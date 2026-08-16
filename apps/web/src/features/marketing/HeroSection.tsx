import type React from 'react';

interface HeroSectionProps {
  onLaunchVault: () => void;
  onExploreCrypto: () => void;
}

export function HeroSection({ onLaunchVault, onExploreCrypto }: HeroSectionProps) {
  return (
    <section className="hero-section">
      <div className="marketing-container">
        <div className="hero-pill-badge">
          <span className="hero-pill-dot" />
          <span>Local-First • Sovereign Cryptography • Zero Cloud Telemetry</span>
        </div>

        <h1 className="hero-title">
          The Future of Sovereign Password Security <br />
          <span className="hero-title-highlight">Starts with Provable Zero-Knowledge</span>
        </h1>

        <p className="hero-subtitle">
          Eliminate high-value cloud breach targets. AegisVault executes 100% client-side
          dual-factor Argon2id derivation and per-item AES-256-GCM envelope encryption off the main
          UI thread. Your plaintext secrets never touch disk, telemetry, or remote servers.
        </p>

        <div className="hero-actions">
          <button type="button" className="btn-primary btn-glow-pulse" onClick={onLaunchVault}>
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
            Launch Web Vault Free
          </button>

          <button type="button" className="btn-secondary" onClick={onExploreCrypto}>
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Cryptographic Architecture
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="metrics-strip">
          <div className="metric-card">
            <div className="metric-value">Argon2id</div>
            <div className="metric-label">64MB Memory-Hard KDF (t = 3, p = 4)</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">AES-256-GCM</div>
            <div className="metric-label">Per-Item Envelope Encryption</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">0 Servers</div>
            <div className="metric-label">100% Client-Side Sovereign</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">Shamir (k-of-n)</div>
            <div className="metric-label">Multi-Party Emergency Recovery</div>
          </div>
        </div>
      </div>
    </section>
  );
}
