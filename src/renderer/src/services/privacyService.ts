import { clearAllHistory, getStoredHistory } from './historyStorage';

const STORAGE_KEY_PRIVACY_MODE = 'aegis_privacy_mode';
export const EVENT_PRIVACY_MODE_CHANGE = 'aegis-privacy-mode-change';

export function getPrivacyModeStatus(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_PRIVACY_MODE) === 'true';
  } catch {
    return false;
  }
}

export function clearBrowserCookies(): number {
  let count = 0;
  try {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        // Expire cookie across root and domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        count++;
      }
    }
  } catch (err) {
    console.warn('Cookie clearing warning:', err);
  }
  return count;
}

export function clearSessionData(): void {
  try {
    sessionStorage.clear();
  } catch (err) {
    console.warn('Session clear warning:', err);
  }
}

export function togglePrivacyMode(forceState?: boolean): {
  enabled: boolean;
  historyCleared: boolean;
  cookiesCleared: boolean;
  clearedCookiesCount: number;
} {
  const current = getPrivacyModeStatus();
  const nextState = typeof forceState === 'boolean' ? forceState : !current;

  let historyCleared = false;
  let cookiesCleared = false;
  let clearedCookiesCount = 0;

  try {
    localStorage.setItem(STORAGE_KEY_PRIVACY_MODE, String(nextState));

    if (nextState) {
      // Privacy Mode Activated: Wipe all browsing history and cookies immediately
      clearAllHistory();
      historyCleared = true;

      clearedCookiesCount = clearBrowserCookies();
      cookiesCleared = true;

      clearSessionData();
    }

    // Notify all components across the app
    window.dispatchEvent(
      new CustomEvent(EVENT_PRIVACY_MODE_CHANGE, {
        detail: {
          enabled: nextState,
          historyCleared,
          cookiesCleared,
          timestamp: Date.now(),
        },
      })
    );
  } catch (err) {
    console.error('Failed to toggle privacy mode:', err);
  }

  return {
    enabled: nextState,
    historyCleared,
    cookiesCleared,
    clearedCookiesCount,
  };
}
