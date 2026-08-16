import { useEffect, useState } from 'react';
import { Footer } from './features/marketing/Footer.js';
import {
  FaqView,
  FeaturesView,
  OverviewView,
  PricingView,
  SecurityView,
} from './features/marketing/MarketingViews.js';
import { type MarketingTab, Navbar } from './features/marketing/Navbar.js';
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

  // Marketing view tabs or Vault App active mode
  const [activeTab, setActiveTab] = useState<MarketingTab>('overview');
  const [inAppMode, setInAppMode] = useState(false);

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

  // Launch Vault App handler
  function handleLaunchVault() {
    setInAppMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Return to Marketing Website
  function handleBackToMarketing() {
    setInAppMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Switch marketing tab
  function handleSelectTab(tab: MarketingTab) {
    setInAppMode(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // If user is inside the Password Manager App
  if (inAppMode) {
    if (lockState === 'checking') {
      return (
        <div className="app-shell">
          <div style={{ color: 'var(--cyan-glow)', fontFamily: 'var(--font-mono)' }}>
            Initializing Sovereign Cryptographic Sandbox...
          </div>
        </div>
      );
    }

    if (lockState === 'onboarding-required') {
      return (
        <OnboardingScreen
          onOnboarded={() => setLockState('unlocked')}
          onBackToMarketing={handleBackToMarketing}
        />
      );
    }

    if (lockState === 'locked') {
      return (
        <UnlockScreen
          onUnlocked={() => setLockState('unlocked')}
          onBackToMarketing={handleBackToMarketing}
        />
      );
    }

    return (
      <VaultScreen
        onLocked={() => setLockState('locked')}
        onBackToMarketing={handleBackToMarketing}
      />
    );
  }

  // Otherwise, render full Marketing Experience with Navbar and Footer
  return (
    <div className="page-wrapper">
      <Navbar
        currentTab={activeTab}
        onSelectTab={handleSelectTab}
        onLaunchVault={handleLaunchVault}
      />

      <main>
        {activeTab === 'overview' && (
          <OverviewView
            onLaunchVault={handleLaunchVault}
            onSelectTab={handleSelectTab}
          />
        )}
        {activeTab === 'features' && (
          <FeaturesView
            onLaunchVault={handleLaunchVault}
            onSelectTab={handleSelectTab}
          />
        )}
        {activeTab === 'security' && (
          <SecurityView
            onLaunchVault={handleLaunchVault}
            onSelectTab={handleSelectTab}
          />
        )}
        {activeTab === 'pricing' && (
          <PricingView
            onLaunchVault={handleLaunchVault}
            onSelectTab={handleSelectTab}
          />
        )}
        {activeTab === 'faq' && (
          <FaqView
            onLaunchVault={handleLaunchVault}
            onSelectTab={handleSelectTab}
          />
        )}
      </main>

      <Footer
        onSelectTab={handleSelectTab}
        onLaunchVault={handleLaunchVault}
      />
    </div>
  );
}
