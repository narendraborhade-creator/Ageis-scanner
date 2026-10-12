import { UserAccount, DatabaseConfig } from '../types';

const STORAGE_KEY_USER = 'aegis_auth_user';
const STORAGE_KEY_DB_CONFIG = 'aegis_db_config';
const STORAGE_KEY_ACCOUNTS = 'aegis_registered_accounts';

const DEFAULT_USER: UserAccount = {
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

export function getStoredUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
    // Seed default admin account
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}

export function saveStoredUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch (err) {
    console.error('Failed to save user:', err);
  }
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

  saveStoredUser(newUser);
  return newUser;
}

export function loginUser(email: string): UserAccount {
  const accounts = getRegisteredAccounts();
  const match = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!match) {
    // If Narendra Borhade email is entered, always allow
    if (email.toLowerCase().includes('narendra')) {
      saveStoredUser(DEFAULT_USER);
      return DEFAULT_USER;
    }
    throw new Error('No registered account matching this email was found. Please register first.');
  }
  saveStoredUser(match);
  return match;
}

export function incrementThreatBlocked(): number {
  const user = getStoredUser();
  if (user) {
    user.threatsBlockedCount = (user.threatsBlockedCount || 0) + 1;
    saveStoredUser(user);
    return user.threatsBlockedCount;
  }
  return 1;
}
