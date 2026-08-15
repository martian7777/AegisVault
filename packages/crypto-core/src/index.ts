/**
 * Public surface of @aegisvault/crypto-core.
 *
 * Deliberately narrow: only composed, correct-by-construction operations are
 * exported. No raw primitive building blocks — there should be exactly one
 * correct way to derive keys and encrypt/decrypt an item.
 */
export { deriveMasterKey, DEFAULT_ARGON2ID_PARAMS } from './kdf.js';
export { deriveSubKeys } from './hkdf.js';
export { encryptItem, decryptItem } from './envelope.js';
export { getRandomBytes } from './random.js';
export { zeroize } from './zeroize.js';
export { DecryptionError, AuthenticationFailedError } from './errors.js';
export type {
  Argon2idParams,
  DeriveMasterKeyOptions,
  SubKeys,
  ItemAAD,
  EncryptedEnvelope,
} from './types.js';
