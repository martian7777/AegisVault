import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { listItemsByType } from '../lib/item-helpers.js';
import { unlockCliVault } from '../lib/vault-context.js';

export interface SshKeyPayload {
  label: string;
  publicKeyPem: string;
  privateKeyPem: string;
}

/**
 * Generates and stores an Ed25519 keypair. This is key generation + encrypted
 * storage only — not a full ssh-agent bridge (no SSH_AUTH_SOCK protocol
 * implementation). See SPECIFICATION.md roadmap notes for the deferred
 * agent-bridging scope.
 */
export async function sshGenerateCommand(label: string): Promise<void> {
  const { vault } = await unlockCliVault();

  const existing = (await listItemsByType<SshKeyPayload>(vault, 'sshkey')).find(
    (item) => item.payload.label === label,
  );
  if (existing) {
    console.error(`An SSH key labeled "${label}" already exists.`);
    process.exitCode = 1;
    return;
  }

  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  await vault.createItem<SshKeyPayload>('sshkey', {
    label,
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
  });

  console.log(`Generated Ed25519 key "${label}". Public key:\n`);
  console.log(publicKey);
}

export async function sshListCommand(): Promise<void> {
  const { vault } = await unlockCliVault();
  const items = await listItemsByType<SshKeyPayload>(vault, 'sshkey');
  if (items.length === 0) {
    console.log('No SSH keys stored.');
    return;
  }
  for (const { payload } of items) {
    console.log(payload.label);
  }
}

export async function sshShowCommand(
  label: string,
  options: { exportPrivate?: string },
): Promise<void> {
  const { vault } = await unlockCliVault();
  const existing = (await listItemsByType<SshKeyPayload>(vault, 'sshkey')).find(
    (item) => item.payload.label === label,
  );
  if (!existing) {
    console.error(`No SSH key labeled "${label}".`);
    process.exitCode = 1;
    return;
  }

  console.log(existing.payload.publicKeyPem);

  if (options.exportPrivate) {
    writeFileSync(options.exportPrivate, existing.payload.privateKeyPem, { mode: 0o600 });
    console.log(`Private key written to ${options.exportPrivate} (mode 600).`);
  }
}
