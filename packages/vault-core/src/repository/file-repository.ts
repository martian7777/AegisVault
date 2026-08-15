import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { VaultItemRecord, VaultMetaKey, VaultMetaRecord } from '../models/vault-item.js';
import type { VaultRepository } from './repository.interface.js';
import {
  type SerializedItem,
  type SerializedMetaEntry,
  deserializeItem,
  deserializeMetaValue,
  serializeItem,
  serializeMetaValue,
} from './serialization.js';

interface FileVaultShape {
  items: SerializedItem[];
  meta: SerializedMetaEntry[];
}

const EMPTY_VAULT: FileVaultShape = { items: [], meta: [] };

/**
 * Node-only VaultRepository backed by a single JSON file on disk — there is
 * no IndexedDB outside a browser. Used by the CLI. Every write rewrites the
 * whole file, which is fine at personal-vault/CLI scale; this is not built
 * for high-frequency concurrent writers.
 */
export class FileVaultRepository implements VaultRepository {
  constructor(private readonly filePath: string) {}

  private read(): FileVaultShape {
    if (!existsSync(this.filePath)) return EMPTY_VAULT;
    const raw = readFileSync(this.filePath, 'utf8');
    if (!raw.trim()) return EMPTY_VAULT;
    return JSON.parse(raw) as FileVaultShape;
  }

  private write(shape: FileVaultShape): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(shape, null, 2), { mode: 0o600 });
  }

  async putItem(record: VaultItemRecord): Promise<void> {
    const shape = this.read();
    const serialized = serializeItem(record);
    const index = shape.items.findIndex((item) => item.id === record.id);
    if (index === -1) shape.items.push(serialized);
    else shape.items[index] = serialized;
    this.write(shape);
  }

  async getItem(id: string): Promise<VaultItemRecord | undefined> {
    const serialized = this.read().items.find((item) => item.id === id);
    return serialized ? deserializeItem(serialized) : undefined;
  }

  async listItems(): Promise<VaultItemRecord[]> {
    return this.read().items.map(deserializeItem);
  }

  async deleteItem(id: string): Promise<void> {
    const shape = this.read();
    shape.items = shape.items.filter((item) => item.id !== id);
    this.write(shape);
  }

  async putMeta(record: VaultMetaRecord): Promise<void> {
    const shape = this.read();
    const entry: SerializedMetaEntry = { key: record.key, value: serializeMetaValue(record.value) };
    const index = shape.meta.findIndex((m) => m.key === record.key);
    if (index === -1) shape.meta.push(entry);
    else shape.meta[index] = entry;
    this.write(shape);
  }

  async getMeta(key: VaultMetaKey): Promise<VaultMetaRecord | undefined> {
    const entry = this.read().meta.find((m) => m.key === key);
    return entry ? { key: entry.key, value: deserializeMetaValue(entry.value) } : undefined;
  }

  async clear(): Promise<void> {
    this.write(EMPTY_VAULT);
  }
}
