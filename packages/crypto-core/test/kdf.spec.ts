import { describe, expect, it } from 'vitest';
import { deriveMasterKey } from '../src/kdf.js';
import { bytesToHex, hexToBytes } from './helpers/hex.js';
import { ARGON2ID_REGRESSION_VECTOR as VEC } from './vectors/argon2id-regression.js';

describe('deriveMasterKey', () => {
  it('matches the pinned regression vector for the exact deriveMasterKey composition', async () => {
    const mk = await deriveMasterKey({
      password: VEC.password,
      secretKey: hexToBytes(VEC.secretKeyHex),
      salt: hexToBytes(VEC.saltHex),
      params: VEC.params,
    });
    expect(bytesToHex(mk)).toBe(VEC.masterKeyHex);
  });

  it('produces a key of the requested hash length', async () => {
    const mk = await deriveMasterKey({
      password: 'p',
      secretKey: hexToBytes('00'.repeat(16)),
      salt: hexToBytes('01'.repeat(16)),
      params: { memory: 256, time: 1, parallelism: 1, hashLength: 16 },
    });
    expect(mk.length).toBe(16);
  });

  it('is sensitive to the password, the Secret Key, and the salt independently', async () => {
    const base = {
      password: 'hunter2',
      secretKey: hexToBytes('02'.repeat(16)),
      salt: hexToBytes('03'.repeat(16)),
      params: { memory: 256, time: 1, parallelism: 1, hashLength: 32 },
    };
    const baseline = bytesToHex(await deriveMasterKey(base));

    const diffPassword = bytesToHex(await deriveMasterKey({ ...base, password: 'hunter3' }));
    const diffSecret = bytesToHex(
      await deriveMasterKey({ ...base, secretKey: hexToBytes('04'.repeat(16)) }),
    );
    const diffSalt = bytesToHex(
      await deriveMasterKey({ ...base, salt: hexToBytes('05'.repeat(16)) }),
    );

    expect(diffPassword).not.toBe(baseline);
    expect(diffSecret).not.toBe(baseline);
    expect(diffSalt).not.toBe(baseline);
  });

  it('never leaks the raw password or Secret Key into thrown errors', async () => {
    const secretPassword = 'super-secret-password-marker-9f3a';
    try {
      await deriveMasterKey({
        password: secretPassword,
        secretKey: hexToBytes('06'.repeat(16)),
        // Invalid salt type deliberately forces hash-wasm to throw.
        salt: null as unknown as Uint8Array,
      });
      expect.unreachable('expected deriveMasterKey to throw on invalid salt');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain(secretPassword);
    }
  });
});
