import { describe, expect, it } from 'vitest';
import { decodeSignal, encodeSignal } from '../src/signal-codec.js';

/**
 * Real RTCPeerConnection handshakes (createOffer/acceptOffer/completeConnection)
 * need an actual browser WebRTC stack — there's no realistic Node/jsdom
 * polyfill for ICE/DTLS worth trusting, so faking that here would just
 * produce false confidence. That path is verified with a real two-page
 * Playwright run instead (see the manual verification in the session
 * notes/PR description). This file covers the one piece that's pure logic:
 * the copy-paste signal encoding.
 */
describe('encodeSignal / decodeSignal', () => {
  it('round-trips an SDP-shaped description', () => {
    const description: RTCSessionDescriptionInit = {
      type: 'offer',
      sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
    };
    const encoded = encodeSignal(description);
    expect(decodeSignal(encoded)).toEqual(description);
  });

  it('tolerates surrounding whitespace from copy-paste', () => {
    const description: RTCSessionDescriptionInit = { type: 'answer', sdp: 'v=0\r\n' };
    const encoded = encodeSignal(description);
    expect(decodeSignal(`  \n${encoded}\n  `)).toEqual(description);
  });

  it('produces a plain base64 string with no embedded newlines', () => {
    const encoded = encodeSignal({
      type: 'offer',
      sdp: 'a=candidate:1 1 UDP 1 1.2.3.4 5\r\n'.repeat(20),
    });
    expect(encoded).not.toContain('\n');
    expect(/^[A-Za-z0-9+/=]+$/.test(encoded)).toBe(true);
  });
});
