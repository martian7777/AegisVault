import { spawn } from 'node:child_process';
import { type EnvVarPayload, filterByProjectEnvironment } from '../lib/env-logic.js';
import { listItemsByType } from '../lib/item-helpers.js';
import { unlockCliVault } from '../lib/vault-context.js';

/**
 * Injects encrypted environment variables directly into the child process's
 * memory (via `spawn`'s `env` option) — they are never written to a `.env`
 * file on disk.
 */
export async function runCommand(
  project: string,
  environment: string,
  command: string[],
): Promise<void> {
  if (command.length === 0) {
    console.error('Usage: aegis run <project> <environment> -- <command> [args...]');
    process.exitCode = 1;
    return;
  }

  const { vault } = await unlockCliVault();
  const items = await listItemsByType<EnvVarPayload>(vault, 'envvar');
  const matches = filterByProjectEnvironment(items, project, environment);

  const injectedEnv: Record<string, string> = {};
  for (const { payload } of matches) {
    injectedEnv[payload.key] = payload.value;
  }

  const [executable, ...args] = command;
  if (!executable) {
    console.error('No command given.');
    process.exitCode = 1;
    return;
  }

  const child = spawn(executable, args, {
    stdio: 'inherit',
    env: { ...process.env, ...injectedEnv },
    shell: process.platform === 'win32',
  });

  await new Promise<void>((resolve) => {
    child.on('exit', (code) => {
      process.exitCode = code ?? 1;
      resolve();
    });
  });
}
