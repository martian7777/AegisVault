/**
 * Encodes/decodes an RTCSessionDescription as a copy-paste-safe blob. This
 * is the entire "signaling channel" — there is no server involved. The
 * offering device shows this text (or a QR code of it, in a later
 * increment) to the joining device, and the answer travels back the same
 * way. Base64-wrapping avoids whitespace-collapsing mishaps when the text
 * passes through chat apps, email, or a plain textarea.
 */
export function encodeSignal(description: RTCSessionDescriptionInit): string {
  return btoa(JSON.stringify(description));
}

export function decodeSignal(text: string): RTCSessionDescriptionInit {
  return JSON.parse(atob(text.trim())) as RTCSessionDescriptionInit;
}
