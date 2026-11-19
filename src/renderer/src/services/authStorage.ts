import { UserAccount, DatabaseConfig } from '../types';

const STORAGE_KEY_USER = 'aegis_auth_user';
const STORAGE_KEY_EXPLICIT_LOGIN = 'aegis_auth_explicit_login';
const STORAGE_KEY_GUEST_SESSION = 'aegis_auth_guest_session';
const STORAGE_KEY_PROMPT_PREFERENCE = 'aegis_auth_prompt_preference';
const STORAGE_KEY_DB_CONFIG = 'aegis_db_config';
const STORAGE_KEY_ACCOUNTS = 'aegis_registered_accounts';

export const ADMIN_ACCOUNT: UserAccount = {
  uid: 'usr-admin-narendra',
  name: 'Narendra Borhade',
  email: 'narendra.via.mail@gmail.com',
  role: 'Lead Security Architect & Administrator',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  registeredAt: '2026-01-15T08:00:00.000Z',
  databaseProvider: 'local',
  bookmarkedUrls: [
    'https://cloudflare.com',
    'https://eutils.ncbi.nlm.nih.gov',
    'https://arxiv.org',
    'https://dns.google',
  ],
  searchHistory: [
    'AlphaFold 3 structure predictions',
    'DNSSEC cryptographic validation',
    'Zero-Trust Web Isolation architecture',
  ],
  threatsBlockedCount: 142,
};

// Backwards compatibility reference (do NOT use as default active user)
export const DEFAULT_USER: UserAccount = ADMIN_ACCOUNT;

const DEFAULT_DB_CONFIG: DatabaseConfig = {
  activeEngine: 'local',
  mongoConfig: {
    // 🛡️ Sentinel: Removed hardcoded MongoDB URI secret to prevent exposure. Uses env var.
    uri: import.meta.env.VITE_MONGO_URI || '',
    databaseName: 'aegis_safe_search',
    isConnected: false,
  },
  firebaseConfig: {
    // 🛡️ Sentinel: Removed hardcoded Firebase API key to prevent exposure. Uses env var.
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: 'aegis-safe-browser.firebaseapp.com',
    projectId: 'aegis-safe-browser-2026',
    firestoreDatabaseId: '(default)',
    isConnected: false,
  },
  cloudflareConfig: {
    accountId: 'cf_acc_9837a1b490f288ec',
    d1DatabaseId: 'd1-db-948194-cf-prod',
    d1DatabaseName: 'aegis_auth_d1_vault',
    // 🛡️ Sentinel: Removed hardcoded Cloudflare token to prevent exposure. Uses env var.
    apiToken: import.meta.env.VITE_CLOUDFLARE_API_TOKEN || '',
    kvNamespaceId: 'AEGIS_AUTH_KV_TOKENS',
    turnstileSiteKey: '0x4AAAAAAATurnstileDemoSiteKey',
    isConnected: true,
    edgePoP: 'BOM / IAD (Anycast Edge)',
    rayId: '87bf9a40291fc0d1',
  },
};

/**
 * Returns the currently authenticated user.
 * ZERO-LEAK SECURITY: The administrator's account (Narendra Borhade) is NEVER
 * automatically opened for regular browser sessions or visitors.
 * Visitors must browse as Guest or sign in with their OWN account.
 */
export function getStoredUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;

    const parsed: UserAccount = JSON.parse(raw);

    // CRITICAL: Prevent Narendra Borhade's admin account from auto-opening for regular browsing
    if (parsed?.email === 'narendra.via.mail@gmail.com' || parsed?.uid?.includes('narendra')) {
      // Purge admin account from standard startup session
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_EXPLICIT_LOGIN);
      return null;
    }

    const isExplicit = localStorage.getItem(STORAGE_KEY_EXPLICIT_LOGIN);
    if (isExplicit !== 'true') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: UserAccount | null, isExplicit = true): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      if (isExplicit) {
        localStorage.setItem(STORAGE_KEY_EXPLICIT_LOGIN, 'true');
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_EXPLICIT_LOGIN);
    }
  } catch (err) {
    console.error('Failed to save user:', err);
  }
}

export function isGuestModeActive(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY_GUEST_SESSION) === 'true';
  } catch {
    return false;
  }
}

export function setGuestModeActive(active: boolean): void {
  try {
    if (active) {
      sessionStorage.setItem(STORAGE_KEY_GUEST_SESSION, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_GUEST_SESSION);
    }
  } catch (err) {
    console.error(err);
  }
}

