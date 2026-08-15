import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare } from '../src/share-codec.js';
import type { Share } from '../src/types.js';

describe('encodeShare / decodeShare', () => {
  it('round-trips a share', () => {
    const share: Share = { index: 3, threshold: 4, data: new Uint8Array([1, 2, 3, 255, 0]) };
    const encoded = encodeShare(share);
    expect(decodeShare(encoded)).toEqual(share);
  });

  it('starts with the recognizable "aegis-shard" prefix', () => {
    const encoded = encodeShare({ index: 1, threshold: 2, data: new Uint8Array([9]) });
    expect(encoded.startsWith('aegis-shard:v1:')).toBe(true);
  });

  it('tolerates surrounding whitespace from copy-paste', () => {
    const encoded = encodeShare({ index: 1, threshold: 2, data: new Uint8Array([9]) });
    expect(decodeShare(`  \n${encoded}\n `)).toEqual({
      index: 1,
      threshold: 2,
      data: new Uint8Array([9]),
    });
  });

  it('rejects text that is not a recovery share', () => {
    expect(() => decodeShare('not a share')).toThrow(/not a valid/i);
  });

  it('rejects an unsupported version', () => {
    expect(() => decodeShare('aegis-shard:v99:2:1:AAA=')).toThrow(/unsupported/i);
  });

  it('rejects malformed numeric fields', () => {
    expect(() => decodeShare('aegis-shard:v1:not-a-number:1:AAA=')).toThrow(/malformed/i);
  });
});
