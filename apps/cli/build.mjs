import { chmodSync } from 'node:fs';
import { build } from 'esbuild';

/**
 * The CLI is bundled (not just transpiled) because it must run as a plain
 * `node dist/cli.js` with no monorepo present — unlike apps/web (bundled by
 * Vite) and the test suites (transpiled on the fly by Vitest), a shipped
 * CLI binary can't rely on `@aegisvault/*`'s package.json pointing straight
 * at TypeScript source.
 */
await build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  // CJS, not ESM: commander (and other deps) use `require('node:events')`
  // internally, which esbuild's CJS-into-ESM interop shim can't satisfy at
  // runtime. Bundling to CJS avoids that entirely — the file is named
  // `.cjs` so Node treats it as CommonJS regardless of this package's
  // "type": "module".
  format: 'cjs',
  target: 'node20',
  outfile: 'dist/cli.cjs',
  // src/cli.ts already starts with `#!/usr/bin/env node` — esbuild
  // preserves an entry file's own shebang automatically, so no `banner`
  // option is needed here (adding one would duplicate the line).
});

try {
  chmodSync('dist/cli.cjs', 0o755);
} catch {
  // chmod is a no-op on Windows — fine to ignore there.
}

console.log('Built dist/cli.cjs');
