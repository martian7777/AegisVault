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
      name: 'vault-core-only-depends-on-crypto-core',
      comment:
        'vault-core is the data/domain layer; it may only depend on crypto-core, never on apps.',
      severity: 'error',
      from: { path: '^packages/vault-core' },
      to: { path: '^apps' },
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
