export function waitForOpen(channel: RTCDataChannel): Promise<void> {
  if (channel.readyState === 'open') return Promise.resolve();
  return new Promise((resolve) => {
    channel.addEventListener('open', () => resolve(), { once: true });
  });
}

export function sendJSON(channel: RTCDataChannel, data: unknown): void {
  channel.send(JSON.stringify(data));
}

/** Returns an unsubscribe function. */
export function onJSON<T>(channel: RTCDataChannel, handler: (data: T) => void): () => void {
  const listener = (event: MessageEvent) => {
    handler(JSON.parse(event.data as string) as T);
  };
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}
