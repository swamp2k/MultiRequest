export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  requiresApiKey: boolean;
}

/**
 * Static model catalog.
 *
 * Cloudflare Workers AI models are free via the binding (no API key needed).
 * External models (OpenAI, Anthropic, Google) require the user to supply their own key.
 *
 * This list is used to populate the Settings page model selector.
 * Phase 2 can replace this with a live fetch from the CF Workers AI Model Catalog API.
 */
export const MODEL_CATALOG: ModelDefinition[] = [
  // ── Cloudflare Workers AI ────────────────────────────────────────────────
  {
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    name: 'Llama 3.3 70B (Fast)',
    provider: 'Cloudflare Workers AI',
    contextWindow: 128000,
    requiresApiKey: false,
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    provider: 'Cloudflare Workers AI',
    contextWindow: 128000,
    requiresApiKey: false,
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.1',
    name: 'Mistral 7B Instruct',
    provider: 'Cloudflare Workers AI',
    contextWindow: 32768,
    requiresApiKey: false,
  },
  {
    id: '@cf/google/gemma-7b-it-lora',
    name: 'Gemma 7B IT (LoRA)',
    provider: 'Cloudflare Workers AI',
    contextWindow: 8192,
    requiresApiKey: false,
  },
  {
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill 32B',
    provider: 'Cloudflare Workers AI',
    contextWindow: 32768,
    requiresApiKey: false,
  },

  // ── OpenAI ───────────────────────────────────────────────────────────────
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextWindow: 128000,
    requiresApiKey: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    contextWindow: 128000,
    requiresApiKey: true,
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'OpenAI',
    contextWindow: 200000,
    requiresApiKey: true,
  },

  // ── Anthropic ────────────────────────────────────────────────────────────
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    contextWindow: 200000,
    requiresApiKey: true,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    contextWindow: 200000,
    requiresApiKey: true,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    contextWindow: 200000,
    requiresApiKey: true,
  },

  // ── Google ───────────────────────────────────────────────────────────────
  {
    id: 'gemini-2.5-pro-preview-03-25',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    contextWindow: 1000000,
    requiresApiKey: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    contextWindow: 1000000,
    requiresApiKey: true,
  },
];

export const PROVIDERS = [...new Set(MODEL_CATALOG.map((m) => m.provider))];

export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}
