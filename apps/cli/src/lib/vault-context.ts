import { AuthenticationFailedError } from '@aegisvault/crypto-core';
import { VaultService, unlockVault } from '@aegisvault/vault-core';
import { FileVaultRepository } from '@aegisvault/vault-core/node';
import { base64ToBytes } from './base64.js';
import { prompt, promptHidden } from './prompt.js';
import { resolveVaultPath } from './vault-path.js';

export interface VaultContext {
  repository: FileVaultRepository;
  vault: VaultService;
}

/**
 * Every command that touches the vault re-derives keys from scratch and
 * exits when the process ends — there is no persistent agent holding keys
 * in memory across CLI invocations in this MVP (see SECURITY.md).
 */
export async function unlockCliVault(): Promise<VaultContext> {
  const filePath = resolveVaultPath();
  const repository = new FileVaultRepository(filePath);

  const hasVault = (await repository.getMeta('kdfSalt')) !== undefined;
  if (!hasVault) {
    console.error('No vault found. Run `aegis onboard` first.');
    process.exit(1);
  }

  const password = await promptHidden('Master password: ');
  const secretKeyInput = await prompt('Secret Key: ');

  let secretKey: Uint8Array;
  try {
    secretKey = base64ToBytes(secretKeyInput.trim());
  } catch {
    console.error('Secret Key is not valid base64.');
    process.exit(1);
  }

  try {
    const { kEnc } = await unlockVault(password, secretKey, repository);
    return { repository, vault: new VaultService(repository, kEnc) };
  } catch (err) {
    if (err instanceof AuthenticationFailedError) {
      console.error('Incorrect password or Secret Key.');
    } else {
      console.error('Could not unlock vault.');
    }
    process.exit(1);
  }
}
