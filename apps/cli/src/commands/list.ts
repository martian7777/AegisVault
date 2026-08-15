import { unlockCliVault } from '../lib/vault-context.js';

export async function listCommand(): Promise<void> {
  const { vault } = await unlockCliVault();
  const summaries = await vault.listItemSummaries();

  if (summaries.length === 0) {
    console.log('Vault is empty.');
    return;
  }

  const counts = new Map<string, number>();
  for (const summary of summaries) {
    counts.set(summary.type, (counts.get(summary.type) ?? 0) + 1);
  }

  console.log(`${summaries.length} item(s):`);
  for (const [type, count] of counts) {
    console.log(`  ${type}: ${count}`);
  }
}
