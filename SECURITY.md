# AegisVault — Security Model (MVP)

This document is the source of truth for AegisVault's cryptographic design and its
explicit non-goals. It is written alongside the crypto core, not after the fact —
if this document and the code disagree, that is a bug in one of them.

## Scope

This covers the MVP only: a single-device, local-first, zero-knowledge password
vault running as a web app with no backend. It does not cover the deferred
pillars (DevOps CLI, multi-device sync, Shamir recovery, AI defense) — those get
their own security review when they're actually designed.

## Key Hierarchy

```
Password + SecretKey + Salt
        │  Argon2id (t=3, m=65536 KiB, p=4, output=32 bytes)
        ▼
   Master Key (MK, 32 bytes)
        │  HKDF-SHA256, distinct "info" per sub-key
        ├──> K_enc  (AES-256-GCM key, non-extractable CryptoKey)
        └──> K_auth (HMAC-SHA256 key, non-extractable CryptoKey)

Per vault item:
   random 256-bit item key
        │  AES-256-GCM, 96-bit IV, 128-bit tag, AAD = {id, version, type}
        ▼
   ciphertext + tag

   item key wrapped under K_enc (AES-256-GCM, its own 96-bit IV)
```

- **Master password**: chosen by the user, never persisted anywhere (not
  IndexedDB, not `localStorage`/`sessionStorage`, not logs, not error reports,
  not analytics). It exists only as a local variable for the duration of a
  single `deriveMasterKey()` call, and the buffer it's concatenated into is
  zeroed in a `finally` block immediately after use.
- **Secret Key**: a 128-bit value generated locally at onboarding, shown to the
  user once (emergency-kit style) and never written to any storage by the app.
  Required on every unlock in the MVP (see "Explicit MVP simplifications"
  below).
- **Salt**: 16 random bytes generated at onboarding, stored in plaintext
  alongside the vault (it is not secret — its purpose is to make precomputed
  rainbow-table-style attacks infeasible, not to add secrecy).
- **Auth verifier**: `HMAC(K_auth, "aegisvault-verifier-v1")`, stored in
  plaintext. Unlock recomputes it and compares in constant time. `K_auth`
  itself is never stored.

## Algorithm Choices & Why

| Primitive | Choice | Why |
|---|---|---|
| KDF | Argon2id via `hash-wasm` | WebCrypto has no Argon2id; `hash-wasm` is a small, actively maintained WASM-SIMD implementation with a clean async API. |
| AES-256-GCM | native WebCrypto `crypto.subtle` | Platform-implemented, hardware-accelerated where available, already audited as part of the browser — no reason to reimplement in userland. |
| HKDF-SHA256 | native WebCrypto `crypto.subtle.deriveBits({name:'HKDF', ...})` | Same rationale as above; natively supported in all evergreen browsers. |
| CSPRNG | `crypto.getRandomValues` | Platform CSPRNG. |

## Explicit Trade-offs

1. **Argon2id parallelism runs single-threaded.** The spec calls for
   `parallelism=4`. This is honored as an *algorithm parameter* (RFC 9106 lane
   count, which affects the memory access pattern and is part of the derived
   key value — not just a speed knob), but the WASM execution itself is
   single-threaded. True multi-threaded execution requires
   `SharedArrayBuffer` + `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy`
   headers, which complicate static hosting (breaks some third-party embeds)
   for no correctness benefit — only speed. This produces a spec-compliant,
   interoperable Argon2id hash. Revisit if COOP/COEP becomes acceptable.
2. **Both password and Secret Key are required on every unlock.** No "remember
   this device" trust model exists yet. This is simpler and requires no
   device-binding key, at the cost of unlock convenience. A documented
   fast-follow (not built in MVP) is wrapping the Secret Key with a
   non-extractable, device-bound key so daily unlock needs only the password.
3. **No backend, no cloud copy.** Vault loss on storage eviction is mitigated
   with `navigator.storage.persist()` and a first-class encrypted
   export/import feature, but the MVP has no redundancy beyond what the user
   exports themselves.

## Explicit Non-Goals (MVP)

- **No protection against a compromised OS or browser.** If the machine
  running AegisVault is compromised (keylogger, malicious browser extension,
  root-level malware), no client-side cryptography can protect the vault.
- **No protection against a malicious or compromised browser extension** with
  page-content access — it can observe the DOM same as any XSS.
- **XSS is the primary realistic threat model** against a zero-knowledge web
  vault, since injected script can call the same in-session `crypto.subtle`
  operations the app can, while the session is unlocked. Mitigations: strict
  CSP (no `unsafe-inline`, no remote script origins), minimal third-party JS
  dependencies, pinned lockfile, `pnpm audit` in CI, keys imported as
  non-extractable `CryptoKey`s wherever possible so raw key bytes are never
  JS-readable even if script execution is compromised.
- **Single-device trust model.** There is no multi-device sync, no server, and
  no notion of "revoke a device" in the MVP.
- **No memory-zeroing guarantee.** JavaScript provides no hard guarantee that
  a zeroed buffer's previous contents aren't still recoverable from process
  memory (GC timing is undefined, engines may copy/move buffers). The
  `zeroize()` calls throughout the crypto core are defense-in-depth, not a
  formal guarantee.
- **No protection against a physically compromised device** while the vault is
  unlocked (i.e., no protection against someone with a moment of access to an
  unlocked, unattended session — that's what the idle-lock timer bounds, not
  eliminates).
