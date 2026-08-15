import { argon2id } from 'hash-wasm';
import { concatBytes, utf8Encode } from './bytes.js';
import type { Argon2idParams, DeriveMasterKeyOptions } from './types.js';
import { zeroize } from './zeroize.js';

/** Matches the spec: t=3, m=64MB (65536 KiB), p=4 lanes, 32-byte output. */
export const DEFAULT_ARGON2ID_PARAMS: Argon2idParams = {
  time: 3,
  memory: 65536,
  parallelism: 4,
  hashLength: 32,
};

/**
 * Derives the 256-bit Master Key from the user's password, their locally
 * generated Secret Key, and a random salt.
 *
 * Runs Argon2id via `hash-wasm` (WebCrypto has no native Argon2id). Callers
 * should invoke this from a Web Worker — it deliberately costs ~64MB of
 * memory and hundreds of milliseconds, and must never block a UI thread.
 *
 * `parallelism` is honored as an RFC 9106 algorithm parameter (it changes the
 * derived key value, not just speed) but execution itself is single-threaded
 * — see SECURITY.md for why.
 */
export async function deriveMasterKey(options: DeriveMasterKeyOptions): Promise<Uint8Array> {
  const params = { ...DEFAULT_ARGON2ID_PARAMS, ...options.params };
  const passwordBytes = concatBytes(utf8Encode(options.password), options.secretKey);

  try {
    const digest = await argon2id({
      password: passwordBytes,
      salt: options.salt,
      iterations: params.time,
      memorySize: params.memory,
      parallelism: params.parallelism,
      hashLength: params.hashLength,
      outputType: 'binary',
    });
    return new Uint8Array(digest);
  } finally {
    zeroize(passwordBytes);
  }
}
