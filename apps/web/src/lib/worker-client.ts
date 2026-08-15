import { createCryptoWorkerClient } from '../workers/crypto-worker-client.js';

/** Single shared worker instance for the whole app session. */
export const cryptoWorker = createCryptoWorkerClient();
