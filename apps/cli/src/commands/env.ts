import { type EnvVarPayload, filterByProjectEnvironment, findEnvVarMatch } from '../lib/env-logic.js';
import { listItemsByType } from '../lib/item-helpers.js';
import { promptHidden } from '../lib/prompt.js';
import { unlockCliVault } from '../lib/vault-context.js';

export type { EnvVarPayload };

export async function envSetCommand(
  project: string,
  environment: string,
  key: string,
  value?: string,
): Promise<void> {
  const { vault } = await unlockCliVault();
  const resolvedValue = value ?? (await promptHidden(`Value for ${key}: `));

  const items = await listItemsByType<EnvVarPayload>(vault, 'envvar');
  const existing = findEnvVarMatch(items, project, environment, key);
  const payload: EnvVarPayload = { project, environment, key, value: resolvedValue };

  if (existing) {
    await vault.updateItem(existing.id, payload);
  } else {
    await vault.createItem('envvar', payload);
  }
  console.log(`Saved ${project}/${environment}/${key}.`);
}

export async function envListCommand(
  project: string,
  environment: string,
  options: { showValues?: boolean },
): Promise<void> {
  const { vault } = await unlockCliVault();
  const items = await listItemsByType<EnvVarPayload>(vault, 'envvar');
  const matches = filterByProjectEnvironment(items, project, environment);

  if (matches.length === 0) {
    console.log(`No environment variables stored for ${project}/${environment}.`);
    return;
  }

  for (const { payload } of matches) {
    console.log(options.showValues ? `${payload.key}=${payload.value}` : payload.key);
  }
}

export async function envUnsetCommand(
  project: string,
  environment: string,
  key: string,
): Promise<void> {
  const { vault } = await unlockCliVault();
  const items = await listItemsByType<EnvVarPayload>(vault, 'envvar');
  const existing = findEnvVarMatch(items, project, environment, key);
  if (!existing) {
    console.error(`No such variable: ${project}/${environment}/${key}`);
    process.exitCode = 1;
    return;
  }
  await vault.deleteItem(existing.id);
  console.log(`Removed ${project}/${environment}/${key}.`);
}
