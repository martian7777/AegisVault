export interface Argon2idParams {
  /** RFC 9106 time cost (iterations). */
  time: number;
  /** RFC 9106 memory cost, in KiB. */
  memory: number;
  /** RFC 9106 parallelism (lane count) — affects the derived key, not just execution speed. */
  parallelism: number;
  /** Output key length in bytes. */
  hashLength: number;
}

export interface DeriveMasterKeyOptions {
  password: string;
  secretKey: Uint8Array;
  salt: Uint8Array;
  params?: Partial<Argon2idParams>;
}

export interface SubKeys {
  /** AES-256-GCM key, non-extractable. Used to wrap per-item keys. */
  kEnc: CryptoKey;
  /** HMAC-SHA256 key, non-extractable. Used only for the local auth verifier. */
  kAuth: CryptoKey;
}

/**
 * Item-level associated data. Not secret — bound into the GCM tag so a
 * ciphertext can't be replayed under a different item's identity/type.
 */
export interface ItemAAD {
  id: string;
  version: number;
  type: string;
}

export interface EncryptedEnvelope {
  ciphertext: ArrayBuffer;
  /** 96-bit IV used for the item ciphertext. */
  iv: ArrayBuffer;
  /** The random per-item key, wrapped (AES-256-GCM) under kEnc. */
  wrappedKey: ArrayBuffer;
  /** 96-bit IV used for the key-wrap operation (distinct from `iv`). */
  wrapIv: ArrayBuffer;
  aad: ItemAAD;
}
