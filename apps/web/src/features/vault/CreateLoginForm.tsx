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
    <form className="panel" onSubmit={handleSubmit}>
      <h1>New login</h1>
      <div className="field">
        <label htmlFor="item-title">Title</label>
        <input id="item-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="item-username">Username</label>
        <input id="item-username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="item-password">Password</label>
        <input
          id="item-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="field">
        <label htmlFor="item-url">URL</label>
        <input id="item-url" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <button type="submit">Save item</button>
    </form>
  );
}
