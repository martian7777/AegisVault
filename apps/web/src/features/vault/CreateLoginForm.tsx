import { useState } from 'react';
import type { LoginItemPayload } from './types.js';

export function CreateLoginForm({ onCreate }: { onCreate: (payload: LoginItemPayload) => void }) {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), username, password, url });
    setTitle('');
    setUsername('');
    setPassword('');
    setUrl('');
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="field">
        <label htmlFor="item-title">Item Title / Service Name *</label>
        <input
          id="item-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. GitHub Production, AWS KMS, Personal Email"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="item-username">Username / Email / Identifier</label>
        <input
          id="item-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. admin@company.internal or secops_user"
        />
      </div>

      <div className="field">
        <label htmlFor="item-password">Password / Secret Key</label>
        <input
          id="item-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter secret payload to envelope-encrypt"
          autoComplete="new-password"
        />
      </div>

      <div className="field">
        <label htmlFor="item-url">Service URL / Domain (Optional)</label>
        <input
          id="item-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <button type="submit" className="btn-primary btn-glow-pulse" style={{ marginTop: '0.5rem' }}>
        🔒 Encrypt & Save to Vault
      </button>
    </form>
  );
}
