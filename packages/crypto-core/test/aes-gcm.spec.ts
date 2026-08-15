import { describe, expect, it } from 'vitest';
import { decryptBytes, encryptBytes } from '../src/aes-gcm.js';
import { DecryptionError } from '../src/errors.js';
import { bytesToHex, hexToBytes } from './helpers/hex.js';
import { AES_256_GCM_REGRESSION_VECTOR as VEC } from './vectors/aes-gcm-regression.js';

async function importKey(rawHex: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey('raw', hexToBytes(rawHex), { name: 'AES-GCM' }, false, usages);
}

describe('encryptBytes / decryptBytes', () => {
  it('matches the pinned AES-256-GCM regression vector', async () => {
    const key = await importKey(VEC.key, ['encrypt']);
    const iv = hexToBytes(VEC.iv);
    const aad = hexToBytes(VEC.aad);
    const plaintext = new TextEncoder().encode(VEC.plaintextUtf8);

    const ciphertext = await encryptBytes(key, iv, plaintext, aad);
    expect(bytesToHex(ciphertext)).toBe(VEC.ciphertextAndTag);
  });

  it('decrypts the regression vector back to the original plaintext', async () => {
    const key = await importKey(VEC.key, ['decrypt']);
    const iv = hexToBytes(VEC.iv);
    const aad = hexToBytes(VEC.aad);
    const ciphertext = hexToBytes(VEC.ciphertextAndTag).buffer as ArrayBuffer;

    const plaintext = await decryptBytes(key, iv, ciphertext, aad);
    expect(new TextDecoder().decode(plaintext)).toBe(VEC.plaintextUtf8);
  });

  it('throws DecryptionError (never returns garbage) when the AAD does not match', async () => {
    const key = await importKey(VEC.key, ['decrypt']);
    const iv = hexToBytes(VEC.iv);
    const wrongAad = hexToBytes(`${VEC.aad.slice(0, -2)}ff`);
    const ciphertext = hexToBytes(VEC.ciphertextAndTag).buffer as ArrayBuffer;

    await expect(decryptBytes(key, iv, ciphertext, wrongAad)).rejects.toThrow(DecryptionError);
  });

  it('throws DecryptionError when a single ciphertext byte is flipped', async () => {
    const key = await importKey(VEC.key, ['decrypt']);
    const iv = hexToBytes(VEC.iv);
    const aad = hexToBytes(VEC.aad);
    const tampered = hexToBytes(VEC.ciphertextAndTag);
    tampered[0] ^= 0x01;

    await expect(decryptBytes(key, iv, tampered.buffer as ArrayBuffer, aad)).rejects.toThrow(
      DecryptionError,
    );
  });
});
