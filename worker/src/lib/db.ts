/**
 * Thin typed wrappers over the Cloudflare D1 API.
 */

export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T | null> {
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result ?? null;
}

export async function queryMany<T>(
  db: D1Database,
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results;
}

export async function execute(
  db: D1Database,
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run();
}

export async function batch(
  db: D1Database,
  statements: D1PreparedStatement[]
): Promise<D1Result[]> {
  return db.batch(statements);
}
