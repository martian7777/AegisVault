import { DecryptionError } from './errors.js';

const TAG_LENGTH_BITS = 128;

export async function encryptBytes(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: Uint8Array,
  additionalData?: Uint8Array,
): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData, tagLength: TAG_LENGTH_BITS },
    key,
    plaintext,
  );
}

/** Throws DecryptionError (never returns null/undefined) on tampered or wrong-key input. */
export async function decryptBytes(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
  additionalData?: Uint8Array,
): Promise<ArrayBuffer> {
  try {
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData, tagLength: TAG_LENGTH_BITS },
      key,
      ciphertext,
    );
  } catch {
    throw new DecryptionError();
  }
}
