import type { VaultItemType } from '@aegisvault/vault-core';
import { useCallback, useEffect, useState } from 'react';
import { cryptoWorker } from '../../lib/worker-client.js';
import { ExportImportPanel } from '../export-import/ExportImportPanel.js';
import { RecoverySetupPanel } from '../recovery/RecoverySetupPanel.js';
import { SyncPanel } from '../sync/SyncPanel.js';
import { CreateLoginForm } from './CreateLoginForm.js';
import { ItemDetail } from './ItemDetail.js';
import type { LoginItemPayload } from './types.js';

interface VaultIndexEntry {
  id: string;
  type: VaultItemType;
  title: string;
  username?: string | undefined;
}

interface VaultScreenProps {
  onLocked: () => void;
  onBackToMarketing?: () => void;
}

/**
 * Builds a session-only, in-memory display index by decrypting each item's
 * title and username. Fine at MVP scale (hundreds of items); never persisted.
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
        username: payload?.username,
      };
    }),
  );
}

export function VaultScreen({ onLocked, onBackToMarketing }: VaultScreenProps) {
  const [items, setItems] = useState<VaultIndexEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<LoginItemPayload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      (item.username && item.username.toLowerCase().includes(query))
    );
  });

  return (
    <div className="marketing-container" style={{ padding: '2rem 1.5rem', minHeight: '100vh' }}>
      <div className="vault-dashboard-shell" style={{ margin: '0 auto' }}>
        {/* Top Command Bar */}
        <div className="vault-top-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="brand-icon" style={{ width: '38px', height: '38px' }}>
              🛡️
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-title)' }}>
                AegisVault Command Center
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--emerald-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--emerald-primary)',
                  }}
                />
                ACTIVE AES-256-GCM ENVELOPE SESSION
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {onBackToMarketing && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onBackToMarketing}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              >
                ← Return to Site / Docs
              </button>
            )}
            <button
              type="button"
              className="btn-danger"
              onClick={handleLock}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              🔒 Lock Vault
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Action & Search Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="search"
              placeholder="🔍 Search encrypted vault items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-primary btn-glow-pulse"
            onClick={() => setShowCreateForm((v) => !v)}
          >
            {showCreateForm ? '✕ Cancel' : '+ New Credential'}
          </button>
        </div>

        {showCreateForm && (
          <div className="glass-card" style={{ borderColor: 'var(--cyan-border)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-title)' }}>
              Create New Vault Item
            </h3>
            <CreateLoginForm onCreate={handleCreate} />
          </div>
        )}

        {/* Grid Layout: Items List and Inspector */}
        <div className="vault-grid-layout">
          {/* Left Column: Items */}
          <div className="vault-items-container">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-title)' }}>
                Encrypted Items ({filteredItems.length})
              </span>
              <span className="badge-tag">Zero-Knowledge</span>
            </div>

            {filteredItems.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p style={{ marginBottom: '1rem' }}>No matching credentials found in your vault.</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateForm(true)}
                  style={{ fontSize: '0.82rem' }}
                >
                  Add your first item
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredItems.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      className={`vault-item-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-title)', fontSize: '0.95rem' }}>
                          {item.title}
                        </div>
                        {item.username && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {item.username}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge-tag">{item.type}</span>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Item Inspector */}
          <div className="vault-items-container">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-title)' }}>
                Decrypted Inspector
              </span>
              <span className="badge-tag" style={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-border)', background: 'var(--emerald-light)' }}>
                Authenticated GCM
              </span>
            </div>

            {selectedId && selectedItem ? (
              <ItemDetail item={selectedItem} />
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '4rem 1.5rem',
                  color: 'var(--text-dim)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                <p>Select an item from your vault to view decrypted credentials.</p>
              </div>
            )}
          </div>
        </div>

        {/* Integrated Management Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          <ExportImportPanel onImported={onLocked} />
          <SyncPanel onImported={onLocked} />
          <RecoverySetupPanel />
        </div>
      </div>
    </div>
  );
}
