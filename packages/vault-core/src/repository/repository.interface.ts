import type { VaultItemRecord, VaultMetaKey, VaultMetaRecord } from '../models/vault-item.js';

/**
 * Zero-knowledge is enforced structurally here: every method accepts or
 * returns only already-encrypted VaultItemRecord shapes or non-secret
 * VaultMetaRecord values — never plaintext, never a CryptoKey. A future
 * networked implementation of this interface is therefore structurally
 * incapable of transmitting plaintext, by construction, not by discipline.
 */
export interface VaultRepository {
  putItem(record: VaultItemRecord): Promise<void>;
  getItem(id: string): Promise<VaultItemRecord | undefined>;
  listItems(): Promise<VaultItemRecord[]>;
  deleteItem(id: string): Promise<void>;

  putMeta(record: VaultMetaRecord): Promise<void>;
  getMeta(key: VaultMetaKey): Promise<VaultMetaRecord | undefined>;

  /** Wipes all items and metadata — used by import (replace) and reset flows. */
  clear(): Promise<void>;
}
