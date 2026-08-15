import {
  type Argon2idParams,
  type SubKeys,
  deriveMasterKey,
  zeroize,
} from '@aegisvault/crypto-core';
import { combineShares, decodeShare, encodeShare, splitSecret } from '@aegisvault/shamir';
import type { RecoveryParams } from '../models/vault-item.js';
import type { VaultRepository } from '../repository/repository.interface.js';
import { verifyMasterKey } from './verifier.js';

export interface EnableRecoveryOptions {
  /** n — total shares to generate. */
  shares: number;
  /** k — shares required to reconstruct. */
  threshold: number;
}

/**
 * Splits the Master Key itself into Shamir shares — there is no separate
 * "recovery key" wrapping kEnc. Reconstructing >= threshold shares
 * regenerates the exact same MK that deriveMasterKey(password, secretKey,
 * salt) would, so recovery reuses the entire existing verify path
 * unmodified (see verifyMasterKey). This requires re-entering the password
 * and Secret Key — it's a sensitive, infrequent settings action, not part
 * of the regular unlock flow, and doubles as proof the caller is actually
 * entitled to generate shares for this vault.
 *
 * Returns the encoded shares to display/export to the user — never persists
 * them. Only the non-secret (threshold, shares, enabledAt) parameters are
 * stored, so the UI can show recovery is enabled without holding any share.
 */
export async function enableRecovery(
  password: string,
  secretKey: Uint8Array,
  repository: VaultRepository,
  options: EnableRecoveryOptions,
): Promise<string[]> {
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

  // verifyMasterKey zeroes the array it's given (via deriveSubKeys), so
  // split the MK from a copy taken before verification, and zero that copy
  // ourselves once the shares are derived from it.
  const mkForSplit = mk.slice();
  try {
    await verifyMasterKey(mk, repository); // throws AuthenticationFailedError if wrong
    const shares = splitSecret(mkForSplit, {
      shares: options.shares,
      threshold: options.threshold,
    });

    const recoveryParams: RecoveryParams = {
      threshold: options.threshold,
      shares: options.shares,
      enabledAt: Date.now(),
    };
    await repository.putMeta({ key: 'recoveryParams', value: recoveryParams });

    return shares.map(encodeShare);
  } finally {
    zeroize(mkForSplit);
  }
}

export async function getRecoveryParams(
  repository: VaultRepository,
): Promise<RecoveryParams | undefined> {
  const meta = await repository.getMeta('recoveryParams');
  return meta?.value as RecoveryParams | undefined;
}

/**
 * Reconstructs the Master Key from >= threshold recovery shares and unlocks
 * the vault — no master password required. Shamir reconstruction itself has
 * no integrity check (wrong or insufficient shares silently produce a
 * *different* MK, not an error), so verifyMasterKey's auth-verifier check
 * is what actually catches that here, surfacing as the same
 * AuthenticationFailedError a wrong password would.
 */
export async function recoverVaultWithShares(
  shareTexts: string[],
  repository: VaultRepository,
): Promise<SubKeys> {
  const shares = shareTexts.map(decodeShare);
  const mk = combineShares(shares);
  return verifyMasterKey(mk, repository);
}
