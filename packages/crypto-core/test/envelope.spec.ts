import { describe, expect, it } from 'vitest';
import { decryptItem, encryptItem } from '../src/envelope.js';
import { DecryptionError } from '../src/errors.js';
import { deriveSubKeys } from '../src/hkdf.js';
import type { ItemAAD } from '../src/types.js';
import { hexToBytes } from './helpers/hex.js';

async function freshKEnc() {
  const mk = hexToBytes('ab'.repeat(32));
  const { kEnc } = await deriveSubKeys(mk);
  return kEnc;
}

const aad: ItemAAD = { id: 'item-1', version: 1, type: 'login' };

describe('encryptItem / decryptItem', () => {
  it('round-trips arbitrary JSON payloads', async () => {
    const kEnc = await freshKEnc();
    const payload = { username: 'alice', password: 'p@ssw0rd!', notes: 'unicode: héllo 🔒' };

    const envelope = await encryptItem(payload, kEnc, aad);
    const decrypted = await decryptItem<typeof payload>(envelope, kEnc);

    expect(decrypted).toEqual(payload);
  });

  it('produces a fresh, distinct IV and wrap-IV on every call', async () => {
    const kEnc = await freshKEnc();
    const a = await encryptItem({ v: 1 }, kEnc, aad);
    const b = await encryptItem({ v: 1 }, kEnc, aad);

    expect(Buffer.from(a.iv)).not.toEqual(Buffer.from(b.iv));
    expect(Buffer.from(a.wrapIv)).not.toEqual(Buffer.from(b.wrapIv));
    // Same plaintext + AAD but a random per-item key each time -> different ciphertext.
    expect(Buffer.from(a.ciphertext)).not.toEqual(Buffer.from(b.ciphertext));
  });

  it('never emits the plaintext secret as a substring anywhere in the envelope', async () => {
    const kEnc = await freshKEnc();
    const canary = 'canary-secret-marker-4f2c9e';
    const envelope = await encryptItem({ password: canary }, kEnc, aad);

    const serialized = JSON.stringify({
      ciphertext: Buffer.from(envelope.ciphertext).toString('base64'),
      iv: Buffer.from(envelope.iv).toString('base64'),
      wrappedKey: Buffer.from(envelope.wrappedKey).toString('base64'),
      wrapIv: Buffer.from(envelope.wrapIv).toString('base64'),
      aad: envelope.aad,
    });

    expect(serialized).not.toContain(canary);
  });

  it('rejects decryption under the wrong kEnc', async () => {
    const kEnc = await freshKEnc();
    const wrongMk = hexToBytes('cd'.repeat(32));
    const { kEnc: wrongKEnc } = await deriveSubKeys(wrongMk);

    const envelope = await encryptItem({ v: 1 }, kEnc, aad);
    await expect(decryptItem(envelope, wrongKEnc)).rejects.toThrow(DecryptionError);
  });

  it('rejects decryption when the AAD has been swapped for a different item identity', async () => {
    const kEnc = await freshKEnc();
    const envelope = await encryptItem({ v: 1 }, kEnc, aad);

    const tampered = { ...envelope, aad: { ...aad, id: 'item-2' } };
    await expect(decryptItem(tampered, kEnc)).rejects.toThrow(DecryptionError);
  });

  it('rejects decryption when the ciphertext has been tampered with', async () => {
    const kEnc = await freshKEnc();
    const envelope = await encryptItem({ v: 1 }, kEnc, aad);

    const tamperedCiphertext = new Uint8Array(envelope.ciphertext);
    tamperedCiphertext[0] ^= 0x01;
    const tampered = { ...envelope, ciphertext: tamperedCiphertext.buffer as ArrayBuffer };

    await expect(decryptItem(tampered, kEnc)).rejects.toThrow(DecryptionError);
  });

  it('rejects decryption when the wrapped item key has been tampered with', async () => {
    const kEnc = await freshKEnc();
    const envelope = await encryptItem({ v: 1 }, kEnc, aad);

    const tamperedWrapped = new Uint8Array(envelope.wrappedKey);
    tamperedWrapped[0] ^= 0x01;
    const tampered = { ...envelope, wrappedKey: tamperedWrapped.buffer as ArrayBuffer };

    await expect(decryptItem(tampered, kEnc)).rejects.toThrow(DecryptionError);
  });
});
