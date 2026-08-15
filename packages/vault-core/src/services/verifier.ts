import { AuthenticationFailedError, type SubKeys, deriveSubKeys } from '@aegisvault/crypto-core';
import type { VaultRepository } from '../repository/repository.interface.js';

const VERIFIER_MESSAGE = new TextEncoder().encode('aegisvault-verifier-v1');

/** HMAC(kAuth, "aegisvault-verifier-v1") — proves password+SecretKey correctness without a server. */
export async function computeAuthVerifier(kAuth: CryptoKey): Promise<Uint8Array> {
  const signature = await crypto.subtle.sign('HMAC', kAuth, VERIFIER_MESSAGE);
  return new Uint8Array(signature);
}

/** Constant-time comparison — avoids leaking verifier match progress via timing. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Given a candidate Master Key from ANY source (password-derived, or
 * reconstructed from Shamir recovery shares), derives sub-keys and checks
 * them against the stored auth verifier. Shared by unlock-service.ts and
 * recovery-service.ts so both re-authentication paths behave identically —
 * including how a wrong/insufficient input surfaces: Shamir reconstruction
 * has no built-in integrity check, so wrong shares silently produce a
 * different `mk`, and this is the layer that turns that into a clean
 * AuthenticationFailedError instead of a bogus-but-"successful" unlock.
 */
export async function verifyMasterKey(
  mk: Uint8Array,
  repository: VaultRepository,
): Promise<SubKeys> {
  const verifierMeta = await repository.getMeta('authVerifier');
  if (!verifierMeta) {
    throw new Error('Vault has not been onboarded yet.');
  }

  const subKeys = await deriveSubKeys(mk);
  const computedVerifier = await computeAuthVerifier(subKeys.kAuth);
  const storedVerifier = verifierMeta.value as Uint8Array;

  if (!constantTimeEqual(computedVerifier, storedVerifier)) {
    throw new AuthenticationFailedError();
  }

  return subKeys;
}
