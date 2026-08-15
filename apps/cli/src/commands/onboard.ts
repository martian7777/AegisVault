import { FileVaultRepository } from '@aegisvault/vault-core/node';
import { onboardVault } from '@aegisvault/vault-core';
import { bytesToBase64 } from '../lib/base64.js';
import { promptHidden } from '../lib/prompt.js';
import { resolveVaultPath } from '../lib/vault-path.js';

export async function onboardCommand(): Promise<void> {
  const filePath = resolveVaultPath();
  const repository = new FileVaultRepository(filePath);

  if ((await repository.getMeta('kdfSalt')) !== undefined) {
    console.error(`A vault already exists at ${filePath}.`);
    console.error('Delete it manually first if you really want to start over.');
    process.exitCode = 1;
    return;
  }

  const password = await promptHidden('Choose a master password: ');
  const confirmPassword = await promptHidden('Confirm master password: ');
  if (password.length < 8) {
    console.error('Master password must be at least 8 characters.');
    process.exitCode = 1;
    return;
  }
  if (password !== confirmPassword) {
    console.error('Passwords do not match.');
    process.exitCode = 1;
    return;
  }

  const { secretKey } = await onboardVault(password, repository);

  console.log(`\nVault created at ${filePath}\n`);
  console.log('Save your Secret Key somewhere safe — it is required, together with your');
  console.log('master password, every time you unlock this vault. AegisVault cannot');
  console.log('recover it for you.\n');
  console.log(`  Secret Key: ${bytesToBase64(secretKey)}\n`);
}
