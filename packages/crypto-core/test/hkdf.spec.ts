import { describe, expect, it } from 'vitest';
import { deriveSubKeys } from '../src/hkdf.js';
import { bytesToHex, hexToBytes } from './helpers/hex.js';
import { HKDF_RFC5869_TEST_CASE_1 } from './vectors/hkdf-rfc5869.js';

describe('deriveSubKeys', () => {
  it('derives distinct, non-extractable kEnc/kAuth keys from a Master Key', async () => {
    const mk = hexToBytes('aa'.repeat(32));
    const { kEnc, kAuth } = await deriveSubKeys(mk);

    expect(kEnc.extractable).toBe(false);
    expect(kAuth.extractable).toBe(false);
    expect(kEnc.algorithm.name).toBe('AES-GCM');
    expect(kAuth.algorithm.name).toBe('HMAC');
  });

  it('zeroes the input Master Key buffer after deriving', async () => {
    const mk = hexToBytes('bb'.repeat(32));
    await deriveSubKeys(mk);
    expect([...mk].every((byte) => byte === 0)).toBe(true);
  });

  it('is deterministic: the same MK always derives the same sub-keys', async () => {
    const mk1 = hexToBytes('cc'.repeat(32));
    const mk2 = hexToBytes('cc'.repeat(32));
    const a = await deriveSubKeys(mk1);
    const b = await deriveSubKeys(mk2);

    // Keys are non-extractable, so compare by usage: sign the same message with
    // both kAuth keys and expect identical HMAC output.
    const message = new TextEncoder().encode('probe');
    const sigA = await crypto.subtle.sign('HMAC', a.kAuth, message);
    const sigB = await crypto.subtle.sign('HMAC', b.kAuth, message);
    expect(bytesToHex(sigA)).toBe(bytesToHex(sigB));
  });

  it("matches the RFC 5869 Test Case 1 vector for WebCrypto's underlying HKDF", async () => {
    // Exercises the exact same crypto.subtle.deriveBits({name:'HKDF', ...})
    // call our deriveSubKeys() uses, with RFC 5869's published inputs/output,
    // to pin correctness of the platform primitive we depend on.
    const ikm = hexToBytes(HKDF_RFC5869_TEST_CASE_1.ikm);
    const salt = hexToBytes(HKDF_RFC5869_TEST_CASE_1.salt);
    const info = hexToBytes(HKDF_RFC5869_TEST_CASE_1.info);

    const baseKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    const okm = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info },
      baseKey,
      HKDF_RFC5869_TEST_CASE_1.length * 8,
    );

    expect(bytesToHex(okm)).toBe(HKDF_RFC5869_TEST_CASE_1.okm);
  });
});
