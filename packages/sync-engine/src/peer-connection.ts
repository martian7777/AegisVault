import { decodeSignal, encodeSignal } from './signal-codec.js';

/**
 * Public STUN servers only help two devices discover their own reachable
 * address for NAT traversal — they never see or relay vault data (the data
 * channel itself is direct peer-to-peer, DTLS-encrypted, and the payload is
 * already application-layer ciphertext regardless). There is no TURN
 * fallback: on a restrictive NAT that STUN can't traverse, pairing will
 * fail. That's a documented MVP limitation, not a silent one — see
 * SECURITY.md.
 */
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

const DATA_CHANNEL_LABEL = 'aegisvault-sync';

/**
 * Bounds how long we wait for ICE gathering before reading out whatever
 * candidates exist so far. Waiting for a literal 'complete' state blocks on
 * *every* configured ICE server responding, including the STUN server — on
 * a network that blocks outbound UDP to it (some corporate/CI networks do,
 * even with normal HTTPS egress working fine), gathering would otherwise
 * hang far longer than a human pairing two devices would ever wait. Host
 * candidates (same-network / same-machine reachability) are typically
 * gathered almost instantly regardless, so a short bound is enough for the
 * common case and fails fast for the STUN-blocked case instead of hanging.
 */
const ICE_GATHERING_TIMEOUT_MS = 4000;

function waitForIceGathering(connection: RTCPeerConnection): Promise<void> {
  if (connection.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(finish, ICE_GATHERING_TIMEOUT_MS);
    function check() {
      if (connection.iceGatheringState === 'complete') finish();
    }
    function finish() {
      clearTimeout(timer);
      connection.removeEventListener('icegatheringstatechange', check);
      resolve();
    }
    connection.addEventListener('icegatheringstatechange', check);
  });
}

/**
 * Resolves once the remote peer's data channel arrives. Only meaningful on
 * the answering side, and only *after* the offering side has received the
 * answer and completed its half of the handshake — which is exactly why
 * `acceptOffer` must not await this itself (see below).
 */
export function waitForDataChannel(connection: RTCPeerConnection): Promise<RTCDataChannel> {
  return new Promise((resolve) => {
    connection.addEventListener('datachannel', (event) => resolve(event.channel), { once: true });
  });
}

/**
 * Starts a pairing session as the "offering" side. There's no trickle ICE
 * over a live signaling channel here — we wait for ICE gathering to finish
 * so all candidates are embedded in one copy-pasteable offer blob.
 */
export async function createOffer(): Promise<{
  connection: RTCPeerConnection;
  channel: RTCDataChannel;
  offerText: string;
}> {
  const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const channel = connection.createDataChannel(DATA_CHANNEL_LABEL);

  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  await waitForIceGathering(connection);

  if (!connection.localDescription) {
    throw new Error('Failed to gather a local description for the offer.');
  }
  return { connection, channel, offerText: encodeSignal(connection.localDescription) };
}

/**
 * Joins a pairing session as the "answering" side, given the offer text.
 *
 * Deliberately does NOT wait for the remote data channel to arrive before
 * returning: that event only fires once the *offering* side has received
 * this answer (via `completeConnection`) and finished its own half of the
 * handshake — waiting for it here would deadlock, since the answer text
 * this function returns is exactly what the offering side needs to reach
 * that point. Callers should display `answerText` immediately and await
 * `waitForDataChannel(connection)` separately, in parallel with the other
 * device completing the round trip.
 */
export async function acceptOffer(
  offerText: string,
): Promise<{ connection: RTCPeerConnection; answerText: string }> {
  const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  await connection.setRemoteDescription(decodeSignal(offerText));
  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);
  await waitForIceGathering(connection);

  if (!connection.localDescription) {
    throw new Error('Failed to gather a local description for the answer.');
  }
  return { connection, answerText: encodeSignal(connection.localDescription) };
}

/** Completes the handshake on the offering side once the answer text comes back. */
export async function completeConnection(
  connection: RTCPeerConnection,
  answerText: string,
): Promise<void> {
  await connection.setRemoteDescription(decodeSignal(answerText));
}
