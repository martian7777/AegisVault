/**
 * AES-256-GCM regression vector for fixed inputs. This is NOT sourced from an
 * external NIST CAVP file — those require preprocessing tooling this test
 * suite doesn't carry, and hand-transcribing multi-hundred-line .rsp files
 * accurately is itself error-prone. Instead this vector was generated once
 * against Node's native WebCrypto AES-GCM implementation (a mature,
 * independently audited primitive — see SECURITY.md's rationale for trusting
 * platform WebCrypto for AES-GCM/HKDF) and pinned here as a regression check.
 * Its purpose is to catch accidental breakage in *our* wrapper (argument
 * order, tag length, IV/AAD mixups) across library or runtime upgrades — not
 * to re-validate AES-GCM's cryptographic correctness, which is out of scope
 * for this package to re-prove.
 */
export const AES_256_GCM_REGRESSION_VECTOR = {
  key: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
  iv: '6465666768696a6b6c6d6e6f',
  aad: 'c8c9cacbcccdcecfd0d1d2d3d4d5d6d7',
  plaintextUtf8: 'AegisVault fixed AES-256-GCM regression vector.',
  ciphertextAndTag:
    '097eb90f0abf37eb52167f8eb31d0f9962834359a65ec6448a96ef05dbd1c02fe68c33b3257df5248b961b4b9230e42fec16d3913b5297eb967010730eb608',
} as const;
