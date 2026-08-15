import { DecryptionError } from './errors.js';
import { asBufferSource } from './webcrypto-compat.js';

const TAG_LENGTH_BITS = 128;

function gcmParams(iv: Uint8Array, additionalData?: Uint8Array): AesGcmParams {
  // exactOptionalPropertyTypes forbids assigning `additionalData: undefined`
  // to an optional property — the key must be omitted entirely when absent.
  return additionalData
    ? {
        name: 'AES-GCM',
        iv: asBufferSource(iv),
        additionalData: asBufferSource(additionalData),
        tagLength: TAG_LENGTH_BITS,
      }
    : { name: 'AES-GCM', iv: asBufferSource(iv), tagLength: TAG_LENGTH_BITS };
}

export async function encryptBytes(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: Uint8Array,
  additionalData?: Uint8Array,
): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt(gcmParams(iv, additionalData), key, asBufferSource(plaintext));
}

/** Throws DecryptionError (never returns null/undefined) on tampered or wrong-key input. */
export async function decryptBytes(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
  additionalData?: Uint8Array,
): Promise<ArrayBuffer> {
  try {
    return await crypto.subtle.decrypt(gcmParams(iv, additionalData), key, ciphertext);
  } catch {
    throw new DecryptionError();
  }
}
