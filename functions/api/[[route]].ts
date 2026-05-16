interface Env {
  WORKER: Fetcher;
  ADMIN_EMAIL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const headers = new Headers(request.headers);

  // Inject user email for auth when Cloudflare Access isn't configured.
  // Set ADMIN_EMAIL in Pages → Settings → Environment variables.
  if (!headers.get('CF-Access-Authenticated-User-Email') && env.ADMIN_EMAIL) {
    headers.set('X-Dev-Email', env.ADMIN_EMAIL);
  }

  return env.WORKER.fetch(new Request(request, { headers }));
};
