const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function utf8Encode(value: string): Uint8Array {
  return encoder.encode(value);
}

export function utf8Decode(bytes: ArrayBuffer | Uint8Array): string {
  return decoder.decode(bytes);
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Deterministic serialization of ItemAAD, independent of caller-supplied key order. */
export function canonicalAADBytes(aad: { id: string; version: number; type: string }): Uint8Array {
  return utf8Encode(JSON.stringify({ id: aad.id, version: aad.version, type: aad.type }));
}
