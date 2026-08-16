import { useEffect, useState } from 'react';

interface MockItem {
  id: string;
  title: string;
  category: 'login' | 'server' | 'key' | 'note';
  username: string;
  previewSecret: string;
  totp?: string;
  lastUpdated: string;
}

const MOCK_ITEMS: [MockItem, ...MockItem[]] = [
  {
    id: '1',
    title: 'GitHub Enterprise / Production',
    category: 'login',
    username: 'sec-ops-lead@company.internal',
    previewSecret: 'ghp_8Fk294nK92mXla091zLq',
    totp: '849 201',
    lastUpdated: '2 hours ago',
  },
  {
    id: '2',
    title: 'AWS Root IAM & KMS Cluster',
    category: 'server',
    username: 'arn:aws:iam::894102941:root',
    previewSecret: 'AKIAIOSFODNN7EXAMPLE',
    totp: '391 754',
    lastUpdated: 'Yesterday',
  },
  {
    id: '3',
    title: 'PostgreSQL Primary Secret Key',
    category: 'key',
    username: 'postgres_cluster_admin',
    previewSecret: 'pg_sec_k94j20f92j4f0923jf',
    lastUpdated: '3 days ago',
  },
  {
    id: '4',
    title: 'Zero-Knowledge Backup Recovery Seed',
    category: 'note',
    username: 'Encrypted Sovereign Note',
    previewSecret: 'desert ocean mountain galaxy falcon orbit echo frost...',
    lastUpdated: '5 days ago',
  },
];

export function VaultLivePreview({ onLaunch }: { onLaunch: () => void }) {
  const [selectedId, setSelectedId] = useState('1');
  const [totpSeconds, setTotpSeconds] = useState(24);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotpSeconds((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedItem = MOCK_ITEMS.find((item) => item.id === selectedId) ?? MOCK_ITEMS[0];

  function handleCopy(id: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 1500);
  }

  return (
    <section className="section-spacing" id="vault-preview">
      <div className="marketing-container">
        <div className="section-header">
          <span className="section-tag">Interactive Vault Interface</span>
          <h2 className="section-title">Clean Sovereign Command Center</h2>
          <p className="section-description">
            Experience the studio interface designed for instant credential access, built-in TOTP
            authenticators, and envelope-encrypted items.
          </p>
        </div>

        {/* Studio Window Mockup */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-elevated)',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          {/* Top Window Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ff5f56',
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ffbd2e',
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#27c93f',
                }}
              />
              <span
                style={{
                  marginLeft: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                aegisvault://sovereign-session [AES-256-GCM]
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
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
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: 'var(--emerald-primary)',
                  }}
                />
                VAULT UNLOCKED
              </span>
              <button
                type="button"
                className="btn-primary"
                onClick={onLaunch}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
              >
                Open Real Vault
              </button>
            </div>
          </div>

          {/* Main Dashboard Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
            }}
          >
            {/* Left: Item list */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-title)' }}>
                  Encrypted Vault Items ({MOCK_ITEMS.length})
                </span>
                <span className="badge-tag">Zero-Knowledge</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {MOCK_ITEMS.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`vault-item-card ${isSelected ? 'selected' : ''}`}
                      style={{ cursor: 'pointer', margin: 0, textAlign: 'left', width: '100%' }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-title)',
                            fontSize: '0.95rem',
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.15rem',
                          }}
                        >
                          {item.username}
                        </div>
                      </div>
                      <span className="badge-tag">{item.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Item Inspector Panel */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <span className="badge-tag">{selectedItem.category}</span>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        marginTop: '0.35rem',
                        color: 'var(--text-title)',
                      }}
                    >
                      {selectedItem.title}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {selectedItem.lastUpdated}
                  </span>
                </div>

                {/* Username Field */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.25rem',
                      fontWeight: 600,
                    }}
                  >
                    Identity / Identifier
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: '#ffffff',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: 'var(--cyan-primary)',
                      border: '1px solid var(--border-card)',
                      fontWeight: 600,
                    }}
                  >
                    {selectedItem.username}
                  </div>
                </div>

                {/* Password / Secret Field */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.25rem',
                      fontWeight: 600,
                    }}
                  >
                    Decrypted Secret (Envelope AES-GCM)
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--bg-terminal)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      color: '#38bdf8',
                      border: '1px solid #1e293b',
                    }}
                  >
                    <span>{selectedItem.previewSecret}</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(selectedItem.id, selectedItem.previewSecret);
                      }}
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      {copiedItem === selectedItem.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* TOTP Field if available */}
                {selectedItem.totp && (
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.25rem',
                        fontWeight: 600,
                      }}
                    >
                      2FA TOTP Code (Updates in {totpSeconds}s)
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--cyan-light)',
                        border: '1px solid var(--cyan-border)',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'var(--cyan-primary)',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {selectedItem.totp}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--cyan-primary)',
                          fontWeight: 600,
                        }}
                      >
                        ⏱ {totpSeconds}s
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Envelope Key: AES-256-GCM (Unique)</span>
                <span style={{ color: 'var(--emerald-primary)', fontWeight: 600 }}>
                  AAD Verified ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
