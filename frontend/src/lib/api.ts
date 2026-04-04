import type { ModelSetting, WorkflowResult } from '../types';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((error as { error?: string }).error ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/** Fetch the user's saved model settings from D1. */
export async function getSettings(): Promise<ModelSetting[]> {
  return apiFetch<ModelSetting[]>('/api/settings');
}

/**
 * Save model settings to D1.
 * Pass api_key only when the user has entered a new value; omit to preserve the existing key.
 */
export async function saveSettings(models: ModelSetting[]): Promise<void> {
  await apiFetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ models }),
  });
}

/**
 * Upload a file to R2.
 * Returns the R2 object key to pass with the query.
 */
export async function uploadFile(file: File): Promise<{ key: string; filename: string }> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch('/api/upload', { method: 'POST', body: form });
}

/**
 * Submit a query to the consensus workflow.
 * Returns a workflowId to pass to openSSEStream().
 */
export async function submitQuery(
  query: string,
  uploadKey?: string
): Promise<{ workflowId: string }> {
  return apiFetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, upload_key: uploadKey }),
  });
}

/**
 * Parse a completed workflow's final_response JSON into a WorkflowResult.
 * The message field of the 'completed' SSE event contains the raw JSON.
 */
export function parseWorkflowResult(message: string): WorkflowResult | null {
  try {
    return JSON.parse(message) as WorkflowResult;
  } catch {
    return null;
  }
}
