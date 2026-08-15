import { useRef, useState } from 'react';
import { cryptoWorker } from '../../lib/worker-client.js';

export function ExportImportPanel({ onImported }: { onImported: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    const backup = await cryptoWorker.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegisvault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Encrypted backup downloaded.');
  }

  async function handleImportFile(file: File) {
    setError(null);
    setStatus(null);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await cryptoWorker.importBackup(backup);
      setStatus('Vault restored. Please unlock again.');
      onImported();
    } catch {
      setError('Could not import this backup file.');
    }
  }

  return (
    <div className="panel">
      <h1>Backup</h1>
      <p className="hint-text">
        Everything in this file is already encrypted — it contains no plaintext, only ciphertext and
        non-secret key-derivation parameters.
      </p>
      <div className="row-gap">
        <button type="button" className="secondary" onClick={handleExport}>
          Export encrypted backup
        </button>
        <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {status && <p className="hint-text">{status}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
