import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decryptItem, encryptItem } from '../src/envelope.js';
import { deriveSubKeys } from '../src/hkdf.js';
import type { ItemAAD } from '../src/types.js';

const jsonValue = fc.jsonValue();
const aadArb: fc.Arbitrary<ItemAAD> = fc.record({
  id: fc.uuid(),
  version: fc.integer({ min: 0, max: 1000 }),
  type: fc.constantFrom('login', 'note', 'card', 'identity'),
});

describe('encryptItem / decryptItem (property-based)', () => {
  it('round-trips any JSON-serializable plaintext under any AAD', async () => {
    const mk = crypto.getRandomValues(new Uint8Array(32));
    const { kEnc } = await deriveSubKeys(mk);

    await fc.assert(
      fc.asyncProperty(jsonValue, aadArb, async (plaintext, aad) => {
        const envelope = await encryptItem(plaintext, kEnc, aad);
        const decrypted = await decryptItem(envelope, kEnc);
        expect(decrypted).toEqual(plaintext);
      }),
      { numRuns: 50 },
    );
  });

  it('never decrypts successfully after a single-byte tamper of ciphertext, IV, wrapped key, or wrap-IV', async () => {
    const mk = crypto.getRandomValues(new Uint8Array(32));
    const { kEnc } = await deriveSubKeys(mk);
    const aad: ItemAAD = { id: 'fixed-id', version: 1, type: 'login' };

    await fc.assert(
      fc.asyncProperty(
        jsonValue,
        fc.constantFrom('ciphertext', 'iv', 'wrappedKey', 'wrapIv') as fc.Arbitrary<
          'ciphertext' | 'iv' | 'wrappedKey' | 'wrapIv'
        >,
        fc.nat({ max: 7 }), // bit to flip within the first byte
        async (plaintext, field, bit) => {
          const envelope = await encryptItem(plaintext, kEnc, aad);
          const bytes = new Uint8Array(envelope[field]);
          if (bytes.length === 0) return; // nothing to tamper
          bytes[0] ^= 1 << bit;

          await expect(decryptItem({ ...envelope, [field]: bytes.buffer }, kEnc)).rejects.toThrow();
        },
      ),
      { numRuns: 50 },
    );
  });
});
