import { AppSessionState, NavTab, BrowserTab } from '../types';
import { getPrivacyModeStatus } from './privacyService';

const SESSION_STORAGE_KEY = 'aegis_browser_session_state';
const ACCURATE_TABS_MIGRATION_KEY = 'aegis_accurate_tabs_migration_v1';

// Default initial tab: 1 active tab by default (accurate state)
export const DEFAULT_INITIAL_TAB: BrowserTab = {
  id: 'tab-cloudflare',
  title: 'Cloudflare: Web Security & DNS',
  url: 'https://cloudflare.com',
  domain: 'cloudflare.com',
  isHttps: true,
  threatStatus: 'clean',
  trackersBlocked: 6,
  bugsSanitized: 2,
  latencyMs: 24,
  securityScore: 98,
  sslGrade: 'A+',
  isQuarantined: false,
  isPinned: false,
  createdAt: Date.now(),
};

export const DEFAULT_INITIAL_TABS: BrowserTab[] = [DEFAULT_INITIAL_TAB];

export function getStoredSessionState(): AppSessionState | null {
  if (getPrivacyModeStatus()) {
    return null;
  }
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: AppSessionState = JSON.parse(raw);

    // Migration to fix the user's issue: "The tabs are showing three and bookmarks are five, but I haven't done any bookmark and tab, so it should be accurate"
    const migrated = localStorage.getItem(ACCURATE_TABS_MIGRATION_KEY);
    if (!migrated) {
      localStorage.setItem(ACCURATE_TABS_MIGRATION_KEY, 'true');
      if (
        parsed?.browser?.tabs?.length === 3 &&
        parsed.browser.tabs[0]?.id === 'tab-cloudflare' &&
        parsed.browser.tabs[1]?.id === 'tab-github' &&
        parsed.browser.tabs[2]?.id === 'tab-ncbi'
      ) {
        // User had the legacy hardcoded 3 default tabs. Reset to accurate 1 single tab
        parsed.browser.tabs = [DEFAULT_INITIAL_TAB];
        parsed.browser.activeTabId = DEFAULT_INITIAL_TAB.id;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      }
    }

    return parsed;
  } catch (err) {
    console.warn('Failed to parse stored session state:', err);
    return null;
  }
}

let saveTimeout: number | null = null;

export function saveSessionState(partialState: Partial<AppSessionState>): void {
  if (getPrivacyModeStatus()) {
    // Zero-trace privacy active: do not persist session to disk
    return;
  }

  // Debounce saves
  if (saveTimeout) {
    window.clearTimeout(saveTimeout);
  }

  saveTimeout = window.setTimeout(() => {
    try {
      const current = getStoredSessionState() || {
        activeNavTab: 'browser' as NavTab,
        scrollPosition: { x: 0, y: 0 },
        browser: {
          tabs: DEFAULT_INITIAL_TABS,
          activeTabId: DEFAULT_INITIAL_TABS[0].id,
          omnibarInput: 'https://cloudflare.com',
          activeSidebar: 'none',
          recentlyClosedTabs: [],
        },
        dnsTargetDomain: 'cloudflare.com',
        compareSiteA: 'cloudflare.com',
        compareSiteB: 'wikipedia.org',
        scienceQuery: 'AlphaFold structural biology',
        lastSavedAt: Date.now(),
      };

      const merged: AppSessionState = {
        ...current,
        ...partialState,
        browser: {
          ...current.browser,
          ...(partialState.browser || {}),
        },
        scrollPosition: {
          ...current.scrollPosition,
          ...(partialState.scrollPosition || {}),
        },
        lastSavedAt: Date.now(),
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(merged));
    } catch (err) {
      console.warn('Could not save session state to localStorage:', err);
    }
  }, 150);
}

export function clearSessionState(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Could not clear session state:', err);
  }
}

// Helper to restore window scroll with retry to ensure DOM has rendered
export function restoreScrollPosition(y = 0, x = 0): void {
  if (y <= 0 && x <= 0) return;

  const performScroll = () => {
    window.scrollTo({
      top: y,
      left: x,
      behavior: 'smooth',
    });
  };

  performScroll();
  setTimeout(performScroll, 100);
}
