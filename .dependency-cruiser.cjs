/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'crypto-core-is-pure',
      comment:
        'crypto-core must stay framework-free and standalone so it can be reused unmodified by a future CLI or browser extension.',
      severity: 'error',
      from: { path: '^packages/crypto-core' },
      to: { path: '^(packages/vault-core|apps)' },
    },
    {
      name: 'vault-core-only-depends-on-crypto-packages',
      comment:
        'vault-core is the data/domain layer; it may only depend on crypto-core/shamir, never on apps.',
      severity: 'error',
      from: { path: '^packages/vault-core' },
      to: { path: '^apps' },
    },
    {
      name: 'shamir-is-pure',
      comment:
        'shamir is a self-contained GF(256) secret-sharing primitive — it must not know about vault-core or any app, so it stays reusable (e.g. by a future CLI) and independently testable.',
      severity: 'error',
      from: { path: '^packages/shamir' },
      to: { path: '^(packages/vault-core|packages/crypto-core|packages/sync-engine|apps)' },
    },
    {
      name: 'sync-engine-is-generic',
      comment:
        'sync-engine is a decoupled WebRTC transport for arbitrary JSON payloads — it must not know about vault-core or any app, so it stays reusable and independently testable.',
      severity: 'error',
      from: { path: '^packages/sync-engine' },
      to: { path: '^(packages/vault-core|apps)' },
    },
    {
      name: 'web-never-imports-node-only-vault-core',
      comment:
        'apps/web is a browser bundle; it must never pull in vault-core/node (fs/path-based repository) — that would bloat the bundle or crash at runtime.',
      severity: 'error',
      from: { path: '^apps/web' },
      to: { path: '^packages/vault-core/src/(node\\.ts|repository/file-repository\\.ts)$' },
    },
    {
      name: 'no-circular',
      comment: 'Circular dependencies make boundaries meaningless.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    exclude: {
      path: 'node_modules|dist|coverage',
    },
  },
};
