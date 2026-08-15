/**
 * Best-effort overwrite of a buffer's contents. This is defense-in-depth, not
 * a guarantee: JS engines give no assurance about GC timing or whether the
 * underlying memory was copied/moved before this runs. See SECURITY.md.
 */
export function zeroize(buffer: Uint8Array): void {
  buffer.fill(0);
}
