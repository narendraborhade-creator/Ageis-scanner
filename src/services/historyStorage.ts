import { BrowserHistoryItem } from '../types';

const STORAGE_KEY_HISTORY = 'aegis_browser_history';

const INITIAL_HISTORY: BrowserHistoryItem[] = [
  {
    id: 'hist-1',
    url: 'https://github.com',
    title: 'GitHub: Where the world builds software',
    domain: 'github.com',
    timestamp: '11:04 PM',
    date: 'Today',
    isHttps: true,
    threatStatus: 'clean',
    securityScore: 96,
  },
  {
    id: 'hist-2',
    url: 'https://cloudflare.com',
    title: 'Cloudflare: Web Security & DNS',
    domain: 'cloudflare.com',
    timestamp: '10:58 PM',
    date: 'Today',
    isHttps: true,
    threatStatus: 'clean',
    securityScore: 98,
  },
  {
    id: 'hist-3',
    url: 'https://ncbi.nlm.nih.gov',
    title: 'National Center for Biotechnology (NCBI)',
    domain: 'ncbi.nlm.nih.gov',
    timestamp: '10:45 PM',
    date: 'Today',
    isHttps: true,
    threatStatus: 'clean',
    securityScore: 94,
  },
  {
    id: 'hist-4',
    url: 'http://paypal-security-login-verification.xyz/account/signin',
    title: 'Deceptive Phishing Gateway (Quarantined)',
    domain: 'paypal-security-login-verification.xyz',
    timestamp: '10:42 PM',
    date: 'Today',
    isHttps: false,
    threatStatus: 'blocked',
    securityScore: 15,
  },
];

export function getStoredHistory(): BrowserHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Seed initial history
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(INITIAL_HISTORY));
    return INITIAL_HISTORY;
  } catch {
    return INITIAL_HISTORY;
  }
}

export function addHistoryItem(
  item: Omit<BrowserHistoryItem, 'id' | 'timestamp' | 'date'>
): BrowserHistoryItem[] {
  try {
    // Zero-trace check: If Privacy Mode is active, do not record history to disk
    if (localStorage.getItem('aegis_privacy_mode') === 'true') {
      return [];
    }

    const history = getStoredHistory();
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const newItem: BrowserHistoryItem = {
      ...item,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      date,
    };

    // Filter out previous consecutive duplicate of the same URL to keep history clean
    const filtered = history.filter((h) => h.url !== item.url);
    const updated = [newItem, ...filtered].slice(0, 150);

    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to add history item:', err);
    return getStoredHistory();
  }
}

export function deleteHistoryItem(id: string): BrowserHistoryItem[] {
  try {
    const history = getStoredHistory();
    const updated = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    return updated;
  } catch {
    return getStoredHistory();
  }
}

export function clearAllHistory(): BrowserHistoryItem[] {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}
