import type { Share } from './types.js';

const SHARE_PREFIX = 'aegis-shard';
const SHARE_VERSION = 1;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** A copy-paste/printable form of a share: `aegis-shard:v1:<threshold>:<index>:<base64 data>`. */
export function encodeShare(share: Share): string {
  return `${SHARE_PREFIX}:v${SHARE_VERSION}:${share.threshold}:${share.index}:${bytesToBase64(share.data)}`;
}

export function decodeShare(text: string): Share {
  const parts = text.trim().split(':');
  const [prefix, versionPart, thresholdPart, indexPart, dataB64] = parts;

  if (parts.length !== 5 || prefix !== SHARE_PREFIX) {
    throw new Error('Not a valid AegisVault recovery share.');
  }
  if (versionPart !== `v${SHARE_VERSION}`) {
    throw new Error(`Unsupported recovery share version: ${versionPart}`);
  }

  const threshold = Number.parseInt(thresholdPart ?? '', 10);
  const index = Number.parseInt(indexPart ?? '', 10);
  if (!Number.isInteger(threshold) || !Number.isInteger(index) || !dataB64) {
    throw new Error('Malformed recovery share.');
  }

  return { index, threshold, data: base64ToBytes(dataB64) };
}
