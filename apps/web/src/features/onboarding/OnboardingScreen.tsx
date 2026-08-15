import { useState } from 'react';
import { bytesToBase64 } from '../../lib/base64.js';
import { cryptoWorker } from '../../lib/worker-client.js';

export function OnboardingScreen({ onOnboarded }: { onOnboarded: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreateVault() {
    setError(null);
    if (password.length < 8) {
      setError('Master password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { secretKey: generatedSecretKey } = await cryptoWorker.onboard(password);
      setSecretKey(bytesToBase64(generatedSecretKey));
    } catch {
      setError('Could not create the vault. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (secretKey) {
    return (
      <div className="app-shell">
        <div className="panel">
          <h1>Save your Secret Key</h1>
          <p className="hint-text">
            This key is generated locally and never leaves your device. It is required, together
            with your master password, every time you unlock your vault. AegisVault cannot recover
            it for you — store it somewhere safe (e.g. printed, or in a separate secure location).
          </p>
          <div className="secret-key-display">{secretKey}</div>
          <div className="field" style={{ marginTop: '1rem' }}>
            <label>
              <input
                type="checkbox"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
              />{' '}
              I have saved my Secret Key somewhere safe.
            </label>
          </div>
          <button type="button" disabled={!confirmedSaved} onClick={onOnboarded}>
            Continue to my vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="panel">
        <h1>Create your AegisVault</h1>
        <div className="field">
          <label htmlFor="password">Master password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Confirm master password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="button" onClick={handleCreateVault} disabled={busy}>
          {busy ? 'Deriving keys…' : 'Create vault'}
        </button>
      </div>
    </div>
  );
}
