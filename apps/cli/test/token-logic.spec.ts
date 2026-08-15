import { describe, expect, it } from 'vitest';
import { type ApiTokenPayload, filterExpiringSoon } from '../src/lib/token-logic.js';

function item(id: string, expiresAt?: string): { id: string; payload: ApiTokenPayload } {
  return { id, payload: { provider: 'aws', label: id, token: 'x', ...(expiresAt ? { expiresAt } : {}) } };
}

describe('filterExpiringSoon', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');
  const dayMs = 24 * 60 * 60 * 1000;

  it('flags tokens expiring within the window', () => {
    const items = [item('soon', new Date(now + 5 * dayMs).toISOString()), item('far', new Date(now + 60 * dayMs).toISOString())];
    const result = filterExpiringSoon(items, 30, now);
    expect(result.map((r) => r.id)).toEqual(['soon']);
  });

  it('ignores tokens with no expiry date', () => {
    const items = [item('no-expiry')];
    expect(filterExpiringSoon(items, 30, now)).toEqual([]);
  });

  it('flags already-expired tokens', () => {
    const items = [item('expired', new Date(now - dayMs).toISOString())];
    expect(filterExpiringSoon(items, 30, now).map((r) => r.id)).toEqual(['expired']);
  });

  it('treats the cutoff boundary as inclusive', () => {
    const items = [item('exact', new Date(now + 30 * dayMs).toISOString())];
    expect(filterExpiringSoon(items, 30, now).map((r) => r.id)).toEqual(['exact']);
  });
});
