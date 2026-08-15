export interface Share {
  /** x-coordinate, 1..255 (0 is reserved — it's where the secret itself lives). */
  index: number;
  /** k — how many shares are required to reconstruct. Carried on every share so combineShares() can validate they're compatible before trying. */
  threshold: number;
  /** y-values, one byte per original secret byte. */
  data: Uint8Array;
}

export interface SplitOptions {
  /** n — total shares to generate. */
  shares: number;
  /** k — shares required to reconstruct. Must be >= 2 and <= shares. */
  threshold: number;
}
