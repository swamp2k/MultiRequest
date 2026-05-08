import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import type { Env, ConsensusParams } from '../types';
import { callModel, ChatMessage } from '../lib/ai-gateway';
import { execute } from '../lib/db';

/**
 * ConsensusWorkflow — the heart of the "Council of LLMs" engine.
 *
 * Steps (each is auto-retried and persisted by CF Workflows):
 *   1. create-record    — Mark workflow as 'running' in D1
 *   2. primary-draft    — Primary model generates an initial response
 *   3. critic-review    — Critic model identifies errors/flaws in the draft
 *   4. primary-synthesis — Primary model integrates the critique → final response
 *   5. finalize         — Compute consensus score, persist results, emit 'completed'
 */
export class ConsensusWorkflow extends WorkflowEntrypoint<Env, ConsensusParams> {
  async run(event: WorkflowEvent<ConsensusParams>, step: WorkflowStep) {
    const { workflowId, userId, query, uploadKey, primaryModel, criticModel } = event.payload;
    const env = this.env;

    // ── Step 1: Mark as running ────────────────────────────────────────────
    await step.do('create-record', async () => {
      await execute(
        env.DB,
        "UPDATE Workflows SET status = 'running' WHERE id = ?",
        [workflowId]
      );
      await emitEvent(env, workflowId, 'progress', 'Council session started');
    });

    // ── Step 2: Primary model generates initial draft ──────────────────────
    const draft = await step.do('primary-draft', async () => {
      await emitEvent(env, workflowId, 'progress', `Primary model (${primaryModel.model_id}) is generating draft...`);

      const messages: ChatMessage[] = buildPrimaryMessages(query, uploadKey);

      const response = await callModel({
        accountId: env.AI_GATEWAY_ACCOUNT_ID,
        gatewayId: env.AI_GATEWAY_ID,
        modelId: primaryModel.model_id,
        apiKey: primaryModel.api_key,
        messages,
        maxTokens: 4096,
      });

      await emitEvent(env, workflowId, 'progress', 'Primary draft complete');
      return response;
    });

    // ── Step 3: Critic reviews the draft ──────────────────────────────────
    const critique = await step.do('critic-review', async () => {
      await emitEvent(env, workflowId, 'progress', `Critic (${criticModel.model_id}) is reviewing the draft...`);

      const messages: ChatMessage[] = buildCriticMessages(query, draft);

      const response = await callModel({
        accountId: env.AI_GATEWAY_ACCOUNT_ID,
        gatewayId: env.AI_GATEWAY_ID,
        modelId: criticModel.model_id,
        apiKey: criticModel.api_key,
        messages,
        maxTokens: 2048,
      });

      await emitEvent(env, workflowId, 'progress', 'Critic review complete');
      return response;
    });

    // ── Step 4: Primary synthesizes the critique ──────────────────────────
    const finalResponse = await step.do('primary-synthesis', async () => {
      await emitEvent(env, workflowId, 'progress', 'Primary is synthesizing the critique...');

      const messages: ChatMessage[] = buildSynthesisMessages(query, draft, critique);

      const response = await callModel({
        accountId: env.AI_GATEWAY_ACCOUNT_ID,
        gatewayId: env.AI_GATEWAY_ID,
        modelId: primaryModel.model_id,
        apiKey: primaryModel.api_key,
        messages,
        maxTokens: 4096,
      });

      await emitEvent(env, workflowId, 'progress', 'Synthesis complete — finalising output');
      return response;
    });

    // ── Step 5: Finalize and persist results ──────────────────────────────
    await step.do('finalize', async () => {
      const score = computeConsensusScore(draft, finalResponse);

      const result = JSON.stringify({
        draft,
        critique,
        final: finalResponse,
        score,
        primaryModel: primaryModel.model_id,
        criticModel: criticModel.model_id,
      });

      await execute(
        env.DB,
        `UPDATE Workflows
         SET final_response = ?, consensus_score = ?, status = 'completed'
         WHERE id = ?`,
        [result, score, workflowId]
      );

      await emitEvent(env, workflowId, 'completed', result);
    });
  }
}

