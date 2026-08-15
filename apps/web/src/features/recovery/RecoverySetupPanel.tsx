import type { RecoveryParams } from '@aegisvault/vault-core';
import { useEffect, useState } from 'react';
import { base64ToBytes } from '../../lib/base64.js';
import { cryptoWorker } from '../../lib/worker-client.js';

type Stage = 'summary' | 'form' | 'shares';

/**
 * Splits the vault's Master Key into k-of-n Shamir shares, letting the
 * vault be unlocked later from any `threshold` of the `shares` without the
 * master password at all. Re-enabling replaces any previous shares — those
 * old shares are NOT invalidated (they still mathematically reconstruct the
 * key), so treat generating new shares as "also destroy the old ones", not
 * a silent rotation. See SECURITY.md.
 */
export function RecoverySetupPanel() {
  const [stage, setStage] = useState<Stage>('summary');
  const [params, setParams] = useState<RecoveryParams | undefined>(undefined);
  const [shareCount, setShareCount] = useState(5);
  const [threshold, setThreshold] = useState(3);
  const [password, setPassword] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [shares, setShares] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void cryptoWorker.getRecoveryParams().then(setParams);
  }, []);

  async function handleGenerate() {
    setError(null);
    if (threshold < 2 || threshold > shareCount) {
      setError('Threshold must be at least 2 and no more than the number of shares.');
      return;
    }
    let secretKey: Uint8Array;
    try {
      secretKey = base64ToBytes(secretKeyInput.trim());
    } catch {
      setError('Secret Key is not valid — check for typos.');
      return;
    }

    setBusy(true);
    try {
      const generatedShares = await cryptoWorker.enableRecovery(password, secretKey, {
        shares: shareCount,
        threshold,
      });
      setShares(generatedShares);
      setParams({ threshold, shares: shareCount, enabledAt: Date.now() });
      setStage('shares');
    } catch {
      setError('Incorrect password or Secret Key.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h1>Emergency Recovery</h1>

      {stage === 'summary' && (
        <>
          <p className="hint-text">
            {params
              ? `Enabled: any ${params.threshold} of ${params.shares} recovery shares can unlock this vault without the master password.`
              : 'Not set up. Splits your Master Key into shares you can distribute to trustees — any threshold number of them unlocks the vault, none alone can.'}
          </p>
          <button type="button" onClick={() => setStage('form')}>
            {params ? 'Generate new shares' : 'Set up emergency recovery'}
          </button>
        </>
      )}

      {stage === 'form' && (
        <>
          <p className="hint-text">
            Re-enter your credentials to prove you can already unlock this vault.
          </p>
          <div className="field">
            <label htmlFor="recovery-shares">Number of shares</label>
            <input
              id="recovery-shares"
              type="text"
              inputMode="numeric"
              value={shareCount}
              onChange={(e) => setShareCount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="field">
            <label htmlFor="recovery-threshold">Shares required to unlock</label>
            <input
              id="recovery-threshold"
              type="text"
              inputMode="numeric"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
            />
          </div>
          <div className="field">
            <label htmlFor="recovery-password">Master password</label>
            <input
              id="recovery-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="recovery-secret-key">Secret Key</label>
            <input
              id="recovery-secret-key"
              type="text"
              value={secretKeyInput}
              onChange={(e) => setSecretKeyInput(e.target.value)}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="row-gap">
            <button type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Generating…' : 'Generate shares'}
            </button>
            <button type="button" className="secondary" onClick={() => setStage('summary')}>
              Cancel
            </button>
          </div>
        </>
      )}

      {stage === 'shares' && (
        <>
          <p className="error-text">
            Save each share somewhere safe and separate — anyone with {threshold} of them can unlock
            this vault. AegisVault does not store these; they cannot be shown again.
          </p>
          <ul className="item-list">
            {shares.map((share) => (
              <li key={share} className="item-row">
                <span className="secret-key-display">{share}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setStage('summary')}>
            Done
          </button>
        </>
      )}
    </div>
  );
}
