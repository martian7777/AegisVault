import { useState } from 'react';
import { base64ToBytes } from '../../lib/base64.js';
import { cryptoWorker } from '../../lib/worker-client.js';

const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type UnlockMode = 'password' | 'shares';

export function UnlockScreen({ onUnlocked }: { onUnlocked: () => void }) {
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
      // Generic message regardless of failure cause: never reveal whether
      // the password, Secret Key, or shares were the ones that were wrong.
      setError('Incorrect credentials.');
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
      setError('Secret Key is not valid — check for typos.');
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
      setError('Paste at least one recovery share.');
      return;
    }
    await withBackoffOnFailure(() => cryptoWorker.recoverWithShares(shareTexts));
  }

  return (
    <div className="app-shell">
      <div className="panel">
        <h1>Unlock AegisVault</h1>

        {mode === 'password' && (
          <>
            <div className="field">
              <label htmlFor="unlock-password">Master password</label>
              <input
                id="unlock-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="field">
              <label htmlFor="unlock-secret-key">Secret Key</label>
              <input
                id="unlock-secret-key"
                type="text"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                spellCheck={false}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="button" onClick={handleUnlock} disabled={busy}>
              {busy ? 'Unlocking…' : 'Unlock'}
            </button>
            <p className="hint-text field-spaced">
              <button type="button" className="secondary" onClick={() => setMode('shares')}>
                Recover using emergency shares instead
              </button>
            </p>
          </>
        )}

        {mode === 'shares' && (
          <>
            <p className="hint-text">
              Paste your recovery shares, one per line — no master password needed if you have
              enough of them.
            </p>
            <div className="field">
              <label htmlFor="unlock-shares">Recovery shares</label>
              <textarea
                id="unlock-shares"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                rows={5}
                spellCheck={false}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="button" onClick={handleRecover} disabled={busy}>
              {busy ? 'Recovering…' : 'Recover vault'}
            </button>
            <p className="hint-text field-spaced">
              <button type="button" className="secondary" onClick={() => setMode('password')}>
                Use master password instead
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
