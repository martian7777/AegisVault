import { useState } from 'react';
import { bytesToBase64 } from '../../lib/base64.js';
import { cryptoWorker } from '../../lib/worker-client.js';

interface OnboardingScreenProps {
  onOnboarded: () => void;
  onBackToMarketing?: () => void;
}

export function OnboardingScreen({ onOnboarded, onBackToMarketing }: OnboardingScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  async function handleCreateVault() {
    setError(null);
    if (password.length < 8) {
      setError('Master password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Master passwords do not match. Please verify.');
      return;
    }
    setBusy(true);
    try {
      const { secretKey: generatedSecretKey } = await cryptoWorker.onboard(password);
      setSecretKey(bytesToBase64(generatedSecretKey));
    } catch {
      setError('Cryptographic derivation failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyKey() {
    if (!secretKey) return;
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Fallback
    }
  }

  // If secret key is generated, show the critical backup screen
  if (secretKey) {
    return (
      <div className="app-shell">
        <div className="app-panel" style={{ width: 'min(580px, 100%)' }}>
          <div className="app-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="brand-icon" style={{ width: '34px', height: '34px', fontSize: '1rem' }}>
                🔑
              </div>
              <h2 className="app-panel-title">Save Your Secret Key</h2>
            </div>
            <span className="badge-tag" style={{ color: 'var(--emerald-glow)', borderColor: 'var(--emerald-border)' }}>
              128-bit Entropy
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.6' }}>
            This 128-bit key was generated locally using CSPRNG and will never leave your device. 
            It is required together with your master password to unlock your vault. <strong>AegisVault has no backdoor or reset mechanism.</strong>
          </p>

          <div className="secret-key-card">
            <div style={{ fontSize: '0.75rem', color: 'var(--emerald-glow)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Sovereign Secret Key:
            </div>
            <div>{secretKey}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopyKey}
              style={{ flex: 1 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              {copiedKey ? 'Secret Key Copied!' : 'Copy to Clipboard'}
            </button>
          </div>

          <div
            style={{
              background: 'var(--cyan-light)',
              border: '1px solid var(--cyan-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <label className="custom-checkbox-label" style={{ color: 'var(--text-title)', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
              />
              I have stored my Secret Key in a safe offline location.
            </label>
          </div>

          <button
            type="button"
            className="btn-primary btn-glow-pulse"
            disabled={!confirmedSaved}
            onClick={onOnboarded}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            Continue to Sovereign Vault →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-panel">
        <div className="app-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon" style={{ width: '34px', height: '34px', fontSize: '1rem' }}>
              🛡️
            </div>
            <h2 className="app-panel-title">Initialize AegisVault</h2>
          </div>
          {onBackToMarketing && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onBackToMarketing}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              ← Back to Site
            </button>
          )}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Create a strong master password to initialize your client-side zero-knowledge vault.
        </p>

        <div className="field">
          <label htmlFor="password">
            <span>Master Password</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Min 8 chars</span>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter strong master passphrase"
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label htmlFor="confirm-password">Confirm Master Password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter master passphrase"
            autoComplete="new-password"
          />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <button
          type="button"
          className="btn-primary btn-glow-pulse"
          onClick={handleCreateVault}
          disabled={busy || !password}
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
        >
          {busy ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
              Deriving Argon2id Keys (64MB)...
            </>
          ) : (
            'Generate Sovereign Vault'
          )}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1.25rem',
            fontSize: '0.78rem',
            color: 'var(--text-dim)',
          }}
        >
          <span>Argon2id (64MB)</span>
          <span>•</span>
          <span>Web Worker Isolation</span>
          <span>•</span>
          <span>Zero Telemetry</span>
        </div>
      </div>
    </div>
  );
}
