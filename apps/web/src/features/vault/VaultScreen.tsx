import type { VaultItemType } from '@aegisvault/vault-core';
import { useCallback, useEffect, useState } from 'react';
import { cryptoWorker } from '../../lib/worker-client.js';
import { ExportImportPanel } from '../export-import/ExportImportPanel.js';
import { SyncPanel } from '../sync/SyncPanel.js';
import { CreateLoginForm } from './CreateLoginForm.js';
import { ItemDetail } from './ItemDetail.js';
import type { LoginItemPayload } from './types.js';

interface VaultIndexEntry {
  id: string;
  type: VaultItemType;
  title: string;
}

/**
 * Builds a session-only, in-memory display index by decrypting each item's
 * title. Fine at MVP scale (hundreds of items); never persisted.
 */
async function buildDisplayIndex(): Promise<VaultIndexEntry[]> {
  const summaries = await cryptoWorker.listItemSummaries();
  return Promise.all(
    summaries.map(async (summary) => {
      const payload = (await cryptoWorker.getItem(summary.id)) as LoginItemPayload | undefined;
      return {
        id: summary.id,
        type: summary.type,
        title: payload?.title || payload?.username || '(untitled)',
      };
    }),
  );
}

export function VaultScreen({ onLocked }: { onLocked: () => void }) {
  const [items, setItems] = useState<VaultIndexEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<LoginItemPayload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await buildDisplayIndex());
    } catch {
      setError('Could not load vault items.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSelect(id: string) {
    setSelectedId(id);
    setSelectedItem(null);
    try {
      const item = (await cryptoWorker.getItem(id)) as LoginItemPayload | undefined;
      setSelectedItem(item ?? null);
    } catch {
      setError('Could not decrypt this item.');
    }
  }

  async function handleDelete(id: string) {
    await cryptoWorker.deleteItem(id);
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedItem(null);
    }
    await refresh();
  }

  async function handleCreate(payload: LoginItemPayload) {
    await cryptoWorker.createItem('login', payload);
    setShowCreateForm(false);
    await refresh();
  }

  async function handleLock() {
    await cryptoWorker.lock();
    onLocked();
  }

  return (
    <div className="app-shell">
      <div className="vault-shell">
        <div className="vault-toolbar">
          <h1>Vault</h1>
          <div className="row-gap">
            <button type="button" onClick={() => setShowCreateForm((v) => !v)}>
              {showCreateForm ? 'Cancel' : 'New login'}
            </button>
            <button type="button" className="secondary" onClick={handleLock}>
              Lock
            </button>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        {showCreateForm && <CreateLoginForm onCreate={handleCreate} />}

        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id} className="item-row">
              <div>
                <div>{item.title}</div>
                <span className="badge">{item.type}</span>
              </div>
              <div className="row-gap">
                <button type="button" className="secondary" onClick={() => handleSelect(item.id)}>
                  View
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
          {items.length === 0 && <p className="hint-text">No items yet.</p>}
        </ul>

        {selectedId && selectedItem && <ItemDetail item={selectedItem} />}

        <ExportImportPanel onImported={onLocked} />
        <SyncPanel onImported={onLocked} />
      </div>
    </div>
  );
}
