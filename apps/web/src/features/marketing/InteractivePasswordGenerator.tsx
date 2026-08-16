import { useCallback, useEffect, useState } from 'react';

export function InteractivePasswordGenerator() {
  const [length, setLength] = useState(24);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let charset = '';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (useUpper) charset += upper;
    if (useLower) charset += lower;
    if (useNumbers) charset += numbers;
    if (useSymbols) charset += symbols;

    if (excludeAmbiguous) {
      charset = charset.replace(/[Il1O0]/g, '');
    }

    if (!charset) {
      setPassword('Select at least one character set');
      return;
    }

    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    let result = '';
    for (let i = 0; i < length; i++) {
      const idx = (randomValues[i] ?? 0) % charset.length;
      result += charset[idx] ?? '';
    }
    setPassword(result);
    setCopied(false);
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  async function handleCopy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  // Calculate entropy
  let poolSize = 0;
  if (useUpper) poolSize += 26;
  if (useLower) poolSize += 26;
  if (useNumbers) poolSize += 10;
  if (useSymbols) poolSize += 28;
  if (excludeAmbiguous) poolSize -= 5;
  poolSize = Math.max(1, poolSize);

  const entropyBits = Math.round(length * Math.log2(poolSize));

  let strengthLabel = 'Weak';
  let strengthColor = 'var(--crimson-glow)';
  const fillPercent = Math.min(100, Math.round((entropyBits / 128) * 100));
  let crackTimeEstimate = 'Instantly';

  if (entropyBits >= 128) {
    strengthLabel = 'Cryptographically Sovereign (128+ bits)';
    strengthColor = 'var(--cyan-glow)';
    crackTimeEstimate = 'Trillions of centuries against GPU clusters';
  } else if (entropyBits >= 90) {
    strengthLabel = 'Military-Grade Strong';
    strengthColor = 'var(--emerald-glow)';
    crackTimeEstimate = 'Millions of years against RTX 4090 clusters';
  } else if (entropyBits >= 60) {
    strengthLabel = 'Moderate';
    strengthColor = 'var(--amber-glow)';
    crackTimeEstimate = 'Several centuries';
  } else {
    strengthLabel = 'Vulnerable';
    strengthColor = 'var(--crimson-glow)';
    crackTimeEstimate = 'Seconds to hours';
  }

  return (
    <section className="section-spacing" id="generator-tool">
      <div className="marketing-container">
        <div className="section-header">
          <span className="section-tag">Client-Side Cryptographic Tool</span>
          <h2 className="section-title">High-Entropy Password & Secret Generator</h2>
          <p className="section-description">
            Generate cryptographically secure pseudo-random secrets directly in your browser with
            zero server transmission and instant entropy calculation.
          </p>
        </div>

        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="generator-box">
            {/* Output Display */}
            <div className="pwd-output-container">
              <span className="pwd-text">{password}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={generatePassword}
                  title="Generate new secret"
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  Regenerate
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopy}
                  id="copy-generated-pwd-btn"
                >
                  <svg
                    aria-hidden="true"
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
                  {copied ? 'Copied!' : 'Copy Secret'}
                </button>
              </div>
            </div>

            {/* Entropy Meter */}
            <div className="entropy-meter">
              <div className="entropy-bar-bg">
                <div
                  className="entropy-bar-fill"
                  style={{
                    width: `${fillPercent}%`,
                    backgroundColor: strengthColor,
                    boxShadow: `0 0 12px ${strengthColor}`,
                  }}
                />
              </div>
              <div className="entropy-label" style={{ color: strengthColor }}>
                {entropyBits} bits ({strengthLabel})
              </div>
            </div>

            {/* Crack Time telemetry */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem',
                color: 'var(--text-main)',
                marginBottom: '1.75rem',
                background: 'var(--bg-subtle)',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
              }}
            >
              <span>Estimated Brute Force Resistance:</span>
              <strong style={{ color: strengthColor }}>{crackTimeEstimate}</strong>
            </div>

            {/* Length Control */}
            <div className="control-row">
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-title)' }}>
                Length: {length} Characters
              </span>
              <span
                style={{
                  color: 'var(--cyan-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}
              >
                {length}
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="range-slider"
              style={{ marginBottom: '1.75rem' }}
            />

            {/* Character Set Toggles */}
            <div className="checkbox-group">
              <label className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={useUpper}
                  onChange={(e) => setUseUpper(e.target.checked)}
                />
                Uppercase (A-Z)
              </label>

              <label className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={useLower}
                  onChange={(e) => setLowerChecked(e.target.checked, setUseLower)}
                />
                Lowercase (a-z)
              </label>

              <label className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                />
                Numbers (0-9)
              </label>

              <label className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                />
                Symbols (!@#$%...)
              </label>

              <label className="custom-checkbox-label">
                <input
                  type="checkbox"
                  checked={excludeAmbiguous}
                  onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                />
                Exclude Ambiguous (I, l, 1, O, 0)
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function setLowerChecked(checked: boolean, setUseLower: (val: boolean) => void) {
  setUseLower(checked);
}
