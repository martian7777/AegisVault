/**
 * Node-only entry point, kept separate from index.ts on purpose: this
 * imports 'node:fs'/'node:path' and must never end up in the browser
 * bundle's dependency graph (import from apps/web would pull @types/node
 * into that compilation and risk global type conflicts with the DOM lib for
 * no reason, since browsers never use this). Consumed only by apps/cli via
 * `@aegisvault/vault-core/node`.
 */
export { FileVaultRepository } from './repository/file-repository.js';
