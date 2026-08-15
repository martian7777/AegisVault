import { describe, expect, it } from 'vitest';
import { type EnvVarPayload, filterByProjectEnvironment, findEnvVarMatch } from '../src/lib/env-logic.js';

function item(project: string, environment: string, key: string, value = 'v'): { id: string; payload: EnvVarPayload } {
  return { id: `${project}/${environment}/${key}`, payload: { project, environment, key, value } };
}

describe('filterByProjectEnvironment', () => {
  it('only returns items matching both project and environment', () => {
    const items = [
      item('acme', 'production', 'DATABASE_URL'),
      item('acme', 'staging', 'DATABASE_URL'),
      item('other', 'production', 'DATABASE_URL'),
    ];
    const result = filterByProjectEnvironment(items, 'acme', 'production');
    expect(result).toHaveLength(1);
    expect(result[0]?.payload.key).toBe('DATABASE_URL');
  });
});

describe('findEnvVarMatch', () => {
  it('finds an exact project/environment/key match', () => {
    const items = [item('acme', 'production', 'DATABASE_URL'), item('acme', 'production', 'API_KEY')];
    const match = findEnvVarMatch(items, 'acme', 'production', 'API_KEY');
    expect(match?.payload.key).toBe('API_KEY');
  });

  it('returns undefined when nothing matches', () => {
    const items = [item('acme', 'production', 'DATABASE_URL')];
    expect(findEnvVarMatch(items, 'acme', 'staging', 'DATABASE_URL')).toBeUndefined();
  });
});
