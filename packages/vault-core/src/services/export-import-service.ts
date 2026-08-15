import type { ItemAAD } from '@aegisvault/crypto-core';
import type { VaultItemRecord, VaultItemType, VaultMetaKey } from '../models/vault-item.js';
import type { VaultRepository } from '../repository/repository.interface.js';
import { base64ToBytes, bytesToBase64 } from '../util/base64.js';

/**
 * Backup/restore is a first-class MVP feature, not a stretch goal: this app
 * has no backend, so browser storage eviction otherwise means total vault
 * loss. Everything here is already ciphertext — export does not add or
 * remove a layer of encryption, it just serializes the same encrypted
 * records (and non-secret metadata) to a portable, versioned JSON shape.
 */

type SerializedMetaValue = { kind: 'bytes'; base64: string } | { kind: 'json'; value: unknown };

interface SerializedMetaEntry {
  key: VaultMetaKey;
  value: SerializedMetaValue;
}

interface SerializedItem {
  id: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  type: VaultItemType;
  favorite: boolean;
  ciphertext: string;
  iv: string;
  wrappedKey: string;
  wrapIv: string;
  aad: ItemAAD;
}

export interface VaultBackup {
  schemaVersion: 1;
  exportedAt: number;
  meta: SerializedMetaEntry[];
  items: SerializedItem[];
}

const META_KEYS: VaultMetaKey[] = ['kdfSalt', 'kdfParams', 'authVerifier', 'schemaVersion'];

function serializeMetaValue(value: unknown): SerializedMetaValue {
  if (value instanceof Uint8Array) return { kind: 'bytes', base64: bytesToBase64(value) };
  return { kind: 'json', value };
}

function deserializeMetaValue(serialized: SerializedMetaValue): unknown {
  return serialized.kind === 'bytes' ? base64ToBytes(serialized.base64) : serialized.value;
}

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
    items: items.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      version: item.version,
      type: item.type,
      favorite: item.favorite,
      ciphertext: bytesToBase64(item.ciphertext),
      iv: bytesToBase64(item.iv),
      wrappedKey: bytesToBase64(item.wrappedKey),
      wrapIv: bytesToBase64(item.wrapIv),
      aad: item.aad,
    })),
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
    const record: VaultItemRecord = {
      id: item.id,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      version: item.version,
      type: item.type,
      favorite: item.favorite,
      ciphertext: base64ToBytes(item.ciphertext).buffer as ArrayBuffer,
      iv: base64ToBytes(item.iv).buffer as ArrayBuffer,
      wrappedKey: base64ToBytes(item.wrappedKey).buffer as ArrayBuffer,
      wrapIv: base64ToBytes(item.wrapIv).buffer as ArrayBuffer,
      aad: item.aad,
    };
    await repository.putItem(record);
  }
}
