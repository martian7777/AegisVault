const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

/** Calls `onIdle` after `timeoutMs` of no user activity. Returns a cleanup function. */
export function startIdleTimer(timeoutMs: number, onIdle: () => void): () => void {
  let handle: ReturnType<typeof setTimeout>;

  const reset = () => {
    clearTimeout(handle);
    handle = setTimeout(onIdle, timeoutMs);
  };

  for (const event of ACTIVITY_EVENTS) {
    window.addEventListener(event, reset, { passive: true });
  }
  reset();

  return () => {
    clearTimeout(handle);
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, reset);
    }
  };
}
