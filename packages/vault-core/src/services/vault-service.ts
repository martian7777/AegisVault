import { type EncryptedEnvelope, type ItemAAD, decryptItem, encryptItem } from '@aegisvault/crypto-core';
import type { VaultItemRecord, VaultItemType } from '../models/vault-item.js';
import type { VaultRepository } from '../repository/repository.interface.js';

export interface VaultItemSummary {
  id: string;
  type: VaultItemType;
  favorite: boolean;
  updatedAt: number;
}

function recordToEnvelope(record: VaultItemRecord): EncryptedEnvelope {
  return {
    ciphertext: record.ciphertext,
    iv: record.iv,
    wrappedKey: record.wrappedKey,
    wrapIv: record.wrapIv,
    aad: record.aad,
  };
}

/**
 * The only module in the codebase permitted to hold plaintext or call
 * encryptItem/decryptItem. `kEnc` is held for the lifetime of an unlocked
 * session; callers (the UI layer) are responsible for discarding the
 * VaultService instance on lock/idle-timeout.
 */
export class VaultService {
  constructor(
    private readonly repository: VaultRepository,
    private readonly kEnc: CryptoKey,
  ) {}

  async createItem<T>(
    type: VaultItemType,
    plaintext: T,
    options?: { favorite?: boolean },
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    const aad: ItemAAD = { id, version: 1, type };
    const envelope = await encryptItem(plaintext, this.kEnc, aad);

    const record: VaultItemRecord = {
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      type,
      favorite: options?.favorite ?? false,
      ciphertext: envelope.ciphertext,
      iv: envelope.iv,
      wrappedKey: envelope.wrappedKey,
      wrapIv: envelope.wrapIv,
      aad: envelope.aad,
    };
    await this.repository.putItem(record);
    return id;
  }

  async getItem<T>(id: string): Promise<T | undefined> {
    const record = await this.repository.getItem(id);
    if (!record) return undefined;
    return decryptItem<T>(recordToEnvelope(record), this.kEnc);
  }

  async updateItem<T>(id: string, plaintext: T): Promise<void> {
    const existing = await this.repository.getItem(id);
    if (!existing) {
      throw new Error(`Vault item ${id} not found.`);
    }

    const aad: ItemAAD = { id, version: existing.version + 1, type: existing.type };
    const envelope = await encryptItem(plaintext, this.kEnc, aad);

    const record: VaultItemRecord = {
      ...existing,
      updatedAt: Date.now(),
      version: aad.version,
      ciphertext: envelope.ciphertext,
      iv: envelope.iv,
      wrappedKey: envelope.wrappedKey,
      wrapIv: envelope.wrapIv,
      aad: envelope.aad,
    };
    await this.repository.putItem(record);
  }

  async deleteItem(id: string): Promise<void> {
    await this.repository.deleteItem(id);
  }

  async setFavorite(id: string, favorite: boolean): Promise<void> {
    const existing = await this.repository.getItem(id);
    if (!existing) {
      throw new Error(`Vault item ${id} not found.`);
    }
    await this.repository.putItem({ ...existing, favorite });
  }

  /** Cleartext-only listing (id/type/favorite/updatedAt) for UI lists without a full decrypt. */
  async listItemSummaries(): Promise<VaultItemSummary[]> {
    const records = await this.repository.listItems();
    return records.map((record) => ({
      id: record.id,
      type: record.type,
      favorite: record.favorite,
      updatedAt: record.updatedAt,
    }));
  }
}
