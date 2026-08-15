import { AuthenticationFailedError } from '@aegisvault/crypto-core';
import { describe, expect, it } from 'vitest';
import { IndexedDbVaultRepository } from '../src/repository/indexeddb-repository.js';
import { onboardVault } from '../src/services/onboarding-service.js';
import {
  enableRecovery,
  getRecoveryParams,
  recoverVaultWithShares,
} from '../src/services/recovery-service.js';
import { VaultService } from '../src/services/vault-service.js';

function freshRepository() {
  return new IndexedDbVaultRepository(`aegisvault-test-${crypto.randomUUID()}`);
}

describe('emergency recovery via Shamir shares', () => {
  it('unlocks the vault from threshold shares with no password, and decrypts existing items', async () => {
    const repository = freshRepository();
    const password = 'recovery-test-password';
    const { secretKey, kEnc } = await onboardVault(password, repository);
    const vault = new VaultService(repository, kEnc);
    const itemId = await vault.createItem('note', { body: 'recoverable secret' });

    const shares = await enableRecovery(password, secretKey, repository, {
      shares: 5,
      threshold: 3,
    });
    expect(shares).toHaveLength(5);
    for (const share of shares) expect(share.startsWith('aegis-shard:v1:')).toBe(true);

    const { kEnc: recoveredKEnc } = await recoverVaultWithShares(shares.slice(0, 3), repository);
    const recoveredVault = new VaultService(repository, recoveredKEnc);
    expect(await recoveredVault.getItem(itemId)).toEqual({ body: 'recoverable secret' });
  });

  it('unlocks from any subset of threshold shares, not just the first ones', async () => {
    const repository = freshRepository();
    const password = 'recovery-test-password-2';
    const { secretKey } = await onboardVault(password, repository);
    const shares = await enableRecovery(password, secretKey, repository, {
      shares: 5,
      threshold: 3,
    });

    const subset = [shares[1], shares[3], shares[4]].filter((s): s is string => s !== undefined);
    await expect(recoverVaultWithShares(subset, repository)).resolves.toBeDefined();
  });

  it('rejects recovery with fewer than threshold shares', async () => {
    const repository = freshRepository();
    const password = 'recovery-test-password-3';
    const { secretKey } = await onboardVault(password, repository);
    const shares = await enableRecovery(password, secretKey, repository, {
      shares: 5,
      threshold: 3,
    });

    await expect(recoverVaultWithShares(shares.slice(0, 2), repository)).rejects.toThrow(
      /at least 3/,
    );
  });

  it('rejects recovery with shares from a different vault (wrong reconstructed MK fails the auth verifier)', async () => {
    const repoA = freshRepository();
    const { secretKey: secretKeyA } = await onboardVault('password-a', repoA);
    const sharesA = await enableRecovery('password-a', secretKeyA, repoA, {
      shares: 3,
      threshold: 2,
    });

    const repoB = freshRepository();
    const { secretKey: secretKeyB } = await onboardVault('password-b', repoB);
    const sharesB = await enableRecovery('password-b', secretKeyB, repoB, {
      shares: 3,
      threshold: 2,
    });

    // Mixing shares from A's split with B's vault reconstructs A's MK, which
    // won't match B's stored auth verifier.
    await expect(recoverVaultWithShares(sharesA.slice(0, 2), repoB)).rejects.toThrow(
      AuthenticationFailedError,
    );
    void sharesB;
  });

  it('rejects enabling recovery with the wrong password', async () => {
    const repository = freshRepository();
    const { secretKey } = await onboardVault('right-password', repository);
    await expect(
      enableRecovery('wrong-password', secretKey, repository, { shares: 3, threshold: 2 }),
    ).rejects.toThrow(AuthenticationFailedError);
  });

  it('reports recovery params once enabled, and none before that', async () => {
    const repository = freshRepository();
    const { secretKey } = await onboardVault('password-x', repository);
    expect(await getRecoveryParams(repository)).toBeUndefined();

    await enableRecovery('password-x', secretKey, repository, { shares: 4, threshold: 3 });
    const params = await getRecoveryParams(repository);
    expect(params).toMatchObject({ threshold: 3, shares: 4 });
  });

  it('never persists share data itself — only non-secret (threshold, shares, enabledAt) params', async () => {
    const repository = freshRepository();
    const { secretKey } = await onboardVault('password-y', repository);
    const shares = await enableRecovery('password-y', secretKey, repository, {
      shares: 3,
      threshold: 2,
    });

    const params = await getRecoveryParams(repository);
    const serialized = JSON.stringify(params);
    for (const share of shares) {
      expect(serialized).not.toContain(share);
    }
  });
});
