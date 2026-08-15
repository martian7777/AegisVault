import {
  DEFAULT_ARGON2ID_PARAMS,
  type SubKeys,
  deriveMasterKey,
  deriveSubKeys,
  getRandomBytes,
} from '@aegisvault/crypto-core';
import type { VaultRepository } from '../repository/repository.interface.js';
import { computeAuthVerifier } from './verifier.js';

const SECRET_KEY_BYTES = 16;
const SALT_BYTES = 16;

export interface OnboardingResult extends SubKeys {
  /**
   * The generated Secret Key, in raw bytes. The caller (UI layer) is
   * responsible for displaying this to the user exactly once as part of an
   * emergency kit — onboardVault() never writes it to any storage itself.
   */
  secretKey: Uint8Array;
}

/**
 * Initializes a brand-new vault: generates a Secret Key and salt, derives
 * the key hierarchy, and persists only non-secret metadata (salt, KDF
 * params, auth verifier) via the repository. Never persists the password,
 * Secret Key, Master Key, or either sub-key.
 */
export async function onboardVault(
  password: string,
  repository: VaultRepository,
): Promise<OnboardingResult> {
  const secretKey = getRandomBytes(SECRET_KEY_BYTES);
  const salt = getRandomBytes(SALT_BYTES);

  const mk = await deriveMasterKey({ password, secretKey, salt });
  const { kEnc, kAuth } = await deriveSubKeys(mk);
  const verifier = await computeAuthVerifier(kAuth);

  await repository.clear();
  await repository.putMeta({ key: 'kdfSalt', value: salt });
  await repository.putMeta({ key: 'kdfParams', value: DEFAULT_ARGON2ID_PARAMS });
  await repository.putMeta({ key: 'authVerifier', value: verifier });
  await repository.putMeta({ key: 'schemaVersion', value: 1 });

  return { secretKey, kEnc, kAuth };
}
