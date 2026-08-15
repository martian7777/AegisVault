import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Real end-to-end coverage: builds the CLI and spawns the actual compiled
 * binary as a child process (not an in-process import of internal
 * functions), matching how a real user invokes `aegis`. Each command
 * re-unlocks the vault from scratch, since the CLI is single-shot per
 * invocation by design (no persistent agent — see SECURITY.md).
 */

const cliEntry = join(import.meta.dirname, '..', 'dist', 'cli.js');
let tempDir: string;
let vaultPath: string;
let secretKey = '';

const PASSWORD = 'e2e-test-master-password';

function runCli(args: string[], stdin: string): string {
  return execFileSync('node', [cliEntry, ...args], {
    input: stdin,
    env: { ...process.env, AEGIS_VAULT_PATH: vaultPath },
    encoding: 'utf8',
  });
}

beforeAll(() => {
  execSync('npx tsc -p tsconfig.json', { cwd: join(import.meta.dirname, '..') });
  tempDir = mkdtempSync(join(tmpdir(), 'aegisvault-cli-e2e-'));
  vaultPath = join(tempDir, 'vault.json');
}, 60000);

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('aegis CLI end-to-end', () => {
  it('onboards a new vault and prints a Secret Key', () => {
    const output = runCli(['onboard'], `${PASSWORD}\n${PASSWORD}\n`);
    expect(output).toContain('Vault created');
    const match = output.match(/Secret Key:\s*(\S+)/);
    expect(match).not.toBeNull();
    secretKey = match?.[1] ?? '';
    expect(secretKey.length).toBeGreaterThan(0);
  });

  it('sets and lists an environment variable', () => {
    runCli(['env', 'set', 'acme', 'production', 'DATABASE_URL', 'postgres://test'], `${PASSWORD}\n${secretKey}\n`);
    const output = runCli(['env', 'list', 'acme', 'production', '--show-values'], `${PASSWORD}\n${secretKey}\n`);
    expect(output).toContain('DATABASE_URL=postgres://test');
  });

  it('injects the env var into a spawned command via `run`', () => {
    const output = runCli(
      ['run', 'acme', 'production', '--', 'node', '-e', 'console.log(process.env.DATABASE_URL)'],
      `${PASSWORD}\n${secretKey}\n`,
    );
    expect(output).toContain('postgres://test');
  });

  it('generates and stores an Ed25519 SSH key', () => {
    const output = runCli(['ssh', 'generate', 'deploy-key'], `${PASSWORD}\n${secretKey}\n`);
    expect(output).toContain('BEGIN PUBLIC KEY');
  });

  it('flags an API token expiring soon via `token check`', () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    runCli(['token', 'add', 'aws', 'prod-key', 'AKIA-fake-token', '--expires', soon], `${PASSWORD}\n${secretKey}\n`);

    let stdout = '';
    let exitCode = 0;
    try {
      stdout = execFileSync('node', [cliEntry, 'token', 'check', '--within', '30'], {
        input: `${PASSWORD}\n${secretKey}\n`,
        env: { ...process.env, AEGIS_VAULT_PATH: vaultPath },
        encoding: 'utf8',
      });
    } catch (err) {
      const execErr = err as { stdout: string; status: number };
      stdout = execErr.stdout;
      exitCode = execErr.status;
    }
    expect(stdout).toContain('aws/prod-key');
    expect(exitCode).toBe(1);
  });

  it('rejects the wrong password', () => {
    expect(() => runCli(['list'], `wrong-password\n${secretKey}\n`)).toThrow();
  });
});
