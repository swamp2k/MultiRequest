import type { Env, User } from '../types';
import { loadDecryptedModels } from './settings';
import { execute } from '../lib/db';
import { json } from '../router';

export async function handleQuery(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  let body: { query: string; upload_key?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.query?.trim()) {
    return json({ error: 'query is required' }, 400);
  }

  // Load the user's enabled models (decrypted)
  const models = await loadDecryptedModels(env, user.id);
  const primaryModel = models.find((m) => m.role === 'primary');
  const criticModel = models.find((m) => m.role === 'critic');

  if (!primaryModel) {
    return json({ error: 'No primary model configured. Please add one in Settings.' }, 422);
  }
  if (!criticModel) {
    return json({ error: 'No critic model configured. Please add one in Settings.' }, 422);
  }

  // Create a workflow record in D1 immediately so SSE can poll it
  const workflowId = crypto.randomUUID();
  await execute(
    env.DB,
    `INSERT INTO Workflows (id, user_id, query, upload_key, status, timestamp)
     VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
    [workflowId, user.id, body.query.trim(), body.upload_key ?? null]
  );

  // Kick off the Cloudflare Workflow (async — does not block this response)
  await env.CONSENSUS_WORKFLOW.create({
    id: workflowId,
    params: {
      workflowId,
      userId: user.id,
      query: body.query.trim(),
      uploadKey: body.upload_key,
      primaryModel,
      criticModel,
    },
  });

  return json({ workflowId });
}
