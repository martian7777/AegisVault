import { create } from 'zustand';

export type LockState = 'checking' | 'onboarding-required' | 'locked' | 'unlocked';

/**
 * UI-only state. The decrypted vault itself never lives here — it stays
 * inside the crypto worker, session-scoped, and is wiped on lock.
 */
interface SessionState {
  lockState: LockState;
  setLockState: (state: LockState) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  lockState: 'checking',
  setLockState: (lockState) => set({ lockState }),
}));
