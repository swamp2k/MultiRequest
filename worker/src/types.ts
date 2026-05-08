export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  CONSENSUS_WORKFLOW: Workflow;
  AI_GATEWAY_ACCOUNT_ID: string;
  AI_GATEWAY_ID: string;
  ENCRYPTION_KEY: string;
}

export interface User {
  id: string;
  email: string;
}

export interface ModelSettingRow {
  id: string;
  user_id: string;
  model_id: string;
  api_key_encrypted: string | null;
  role: 'primary' | 'critic';
  sort_order: number;
  is_enabled: number; // 0 or 1 in SQLite
}

export interface WorkflowRow {
  id: string;
  user_id: string;
  query: string;
  upload_key: string | null;
  final_response: string | null;
  consensus_score: number | null;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: string;
}

export interface WorkflowEventRow {
  id: string;
  workflow_id: string;
  event_type: 'progress' | 'completed' | 'error';
  message: string | null;
  created_at: string;
}

/** Parameters passed into the ConsensusWorkflow */
export interface ConsensusParams {
  workflowId: string;
  userId: string;
  query: string;
  uploadKey?: string;
  primaryModel: ModelConfig;
  criticModel: ModelConfig;
}

export interface ModelConfig {
  model_id: string;
  api_key: string | null;
  role: 'primary' | 'critic';
}
