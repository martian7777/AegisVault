import { useState } from 'react';
import { base64ToBytes } from '../../lib/base64.js';
import { cryptoWorker } from '../../lib/worker-client.js';

const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type UnlockMode = 'password' | 'shares';

interface UnlockScreenProps {
  onUnlocked: () => void;
  onBackToMarketing?: () => void;
}

export function UnlockScreen({ onUnlocked, onBackToMarketing }: UnlockScreenProps) {
  const [mode, setMode] = useState<UnlockMode>('password');
  const [password, setPassword] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [sharesInput, setSharesInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  async function withBackoffOnFailure(attempt: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await attempt();
      onUnlocked();
    } catch {
      setError('Incorrect master credentials or invalid Secret Key.');
      const nextAttempt = failedAttempts + 1;
      setFailedAttempts(nextAttempt);
      const backoff = Math.min(BASE_BACKOFF_MS * 2 ** nextAttempt, MAX_BACKOFF_MS);
      await sleep(backoff);
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock() {
    let secretKey: Uint8Array;
    try {
      secretKey = base64ToBytes(secretKeyInput.trim());
    } catch {
      setError('Secret Key format is invalid — check for typos.');
      return;
    }
    await withBackoffOnFailure(() => cryptoWorker.unlock(password, secretKey));
  }

  async function handleRecover() {
    const shareTexts = sharesInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (shareTexts.length === 0) {
      setError('Please paste at least one Shamir recovery share.');
      return;
    }
    await withBackoffOnFailure(() => cryptoWorker.recoverWithShares(shareTexts));
  }

  return (
    <div className="app-shell">
      <div className="app-panel" style={{ width: 'min(540px, 100%)' }}>
        <div className="app-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-icon" style={{ width: '34px', height: '34px', fontSize: '1rem' }}>
              🔒
            </div>
            <h2 className="app-panel-title">Unlock AegisVault</h2>
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

        {mode === 'password' && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Enter your Master Password and 128-bit Secret Key to decrypt your vault.
            </p>

            <div className="field">
              <label htmlFor="unlock-password">Master Password</label>
              <input
                id="unlock-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password"
                autoComplete="current-password"
              />
            </div>

            <div className="field">
              <label htmlFor="unlock-secret-key">Secret Key (128-bit Base64)</label>
              <input
                id="unlock-secret-key"
                type="text"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                placeholder="e.g. aegis-sec-..."
                spellCheck={false}
              />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button
              type="button"
              className="btn-primary btn-glow-pulse"
              onClick={handleUnlock}
              disabled={busy || !password || !secretKeyInput}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {busy ? 'Deriving & Decrypting…' : 'Unlock Sovereign Vault'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMode('shares')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
              >
                👥 Recover using Shamir Emergency Shares instead
              </button>
            </div>
          </>
        )}

        {mode === 'shares' && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Paste your Shamir recovery shares (one per line). Master password is not required if the
              threshold $k$ is met.
            </p>

            <div className="field">
              <label htmlFor="unlock-shares">Recovery Shares</label>
              <textarea
                id="unlock-shares"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                rows={5}
                placeholder="Paste share lines..."
                spellCheck={false}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button
              type="button"
              className="btn-primary btn-glow-pulse"
              onClick={handleRecover}
              disabled={busy || !sharesInput.trim()}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {busy ? 'Reconstructing Key…' : 'Reconstruct & Recover Vault'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMode('password')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
              >
                ← Return to Master Password Unlock
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
