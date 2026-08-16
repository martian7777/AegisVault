import { useState } from 'react';

export type MarketingTab = 'overview' | 'features' | 'security' | 'pricing' | 'faq';

interface NavbarProps {
  currentTab: MarketingTab;
  onSelectTab: (tab: MarketingTab) => void;
  onLaunchVault: () => void;
}

export function Navbar({ currentTab, onSelectTab, onLaunchVault }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleTabClick(tab: MarketingTab) {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  }

  function handleLaunchClick() {
    onLaunchVault();
    setMobileMenuOpen(false);
  }

  return (
    <header className="navbar-sticky">
      <div className="nav-container">
        <button
          type="button"
          className="nav-brand"
          onClick={() => handleTabClick('overview')}
          aria-label="AegisVault Home"
        >
          <div className="brand-icon">
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <span className="brand-title">AegisVault</span>
          <span className="brand-badge">Sovereign v1.0</span>
        </button>

        {/* Desktop Navigation */}
        <nav>
          <ul className="nav-links">
            <li>
              <button
                type="button"
                className={`nav-link-btn ${currentTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabClick('overview')}
              >
                Overview
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link-btn ${currentTab === 'features' ? 'active' : ''}`}
                onClick={() => handleTabClick('features')}
              >
                Features
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link-btn ${currentTab === 'security' ? 'active' : ''}`}
                onClick={() => handleTabClick('security')}
              >
                Security Whitepaper
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link-btn ${currentTab === 'pricing' ? 'active' : ''}`}
                onClick={() => handleTabClick('pricing')}
              >
                Open Source & Pricing
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link-btn ${currentTab === 'faq' ? 'active' : ''}`}
                onClick={() => handleTabClick('faq')}
              >
                FAQ & Docs
              </button>
            </li>
          </ul>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="btn-primary desktop-only"
            onClick={handleLaunchClick}
            id="nav-launch-vault-btn"
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Launch Vault
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-menu">
          <button
            type="button"
            className={`mobile-nav-link ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabClick('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${currentTab === 'features' ? 'active' : ''}`}
            onClick={() => handleTabClick('features')}
          >
            Features
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${currentTab === 'security' ? 'active' : ''}`}
            onClick={() => handleTabClick('security')}
          >
            Security Whitepaper
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${currentTab === 'pricing' ? 'active' : ''}`}
            onClick={() => handleTabClick('pricing')}
          >
            Open Source & Pricing
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${currentTab === 'faq' ? 'active' : ''}`}
            onClick={() => handleTabClick('faq')}
          >
            FAQ & Docs
          </button>

          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={handleLaunchClick}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              🔒 Launch Web Vault
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
