import { type Argon2idParams, type SubKeys, deriveMasterKey } from '@aegisvault/crypto-core';
import type { VaultRepository } from '../repository/repository.interface.js';
import { verifyMasterKey } from './verifier.js';

/**
 * Re-derives the key hierarchy from password + Secret Key and validates it
 * against the stored auth verifier — no server round-trip required. Throws
 * AuthenticationFailedError on a wrong password/Secret Key, or a plain Error
 * if the vault hasn't been onboarded yet (missing salt/verifier).
 *
 * MVP requires both the password and the Secret Key on every unlock; there
 * is no "remember this device" trust model yet (see SECURITY.md).
 */
export async function unlockVault(
  password: string,
  secretKey: Uint8Array,
  repository: VaultRepository,
): Promise<SubKeys> {
  const [saltMeta, paramsMeta] = await Promise.all([
    repository.getMeta('kdfSalt'),
    repository.getMeta('kdfParams'),
  ]);

  if (!saltMeta) {
    throw new Error('Vault has not been onboarded yet.');
  }

  const salt = saltMeta.value as Uint8Array;
  const params = paramsMeta?.value as Partial<Argon2idParams> | undefined;

  const mk = await deriveMasterKey(
    params ? { password, secretKey, salt, params } : { password, secretKey, salt },
  );
  return verifyMasterKey(mk, repository);
}
