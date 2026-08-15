import {
  acceptOffer,
  completeConnection,
  createOffer,
  onJSON,
  sendJSON,
  waitForDataChannel,
  waitForOpen,
} from '@aegisvault/sync-engine';
import type { VaultBackup } from '@aegisvault/vault-core';
import { useRef, useState } from 'react';
import { cryptoWorker } from '../../lib/worker-client.js';

type SyncMode = 'idle' | 'offering' | 'joining' | 'connected';

/**
 * Direct device-to-device pairing over WebRTC. There is no signaling
 * server: the offer/answer blobs are exchanged by copy-paste (or, in a
 * later increment, a QR code of the same text) between the two devices.
 * Once connected, either side can send its encrypted vault backup — the
 * exact same ciphertext-only VaultBackup shape used for file export/import
 * — directly over the data channel. See SECURITY.md for the STUN-only, no
 * TURN-fallback limitation.
 */
export function SyncPanel({ onImported }: { onImported: () => void }) {
  const [mode, setMode] = useState<SyncMode>('idle');
  const [offerText, setOfferText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [pastedOffer, setPastedOffer] = useState('');
  const [pastedAnswer, setPastedAnswer] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [incomingBackup, setIncomingBackup] = useState<VaultBackup | null>(null);
  const connectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);

  function armChannel(channel: RTCDataChannel) {
    channelRef.current = channel;
    void waitForOpen(channel).then(() => {
      setMode('connected');
      setStatus('Connected.');
    });
    onJSON<VaultBackup>(channel, (backup) => {
      setIncomingBackup(backup);
    });
  }

  async function handleStartPairing() {
    setError(null);
    const { connection, channel, offerText: newOfferText } = await createOffer();
    connectionRef.current = connection;
    setOfferText(newOfferText);
    setMode('offering');
    armChannel(channel);
  }

  async function handleJoinPairing() {
    setError(null);
    try {
      const { connection, answerText: newAnswerText } = await acceptOffer(pastedOffer.trim());
      connectionRef.current = connection;
      setAnswerText(newAnswerText);
      setMode('joining');
      // The remote data channel only arrives once the offering device has
      // pasted this answer back and completed its half of the handshake —
      // that happens on the other device, so this just waits in the
      // background rather than blocking the answer text from being shown.
      void waitForDataChannel(connection).then(armChannel);
    } catch {
      setError('Could not read that offer — check you copied the whole thing.');
    }
  }

  async function handleCompletePairing() {
    if (!connectionRef.current) return;
    setError(null);
    try {
      await completeConnection(connectionRef.current, pastedAnswer.trim());
    } catch {
      setError('Could not read that answer — check you copied the whole thing.');
    }
  }

  async function handleSendVault() {
    if (!channelRef.current) return;
    const backup = await cryptoWorker.exportBackup();
    sendJSON(channelRef.current, backup);
    setStatus('Vault sent to peer.');
  }

  async function handleAcceptIncoming() {
    if (!incomingBackup) return;
    await cryptoWorker.importBackup(incomingBackup);
    setIncomingBackup(null);
    setStatus('Vault imported from peer. Please unlock again.');
    onImported();
  }

  function handleReset() {
    connectionRef.current?.close();
    connectionRef.current = null;
    channelRef.current = null;
    setMode('idle');
    setOfferText('');
    setAnswerText('');
    setPastedOffer('');
    setPastedAnswer('');
    setIncomingBackup(null);
    setError(null);
  }

  return (
    <div className="panel">
      <h1>Device Sync</h1>
      <p className="hint-text">
        Pairs directly with another device over WebRTC — no cloud server ever sees your vault.
        Exchange the offer/answer text below once to connect.
      </p>

      {incomingBackup && (
        <div className="panel">
          <p>A vault was received from the paired device.</p>
          <p className="error-text">Importing replaces everything currently in this vault.</p>
          <div className="row-gap">
            <button type="button" onClick={handleAcceptIncoming}>
              Import and replace my vault
            </button>
            <button type="button" className="secondary" onClick={() => setIncomingBackup(null)}>
              Discard
            </button>
          </div>
        </div>
      )}

      {mode === 'idle' && (
        <div className="row-gap">
          <button type="button" onClick={handleStartPairing}>
            Start pairing
          </button>
          <button type="button" className="secondary" onClick={() => setMode('joining')}>
            Join pairing
          </button>
        </div>
      )}

      {mode === 'offering' && (
        <>
          <div className="field">
            <label htmlFor="offer-text">1. Send this offer to the other device</label>
            <textarea id="offer-text" readOnly value={offerText} rows={4} />
          </div>
          <div className="field">
            <label htmlFor="answer-input">2. Paste the answer from the other device</label>
            <textarea
              id="answer-input"
              value={pastedAnswer}
              onChange={(e) => setPastedAnswer(e.target.value)}
              rows={4}
            />
          </div>
          <div className="row-gap">
            <button type="button" onClick={handleCompletePairing} disabled={!pastedAnswer.trim()}>
              Complete pairing
            </button>
            <button type="button" className="secondary" onClick={handleReset}>
              Cancel
            </button>
          </div>
        </>
      )}

      {mode === 'joining' && !answerText && (
        <>
          <div className="field">
            <label htmlFor="offer-input">Paste the offer from the other device</label>
            <textarea
              id="offer-input"
              value={pastedOffer}
              onChange={(e) => setPastedOffer(e.target.value)}
              rows={4}
            />
          </div>
          <div className="row-gap">
            <button type="button" onClick={handleJoinPairing} disabled={!pastedOffer.trim()}>
              Generate answer
            </button>
            <button type="button" className="secondary" onClick={handleReset}>
              Cancel
            </button>
          </div>
        </>
      )}

      {mode === 'joining' && answerText && (
        <>
          <div className="field">
            <label htmlFor="answer-text">Send this answer back to the other device</label>
            <textarea id="answer-text" readOnly value={answerText} rows={4} />
          </div>
          <p className="hint-text">Waiting for the connection to complete…</p>
          <button type="button" className="secondary" onClick={handleReset}>
            Cancel
          </button>
        </>
      )}

      {mode === 'connected' && (
        <div className="row-gap">
          <button type="button" onClick={handleSendVault}>
            Send my vault to this device
          </button>
          <button type="button" className="secondary" onClick={handleReset}>
            Disconnect
          </button>
        </div>
      )}

      {status && <p className="hint-text">{status}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
