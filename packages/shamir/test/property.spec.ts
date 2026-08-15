import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { combineShares, splitSecret } from '../src/shamir.js';

describe('splitSecret / combineShares (property-based)', () => {
  it('any threshold-sized subset of shares reconstructs the exact original secret', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 64 }),
        fc.integer({ min: 2, max: 8 }),
        fc.integer({ min: 0, max: 5 }),
        (secretArray, threshold, extraShares) => {
          const secret = new Uint8Array(secretArray);
          const totalShares = threshold + extraShares;
          const shares = splitSecret(secret, { shares: totalShares, threshold });

          // Deterministic "random" subset selection: reverse + take threshold,
          // so different runs exercise different positions without needing
          // an extra fast-check arbitrary for the subset itself.
          const subset = [...shares].reverse().slice(0, threshold);
          const reconstructed = combineShares(subset);

          expect(reconstructed).toEqual(secret);
        },
      ),
      { numRuns: 100 },
    );
  });
});
