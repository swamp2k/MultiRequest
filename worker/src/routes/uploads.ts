import type { Env, User } from '../types';
import { json } from '../router';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function handleUpload(
  request: Request,
  env: Env,
  user: User
): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid multipart form data' }, 400);
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return json({ error: 'file field is required' }, 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return json({ error: 'File exceeds 10 MB limit' }, 413);
  }

  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `uploads/${user.id}/${crypto.randomUUID()}/${safeFilename}`;

  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
    customMetadata: {
      originalName: file.name,
      userId: user.id,
    },
  });

  return json({ key, filename: file.name, size: file.size });
}
