import { homedir } from 'node:os';
import { join } from 'node:path';

/** `AEGIS_VAULT_PATH` lets tests/CI point at an isolated vault file. */
export function resolveVaultPath(): string {
  return process.env.AEGIS_VAULT_PATH ?? join(homedir(), '.aegisvault', 'vault.json');
}
