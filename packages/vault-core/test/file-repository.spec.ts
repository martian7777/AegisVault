import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileVaultRepository } from '../src/repository/file-repository.js';
import { onboardVault } from '../src/services/onboarding-service.js';
import { unlockVault } from '../src/services/unlock-service.js';
import { VaultService } from '../src/services/vault-service.js';

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'aegisvault-file-repo-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('FileVaultRepository', () => {
  it('persists items and metadata to disk across separate repository instances', async () => {
    const filePath = join(tempDir, 'vault.json');

    const writerRepo = new FileVaultRepository(filePath);
    const password = 'file-repo-test-password';
    const { secretKey, kEnc } = await onboardVault(password, writerRepo);
    const writerVault = new VaultService(writerRepo, kEnc);
    const itemId = await writerVault.createItem('envvar', {
      project: 'acme',
      environment: 'production',
      key: 'DATABASE_URL',
      value: 'postgres://secret',
    });

    // Fresh repository instance pointed at the same file, simulating a new CLI process.
    const readerRepo = new FileVaultRepository(filePath);
    const { kEnc: readerKEnc } = await unlockVault(password, secretKey, readerRepo);
    const readerVault = new VaultService(readerRepo, readerKEnc);

    const item = await readerVault.getItem(itemId);
    expect(item).toEqual({
      project: 'acme',
      environment: 'production',
      key: 'DATABASE_URL',
      value: 'postgres://secret',
    });
  });

  it('returns an empty vault when the file does not exist yet', async () => {
    const repo = new FileVaultRepository(join(tempDir, 'does-not-exist.json'));
    expect(await repo.listItems()).toEqual([]);
    expect(await repo.getMeta('kdfSalt')).toBeUndefined();
  });

  it('supports update, delete, and clear', async () => {
    const filePath = join(tempDir, 'vault.json');
    const repo = new FileVaultRepository(filePath);
    const { kEnc } = await onboardVault('another-password', repo);
    const vault = new VaultService(repo, kEnc);

    const id = await vault.createItem('note', { body: 'v1' });
    await vault.updateItem(id, { body: 'v2' });
    expect(await vault.getItem(id)).toEqual({ body: 'v2' });

    await vault.deleteItem(id);
    expect(await vault.getItem(id)).toBeUndefined();

    await repo.clear();
    expect(await repo.getMeta('kdfSalt')).toBeUndefined();
  });
});
