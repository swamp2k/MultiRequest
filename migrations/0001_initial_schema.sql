-- Council of LLMs — Initial Schema
-- Migration: 0001_initial_schema

CREATE TABLE IF NOT EXISTS Users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ModelSettings (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  model_id          TEXT NOT NULL,
  -- Stored as "base64(iv):base64(ciphertext)" — never returned to frontend
  api_key_encrypted TEXT,
  role              TEXT NOT NULL CHECK(role IN ('primary', 'critic')),
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_enabled        INTEGER NOT NULL DEFAULT 1  -- SQLite boolean: 0/1
);
CREATE INDEX IF NOT EXISTS idx_ms_user ON ModelSettings(user_id);

CREATE TABLE IF NOT EXISTS Workflows (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  query           TEXT,
  upload_key      TEXT,        -- R2 object key for uploaded file (nullable)
  final_response  TEXT,
  consensus_score REAL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'error')),
  timestamp       DATETIME DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_wf_user ON Workflows(user_id);

CREATE TABLE IF NOT EXISTS WorkflowEvents (
  id          TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES Workflows(id) ON DELETE CASCADE,
  -- event_type: 'progress' | 'completed' | 'error'
  event_type  TEXT NOT NULL,
  message     TEXT,
  created_at  DATETIME DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_we_wf ON WorkflowEvents(workflow_id);
