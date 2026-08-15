export interface ApiTokenPayload {
  provider: string;
  label: string;
  token: string;
  /** ISO 8601 date string, or undefined if the token doesn't expire. */
  expiresAt?: string;
}

/** Pure filter, extracted for direct unit testing without spawning a process. */
export function filterExpiringSoon(
  items: Array<{ id: string; payload: ApiTokenPayload }>,
  withinDays: number,
  now: number,
): Array<{ id: string; payload: ApiTokenPayload }> {
  const cutoff = now + withinDays * 24 * 60 * 60 * 1000;
  return items.filter(
    (item) => item.payload.expiresAt && Date.parse(item.payload.expiresAt) <= cutoff,
  );
}
