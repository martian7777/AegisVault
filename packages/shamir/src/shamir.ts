import { gfAdd, gfDiv, gfMul } from './gf256.js';
import type { Share, SplitOptions } from './types.js';

/** x-coordinates run 1..255 — 0 is reserved for the secret (f(0) = secret byte). */
const MAX_SHARES = 255;

function evaluatePolynomial(coefficients: Uint8Array, x: number): number {
  // Horner's method, entirely in GF(256).
  let result = 0;
  for (let i = coefficients.length - 1; i >= 0; i--) {
    result = gfAdd(gfMul(result, x), coefficients[i] ?? 0);
  }
  return result;
}

/**
 * Splits `secret` into `options.shares` shares, any `options.threshold` of
 * which reconstruct it exactly (Shamir's Secret Sharing over GF(256), one
 * random degree-(k-1) polynomial per byte, f(0) = that byte).
 */
export function splitSecret(secret: Uint8Array, options: SplitOptions): Share[] {
  const { shares, threshold } = options;
  if (threshold < 2) throw new Error('threshold must be at least 2.');
  if (shares < threshold) throw new Error('shares must be >= threshold.');
  if (shares > MAX_SHARES) throw new Error(`shares must be <= ${MAX_SHARES}.`);
  if (secret.length === 0) throw new Error('secret must not be empty.');

  const shareBytes: Uint8Array[] = Array.from(
    { length: shares },
    () => new Uint8Array(secret.length),
  );

  for (let byteIndex = 0; byteIndex < secret.length; byteIndex++) {
    const coefficients = new Uint8Array(threshold);
    coefficients[0] = secret[byteIndex] ?? 0;
    const randomCoefficients = crypto.getRandomValues(new Uint8Array(threshold - 1));
    coefficients.set(randomCoefficients, 1);

    for (let shareIdx = 0; shareIdx < shares; shareIdx++) {
      const x = shareIdx + 1;
      const target = shareBytes[shareIdx];
      if (target) target[byteIndex] = evaluatePolynomial(coefficients, x);
    }
  }

  return shareBytes.map((data, i) => ({ index: i + 1, threshold, data }));
}

function lagrangeInterpolateAtZero(shares: Share[], byteIndex: number): number {
  let result = 0;
  for (let j = 0; j < shares.length; j++) {
    const shareJ = shares[j];
    if (!shareJ) continue;
    const xj = shareJ.index;
    const yj = shareJ.data[byteIndex] ?? 0;

    let numerator = 1;
    let denominator = 1;
    for (let m = 0; m < shares.length; m++) {
      if (m === j) continue;
      const xm = shares[m]?.index;
      if (xm === undefined) continue;
      numerator = gfMul(numerator, xm);
      denominator = gfMul(denominator, gfAdd(xm, xj)); // xm - xj === xm ^ xj in GF(2^n)
    }
    result = gfAdd(result, gfMul(yj, gfDiv(numerator, denominator)));
  }
  return result;
}

/**
 * Reconstructs the original secret from >= threshold shares.
 *
 * Important: this does NOT validate that the reconstructed value is
 * "correct" in any cryptographic sense — Shamir's Secret Sharing has no
 * built-in integrity check. Wrong, insufficient, or mismatched shares
 * produce a *different* byte sequence, not a thrown error (except for the
 * structural checks below — too few shares, mismatched threshold/length,
 * duplicate indices). Callers that need to know whether reconstruction
 * actually recovered the right secret must verify it against something
 * else (AegisVault wraps the reconstructed value with an AEAD tag
 * specifically so a wrong value fails to decrypt cleanly).
 */
export function combineShares(shares: Share[]): Uint8Array {
  if (shares.length === 0) throw new Error('No shares provided.');

  const threshold = shares[0]?.threshold;
  if (threshold === undefined || shares.some((s) => s.threshold !== threshold)) {
    throw new Error('Shares have mismatched threshold values — they are not from the same split.');
  }
  if (shares.length < threshold) {
    throw new Error(`Need at least ${threshold} shares, got ${shares.length}.`);
  }

  const length = shares[0]?.data.length ?? 0;
  if (shares.some((s) => s.data.length !== length)) {
    throw new Error('Shares have mismatched data lengths.');
  }

  const indices = shares.map((s) => s.index);
  if (new Set(indices).size !== indices.length) {
    throw new Error('Duplicate share indices provided.');
  }

  const secret = new Uint8Array(length);
  for (let byteIndex = 0; byteIndex < length; byteIndex++) {
    secret[byteIndex] = lagrangeInterpolateAtZero(shares, byteIndex);
  }
  return secret;
}
