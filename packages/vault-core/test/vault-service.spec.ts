import { AuthenticationFailedError } from '@aegisvault/crypto-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { IndexedDbVaultRepository } from '../src/repository/indexeddb-repository.js';
import type { VaultRepository } from '../src/repository/repository.interface.js';
import { onboardVault } from '../src/services/onboarding-service.js';
import { unlockVault } from '../src/services/unlock-service.js';
import { VaultService } from '../src/services/vault-service.js';

interface LoginPayload {
  username: string;
  password: string;
  url: string;
}

function freshRepository(): VaultRepository {
  return new IndexedDbVaultRepository(`aegisvault-test-${crypto.randomUUID()}`);
}

describe('vault-service integration: onboarding -> encrypt -> lock -> unlock -> decrypt', () => {
  let repository: VaultRepository;

  beforeEach(() => {
    repository = freshRepository();
  });

  it('round-trips a vault item across a full lock/unlock cycle', async () => {
    const password = 'correct horse battery staple';
    const { secretKey, kEnc: onboardingKEnc } = await onboardVault(password, repository);

    const onboardingVault = new VaultService(repository, onboardingKEnc);
    const payload: LoginPayload = {
      username: 'alice@example.com',
      password: 'p@ssw0rd!',
      url: 'https://example.com',
    };
    const itemId = await onboardingVault.createItem<LoginPayload>('login', payload);

    // Simulate lock: drop all in-memory key references, then unlock again from scratch.
    const { kEnc: unlockedKEnc } = await unlockVault(password, secretKey, repository);
    const unlockedVault = new VaultService(repository, unlockedKEnc);

    const decrypted = await unlockedVault.getItem<LoginPayload>(itemId);
    expect(decrypted).toEqual(payload);
  });

  it('rejects unlock with the wrong password', async () => {
    const { secretKey } = await onboardVault('right-password', repository);
    await expect(unlockVault('wrong-password', secretKey, repository)).rejects.toThrow(
      AuthenticationFailedError,
    );
  });

  it('rejects unlock with the wrong Secret Key', async () => {
    await onboardVault('right-password', repository);
    const wrongSecretKey = crypto.getRandomValues(new Uint8Array(16));
    await expect(unlockVault('right-password', wrongSecretKey, repository)).rejects.toThrow(
      AuthenticationFailedError,
    );
  });

  it('supports create, update, and delete', async () => {
    const password = 'another-strong-password';
    const { kEnc } = await onboardVault(password, repository);
    const vault = new VaultService(repository, kEnc);

    const id = await vault.createItem('note', { body: 'v1' });
    await vault.updateItem(id, { body: 'v2' });
    expect(await vault.getItem(id)).toEqual({ body: 'v2' });

    await vault.deleteItem(id);
    expect(await vault.getItem(id)).toBeUndefined();
  });

  it('lists item summaries without exposing plaintext', async () => {
    const { kEnc } = await onboardVault('summary-list-password', repository);
    const vault = new VaultService(repository, kEnc);
    await vault.createItem('login', { username: 'bob', password: 'hunter2', url: '' });

    const summaries = await vault.listItemSummaries();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ type: 'login', favorite: false });
    expect(JSON.stringify(summaries)).not.toContain('hunter2');
  });
});
