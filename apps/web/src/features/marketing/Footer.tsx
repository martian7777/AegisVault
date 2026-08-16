import type { MarketingTab } from './Navbar.js';

interface FooterProps {
  onSelectTab: (tab: MarketingTab) => void;
  onLaunchVault: () => void;
}

export function Footer({ onSelectTab, onLaunchVault }: FooterProps) {
  return (
    <footer className="footer-section">
      <div className="marketing-container">
        <div className="footer-grid">
          {/* Col 1: Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div className="brand-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                🛡️
              </div>
              <span className="brand-title" style={{ fontSize: '1.2rem' }}>
                AegisVault
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '360px' }}>
              Next-generation zero-knowledge sovereign secrets & password manager engineered for absolute
              cryptographic sovereignty and zero cloud telemetry.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <div className="footer-col-title">Navigation</div>
            <ul className="footer-links">
              <li>
                <button type="button" onClick={() => onSelectTab('overview')}>
                  Overview
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onSelectTab('features')}>
                  Feature Suite
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onSelectTab('security')}>
                  Security Whitepaper
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onSelectTab('pricing')}>
                  Open Source & Pricing
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onSelectTab('faq')}>
                  FAQ & Docs
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Cryptography */}
          <div>
            <div className="footer-col-title">Specifications</div>
            <ul className="footer-links" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <li>KDF: Argon2id (m = 64MB, t = 3, p = 4)</li>
              <li>Cipher: AES-256-GCM</li>
              <li>Subkeys: HKDF-SHA256</li>
              <li>Isolation: Web Worker Proxy</li>
              <li>Disaster: Shamir (k-of-n)</li>
            </ul>
          </div>

          {/* Col 4: App CTA */}
          <div>
            <div className="footer-col-title">Get Started</div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Access your sovereign zero-knowledge vault instantly in your browser.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={onLaunchVault}
              style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.88rem' }}
            >
              Launch Vault
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} AegisVault. Licensed under the MIT Open Source License.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ color: 'var(--cyan-glow)' }}>100% Client-Side Sovereign</span>
            <span>Zero Cloud Telemetry</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
