import type { ItemAAD } from '@aegisvault/crypto-core';

export type VaultItemType =
  | 'login'
  | 'note'
  | 'card'
  | 'identity'
  | 'envvar'
  | 'sshkey'
  | 'apitoken';

/**
 * Persisted shape of a vault item. Every field here is either ciphertext,
 * an IV/wrapped-key, or low-sensitivity metadata needed for local indexing
 * (type/favorite/timestamps) — never plaintext. `aad` mirrors crypto-core's
 * ItemAAD and is not secret; it's stored so decryptItem() can reconstruct
 * and verify it against the GCM tag.
 */
export interface VaultItemRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  type: VaultItemType;
  favorite: boolean;
  ciphertext: ArrayBuffer;
  iv: ArrayBuffer;
  wrappedKey: ArrayBuffer;
  wrapIv: ArrayBuffer;
  aad: ItemAAD;
}

export type VaultMetaKey =
  | 'kdfSalt'
  | 'kdfParams'
  | 'authVerifier'
  | 'schemaVersion'
  | 'recoveryParams';

/**
 * Non-secret metadata needed to re-derive keys and validate an unlock
 * attempt. Never holds a key or key material — only salt, algorithm params,
 * an HMAC verifier, and (if emergency recovery is enabled) the k-of-n
 * parameters used, never the shares themselves.
 */
export interface VaultMetaRecord {
  key: VaultMetaKey;
  value: unknown;
}

export interface RecoveryParams {
  threshold: number;
  shares: number;
  enabledAt: number;
}
