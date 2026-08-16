export function ComparisonMatrix() {
  return (
    <section className="section-spacing" id="comparison-matrix">
      <div className="marketing-container">
        <div className="section-header">
          <span className="section-tag">Security Architecture Benchmark</span>
          <h2 className="section-title">AegisVault vs Legacy Password Managers</h2>
          <p className="section-description">
            Compare cryptographic specifications, execution isolation, and trust models side by side.
          </p>
        </div>

        <div className="comparison-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Feature Dimension</th>
                <th className="highlight-col" style={{ width: '26%', color: 'var(--cyan-primary)' }}>
                  🛡️ AegisVault (Sovereign)
                </th>
                <th style={{ width: '15%' }}>1Password</th>
                <th style={{ width: '15%' }}>Bitwarden</th>
                <th style={{ width: '16%' }}>LastPass</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Trust Model & Cloud Footprint</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Where keys and plaintexts exist
                  </div>
                </td>
                <td className="highlight-col">
                  <span className="check-icon">✓</span> <strong>100% Client-Side Sovereign</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--cyan-glow)' }}>
                    Zero cloud breach targets
                  </div>
                </td>
                <td>Centralized Cloud Service</td>
                <td>Centralized / Self-Hosted Cloud</td>
                <td>Centralized Cloud DB</td>
              </tr>

              <tr>
                <td>
                  <strong>Key Derivation Function (KDF)</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Resistance to ASIC/GPU farms
                  </div>
                </td>
                <td className="highlight-col">
                  <span className="check-icon">✓</span> <strong>Argon2id (64MB, 4 threads)</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--cyan-glow)' }}>
                    RFC 9106 Winner
                  </div>
                </td>
                <td>PBKDF2-HMAC-SHA256 (or Argon2id optional)</td>
                <td>PBKDF2 (legacy standard default)</td>
                <td>PBKDF2 (historically low iterations)</td>
              </tr>

              <tr>
                <td>
                  <strong>Dual-Factor Master Key Secret</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Offline second secret factor
                  </div>
                </td>
                <td className="highlight-col">
                  <span className="check-icon">✓</span> <strong>128-bit Sovereign Secret Key</strong>
                </td>
                <td>128-bit Secret Key</td>
                <td><span className="cross-icon">✕</span> Single Master Password</td>
                <td><span className="cross-icon">✕</span> Single Master Password</td>
              </tr>

              <tr>
                <td>
                  <strong>Execution Thread Isolation</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Resistance to UI freeze and DOM inspection
                  </div>
                </td>
                <td className="highlight-col">
                  <span className="check-icon">✓</span> <strong>Dedicated Web Worker (Comlink)</strong>
                </td>
                <td>Native Apps / Main Thread</td>
                <td>Main JS Thread</td>
                <td>Main JS Thread</td>
              </tr>

              <tr>
                <td>
                  <strong>Item Encryption Scheme</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Per-record key isolation
                  </div>
                </td>
                <td className="highlight-col">
                  <span className="check-icon">✓</span> <strong>Envelope: Unique 256-bit Key / item</strong>
                </td>
                <td>Vault-level key hierarchy</td>
                <td>Single symmetric vault key</td>
                <td>Single symmetric vault key</td>
              </tr>

              <tr>
                <td>
                  <strong>Emergency Key Recovery</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Multi-party disaster recovery
                  </div>
                </td>
                <td className="highlight-col">
                  <span className="check-icon">✓</span> <strong>Shamir Secret Sharing (k-of-n)</strong>
                </td>
                <td>Emergency Kit PDF</td>
                <td>Trusted emergency contacts</td>
                <td>SMS / Email OTP reset</td>
              </tr>

              <tr>
                <td>
                  <strong>Licensing & Sovereignty</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Code transparency and zero lock-in
                  </div>
                </td>
                <td className="highlight-col">
                  <span className="check-icon">✓</span> <strong>100% Open Source (MIT)</strong>
                </td>
                <td>Proprietary Closed Source</td>
                <td>Open Source (GPL / Server limits)</td>
                <td>Proprietary Closed Source</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
