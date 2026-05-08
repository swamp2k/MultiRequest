/**
 * AES-GCM 256-bit encryption/decryption using the Web Crypto API.
 * Native to Cloudflare Workers — zero npm dependencies.
 *
 * Storage format: "base64(iv):base64(ciphertext)"
 *
 * The ENCRYPTION_KEY secret must be a base64-encoded 32-byte random value:
 *   node -e "console.log(Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'))"
 * Set via: wrangler secret put ENCRYPTION_KEY
 */

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function bytesToB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function importKey(rawKeyB64: string): Promise<CryptoKey> {
  const keyBytes = b64ToBytes(rawKeyB64);
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypts a plaintext string.
 * Returns a colon-delimited "base64(iv):base64(ciphertext)" string.
 */
export async function encrypt(plaintext: string, encryptionKeyB64: string): Promise<string> {
  const key = await importKey(encryptionKeyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return `${bytesToB64(iv)}:${bytesToB64(new Uint8Array(ciphertext))}`;
}

/**
 * Decrypts a "base64(iv):base64(ciphertext)" string.
 * Returns the original plaintext.
 */
export async function decrypt(stored: string, encryptionKeyB64: string): Promise<string> {
  const [ivB64, ciphertextB64] = stored.split(':');
  if (!ivB64 || !ciphertextB64) throw new Error('Invalid encrypted value format');

  const key = await importKey(encryptionKeyB64);
  const iv = b64ToBytes(ivB64);
  const ciphertext = b64ToBytes(ciphertextB64);

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
