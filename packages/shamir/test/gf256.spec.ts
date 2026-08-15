import { describe, expect, it } from 'vitest';
import { gfAdd, gfDiv, gfMul } from '../src/gf256.js';

describe('GF(256) arithmetic', () => {
  it('multiplication is invertible via division for every nonzero pair', () => {
    // A generator with the wrong multiplicative order (e.g. 2 instead of 3,
    // under the 0x11B reducing polynomial) silently corrupts most of the
    // log/exp tables while leaving a handful of values self-consistent —
    // exactly the bug this test is guarding against. Sweeping all 255
    // nonzero values (not just a few samples) is what actually catches it.
    for (let a = 1; a <= 255; a++) {
      for (let b = 1; b <= 255; b++) {
        expect(gfDiv(gfMul(a, b), b)).toBe(a);
      }
    }
  });

  it('every nonzero byte is reachable as a product (log/exp tables cover the full field)', () => {
    const reachable = new Set<number>();
    for (let a = 1; a <= 255; a++) {
      reachable.add(gfMul(a, 1));
    }
    expect(reachable.size).toBe(255);
  });

  it('gfAdd is its own inverse (XOR)', () => {
    expect(gfAdd(gfAdd(37, 201), 201)).toBe(37);
  });

  it('multiplying by zero is always zero', () => {
    expect(gfMul(123, 0)).toBe(0);
    expect(gfMul(0, 123)).toBe(0);
  });

  it('division by zero throws', () => {
    expect(() => gfDiv(1, 0)).toThrow(/division by zero/i);
  });
});
