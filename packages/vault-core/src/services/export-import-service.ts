import type { VaultMetaKey } from '../models/vault-item.js';
import type { VaultRepository } from '../repository/repository.interface.js';
import {
  type SerializedItem,
  type SerializedMetaEntry,
  deserializeItem,
  deserializeMetaValue,
  serializeItem,
  serializeMetaValue,
} from '../repository/serialization.js';

/**
 * Backup/restore is a first-class MVP feature, not a stretch goal: this app
 * has no backend, so browser storage eviction otherwise means total vault
 * loss. Everything here is already ciphertext — export does not add or
 * remove a layer of encryption, it just serializes the same encrypted
 * records (and non-secret metadata) to a portable, versioned JSON shape.
 */

export interface VaultBackup {
  schemaVersion: 1;
  exportedAt: number;
  meta: SerializedMetaEntry[];
  items: SerializedItem[];
}

const META_KEYS: VaultMetaKey[] = ['kdfSalt', 'kdfParams', 'authVerifier', 'schemaVersion'];

export async function exportVaultBackup(repository: VaultRepository): Promise<VaultBackup> {
  const metaRecords = await Promise.all(META_KEYS.map((key) => repository.getMeta(key)));
  const meta: SerializedMetaEntry[] = metaRecords
    .filter((record) => record !== undefined)
    .map((record) => ({ key: record.key, value: serializeMetaValue(record.value) }));

  const items = await repository.listItems();

  return {
    schemaVersion: 1,
    exportedAt: Date.now(),
    meta,
    items: items.map(serializeItem),
  };
}

/** Replaces the entire vault (items + metadata) with the contents of the backup. */
export async function importVaultBackup(
  backup: VaultBackup,
  repository: VaultRepository,
): Promise<void> {
  if (backup.schemaVersion !== 1) {
    throw new Error(`Unsupported vault backup schema version: ${backup.schemaVersion}`);
  }

  await repository.clear();

  for (const entry of backup.meta) {
    await repository.putMeta({ key: entry.key, value: deserializeMetaValue(entry.value) });
  }

  for (const item of backup.items) {
    await repository.putItem(deserializeItem(item));
  }
}
