import * as Comlink from 'comlink';
import type { CryptoWorkerApi } from './crypto-worker.js';

export function createCryptoWorkerClient(): Comlink.Remote<CryptoWorkerApi> {
  const worker = new Worker(new URL('./crypto-worker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<CryptoWorkerApi>(worker);
}
