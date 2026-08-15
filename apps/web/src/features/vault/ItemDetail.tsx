import { useState } from 'react';
import type { LoginItemPayload } from './types.js';

export function ItemDetail({ item }: { item: LoginItemPayload }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="panel">
      <h1>{item.title}</h1>
      <div className="field">
        <label htmlFor="detail-username">Username</label>
        <input id="detail-username" type="text" value={item.username} readOnly />
      </div>
      <div className="field">
        <label htmlFor="detail-password">Password</label>
        <input
          id="detail-password"
          type={revealed ? 'text' : 'password'}
          value={item.password}
          readOnly
        />
        <button type="button" className="secondary" onClick={() => setRevealed((v) => !v)}>
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
      {item.url && (
        <div className="field">
          <label htmlFor="detail-url">URL</label>
          <input id="detail-url" type="text" value={item.url} readOnly />
        </div>
      )}
    </div>
  );
}
