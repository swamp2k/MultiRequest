/**
 * Cloudflare AI Gateway wrapper.
 *
 * All LLM calls are routed through:
 *   https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}/{provider}/chat/completions
 *
 * The gateway provides:
 *   - PII redaction (configured in the CF dashboard)
 *   - Semantic caching
 *   - Rate limiting and observability
 *
 * Provider slug mapping:
 *   @cf/*           → workers-ai
 *   gpt-* / o*      → openai
 *   claude-*        → anthropic
 *   gemini-*        → google-ai-studio
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallModelOptions {
  accountId: string;
  gatewayId: string;
  modelId: string;
  apiKey: string | null;
  messages: ChatMessage[];
  maxTokens?: number;
}

function getProviderSlug(modelId: string): string {
  if (modelId.startsWith('@cf/')) return 'workers-ai';
  if (modelId.startsWith('claude-')) return 'anthropic';
  if (modelId.startsWith('gemini-')) return 'google-ai-studio';
  if (modelId.startsWith('gpt-') || modelId.startsWith('o1') || modelId.startsWith('o3')) {
    return 'openai';
  }
  // Default fallback
  return 'openai';
}

export async function callModel(options: CallModelOptions): Promise<string> {
  const { accountId, gatewayId, modelId, apiKey, messages, maxTokens = 4096 } = options;

  const provider = getProviderSlug(modelId);
  const url = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${provider}/chat/completions`;

  // For Workers AI models, the model id is used as-is; for others strip any prefix
  const resolvedModel =
    provider === 'workers-ai'
      ? modelId // e.g. @cf/meta/llama-3.3-70b-instruct-fp8-fast
      : modelId;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Anthropic requires a different API version header
  if (provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
  }

  const body: Record<string, unknown> = {
    model: resolvedModel,
    messages,
    max_tokens: maxTokens,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI Gateway error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    content?: { text?: string }[];
  };

  // OpenAI / Workers AI format
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }

  // Anthropic format
  if (data.content?.[0]?.text) {
    return data.content[0].text;
  }

  throw new Error('Unexpected response format from AI Gateway');
}
