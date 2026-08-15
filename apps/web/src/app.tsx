import { useEffect } from 'react';
import { OnboardingScreen } from './features/onboarding/OnboardingScreen.js';
import { UnlockScreen } from './features/unlock/UnlockScreen.js';
import { VaultScreen } from './features/vault/VaultScreen.js';
import { startIdleTimer } from './lib/idle-timer.js';
import { cryptoWorker } from './lib/worker-client.js';
import { useSessionStore } from './stores/session-store.js';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export function App() {
  const lockState = useSessionStore((s) => s.lockState);
  const setLockState = useSessionStore((s) => s.setLockState);

  useEffect(() => {
    let cancelled = false;
    void cryptoWorker.hasVault().then((hasVault) => {
      if (cancelled) return;
      setLockState(hasVault ? 'locked' : 'onboarding-required');
    });
    return () => {
      cancelled = true;
    };
  }, [setLockState]);

  useEffect(() => {
    if (lockState !== 'unlocked') return;
    return startIdleTimer(IDLE_TIMEOUT_MS, () => {
      void cryptoWorker.lock().then(() => setLockState('locked'));
    });
  }, [lockState, setLockState]);

  if (lockState === 'checking') {
    return <div className="app-shell" />;
  }

  if (lockState === 'onboarding-required') {
    return <OnboardingScreen onOnboarded={() => setLockState('unlocked')} />;
  }

  if (lockState === 'locked') {
    return <UnlockScreen onUnlocked={() => setLockState('unlocked')} />;
  }

  return <VaultScreen onLocked={() => setLockState('locked')} />;
}
