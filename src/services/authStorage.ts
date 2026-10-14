import { UserAccount, DatabaseConfig } from '../types';

const STORAGE_KEY_USER = 'aegis_auth_user';
const STORAGE_KEY_EXPLICIT_LOGIN = 'aegis_auth_explicit_login';
const STORAGE_KEY_GUEST_SESSION = 'aegis_auth_guest_session';
const STORAGE_KEY_PROMPT_PREFERENCE = 'aegis_auth_prompt_preference';
const STORAGE_KEY_DB_CONFIG = 'aegis_db_config';
const STORAGE_KEY_ACCOUNTS = 'aegis_registered_accounts';

export const DEFAULT_USER: UserAccount = {
  uid: 'usr-narendra-001',
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

const DEFAULT_DB_CONFIG: DatabaseConfig = {
  activeEngine: 'local',
  mongoConfig: {
    uri: 'mongodb+srv://user:password@aegis-cluster.mongodb.net/aegis_browser?retryWrites=true&w=majority',
    databaseName: 'aegis_safe_search',
    isConnected: false,
  },
  firebaseConfig: {
    apiKey: 'AIzaSyDemoAegisSecurityKeyForClientValidation',
    authDomain: 'aegis-safe-browser.firebaseapp.com',
    projectId: 'aegis-safe-browser-2026',
    firestoreDatabaseId: '(default)',
    isConnected: false,
  },
  cloudflareConfig: {
    accountId: 'cf_acc_9837a1b490f288ec',
    d1DatabaseId: 'd1-db-948194-cf-prod',
    d1DatabaseName: 'aegis_auth_d1_vault',
    apiToken: 'cf_sec_token_098a83d726b1c94',
    kvNamespaceId: 'AEGIS_AUTH_KV_TOKENS',
    turnstileSiteKey: '0x4AAAAAAATurnstileDemoSiteKey',
    isConnected: true,
    edgePoP: 'BOM / IAD (Anycast Edge)',
    rayId: '87bf9a40291fc0d1',
  },
};

/**
 * Returns the currently authenticated user.
 * STRICT SECURITY: NEVER auto-logs in any default user.
 * Explicit login is strictly required. Legacy auto-seeded sessions are cleared.
 */
export function getStoredUser(): UserAccount | null {
  try {
    const isExplicit = localStorage.getItem(STORAGE_KEY_EXPLICIT_LOGIN);
    const raw = localStorage.getItem(STORAGE_KEY_USER);

    if (!raw || isExplicit !== 'true') {
      // Clear any legacy unverified auto-seed to prevent privacy leaks
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.uid === 'usr-narendra-001' && isExplicit !== 'true') {
            localStorage.removeItem(STORAGE_KEY_USER);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY_USER);
        }
      }
      return null;
    }

    return JSON.parse(raw);
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

export function loginWithGmail(email: string, name?: string): UserAccount {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error('Please enter a valid Gmail address.');
  }

  const accounts = getRegisteredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);

  if (existing) {
    saveStoredUser(existing, true);
    setGuestModeActive(false);
    return existing;
  }

  // If Narendra Borhade email is entered, restore full admin identity
  if (trimmedEmail.includes('narendra')) {
    const adminUser: UserAccount = {
      ...DEFAULT_USER,
      email: trimmedEmail,
    };
    saveStoredUser(adminUser, true);
    setGuestModeActive(false);
    return adminUser;
  }

  // Auto-format readable name from email (e.g. narendra.borhade@gmail.com -> Narendra Borhade)
  const derivedName = name || trimmedEmail
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ') || 'Google User';

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
    if (raw) return JSON.parse(raw);
    return [DEFAULT_USER];
  } catch {
    return [DEFAULT_USER];
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
    // If Narendra Borhade email is entered, allow login
    if (email.toLowerCase().includes('narendra')) {
      saveStoredUser(DEFAULT_USER, true);
      setGuestModeActive(false);
      return DEFAULT_USER;
    }
    throw new Error('No registered account matching this email was found. Please register first.');
  }
  saveStoredUser(match, true);
  setGuestModeActive(false);
  return match;
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
