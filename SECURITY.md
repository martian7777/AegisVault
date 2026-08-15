# AegisVault — Security Model (MVP)

This document is the source of truth for AegisVault's cryptographic design and its
explicit non-goals. It is written alongside the crypto core, not after the fact —
if this document and the code disagree, that is a bug in one of them.

## Scope

This covers the local-first, zero-knowledge password vault core (web app, no
backend), the DevOps CLI, and P2P device sync — all built on the same key
hierarchy below. Shamir recovery and AI defense are still deferred and get
their own security review when they're designed.

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
- **No memory-zeroing guarantee.** JavaScript provides no hard guarantee that
  a zeroed buffer's previous contents aren't still recoverable from process
  memory (GC timing is undefined, engines may copy/move buffers). The
  `zeroize()` calls throughout the crypto core are defense-in-depth, not a
  formal guarantee.
- **No protection against a physically compromised device** while the vault is
  unlocked (i.e., no protection against someone with a moment of access to an
  unlocked, unattended session — that's what the idle-lock timer bounds, not
  eliminates).

## DevOps CLI

- The CLI (`apps/cli`) maintains its **own local vault file** (default
  `~/.aegisvault/vault.json`, permission mode `600`), separate from the web
  app's IndexedDB vault, using the exact same crypto core. It is not
  automatically unified with the web vault — device sync (below) is what
  would let you carry items between them, by explicit user action, not
  silent background merging.
- **No persistent agent/session.** Every command re-derives keys from
  password + Secret Key and exits; there is no `aegis-agent` daemon holding
  `kEnc` in memory across invocations (unlike a real `ssh-agent`). This is
  simpler and has a smaller attack surface than a long-lived key-holding
  process, at the cost of re-entering credentials per command. Deferred, not
  built: wrapping the Secret Key with a device-bound key for a "remember
  this device" CLI session.
- **SSH key management is generation + encrypted storage only** — not an
  `SSH_AUTH_SOCK`-compatible agent bridge. `aegis ssh show --export-private`
  writes the private key to a plaintext file (mode `600`) at the user's
  explicit request; from that point it's protected by filesystem
  permissions, not by AegisVault.
- **`aegis token check` has no scheduling or webhook delivery.** It's a
  one-shot check with a meaningful exit code, meant to be wired into the
  user's own cron/CI — AegisVault does not page anyone on its own.

## P2P Device Sync

- **No signaling server.** Pairing exchanges a WebRTC offer/answer as a
  copy-paste text blob between the two devices — there is no third party
  that brokers the connection or ever sees the offer/answer text, unlike
  most WebRTC apps which use a signaling server for this exchange.
- **STUN only, no TURN fallback.** A public STUN server
  (`stun.l.google.com:19302`) helps each device discover its own reachable
  address for NAT traversal; it never relays vault data. On a sufficiently
  restrictive NAT (symmetric NAT on both sides, corporate firewalls), direct
  P2P connection can simply fail — there is no relay fallback to fall back
  on. This is a deliberate scope cut, not a silent failure mode: pairing
  will show a clear "could not connect" state rather than hang.
- **The offer/answer exchange is the trust boundary, not WebRTC's DTLS.**
  DTLS encrypts the data-channel transport, but WebRTC itself doesn't
  authenticate *who* you're pairing with — that's established entirely by
  the fact that the offer/answer text passed through a channel the user
  trusts (in person, a private message). Pasting an offer from an untrusted
  source and completing the pairing would connect you to *them*.
- **The payload is still just ciphertext.** A synced `VaultBackup` is the
  exact same shape used for file export — item ciphertext, wrapped keys,
  and non-secret KDF metadata. Even if a connection were somehow relayed or
  observed, nothing plaintext crosses the wire; sync adds a transport, not a
  new trust requirement on top of the existing zero-knowledge model.
- **Import still fully replaces the receiving vault**, exactly like file
  import — the UI requires an explicit confirmation because there is no
  merge logic (see the deferred roadmap: full delta/merge sync is a later
  increment, not part of this pairing flow).

## Emergency Recovery (Shamir's Secret Sharing)

- **Shares split the Master Key itself, not a separate wrapped key.**
  Reconstructing >= threshold shares regenerates the exact same MK that
  `deriveMasterKey(password, secretKey, salt)` produces, so recovery reuses
  the entire existing unlock/verify path unmodified — no new wrap/unwrap
  primitive, and no exception carved into the "kEnc is a non-extractable
  CryptoKey" rule.
- **Anyone holding `threshold` shares can fully unlock the vault, with no
  master password at all.** That is the feature, not a bug — but it means
  distributing shares is equivalent to distributing partial trust in the
  vault's contents. Choose trustees and a threshold accordingly (e.g. 3-of-5
  so no single trustee, and no pair of colluding trustees below the
  threshold, can unlock it alone).
- **Shamir's Secret Sharing has no built-in integrity check.** Combining
  fewer than `threshold` shares, or shares from a different split, doesn't
  error at the math layer — it silently produces a *different* byte
  sequence. What actually catches a wrong/insufficient combination is the
  same auth-verifier check unlock already uses (`verifyMasterKey`): a wrong
  reconstructed MK derives the wrong `kAuth`, fails the verifier comparison,
  and surfaces as `AuthenticationFailedError` — not a corrupted-but-accepted
  vault.
- **Generating new shares does not invalidate old ones.** "Set up emergency
  recovery" again produces a fresh split of the *same* MK; previously
  distributed shares still mathematically reconstruct it unless the master
  password itself is later changed (out of scope for this MVP — there is no
  change-password/key-rotation flow yet). Treat regenerating shares as
  "also destroy the old copies," not a revoke.
- **The field arithmetic is GF(2^8) with generator 3** (reducing polynomial
  0x11B, the same one AES uses) — not a cryptographic design choice with
  security implications on its own (any valid field works, since split and
  combine only need to agree with each other), but worth noting since an
  earlier draft of this implementation used generator 2, which is *not*
  primitive under 0x11B (order 51, not 255) and silently corrupted most
  reconstructions. Caught by property-based testing across share subsets,
  not by the naive "first N shares" happy path.
