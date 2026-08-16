import { useState } from 'react';

interface StageInfo {
  id: number;
  title: string;
  short: string;
  tag: string;
  description: string;
  inputs: { label: string; value: string }[];
  process: { label: string; detail: string };
  outputs: { label: string; value: string; isEncrypted?: boolean }[];
  securityNote: string;
}

const STAGES: [StageInfo, ...StageInfo[]] = [
  {
    id: 1,
    title: 'Dual-Factor Master Input & Salt Ingestion',
    short: '1. Ingestion',
    tag: 'Dual-Factor Authentication',
    description:
      'AegisVault enforces two independent secrets before key derivation starts. Unlike legacy single-password managers, an attacker with your password still cannot derive the master key without the offline 128-bit Secret Key.',
    inputs: [
      { label: 'Master Password (Human Input)', value: '••••••••••••••••' },
      {
        label: 'Secret Key (128-bit High-Entropy Device Key)',
        value: 'aegis-sec-7f9a8b1c4e2d3f0a9b8c7d6e5f4a3b2c',
      },
      { label: 'Cryptographic Salt (CSPRNG 256-bit)', value: 'e4f9b2c8...d3a7e1f0' },
    ],
    process: {
      label: 'Input Normalization & Buffer Isolation',
      detail:
        'Loaded into ephemeral Uint8Array memory buffers; never touched by React state or DOM.',
    },
    outputs: [
      {
        label: 'Combined Key Derivation Vector',
        value: 'PWD || SK || SALT (Loaded in Web Worker Memory)',
      },
    ],
    securityNote:
      'Defense Against GPU / ASIC Brute Force: Dual-factor input provides an extra 128-bits of unguessable entropy.',
  },
  {
    id: 2,
    title: 'Argon2id Memory-Hard Key Derivation',
    short: '2. Argon2id KDF',
    tag: 'RFC 9106 Memory-Hard KDF',
    description:
      'Execution happens inside a dedicated Web Worker via WebAssembly. Parameters ($t=3, m=65536\\text{ KiB}, p=4$) ensure that generating a single key requires 64MB of RAM across 4 threads, crippling mass GPU cracking farms.',
    inputs: [
      { label: 'Memory Cost ($m$)', value: '64 MB (65,536 KiB)' },
      { label: 'Time Cost ($t$)', value: '3 Iterations' },
      { label: 'Parallelism ($p$)', value: '4 Threads (Web Worker Off-Thread)' },
    ],
    process: {
      label: 'Argon2id WebAssembly Worker Engine',
      detail: 'Executes without blocking UI frames. Memory is instantly zeroized post-derivation.',
    },
    outputs: [
      {
        label: 'Master Key (MK - 256-bit CryptoKey)',
        value: '0x9a8f21bc... (Non-Extractable CryptoKey handle)',
        isEncrypted: true,
      },
    ],
    securityNote:
      'Worker Isolation: Even if an XSS vulnerability existed in the DOM, the raw master key buffer cannot be read.',
  },
  {
    id: 3,
    title: 'Sub-Key Expansion via HKDF-SHA256',
    short: '3. Sub-Key Derivation',
    tag: 'HKDF Expand RFC 5869',
    description:
      'The Master Key is never used directly to encrypt vault records. Instead, HKDF-SHA256 expands it into two structurally separated sub-keys with distinct domain context separation.',
    inputs: [
      { label: 'Master Key (MK)', value: '256-bit Non-Extractable CryptoKey' },
      { label: 'Domain Info 1', value: '"aegis-vault-enc-v1"' },
      { label: 'Domain Info 2', value: '"aegis-vault-auth-v1"' },
    ],
    process: {
      label: 'HKDF-Expand (SHA-256)',
      detail:
        'Generates mathematically distinct encryption and authentication keys from the root seed.',
    },
    outputs: [
      { label: 'K_enc (AES-256-GCM Wrapping Key)', value: 'Key-Wrap Key for Item Envelope Keys' },
      {
        label: 'K_auth (HMAC-SHA256 Verifier Key)',
        value: 'Constant-time login verification without exposing MK',
      },
    ],
    securityNote:
      'Domain Separation: Ensures encryption operations never leak mathematical clues regarding auth verifiers.',
  },
  {
    id: 4,
    title: 'Per-Item Envelope Encryption (AES-256-GCM)',
    short: '4. Envelope Encrypt',
    tag: 'Envelope Encryption Architecture',
    description:
      'Every password, credit card, or note receives its own unique 256-bit Item Key. The plaintext is encrypted using AES-256-GCM with Authenticated Additional Data (AAD), and the Item Key is wrapped with $K_{enc}$.',
    inputs: [
      {
        label: 'Item Plaintext Data',
        value: '{"service":"Github","username":"alice","password":"••••"}',
      },
      { label: 'Random Item Key (CSPRNG)', value: 'Unique 256-bit Key Generated per Item' },
      {
        label: 'Authenticated Additional Data (AAD)',
        value: '{"id":"item-042","version":1,"type":"login"}',
      },
    ],
    process: {
      label: 'Dual-Stage AES-256-GCM',
      detail: 'Stage 1: Encrypt Plaintext -> Ciphertext + Tag. Stage 2: Wrap ItemKey with K_enc.',
    },
    outputs: [
      {
        label: 'Ciphertext Payload',
        value: 'f72a901e...49b2 (Authenticated 128-bit GCM Tag)',
        isEncrypted: true,
      },
      { label: 'Wrapped Item Key', value: 'ae89012f... (Wrapped with K_enc)', isEncrypted: true },
    ],
    securityNote:
      'Envelope Security: Compromise of an individual item key never compromises the remainder of the vault.',
  },
  {
    id: 5,
    title: 'Sovereign Zero-Knowledge Local Storage',
    short: '5. Sovereign Storage',
    tag: 'Local-First Zero-Telemetry',
    description:
      'Only opaque encrypted records and the constant-time HMAC verifier are written to client-side IndexedDB. No plaintext, no master password, and no secret keys ever touch disk or network packets.',
    inputs: [
      {
        label: 'Vault Item Records',
        value: 'Array of { id, type, wrappedKey, ciphertext, iv, aad }',
      },
      { label: 'Auth Verifier', value: 'HMAC-SHA256 constant-time match token' },
      { label: 'Salt Vector', value: '256-bit Public Salt' },
    ],
    process: {
      label: 'IndexedDB Secure Commit',
      detail:
        'Stored strictly within the sovereign browser sandbox with full offline availability.',
    },
    outputs: [
      {
        label: 'Local Vault Status',
        value: 'Encrypted at Rest • Zero Telemetry Transmitted • Sovereign',
      },
    ],
    securityNote:
      'Breach Immunity: Even physical extraction of the raw IndexedDB database yields zero readable credentials.',
  },
];

