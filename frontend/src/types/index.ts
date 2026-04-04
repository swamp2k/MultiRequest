export type ModelRole = 'primary' | 'critic';

export interface ModelSetting {
  id: string;
  model_id: string;
  role: ModelRole;
  sort_order: number;
  is_enabled: boolean;
  has_api_key: boolean;
  /** Frontend-only: the raw key the user has typed (not persisted here) */
  api_key?: string;
}

export type SSEEventType = 'connected' | 'progress' | 'completed' | 'error';

export interface SSEEvent {
  type: SSEEventType;
  id?: string;
  message: string;
  timestamp: string;
}

export interface WorkflowResult {
  draft: string;
  critique: string;
  final: string;
  score: number;
  primaryModel: string;
  criticModel: string;
}

export type QueryStatus = 'idle' | 'uploading' | 'submitting' | 'running' | 'completed' | 'error';
