import { describe, expect, it } from 'vitest';
import { IndexedDbVaultRepository } from '../src/repository/indexeddb-repository.js';
import { exportVaultBackup, importVaultBackup } from '../src/services/export-import-service.js';
import { onboardVault } from '../src/services/onboarding-service.js';
import { unlockVault } from '../src/services/unlock-service.js';
import { VaultService } from '../src/services/vault-service.js';

function freshRepository() {
  return new IndexedDbVaultRepository(`aegisvault-test-${crypto.randomUUID()}`);
}

describe('export / import backup', () => {
  it('restores a vault into a fresh repository and it unlocks/decrypts identically', async () => {
    const sourceRepo = freshRepository();
    const password = 'export-import-password';
    const { secretKey, kEnc } = await onboardVault(password, sourceRepo);
    const sourceVault = new VaultService(sourceRepo, kEnc);
    const itemId = await sourceVault.createItem('login', {
      username: 'carol',
      password: 'sup3r-secret',
      url: 'https://bank.example.com',
    });

    const backup = await exportVaultBackup(sourceRepo);
    const backupJson = JSON.parse(JSON.stringify(backup));

    // The exported blob is ciphertext-only: no plaintext secret leaks into the JSON.
    expect(JSON.stringify(backupJson)).not.toContain('sup3r-secret');

    const destinationRepo = freshRepository();
    await importVaultBackup(backupJson, destinationRepo);

    const { kEnc: restoredKEnc } = await unlockVault(password, secretKey, destinationRepo);
    const restoredVault = new VaultService(destinationRepo, restoredKEnc);
    const restoredItem = await restoredVault.getItem(itemId);

    expect(restoredItem).toEqual({
      username: 'carol',
      password: 'sup3r-secret',
      url: 'https://bank.example.com',
    });
  });

  it('rejects a backup with an unsupported schema version', async () => {
    const repo = freshRepository();
    await expect(
      importVaultBackup(
        { schemaVersion: 99 as 1, exportedAt: Date.now(), meta: [], items: [] },
        repo,
      ),
    ).rejects.toThrow(/unsupported/i);
  });
});
