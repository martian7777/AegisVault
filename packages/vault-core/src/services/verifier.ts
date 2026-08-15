const VERIFIER_MESSAGE = new TextEncoder().encode('aegisvault-verifier-v1');

/** HMAC(kAuth, "aegisvault-verifier-v1") — proves password+SecretKey correctness without a server. */
export async function computeAuthVerifier(kAuth: CryptoKey): Promise<Uint8Array> {
  const signature = await crypto.subtle.sign('HMAC', kAuth, VERIFIER_MESSAGE);
  return new Uint8Array(signature);
}

/** Constant-time comparison — avoids leaking verifier match progress via timing. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}
