#!/usr/bin/env node
import { Command } from 'commander';
import { envListCommand, envSetCommand, envUnsetCommand } from './commands/env.js';
import { listCommand } from './commands/list.js';
import { onboardCommand } from './commands/onboard.js';
import { runCommand } from './commands/run.js';
import { sshGenerateCommand, sshListCommand, sshShowCommand } from './commands/ssh.js';
import { tokenAddCommand, tokenCheckCommand, tokenListCommand } from './commands/token.js';

async function main(): Promise<void> {
  // `aegis run <project> <environment> -- <command...>` is handled before
  // commander ever sees the args: commander's variadic parsing doesn't
  // cleanly support "everything after a literal --" as an opaque passthrough
  // command, so we split on it manually — the same approach npm/yarn use.
  const rawArgs = process.argv.slice(2);
  if (rawArgs[0] === 'run') {
    const separatorIndex = rawArgs.indexOf('--');
    const [, project, environment] = rawArgs.slice(0, separatorIndex === -1 ? rawArgs.length : separatorIndex);
    if (separatorIndex === -1 || !project || !environment) {
      console.error('Usage: aegis run <project> <environment> -- <command> [args...]');
      process.exitCode = 1;
      return;
    }
    await runCommand(project, environment, rawArgs.slice(separatorIndex + 1));
    return;
  }

  const program = new Command();
  program.name('aegis').description('AegisVault DevOps secrets CLI').version('0.0.0');

  program.command('onboard').description('Create a new local vault').action(onboardCommand);
  program.command('list').description('Summarize items in the vault').action(listCommand);

  const env = program.command('env').description('Manage per-project environment variables');
  env
    .command('set <project> <environment> <key> [value]')
    .description('Set an environment variable (prompts for the value if omitted)')
    .action(envSetCommand);
  env
    .command('list <project> <environment>')
    .option('--show-values', 'print values, not just keys')
    .description('List environment variables for a project/environment')
    .action((project: string, environment: string, options: { showValues?: boolean }) =>
      envListCommand(project, environment, options),
    );
  env
    .command('unset <project> <environment> <key>')
    .description('Remove an environment variable')
    .action(envUnsetCommand);

  const ssh = program.command('ssh').description('Manage SSH keys');
  ssh
    .command('generate <label>')
    .description('Generate and store an Ed25519 key')
    .action(sshGenerateCommand);
  ssh.command('list').description('List stored SSH key labels').action(sshListCommand);
  ssh
    .command('show <label>')
    .option('--export-private <path>', 'also write the private key to a file')
    .description('Print the public key (and optionally export the private key)')
    .action((label: string, options: { exportPrivate?: string }) => sshShowCommand(label, options));

  const token = program.command('token').description('Manage API tokens');
  token
    .command('add <provider> <label> [token]')
    .option('--expires <date>', 'ISO date the token expires')
    .description('Store an API token (prompts for the value if omitted)')
    .action((provider: string, label: string, tokenValue: string | undefined, options: { expires?: string }) =>
      tokenAddCommand(provider, label, tokenValue, options),
    );
  token.command('list').description('List stored tokens').action(tokenListCommand);
  token
    .command('check')
    .option('--within <days>', 'flag tokens expiring within N days', '30')
    .description('Flag tokens expiring soon (exit code 1 if any found)')
    .action((options: { within: string }) => tokenCheckCommand({ within: Number(options.within) }));

  program.command('run <project> <environment>').description(
    'Run a command with vault secrets injected as env vars — use: aegis run <project> <env> -- <command>',
  ).action(() => {
    console.error('Usage: aegis run <project> <environment> -- <command> [args...]');
    process.exitCode = 1;
  });

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
