import * as Comlink from 'comlink';
import {
  IndexedDbVaultRepository,
  type VaultBackup,
  type VaultItemSummary,
  type VaultItemType,
  VaultService,
  exportVaultBackup,
  importVaultBackup,
  onboardVault,
  unlockVault,
} from '@aegisvault/vault-core';

/**
 * Lives entirely inside a dedicated Web Worker. `kEnc` (and the VaultService
 * that holds it) never leaves this scope — the main thread only ever sees
 * plaintext request/response payloads or ciphertext-shaped VaultItemRecord
 * data via exportVaultBackup, never a CryptoKey.
 */
const repository = new IndexedDbVaultRepository();
let vaultService: VaultService | null = null;

function requireUnlocked(): VaultService {
  if (!vaultService) throw new Error('Vault is locked.');
  return vaultService;
}

const api = {
  async hasVault(): Promise<boolean> {
    return (await repository.getMeta('kdfSalt')) !== undefined;
  },

  async onboard(password: string): Promise<{ secretKey: Uint8Array }> {
    const { secretKey, kEnc } = await onboardVault(password, repository);
    vaultService = new VaultService(repository, kEnc);
    return { secretKey };
  },

  async unlock(password: string, secretKey: Uint8Array): Promise<void> {
    const { kEnc } = await unlockVault(password, secretKey, repository);
    vaultService = new VaultService(repository, kEnc);
  },

  lock(): void {
    vaultService = null;
  },

  isUnlocked(): boolean {
    return vaultService !== null;
  },

  async createItem(
    type: VaultItemType,
    plaintext: unknown,
    favorite?: boolean,
  ): Promise<string> {
    return requireUnlocked().createItem(type, plaintext, { favorite });
  },

  async getItem<T>(id: string): Promise<T | undefined> {
    return requireUnlocked().getItem<T>(id);
  },

  async updateItem(id: string, plaintext: unknown): Promise<void> {
    await requireUnlocked().updateItem(id, plaintext);
  },

  async deleteItem(id: string): Promise<void> {
    await requireUnlocked().deleteItem(id);
  },

  async listItemSummaries(): Promise<VaultItemSummary[]> {
    return requireUnlocked().listItemSummaries();
  },

  async exportBackup(): Promise<VaultBackup> {
    return exportVaultBackup(repository);
  },

  async importBackup(backup: VaultBackup): Promise<void> {
    await importVaultBackup(backup, repository);
    // Force re-unlock: the imported vault's salt/verifier may differ from
    // whatever key this session was holding.
    vaultService = null;
  },
};

export type CryptoWorkerApi = typeof api;

Comlink.expose(api);
