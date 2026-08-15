import { listItemsByType } from '../lib/item-helpers.js';
import { promptHidden } from '../lib/prompt.js';
import { type ApiTokenPayload, filterExpiringSoon } from '../lib/token-logic.js';
import { unlockCliVault } from '../lib/vault-context.js';

export type { ApiTokenPayload };

/**
 * Stores API tokens with an optional expiry date and lets `aegis token
 * check` flag ones expiring soon. There is no scheduling or webhook
 * infrastructure here — wire the exit code into your own cron/CI rather
 * than expecting AegisVault to page you (see SPECIFICATION.md roadmap).
 */
export async function tokenAddCommand(
  provider: string,
  label: string,
  token: string | undefined,
  options: { expires?: string },
): Promise<void> {
  const { vault } = await unlockCliVault();
  const resolvedToken = token ?? (await promptHidden(`Token value for ${provider}/${label}: `));

  if (options.expires && Number.isNaN(Date.parse(options.expires))) {
    console.error(`Not a valid date: ${options.expires}`);
    process.exitCode = 1;
    return;
  }

  const payload: ApiTokenPayload = {
    provider,
    label,
    token: resolvedToken,
    ...(options.expires ? { expiresAt: new Date(options.expires).toISOString() } : {}),
  };
  await vault.createItem('apitoken', payload);
  console.log(`Saved token ${provider}/${label}.`);
}

export async function tokenListCommand(): Promise<void> {
  const { vault } = await unlockCliVault();
  const items = await listItemsByType<ApiTokenPayload>(vault, 'apitoken');
  if (items.length === 0) {
    console.log('No API tokens stored.');
    return;
  }
  for (const { payload } of items) {
    const expiry = payload.expiresAt ? ` (expires ${payload.expiresAt.slice(0, 10)})` : '';
    console.log(`${payload.provider}/${payload.label}${expiry}`);
  }
}

export async function tokenCheckCommand(options: { within: number }): Promise<void> {
  const { vault } = await unlockCliVault();
  const items = await listItemsByType<ApiTokenPayload>(vault, 'apitoken');
  const expiringSoon = filterExpiringSoon(items, options.within, Date.now());

  if (expiringSoon.length === 0) {
    console.log(`No tokens expiring within ${options.within} days.`);
    return;
  }

  console.log(`Tokens expiring within ${options.within} days:`);
  for (const { payload } of expiringSoon) {
    console.log(`  ${payload.provider}/${payload.label} — expires ${payload.expiresAt}`);
  }
  process.exitCode = 1;
}
