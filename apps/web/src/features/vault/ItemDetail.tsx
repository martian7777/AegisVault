import { useState } from 'react';
import type { LoginItemPayload } from './types.js';

export function ItemDetail({ item }: { item: LoginItemPayload }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="panel">
      <h1>{item.title}</h1>
      <div className="field">
        <label>Username</label>
        <input type="text" value={item.username} readOnly />
      </div>
      <div className="field">
        <label>Password</label>
        <input type={revealed ? 'text' : 'password'} value={item.password} readOnly />
        <button type="button" className="secondary" onClick={() => setRevealed((v) => !v)}>
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
      {item.url && (
        <div className="field">
          <label>URL</label>
          <input type="text" value={item.url} readOnly />
        </div>
      )}
    </div>
  );
}
