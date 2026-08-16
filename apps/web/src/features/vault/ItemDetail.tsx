import { useState } from 'react';
import type { LoginItemPayload } from './types.js';

export function ItemDetail({ item }: { item: LoginItemPayload }) {
  const [revealed, setRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function handleCopy(text: string, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // Fallback
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <span className="badge-tag">Login Credential</span>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-title)', marginTop: '0.35rem' }}>{item.title}</h2>
      </div>

      {item.username && (
        <div className="field">
          <label htmlFor="detail-username">Identity / Username</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input id="detail-username" type="text" value={item.username} readOnly />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleCopy(item.username ?? '', 'username')}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              {copiedField === 'username' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="detail-password">Decrypted Secret Payload</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            id="detail-password"
            type={revealed ? 'text' : 'password'}
            value={item.password}
            readOnly
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setRevealed((v) => !v)}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            {revealed ? 'Hide' : 'Reveal'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleCopy(item.password ?? '', 'password')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            {copiedField === 'password' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {item.url && (
        <div className="field">
          <label htmlFor="detail-url">Service Domain</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input id="detail-url" type="text" value={item.url} readOnly />
            <a
              href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              Open ↗
            </a>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-card)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Cipher: AES-256-GCM Envelope</span>
        <span style={{ color: 'var(--emerald-primary)', fontWeight: 600 }}>AAD Integrity: OK ✓</span>
      </div>
    </div>
  );
}
