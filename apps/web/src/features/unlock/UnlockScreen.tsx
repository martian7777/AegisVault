import { useState } from 'react';
import { base64ToBytes } from '../../lib/base64.js';
import { cryptoWorker } from '../../lib/worker-client.js';

const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function UnlockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  async function handleUnlock() {
    setError(null);

    let secretKey: Uint8Array;
    try {
      secretKey = base64ToBytes(secretKeyInput.trim());
    } catch {
      setError('Secret Key is not valid — check for typos.');
      return;
    }

    setBusy(true);
    try {
      await cryptoWorker.unlock(password, secretKey);
      onUnlocked();
    } catch {
      // Generic message regardless of failure cause: never reveal whether the
      // password or the Secret Key was the one that was wrong.
      setError('Incorrect password or Secret Key.');
      const attempt = failedAttempts + 1;
      setFailedAttempts(attempt);
      const backoff = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
      await sleep(backoff);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="panel">
        <h1>Unlock AegisVault</h1>
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
      </div>
    </div>
  );
}
