/**
 * Arithmetic over GF(2^8), the finite field Shamir's Secret Sharing is
 * built on here — each byte of the secret is split/reconstructed
 * independently in this field. Uses the same reducing polynomial as AES,
 * x^8 + x^4 + x^3 + x + 1 (0x11B): a well-known, standard choice. This
 * doesn't need to match any *other* Shamir implementation's field choice to
 * be correct — split and combine only need to agree with each other, which
 * they do by construction — but 0x11B is the most recognizable choice
 * available, rather than an arbitrary one.
 */
const REDUCING_POLYNOMIAL = 0x11b;

const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);

(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    // Advance by generator 3, not 2: 2 has multiplicative order 51 under
    // 0x11B (51 | 255, but 51 !== 255), so repeatedly doubling only cycles
    // through a 51-element subgroup and silently corrupts most of the
    // table instead of covering all 255 nonzero field elements. 3 has
    // order 255 (verified numerically) — it's the same generator AES's own
    // reference log/antilog tables use for this exact polynomial.
    let doubled = x << 1;
    if (doubled & 0x100) doubled ^= REDUCING_POLYNOMIAL;
    x = (doubled ^ x) & 0xff; // x*3 = x*2 XOR x
  }
  // EXP has period 255; EXP[255] is defined for convenience but never
  // produced by the (LOG[a] + LOG[b]) % 255 reduction below.
  EXP[255] = EXP[0] ?? 0;
})();

export function gfAdd(a: number, b: number): number {
  return a ^ b;
}

export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  const j = LOG[a];
  const k = LOG[b];
  if (j === undefined || k === undefined) throw new Error('GF(256) value out of range.');
  return EXP[(j + k) % 255] ?? 0;
}

export function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(256).');
  if (a === 0) return 0;
  const j = LOG[a];
  const k = LOG[b];
  if (j === undefined || k === undefined) throw new Error('GF(256) value out of range.');
  return EXP[(j - k + 255) % 255] ?? 0;
}