export function CryptoVisualizer() {
  const [activeStep, setActiveStep] = useState(0);
  const currentStage = STAGES[activeStep] ?? STAGES[0];

  return (
    <section className="section-spacing" id="crypto-visualizer">
      <div className="marketing-container">
        <div className="section-header">
          <span className="section-tag">Interactive Cryptographic Pipeline</span>
          <h2 className="section-title">Step-by-Step Zero-Knowledge Architecture</h2>
          <p className="section-description">
            Explore how AegisVault transforms your master credentials into multi-layered
            envelope-encrypted sovereign records with zero server exposure.
          </p>
        </div>

        <div className="visualizer-container">
          {/* Stepper Buttons */}
          <div className="pipeline-stepper">
            {STAGES.map((stage, idx) => {
              const isActive = idx === activeStep;
              const isCompleted = idx < activeStep;
              return (
                <button
                  key={stage.id}
                  type="button"
                  className={`pipeline-step-btn ${isActive ? 'active' : ''} ${
                    isCompleted ? 'completed' : ''
                  }`}
                  onClick={() => setActiveStep(idx)}
                >
                  <div className="step-circle">{isCompleted ? '✓' : `0${stage.id}`}</div>
                  <span className="step-title">{stage.short}</span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Display Box */}
          <div className="visualizer-display-box">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span className="badge-tag">{currentStage.tag}</span>
                <h3
                  style={{ fontSize: '1.45rem', marginTop: '0.5rem', color: 'var(--text-title)' }}
                >
                  {currentStage.title}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                >
                  ← Prev Stage
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                  disabled={activeStep === STAGES.length - 1}
                  onClick={() => setActiveStep((s) => Math.min(STAGES.length - 1, s + 1))}
                >
                  Next Stage →
                </button>
              </div>
            </div>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.98rem',
                marginBottom: '1.5rem',
                lineHeight: '1.6',
              }}
            >
              {currentStage.description}
            </p>

            <div className="crypto-flow-diagram">
              {/* Inputs */}
              <div className="flow-node">
                <div className="flow-node-title">
                  <span>Cryptographic Inputs</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>[IN]</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentStage.inputs.map((inp) => (
                    <div key={inp.label}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {inp.label}
                      </div>
                      <div className="flow-node-code">{inp.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Processing Engine */}
              <div className="flow-node" style={{ borderColor: 'var(--cyan-border)' }}>
                <div className="flow-node-title">
                  <span style={{ color: 'var(--cyan-primary)' }}>Execution & Transforms</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)' }}>
                    [ENGINE]
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: 'var(--text-title)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {currentStage.process.label}
                  </div>
                  <div
                    style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}
                  >
                    {currentStage.process.detail}
                  </div>
                </div>
              </div>

              {/* Outputs */}
              <div className="flow-node">
                <div className="flow-node-title">
                  <span>Cryptographic Outputs</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--emerald-primary)' }}>
                    [SECURED]
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentStage.outputs.map((out) => (
                    <div key={out.label}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {out.label}
                      </div>
                      <div
                        className="flow-node-code"
                        style={
                          out.isEncrypted ? { color: '#34d399', borderColor: '#065f46' } : undefined
                        }
                      >
                        {out.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Guarantee Alert Banner */}
            <div
              style={{
                marginTop: '1.5rem',
                background: 'var(--cyan-light)',
                border: '1px solid var(--cyan-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.2rem', color: 'var(--cyan-primary)' }}>🛡️</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-title)' }}>
                <strong style={{ color: 'var(--cyan-primary)' }}>Cryptographic Guarantee:</strong>{' '}
                {currentStage.securityNote}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
