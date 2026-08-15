/**
 * Argon2id regression vector for AegisVault's exact deriveMasterKey()
 * composition: Argon2id(password ‖ secretKey, salt, t=3, m=65536 KiB, p=4,
 * len=32).
 *
 * This is NOT the RFC 9106 Section 5.3 published test vector. That vector
 * requires Argon2's `secret` (key) AND `associatedData` parameters together;
 * `hash-wasm`'s argon2id API (as of the version pinned here) only exposes
 * `secret`, not `associatedData`, so it cannot reproduce that vector exactly
 * — confirmed by inspecting node_modules/hash-wasm/dist/lib/argon2.d.ts.
 * AegisVault's own KDF design doesn't use either of those fields anyway (the
 * Secret Key is concatenated into the password bytes per the spec formula),
 * so this local regression vector is what actually matters for us: it pins
 * the real deriveMasterKey() code path and catches accidental parameter
 * regressions across `hash-wasm` upgrades.
 */
export const ARGON2ID_REGRESSION_VECTOR = {
  password: 'correct horse battery staple',
  secretKeyHex: '000102030405060708090a0b0c0d0e0f',
  saltHex: '101112131415161718191a1b1c1d1e1f',
  params: { time: 3, memory: 65536, parallelism: 4, hashLength: 32 },
  masterKeyHex: '5f294ac877f13432dc61a629d26743bddda380d219da962b3b42da88ef221a1b',
} as const;
