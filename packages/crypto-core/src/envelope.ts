import { decryptBytes, encryptBytes } from './aes-gcm.js';
import { canonicalAADBytes, utf8Decode, utf8Encode } from './bytes.js';
import { GCM_IV_BYTES, KEY_BYTES, getRandomBytes } from './random.js';
import type { EncryptedEnvelope, ItemAAD } from './types.js';
import { zeroize } from './zeroize.js';

/**
 * Encrypts a single vault item under a fresh, random per-item key, then
 * wraps that key under `kEnc`. `aad` is bound into the ciphertext's GCM tag
 * so a ciphertext can't be replayed under a different item's identity/type;
 * it is not secret and is stored alongside the ciphertext in cleartext.
 */
export async function encryptItem(
  plaintext: unknown,
  kEnc: CryptoKey,
  aad: ItemAAD,
): Promise<EncryptedEnvelope> {
  const itemKeyRaw = getRandomBytes(KEY_BYTES);
  const aadBytes = canonicalAADBytes(aad);

  try {
    const itemKey = await crypto.subtle.importKey('raw', itemKeyRaw, { name: 'AES-GCM' }, false, [
      'encrypt',
    ]);

    const iv = getRandomBytes(GCM_IV_BYTES);
    const ciphertext = await encryptBytes(itemKey, iv, utf8Encode(JSON.stringify(plaintext)), aadBytes);

    const wrapIv = getRandomBytes(GCM_IV_BYTES);
    const wrappedKey = await encryptBytes(kEnc, wrapIv, itemKeyRaw);

    return { ciphertext, iv: iv.buffer as ArrayBuffer, wrappedKey, wrapIv: wrapIv.buffer as ArrayBuffer, aad };
  } finally {
    zeroize(itemKeyRaw);
  }
}

/** Throws DecryptionError if the wrong key is used or the envelope was tampered with. */
export async function decryptItem<T = unknown>(
  envelope: EncryptedEnvelope,
  kEnc: CryptoKey,
): Promise<T> {
  const wrapIv = new Uint8Array(envelope.wrapIv);
  const itemKeyRaw = new Uint8Array(await decryptBytes(kEnc, wrapIv, envelope.wrappedKey));

  try {
    const itemKey = await crypto.subtle.importKey('raw', itemKeyRaw, { name: 'AES-GCM' }, false, [
      'decrypt',
    ]);

    const iv = new Uint8Array(envelope.iv);
    const aadBytes = canonicalAADBytes(envelope.aad);
    const plaintextBytes = await decryptBytes(itemKey, iv, envelope.ciphertext, aadBytes);

    return JSON.parse(utf8Decode(plaintextBytes)) as T;
  } finally {
    zeroize(itemKeyRaw);
  }
}