// ── Prompt builders ────────────────────────────────────────────────────────

function buildPrimaryMessages(query: string, _uploadKey?: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are an expert assistant. Provide a thorough, accurate, and well-structured response. ' +
        'If the input is code or a script, focus on correctness, security, and best practices. ' +
        'If it is a log, identify errors and their root causes. ' +
        'If it is a legal or policy question, highlight key considerations and caveats.',
    },
    {
      role: 'user',
      content: query,
    },
  ];
}

function buildCriticMessages(query: string, draft: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are a rigorous critic on a council of AI advisors. ' +
        'You will be shown an original question and a draft answer from another AI. ' +
        'Your job is to identify: (1) factual errors or hallucinations, ' +
        '(2) security vulnerabilities or risks, ' +
        '(3) logical flaws or unsound reasoning, ' +
        '(4) missing important context or caveats. ' +
        'Be specific and cite the problematic sections. ' +
        'If the draft is correct and complete, say so explicitly. ' +
        'Do NOT rewrite the answer — only critique it.',
    },
    {
      role: 'user',
      content: `Original question:\n${query}\n\n---\nDraft answer to critique:\n${draft}`,
    },
  ];
}

function buildSynthesisMessages(query: string, draft: string, critique: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are the Primary Arbiter on a council of AI advisors. ' +
        'You previously wrote a draft answer, which a Critic has now reviewed. ' +
        'Your task is to produce the final, authoritative response by: ' +
        '(1) Adopting valid corrections from the critique. ' +
        '(2) Rejecting critiques that are themselves wrong (briefly explain why). ' +
        '(3) Producing a dual-layer output: first a "## Management Summary" section with a ' +
        'high-level status (e.g. ✅ Correct / ⚠️ Warning / 🔴 Critical Issue) and a one-paragraph ' +
        'plain-language summary; then a "## Technical Detail" section with the full technical response. ' +
        'You are the final source of truth. Do not defer or hedge excessively.',
    },
    {
      role: 'user',
      content:
        `Original question:\n${query}\n\n` +
        `---\nYour initial draft:\n${draft}\n\n` +
        `---\nCritic's review:\n${critique}\n\n` +
        'Please produce the final authoritative response.',
    },
  ];
}

// ── Consensus score ────────────────────────────────────────────────────────

/**
 * Computes a Jaccard similarity score between the draft and final response.
 * Returns a value in [0, 1] where 1 means the final is identical to the draft
 * (critic had nothing to add) and lower values mean significant revisions were made.
 *
 * This is a simple Phase 1 heuristic. Phase 2 can replace with LLM-judged scoring.
 */
function computeConsensusScore(draft: string, final: string): number {
  const tokenize = (text: string): Set<string> => {
    const tokens = text
      .toLowerCase()
      .split(/[\s.,;:!?()\[\]{}"'`\-\/\\]+/)
      .filter((t) => t.length > 2);
    return new Set(tokens);
  };

  const draftTokens = tokenize(draft);
  const finalTokens = tokenize(final);

  if (draftTokens.size === 0 && finalTokens.size === 0) return 1;
  if (draftTokens.size === 0 || finalTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of draftTokens) {
    if (finalTokens.has(token)) intersection++;
  }

  const union = draftTokens.size + finalTokens.size - intersection;
  return Math.round((intersection / union) * 100) / 100;
}

// ── Event emission ─────────────────────────────────────────────────────────

async function emitEvent(
  env: Env,
  workflowId: string,
  eventType: 'progress' | 'completed' | 'error',
  message: string
): Promise<void> {
  await execute(
    env.DB,
    `INSERT INTO WorkflowEvents (id, workflow_id, event_type, message, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [crypto.randomUUID(), workflowId, eventType, message]
  );
}
