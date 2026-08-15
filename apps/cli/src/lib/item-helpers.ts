import type { VaultItemType, VaultService } from '@aegisvault/vault-core';

/** Decrypts every item of a given type — fine at personal-vault CLI scale. */
export async function listItemsByType<T>(
  vault: VaultService,
  type: VaultItemType,
): Promise<Array<{ id: string; payload: T }>> {
  const summaries = await vault.listItemSummaries();
  const matches: Array<{ id: string; payload: T }> = [];
  for (const summary of summaries.filter((s) => s.type === type)) {
    const payload = await vault.getItem<T>(summary.id);
    if (payload !== undefined) matches.push({ id: summary.id, payload });
  }
  return matches;
}
