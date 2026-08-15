# AegisVault: Next-Gen Zero-Knowledge Password Manager & Secrets Mesh
*Feature Specification & Architecture Document*

---

## 1. Vision & Competitive Advantage

| Feature Dimension | Traditional (1Password / Bitwarden / LastPass) | **AegisVault (Next-Gen)** |
| :--- | :--- | :--- |
| **Data Storage & Sync** | Centralized proprietary cloud database (honey pot risk) | **Offline-First Zero-Trust with WebRTC P2P direct sync & LAN discovery** |
| **Developer Secrets** | Basic browser credentials, separate expensive enterprise tools | **Built-in DevOps Hub: `.env` injector (`vlt run`), SSH Key agent, API token alerts** |
| **Breach Defense** | Passive vulnerability alerts after breaches occur | **AI Active Defense: DOM phishing interceptor, automated 1-click password rotator** |
| **Emergency Recovery** | Fragile master password reset / single paper PDF emergency kit | **Cryptographic Shamir's Secret Sharing ($k$-of-$n$) & Dead-Man's Timelock** |
| **Key Derivation** | PBKDF2 (legacy) or standard Argon2 | **Dual-Factor Argon2id + 128-bit Secret Key + WebAuthn PRF Biometrics** |

---

## 2. The 4 Innovation Pillars

### 1. AI-Powered Active Security & Defense
- **Real-Time Phishing & Spoofing Guard**: DOM structure analysis, homoglyph lookups (detecting spoofed unicode domains), and SSL history verification before prompting autofill.
- **Autonomous Password Auto-Rotator**: 1-click headless bot to navigate to target service account settings and rotate compromised passwords.
- **Dynamic Vault Entropy Radar**: Continuous mathematical health check across all vault items with automated breach cross-referencing.

### 2. Developer & DevOps Secrets Hub
- **Process Memory Env Injection**: Run `vlt run -- npm run dev` to inject encrypted environment variables into memory without saving `.env` files to disk.
- **SSH & GPG Hardware Keys**: Ed25519 key generation, agent bridging, and biometric approval prompt on terminal SSH connections.
- **Cloud API Expiry Watchdog**: Tracks expiration dates for Stripe, AWS, and GitHub tokens with automated rotation hooks.

### 3. Zero-Trust Offline-First & P2P Sync
- **Local-First Sovereign Storage**: IndexedDB (Web) and Encrypted SQLite (Desktop/Mobile).
- **Direct P2P Encrypted Sync**: WebRTC data channels with DTLS/SRTP encryption directly sync vault delta changes between authenticated paired devices without cloud intermediaries.
- **Air-Gapped Sync Mode**: Multi-frame animated QR codes for syncing secure vaults to air-gapped computers.

### 4. Digital Estate & Multi-Party Recovery
- **Shamir's Secret Sharing ($k$-of-$n$)**: Split master recovery key into $N$ cryptographic shards (e.g. 3 of 5 required to reconstruct).
- **Cryptographic Dead-Man's Switch**: Automated periodic proof-of-life heartbeats; triggers recovery shard distribution if inactive for 90 days.
- **Multi-Sig Team Vaults**: Critical production credentials require multi-party biometric authorization to reveal.

---

## 3. Cryptographic Specification

- **Master Key Derivation**:
  $$\text{MK} = \text{Argon2id}(\text{Password} \parallel \text{SecretKey}, \text{Salt}, \text{time}=3, \text{mem}=64\text{MB}, \text{threads}=4)$$
- **Payload Encryption**:
  $$\text{AES-256-GCM} \quad (\text{256-bit key}, \text{96-bit unique IV}, \text{128-bit authentication tag})$$
- **Shamir Reconstruction**:
  $$S = \sum_{j=1}^{k} y_j \prod_{m \neq j} \frac{x_m}{x_m - x_j} \pmod p$$
- **Biometrics**: WebAuthn PRF (Pseudo-Random Function) Extension to wrap/unwrap vault keys.

---

## 4. UI / UX Design Tokens (Cyber-Glass Obsidian)

- **Backdrop**: `#0b0f17` (Obsidian), `#111827` (Slate)
- **Glassmorphic Panels**: `rgba(17, 24, 39, 0.75)`, `backdrop-filter: blur(16px)`, `border: 1px solid rgba(255, 255, 255, 0.08)`
- **Accents**: Cyber Cyan `#00f2fe`, Emerald Security `#10b981`, Amber Warning `#f59e0b`, Crimson Breach `#ef4444`
- **Typography**: Inter (UI) + JetBrains Mono (Cryptographic telemetry & keys)
