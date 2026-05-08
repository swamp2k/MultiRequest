import type { Env, User, ModelSettingRow } from '../types';
import { queryMany, execute } from '../lib/db';
import { encrypt, decrypt } from '../crypto';
import { json } from '../router';

interface ModelInput {
  id?: string;
  model_id: string;
  role: 'primary' | 'critic';
  sort_order: number;
  is_enabled: boolean;
  api_key?: string; // only present when user is setting/updating the key
}

interface ModelOutput {
  id: string;
  model_id: string;
  role: 'primary' | 'critic';
  sort_order: number;
  is_enabled: boolean;
  has_api_key: boolean; // never expose the actual key
}

export async function handleGetSettings(env: Env, user: User): Promise<Response> {
  const rows = await queryMany<ModelSettingRow>(
    env.DB,
    'SELECT * FROM ModelSettings WHERE user_id = ? ORDER BY sort_order ASC',
    [user.id]
  );

  const output: ModelOutput[] = rows.map((r) => ({
    id: r.id,
    model_id: r.model_id,
    role: r.role,
    sort_order: r.sort_order,
    is_enabled: r.is_enabled === 1,
    has_api_key: !!r.api_key_encrypted,
  }));

  return json(output);
}

export async function handlePostSettings(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  let body: { models: ModelInput[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(body.models)) {
    return json({ error: 'models must be an array' }, 400);
  }

  // Load existing settings to preserve encrypted keys when no new key is provided
  const existing = await queryMany<ModelSettingRow>(
    env.DB,
    'SELECT * FROM ModelSettings WHERE user_id = ?',
    [user.id]
  );
  const existingMap = new Map(existing.map((r) => [r.id, r]));

  // Build batch of upsert statements
  const stmts: D1PreparedStatement[] = [];

  // Delete all current settings for this user, then re-insert in sort order
  stmts.push(
    env.DB.prepare('DELETE FROM ModelSettings WHERE user_id = ?').bind(user.id)
  );

  for (const model of body.models) {
    const id = model.id || crypto.randomUUID();
    const existingRow = model.id ? existingMap.get(model.id) : undefined;

    let encryptedKey: string | null = existingRow?.api_key_encrypted ?? null;

    if (model.api_key && model.api_key.trim()) {
      // New or updated API key — encrypt it
      encryptedKey = await encrypt(model.api_key.trim(), env.ENCRYPTION_KEY);
    }

    stmts.push(
      env.DB.prepare(
        `INSERT INTO ModelSettings (id, user_id, model_id, api_key_encrypted, role, sort_order, is_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        user.id,
        model.model_id,
        encryptedKey,
        model.role,
        model.sort_order,
        model.is_enabled ? 1 : 0
      )
    );
  }

  await env.DB.batch(stmts);

  return json({ ok: true });
}

/**
 * Load the decrypted model configs for use inside the Workflow.
 * This is called internally — not exposed via HTTP.
 */
export async function loadDecryptedModels(
  env: Env,
  userId: string
): Promise<{ model_id: string; api_key: string | null; role: 'primary' | 'critic' }[]> {
  const rows = await queryMany<ModelSettingRow>(
    env.DB,
    'SELECT * FROM ModelSettings WHERE user_id = ? AND is_enabled = 1 ORDER BY sort_order ASC',
    [userId]
  );

  return Promise.all(
    rows.map(async (r) => ({
      model_id: r.model_id,
      role: r.role,
      api_key: r.api_key_encrypted
        ? await decrypt(r.api_key_encrypted, env.ENCRYPTION_KEY)
        : null,
    }))
  );
}
