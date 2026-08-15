import Dexie, { type Table } from 'dexie';
import type { VaultItemRecord, VaultMetaKey, VaultMetaRecord } from '../models/vault-item.js';
import type { VaultRepository } from './repository.interface.js';

class VaultDatabase extends Dexie {
  items!: Table<VaultItemRecord, string>;
  vaultMeta!: Table<VaultMetaRecord, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      items: 'id, updatedAt, type, favorite',
      vaultMeta: 'key',
    });
  }
}

export class IndexedDbVaultRepository implements VaultRepository {
  private readonly db: VaultDatabase;

  constructor(databaseName = 'aegisvault') {
    this.db = new VaultDatabase(databaseName);
  }

  async putItem(record: VaultItemRecord): Promise<void> {
    await this.db.items.put(record);
  }

  async getItem(id: string): Promise<VaultItemRecord | undefined> {
    return this.db.items.get(id);
  }

  async listItems(): Promise<VaultItemRecord[]> {
    return this.db.items.toArray();
  }

  async deleteItem(id: string): Promise<void> {
    await this.db.items.delete(id);
  }

  async putMeta(record: VaultMetaRecord): Promise<void> {
    await this.db.vaultMeta.put(record);
  }

  async getMeta(key: VaultMetaKey): Promise<VaultMetaRecord | undefined> {
    return this.db.vaultMeta.get(key);
  }

  async clear(): Promise<void> {
    await this.db.transaction('rw', this.db.items, this.db.vaultMeta, async () => {
      await this.db.items.clear();
      await this.db.vaultMeta.clear();
    });
  }
}
