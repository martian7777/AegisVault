import type { ItemAAD } from '@aegisvault/crypto-core';
import type { VaultItemRecord, VaultItemType, VaultMetaKey } from '../models/vault-item.js';
import { base64ToBytes, bytesToBase64 } from '../util/base64.js';

/**
 * Shared JSON-safe encoding for vault records, used by both the backup
 * export/import format and any repository backed by a plain text file
 * (there is no structured-clone binary storage outside IndexedDB).
 */

export type SerializedMetaValue =
  | { kind: 'bytes'; base64: string }
  | { kind: 'json'; value: unknown };

export interface SerializedMetaEntry {
  key: VaultMetaKey;
  value: SerializedMetaValue;
}

export interface SerializedItem {
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

export function serializeMetaValue(value: unknown): SerializedMetaValue {
  if (value instanceof Uint8Array) return { kind: 'bytes', base64: bytesToBase64(value) };
  return { kind: 'json', value };
}

export function deserializeMetaValue(serialized: SerializedMetaValue): unknown {
  return serialized.kind === 'bytes' ? base64ToBytes(serialized.base64) : serialized.value;
}

export function serializeItem(item: VaultItemRecord): SerializedItem {
  return {
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
  };
}

export function deserializeItem(item: SerializedItem): VaultItemRecord {
  return {
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
}
