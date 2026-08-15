/**
 * TypeScript 5.7 made typed arrays generic over their backing buffer
 * (`Uint8Array<ArrayBufferLike>` vs the DOM lib's `ArrayBufferView<ArrayBuffer>`),
 * which makes ordinary `Uint8Array` values fail to structurally match
 * WebCrypto's overloaded `importKey`/`deriveBits` signatures at the type
 * level even though every value here really is a plain, non-shared
 * ArrayBuffer-backed Uint8Array at runtime. This is a type-only
 * compatibility cast for that TS/lib mismatch, not a runtime behavior
 * change. See https://github.com/microsoft/TypeScript/pull/58573.
 */
export function asBufferSource(view: Uint8Array): BufferSource {
  return view as unknown as BufferSource;
}
