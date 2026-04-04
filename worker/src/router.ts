import type { Env } from './types';
import { getAuthenticatedUser, AuthError } from './auth';
import { handleGetSettings, handlePostSettings } from './routes/settings';
import { handleQuery } from './routes/query';
import { handleStream } from './routes/stream';
import { handleUpload } from './routes/uploads';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Dev-Email',
};

export async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { method, pathname } = { method: request.method, pathname: url.pathname };

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    let response: Response;

    if (pathname === '/api/settings' && method === 'GET') {
      const user = await getAuthenticatedUser(request, env);
      response = await handleGetSettings(env, user);
    } else if (pathname === '/api/settings' && method === 'POST') {
      const user = await getAuthenticatedUser(request, env);
      response = await handlePostSettings(request, env, user);
    } else if (pathname === '/api/query' && method === 'POST') {
      const user = await getAuthenticatedUser(request, env);
      response = await handleQuery(request, env, user);
    } else if (pathname === '/api/stream' && method === 'GET') {
      const user = await getAuthenticatedUser(request, env);
      response = await handleStream(request, env, user);
    } else if (pathname === '/api/upload' && method === 'POST') {
      const user = await getAuthenticatedUser(request, env);
      response = await handleUpload(request, env, user);
    } else {
      response = json({ error: 'Not found' }, 404);
    }

    // Attach CORS headers to all responses
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
