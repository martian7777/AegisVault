/** 96-bit IV, the recommended size for AES-GCM. */
export const GCM_IV_BYTES = 12;

/** 256-bit key, matching AES-256 and the item-key/master-key sizes used throughout. */
export const KEY_BYTES = 32;

export function getRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}