export function createGuestAccount(): UserAccount {
  setGuestModeActive(true);
  return {
    uid: `usr-guest-${Date.now()}`,
    name: 'Guest User',
    email: 'guest@aegis.local',
    role: 'Guest (Zero-Trace Sandbox)',
    registeredAt: new Date().toISOString(),
    databaseProvider: 'local',
    bookmarkedUrls: [],
    searchHistory: [],
    threatsBlockedCount: 0,
  };
}

export function getAuthPromptPreference(): 'always' | 'session' {
  try {
    const val = localStorage.getItem(STORAGE_KEY_PROMPT_PREFERENCE);
    return val === 'always' ? 'always' : 'session';
  } catch {
    return 'session';
  }
}

export function setAuthPromptPreference(pref: 'always' | 'session'): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROMPT_PREFERENCE, pref);
  } catch (err) {
    console.error(err);
  }
}

/**
 * Sign in using personal Gmail address.
 * NEVER defaults to Narendra Borhade's admin account.
 * Creates and logs into a dedicated session for the user's OWN email.
 */
export function loginWithGmail(email: string, name?: string): UserAccount {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
    throw new Error('Please enter a valid personal Gmail address (e.g. yourname@gmail.com).');
  }

  // Derive human-readable name from the user's email
  const derivedName =
    name ||
    trimmedEmail
      .split('@')[0]
      .split(/[._-]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ') ||
    'Google User';

  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);

  if (existing) {
    saveStoredUser(existing, true);
    setGuestModeActive(false);
    return existing;
  }

  const newUser: UserAccount = {
    uid: `usr-gmail-${Date.now()}`,
    name: derivedName,
    email: trimmedEmail,
    role: 'Gmail Verified User',
    registeredAt: new Date().toISOString(),
    databaseProvider: getStoredDbConfig().activeEngine,
    bookmarkedUrls: ['https://cloudflare.com', 'https://google.com'],
    searchHistory: ['Initial Google/Gmail Safe Session'],
    threatsBlockedCount: 0,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedEmail)}`,
  };

  accounts.push(newUser);
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error(err);
  }

  saveStoredUser(newUser, true);
  setGuestModeActive(false);
  return newUser;
}

export function logoutAll(): void {
  saveStoredUser(null, false);
  setGuestModeActive(false);
}

export function getStoredDbConfig(): DatabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB_CONFIG);
    if (raw) return JSON.parse(raw);
    return DEFAULT_DB_CONFIG;
  } catch {
    return DEFAULT_DB_CONFIG;
  }
}

export function saveStoredDbConfig(config: DatabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_DB_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save DB config:', err);
  }
}

export function getRegisteredAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (raw) {
      const list: UserAccount[] = JSON.parse(raw);
      return Array.isArray(list)
        ? list.filter((a) => a.email !== 'narendra.via.mail@gmail.com' && !a.uid?.includes('narendra'))
        : [];
    }
    return [];
  } catch {
    return [];
  }
}

export function registerNewUser(name: string, email: string, passwordHash: string): UserAccount {
  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email address already exists in the database.');
  }

  const newUser: UserAccount = {
    uid: `usr-${Date.now()}`,
    name,
    email,
    role: 'Cyber Analyst User',
    registeredAt: new Date().toISOString(),
    databaseProvider: getStoredDbConfig().activeEngine,
    bookmarkedUrls: ['https://cloudflare.com', 'https://ncbi.nlm.nih.gov'],
    searchHistory: ['Safe Web Search initialized'],
    threatsBlockedCount: 0,
  };

  accounts.push(newUser);
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error(err);
  }

  saveStoredUser(newUser, true);
  setGuestModeActive(false);
  return newUser;
}

export function loginUser(email: string): UserAccount {
  const accounts = getRegisteredAccounts();
  const match = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!match) {
    throw new Error('No registered account matching this email was found. Please register or sign in with your Gmail.');
  }
  saveStoredUser(match, true);
  setGuestModeActive(false);
  return match;
}

/**
 * Dedicated Administrator Authentication for Narendra Borhade.
 * Strictly requires the master admin security key.
 */
export function loginAsAdmin(adminKey: string): UserAccount {
  const clean = adminKey.trim();
  // 🛡️ Sentinel: Removed hardcoded Admin key. Validates using securely injected env var.
  const adminSecret = import.meta.env.VITE_ADMIN_SECRET_KEY;
  if (adminSecret && clean === adminSecret) {
    saveStoredUser(ADMIN_ACCOUNT, true);
    setGuestModeActive(false);
    return ADMIN_ACCOUNT;
  }
  throw new Error('Invalid Administrator Security Key.');
}

export function incrementThreatBlocked(): number {
  const user = getStoredUser();
  if (user) {
    user.threatsBlockedCount = (user.threatsBlockedCount || 0) + 1;
    saveStoredUser(user, true);
    return user.threatsBlockedCount;
  }
  return 1;
}
