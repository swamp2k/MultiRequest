import type { Env, User } from './types';
import { queryOne, execute } from './lib/db';

/**
 * Extracts the authenticated user from the request.
 * In production: reads CF-Access-Authenticated-User-Email header (set by Cloudflare Access).
 * In local dev: falls back to X-Dev-Email header.
 * Upserts the user in D1 on first seen email, then returns the User record.
 */
export async function getAuthenticatedUser(request: Request, env: Env): Promise<User> {
  const email =
    request.headers.get('CF-Access-Authenticated-User-Email') ||
    request.headers.get('X-Dev-Email');

  if (!email) {
    throw new AuthError('Unauthorized: no authenticated user email found');
  }

  const userId = await getOrCreateUser(email, env.DB);
  return { id: userId, email };
}

async function getOrCreateUser(email: string, db: D1Database): Promise<string> {
  // Try to find existing user
  const existing = await queryOne<{ id: string }>(
    db,
    'SELECT id FROM Users WHERE email = ?',
    [email]
  );
  if (existing) return existing.id;

  // Create new user with a UUID
  const id = crypto.randomUUID();
  await execute(
    db,
    'INSERT OR IGNORE INTO Users (id, email, created_at) VALUES (?, ?, datetime(\'now\'))',
    [id, email]
  );

  // Re-fetch in case INSERT OR IGNORE hit a race condition
  const created = await queryOne<{ id: string }>(
    db,
    'SELECT id FROM Users WHERE email = ?',
    [email]
  );
  if (!created) throw new Error('Failed to create user');
  return created.id;
}

export class AuthError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
