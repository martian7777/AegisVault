import { useState } from 'react';
import { ComparisonMatrix } from './ComparisonMatrix.js';
import { CryptoVisualizer } from './CryptoVisualizer.js';
import { HeroSection } from './HeroSection.js';
import { InteractivePasswordGenerator } from './InteractivePasswordGenerator.js';
import { VaultLivePreview } from './VaultLivePreview.js';

interface ViewProps {
  onLaunchVault: () => void;
  onSelectTab: (tab: 'overview' | 'features' | 'security' | 'pricing' | 'faq') => void;
}

// --------------------------------------------------------------------------
// 1. OVERVIEW VIEW (Combined Landing Experience)
// --------------------------------------------------------------------------
export function OverviewView({ onLaunchVault, onSelectTab }: ViewProps) {
  return (
    <>
      <HeroSection onLaunchVault={onLaunchVault} onExploreCrypto={() => onSelectTab('security')} />

      {/* Bento Grid Highlights */}
      <section className="section-spacing" id="bento-features">
        <div className="marketing-container">
          <div className="section-header">
            <span className="section-tag">Core Sovereign Capabilities</span>
            <h2 className="section-title">Engineered for Cryptographic Independence</h2>
            <p className="section-description">
              AegisVault replaces centralized cloud custody with compile-time cryptographic
              guarantees and uncompromising client-side isolation.
            </p>
          </div>

          <div className="bento-grid">
            <div className="glass-card glass-card-glow-edge bento-col-8">
              <div className="card-icon">⚡</div>
              <h3 className="card-title">Dual-Factor Argon2id Key Derivation</h3>
              <p className="card-text">
                Memory-hard derivation parameters (m = 64MB, t = 3, p = 4) combined with an offline
                128-bit Secret Key make GPU, ASIC, and distributed botnet password-cracking
                mathematically futile.
              </p>
              <ul className="tech-spec-list">
                <li className="tech-spec-item">RFC 9106 Password Hashing Competition Winner</li>
                <li className="tech-spec-item">
                  Executed off-thread via dedicated WebAssembly worker
                </li>
                <li className="tech-spec-item">
                  128 bits of additional non-memorized device entropy
                </li>
              </ul>
            </div>

            <div className="glass-card bento-col-4">
              <div className="card-icon">🛡️</div>
              <h3 className="card-title">Envelope Encryption</h3>
              <p className="card-text">
                Every credential item is encrypted with an independent, random 256-bit AES-GCM item
                key, wrapped with K_enc and authenticated with AAD.
              </p>
              <ul className="tech-spec-list">
                <li className="tech-spec-item">Per-item key isolation</li>
                <li className="tech-spec-item">AAD-authenticated metadata</li>
              </ul>
            </div>

            <div className="glass-card bento-col-4">
              <div className="card-icon">🔒</div>
              <h3 className="card-title">Memory Zeroization</h3>
              <p className="card-text">
                Plaintext secrets and cryptographic keys exist solely in short-lived typed arrays in
                memory, immediately scrubbed via <code>zeroize()</code> in protected finally blocks.
              </p>
              <ul className="tech-spec-list">
                <li className="tech-spec-item">Non-extractable CryptoKey handles</li>
                <li className="tech-spec-item">Zero plaintext persistence to disk or logs</li>
              </ul>
            </div>

            <div className="glass-card bento-col-4">
              <div className="card-icon">👥</div>
              <h3 className="card-title">Shamir Multi-Party Recovery</h3>
              <p className="card-text">
                Split your master emergency key into k-of-n mathematical shares (e.g. 3 of 5)
                distributed among trusted contacts or secure storage locations.
              </p>
              <ul className="tech-spec-list">
                <li className="tech-spec-item">Polynomial threshold secret sharing</li>
                <li className="tech-spec-item">Zero single points of failure</li>
              </ul>
            </div>

            <div className="glass-card bento-col-4">
              <div className="card-icon">🌐</div>
              <h3 className="card-title">Offline-First Sovereign DB</h3>
              <p className="card-text">
                Full functionality without internet access. Encrypted records reside in client-side
                IndexedDB with zero background telemetry or cloud pingbacks.
              </p>
              <ul className="tech-spec-list">
                <li className="tech-spec-item">Zero cloud breach targets</li>
                <li className="tech-spec-item">Portable encrypted JSON export & sync</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Visualizer */}
      <CryptoVisualizer />

      {/* Live Vault Mock Preview */}
      <VaultLivePreview onLaunch={onLaunchVault} />

      {/* Interactive Password Tool */}
      <InteractivePasswordGenerator />

      {/* Comparison Matrix */}
      <ComparisonMatrix />

      {/* Call to action Banner */}
      <section className="section-spacing">
        <div className="marketing-container">
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
              borderColor: 'var(--cyan-border)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                marginBottom: '1rem',
                color: 'var(--text-title)',
              }}
            >
              Ready for Provable Cryptographic Sovereignty?
            </h2>
            <p
              style={{
                fontSize: '1.15rem',
                maxWidth: '650px',
                margin: '0 auto 2.5rem',
                color: 'var(--text-muted)',
              }}
            >
              Start protecting your credentials in seconds. No email required, no cloud account, no
              credit card. 100% Free and Open Source.
            </p>
            <button
              type="button"
              className="btn-primary btn-glow-pulse"
              onClick={onLaunchVault}
              style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Launch Sovereign AegisVault
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

