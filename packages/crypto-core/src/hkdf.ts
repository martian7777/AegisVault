import { utf8Encode } from './bytes.js';
import { zeroize } from './zeroize.js';
import type { SubKeys } from './types.js';

const ENC_INFO = utf8Encode('aegisvault:enc:v1');
const AUTH_INFO = utf8Encode('aegisvault:auth:v1');

/**
 * Derives the two sub-keys used throughout the vault from the Master Key,
 * via HKDF-SHA256 with distinct `info` labels. Both keys are imported as
 * non-extractable CryptoKeys — after this call returns, their raw bytes are
 * never again JS-readable, only usable via crypto.subtle. `mk` is zeroed
 * before returning.
 */
export async function deriveSubKeys(mk: Uint8Array): Promise<SubKeys> {
  const baseKey = await crypto.subtle.importKey('raw', mk, 'HKDF', false, ['deriveBits']);

  const [encBits, authBits] = await Promise.all([
    crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: ENC_INFO },
      baseKey,
      256,
    ),
    crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: AUTH_INFO },
      baseKey,
      256,
    ),
  ]);

  zeroize(mk);

  const kEnc = await crypto.subtle.importKey('raw', encBits, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  const kAuth = await crypto.subtle.importKey(
    'raw',
    authBits,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

  return { kEnc, kAuth };
}
