import { describe, expect, it } from 'vitest';
import { combineShares, splitSecret } from '../src/shamir.js';

function secretOf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

describe('splitSecret / combineShares', () => {
  it('reconstructs the secret from exactly `threshold` shares', () => {
    const secret = secretOf('deadbeefcafef00d');
    const shares = splitSecret(secret, { shares: 5, threshold: 3 });
    const reconstructed = combineShares(shares.slice(0, 3));
    expect(reconstructed).toEqual(secret);
  });

  it('reconstructs from any subset of shares of size >= threshold, not just the first ones', () => {
    const secret = secretOf('0102030405060708090a0b0c0d0e0f10');
    const shares = splitSecret(secret, { shares: 5, threshold: 3 });
    const subset = [shares[1], shares[3], shares[4]].filter((s) => s !== undefined);
    expect(combineShares(subset)).toEqual(secret);
  });

  it('reconstructs using all shares (more than the minimum threshold)', () => {
    const secret = secretOf('ff00ff00');
    const shares = splitSecret(secret, { shares: 5, threshold: 3 });
    expect(combineShares(shares)).toEqual(secret);
  });

  it('rejects reconstruction with fewer than `threshold` shares', () => {
    const secret = secretOf('aabbccdd');
    const shares = splitSecret(secret, { shares: 5, threshold: 3 });
    expect(() => combineShares(shares.slice(0, 2))).toThrow(/at least 3/);
  });

  it('produces the wrong (not matching) secret when given insufficient/wrong shares — no built-in integrity check', () => {
    // Documents the real Shamir property: combining fewer than threshold
    // shares "succeeds" numerically but yields garbage, not an error. This
    // is exactly why AegisVault wraps the reconstructed value with AEAD.
    const secret = secretOf('0011223344556677');
    const shares = splitSecret(secret, { shares: 5, threshold: 4 });
    // Force through with an invalid combination by bypassing the length
    // guard is not possible via the public API (it correctly throws) —
    // instead, verify that swapping in a share from a *different* split
    // reconstructs something other than the original secret.
    const otherSplit = splitSecret(secret, { shares: 5, threshold: 4 });
    const mixed = [shares[0], shares[1], shares[2], otherSplit[3]].filter((s) => s !== undefined);
    const reconstructed = combineShares(mixed);
    expect(reconstructed).not.toEqual(secret);
  });

  it('rejects shares from different splits (mismatched threshold is one signal, but same-threshold mixed splits are only structurally invalid via index/length checks)', () => {
    const secret = secretOf('12345678');
    const a = splitSecret(secret, { shares: 5, threshold: 3 });
    const b = splitSecret(secret, { shares: 5, threshold: 4 });
    expect(() => combineShares([a[0], a[1], b[0]].filter((s) => s !== undefined))).toThrow(/mismatched threshold/);
  });

  it('rejects duplicate share indices', () => {
    const secret = secretOf('aabb');
    const shares = splitSecret(secret, { shares: 5, threshold: 3 });
    const first = shares[0];
    if (!first) throw new Error('test setup failed');
    expect(() => combineShares([first, first, shares[1]].filter((s): s is typeof first => s !== undefined))).toThrow(
      /duplicate/i,
    );
  });

  it('rejects threshold < 2', () => {
    expect(() => splitSecret(secretOf('aa'), { shares: 3, threshold: 1 })).toThrow(/at least 2/);
  });

  it('rejects shares < threshold at split time', () => {
    expect(() => splitSecret(secretOf('aa'), { shares: 2, threshold: 3 })).toThrow(/shares must be/);
  });

  it('produces shares that individually reveal nothing about the secret (spot check: differs from a fresh split)', () => {
    const secret = secretOf('00000000000000000000000000000000');
    const shares = splitSecret(secret, { shares: 3, threshold: 2 });
    // A share for an all-zero secret should not itself be all zero (that
    // would leak the secret directly) except with vanishing probability.
    expect(shares[0]?.data.every((b) => b === 0)).toBe(false);
  });
});