// --------------------------------------------------------------------------
// 2. FEATURES VIEW
// --------------------------------------------------------------------------
export function FeaturesView({ onLaunchVault }: ViewProps) {
  return (
    <div className="section-spacing">
      <div className="marketing-container">
        <div className="section-header">
          <span className="section-tag">Feature Suite Deep Dive</span>
          <h1 className="section-title">Built Without Compromise for Total Security</h1>
          <p className="section-description">
            Explore every architectural pillar that makes AegisVault the sovereign standard in
            secret management.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            maxWidth: '960px',
            margin: '0 auto',
          }}
        >
          {/* Feature 1 */}
          <div className="glass-card">
            <div
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
            >
              <div className="card-icon" style={{ flexShrink: 0 }}>
                ⚡
              </div>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <span className="badge-tag">Cryptographic Core</span>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    margin: '0.5rem 0 0.75rem',
                    color: 'var(--text-title)',
                  }}
                >
                  Dual-Factor Argon2id Master Key Derivation
                </h2>
                <p className="card-text">
                  AegisVault requires both your memorable master password and a high-entropy 128-bit
                  Secret Key. Together with a 256-bit CSPRNG salt, they feed into Argon2id
                  configured with 64 megabytes of memory and 4 parallel lanes. This mathematically
                  neutralizes both dictionary attacks and GPU hash cracking.
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginTop: '1.25rem',
                  }}
                >
                  <div className="flow-node">
                    <div
                      style={{ color: 'var(--cyan-primary)', fontWeight: 700, fontSize: '0.85rem' }}
                    >
                      Off-Thread Worker
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No UI lag during heavy derivation
                    </div>
                  </div>
                  <div className="flow-node">
                    <div
                      style={{
                        color: 'var(--emerald-primary)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      Dual Factor Entropy
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Password + 128-bit Secret Key
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-card">
            <div
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
            >
              <div className="card-icon" style={{ flexShrink: 0 }}>
                🛡️
              </div>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <span className="badge-tag">Envelope Encryption</span>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    margin: '0.5rem 0 0.75rem',
                    color: 'var(--text-title)',
                  }}
                >
                  AES-256-GCM Per-Item Envelope Encryption
                </h2>
                <p className="card-text">
                  Unlike traditional managers that encrypt an entire vault under a single static
                  key, AegisVault generates a fresh 256-bit AES-GCM item key for every entry. Items
                  are wrapped using subkeys derived from HKDF-SHA256 and authenticated with
                  Additional Authenticated Data (AAD).
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginTop: '1.25rem',
                  }}
                >
                  <div className="flow-node">
                    <div
                      style={{ color: 'var(--cyan-primary)', fontWeight: 700, fontSize: '0.85rem' }}
                    >
                      Key Isolation
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Single item breach leaves rest safe
                    </div>
                  </div>
                  <div className="flow-node">
                    <div
                      style={{
                        color: 'var(--emerald-primary)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      AAD Integrity
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Tamper-proof item headers & IDs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-card">
            <div
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
            >
              <div className="card-icon" style={{ flexShrink: 0 }}>
                👥
              </div>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <span className="badge-tag">Disaster Recovery</span>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    margin: '0.5rem 0 0.75rem',
                    color: 'var(--text-title)',
                  }}
                >
                  Shamir Secret Sharing (k-of-n) Multi-Party Split
                </h2>
                <p className="card-text">
                  Never worry about losing your master password. AegisVault includes built-in Shamir
                  Secret Sharing allowing you to split your emergency secret key into N mathematical
                  shares (e.g. 5 shares). Any K shares (e.g. 3 of 5) can recombine and reconstruct
                  the vault without exposing the root password.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="glass-card">
            <div
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
            >
              <div className="card-icon" style={{ flexShrink: 0 }}>
                🔄
              </div>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <span className="badge-tag">Data Portability</span>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    margin: '0.5rem 0 0.75rem',
                    color: 'var(--text-title)',
                  }}
                >
                  Encrypted Sovereign Export & Import
                </h2>
                <p className="card-text">
                  Full control over your backups. Export raw encrypted ciphertext JSON or decrypted
                  plaintext backups whenever you choose. Zero vendor lock-in, zero cloud
                  dependencies.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <button type="button" className="btn-primary btn-glow-pulse" onClick={onLaunchVault}>
            Launch Web Vault Now
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. SECURITY WHITEPAPER VIEW
// --------------------------------------------------------------------------
export function SecurityView({ onLaunchVault }: ViewProps) {
  return (
    <div className="section-spacing">
      <div className="marketing-container">
        <div className="section-header">
          <span className="section-tag">Cryptographic Whitepaper</span>
          <h1 className="section-title">Provable Zero-Knowledge Security Model</h1>
          <p className="section-description">
            Complete mathematical specification, threat modeling, and cryptographic guarantees.
          </p>
        </div>

        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
          }}
        >
          {/* Spec Card 1 */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.35rem', color: 'var(--cyan-primary)', marginBottom: '1rem' }}>
              1. Key Derivation & Memory Hardness Parameters
            </h2>
            <p className="card-text">
              AegisVault implements the <strong>Argon2id</strong> algorithm as specified in RFC
              9106. Argon2id combines data-independent memory access (protecting against
              side-channel attacks) with data-dependent memory access (maximizing resistance against
              GPU/ASIC cost performance).
            </p>
            <div className="flow-node" style={{ marginTop: '1rem' }}>
              <div className="flow-node-code">
                Algorithm: Argon2id (RFC 9106)
                <br />
                Memory Cost (m): 65536 KiB (64 MB)
                <br />
                Time Cost (t): 3 Iterations
                <br />
                Parallelism (p): 4 Threads
                <br />
                Salt: 256-bit CSPRNG (crypto.getRandomValues)
                <br />
                Secret Key Factor: 128-bit random base64 string
              </div>
            </div>
          </div>

          {/* Spec Card 2 */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.35rem', color: 'var(--cyan-primary)', marginBottom: '1rem' }}>
              2. Sub-Key Derivation (HKDF-Expand)
            </h2>
            <p className="card-text">
              From the 256-bit Master Key derived by Argon2id, AegisVault applies HKDF-Expand (RFC
              5869) with SHA-256 to generate distinct, cryptographically independent sub-keys:
            </p>
            <ul className="tech-spec-list" style={{ marginTop: '0.75rem' }}>
              <li className="tech-spec-item">
                <strong>K_enc</strong> (AES-256-GCM Wrapping Key): Derived with info tag{' '}
                <code>aegis-vault-enc-v1</code>
              </li>
              <li className="tech-spec-item">
                <strong>K_auth</strong> (HMAC-SHA256 Verifier Key): Derived with info tag{' '}
                <code>aegis-vault-auth-v1</code>
              </li>
            </ul>
          </div>

          {/* Spec Card 3 */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.35rem', color: 'var(--cyan-primary)', marginBottom: '1rem' }}>
              3. Threat Model & Attack Vector Resistance
            </h2>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}
            >
              <div className="flow-node">
                <div style={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>
                  Cloud Provider / Host Compromise
                </div>
                <p
                  style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}
                >
                  <strong>Zero Impact.</strong> No plaintext keys or unencrypted records ever
                  transit to remote servers. Even complete takeover of the hosting CDN provides zero
                  access to client vaults.
                </p>
              </div>

              <div className="flow-node">
                <div style={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>
                  GPU & Cluster Brute Force Attacks
                </div>
                <p
                  style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}
                >
                  <strong>Cryptographically Infeasible.</strong> Dual-factor derivation requires
                  cracking both the master password AND the 128-bit Secret Key, with each attempt
                  costing 64MB of RAM.
                </p>
              </div>

              <div className="flow-node">
                <div style={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>
                  Cross-Site Scripting (XSS) in UI DOM
                </div>
                <p
                  style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}
                >
                  <strong>Off-Thread Isolation.</strong> Crypto keys are held inside a dedicated Web
                  Worker as non-extractable CryptoKey handles. The main React DOM thread never has
                  access to raw key bytes.
                </p>
              </div>
            </div>
          </div>

          {/* Security Visualizer Embedded */}
          <CryptoVisualizer />
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. OPEN SOURCE & PRICING VIEW
// --------------------------------------------------------------------------
export function PricingView({ onLaunchVault }: ViewProps) {
  return (
    <div className="section-spacing">
      <div className="marketing-container">
        <div className="section-header">
          <span className="section-tag">Transparent Open Source Sovereignty</span>
          <h1 className="section-title">Zero Paywalls for Absolute Privacy</h1>
          <p className="section-description">
            AegisVault is 100% Free & Open Source under the permissive MIT license. Deploy anywhere,
            inspect everything.
          </p>
        </div>

        <div className="pricing-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Community Free */}
          <div className="pricing-card featured">
            <span className="pricing-badge">Recommended</span>
            <div>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--text-title)' }}>
                Sovereign Community
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Full zero-knowledge client-side password & secrets manager.
              </p>
              <div className="price-number">
                $0{' '}
                <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                  / forever
                </span>
              </div>
              <ul className="price-features">
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Unlimited Credentials & Vault Items
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Dual-Factor Argon2id Key Derivation
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> AES-256-GCM Per-Item Envelope Encryption
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Shamir Secret Sharing (k-of-n) Recovery
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Web Worker Off-Thread Isolation
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Zero Telemetry / 100% Offline Capable
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Permissive MIT Open-Source License
                </li>
              </ul>
            </div>
            <button
              type="button"
              className="btn-primary btn-glow-pulse"
              onClick={onLaunchVault}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Launch Vault Free
            </button>
          </div>

          {/* Self-Hosted Pro */}
          <div className="pricing-card">
            <div>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--text-title)' }}>Self-Hosted Pro</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                For teams and power users running private zero-knowledge sync servers.
              </p>
              <div className="price-number">
                Self-Hosted{' '}
                <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                  / 100% Free
                </span>
              </div>
              <ul className="price-features">
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Everything in Sovereign Community
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Docker / Fly.io / Kubernetes Deployments
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Private End-to-End Encrypted Sync
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Custom Backup Automations
                </li>
                <li className="price-feature-item">
                  <span className="check-icon">✓</span> Zero External Cloud Dependencies
                </li>
              </ul>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={onLaunchVault}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              View GitHub Repo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. FAQ & DOCS VIEW
// --------------------------------------------------------------------------
const FAQ_ITEMS = [
  {
    q: 'How does AegisVault differ from 1Password and Bitwarden?',
    a: 'Unlike traditional password managers that store encrypted blobs on their central cloud servers creating attractive multi-million-user breach targets, AegisVault is 100% client-side sovereign. It executes dual-factor Argon2id KDF (m = 64MB, t = 3, p = 4) and per-item AES-256-GCM envelope encryption inside an isolated Web Worker, storing records directly in your browser sandboxed IndexedDB with zero cloud telemetry.',
  },
  {
    q: 'What happens if I forget my Master Password or lose my Secret Key?',
    a: 'Because AegisVault enforces strict zero-knowledge cryptography, nobody—not even the creators of AegisVault—can recover a lost master password or secret key. However, AegisVault includes built-in Shamir Secret Sharing (k-of-n) disaster recovery, allowing you to split recovery keys into 3 or 5 distributed shares with trusted contacts or emergency safes.',
  },
  {
    q: 'Can browser extensions or XSS attacks steal my master key?',
    a: 'AegisVault executes all cryptographic operations inside a dedicated Web Worker via Comlink. Sensitive keys are instantiated as non-extractable WebCrypto CryptoKey handles. Memory buffers are explicitly zeroized using typed array sweeps in finally blocks immediately after derivation.',
  },
  {
    q: 'Is AegisVault free and open source?',
    a: 'Yes, 100%. AegisVault is licensed under the permissive MIT open-source license. You can inspect all cryptographic source code, build it locally, or self-host your own synchronization relays.',
  },
  {
    q: 'Does AegisVault work completely offline?',
    a: 'Yes! All derivation, item decryption, search filtering, and password generation happens 100% locally on your device within the browser sandbox. You never need an active internet connection to access or manage your vault.',
  },
];

export function FaqView({ onLaunchVault }: ViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="section-spacing">
      <div className="marketing-container">
        <div className="section-header">
          <span className="section-tag">Frequently Asked Questions</span>
          <h1 className="section-title">Security, Cryptography & Architecture</h1>
          <p className="section-description">
            Everything you need to know about sovereign password management and zero-knowledge
            privacy.
          </p>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.q} className="faq-item">
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span>{item.q}</span>
                  <span style={{ color: 'var(--cyan-primary)', fontSize: '1.3rem' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && <div className="faq-answer">{item.a}</div>}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <button type="button" className="btn-primary btn-glow-pulse" onClick={onLaunchVault}>
            Launch AegisVault
          </button>
        </div>
      </div>
    </div>
  );
}
