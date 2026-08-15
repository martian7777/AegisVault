import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndexedDbVaultRepository } from '../src/repository/indexeddb-repository.js';
import { onboardVault } from '../src/services/onboarding-service.js';
import { unlockVault } from '../src/services/unlock-service.js';
import { VaultService } from '../src/services/vault-service.js';

function freshRepository() {
  return new IndexedDbVaultRepository(`aegisvault-test-${crypto.randomUUID()}`);
}

/** Recursively flattens an unknown value into a string suitable for substring scanning. */
function flattenForScan(value: unknown, seen = new WeakSet<object>()): string {
  if (value instanceof ArrayBuffer) return Buffer.from(value).toString('latin1');
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('latin1');
  }
  if (value === null || typeof value !== 'object') return String(value);
  if (seen.has(value)) return '';
  seen.add(value);
  if (Array.isArray(value)) return value.map((v) => flattenForScan(v, seen)).join('|');
  return Object.values(value)
    .map((v) => flattenForScan(v, seen))
    .join('|');
}

describe('no-plaintext-leakage', () => {
  const consoleSpies = ['log', 'warn', 'error', 'info', 'debug'] as const;
  const spies = consoleSpies.map((method) => vi.spyOn(console, method).mockImplementation(() => {}));

  afterEach(() => {
    for (const spy of spies) spy.mockClear();
  });

  it('never writes the raw password or Secret Key into any persisted record', async () => {
    const canaryPassword = 'canary-password-marker-7b1e';
    const repository = freshRepository();
    const { secretKey } = await onboardVault(canaryPassword, repository);
    const secretKeyMarker = Buffer.from(secretKey).toString('latin1');

    const metaRecords = await Promise.all(
      (['kdfSalt', 'kdfParams', 'authVerifier', 'schemaVersion'] as const).map((key) =>
        repository.getMeta(key),
      ),
    );

    const persistedText = flattenForScan(metaRecords);
    expect(persistedText).not.toContain(canaryPassword);
    expect(persistedText).not.toContain(secretKeyMarker);
  });

  it('never writes item plaintext into the persisted VaultItemRecord', async () => {
    const repository = freshRepository();
    const { kEnc } = await onboardVault('leakage-test-password', repository);
    const vault = new VaultService(repository, kEnc);

    const canary = 'canary-item-plaintext-marker-c3d9';
    await vault.createItem('login', { username: 'dave', password: canary, url: '' });

    const records = await repository.listItems();
    expect(flattenForScan(records)).not.toContain(canary);
  });

  it('never logs the password or Secret Key to the console during onboarding or unlock', async () => {
    const canaryPassword = 'canary-console-password-e91a';
    const repository = freshRepository();
    const { secretKey } = await onboardVault(canaryPassword, repository);
    await unlockVault(canaryPassword, secretKey, repository);

    const secretKeyMarker = Buffer.from(secretKey).toString('latin1');
    for (const spy of spies) {
      for (const call of spy.mock.calls) {
        const serialized = flattenForScan(call);
        expect(serialized).not.toContain(canaryPassword);
        expect(serialized).not.toContain(secretKeyMarker);
      }
    }
  });
});
