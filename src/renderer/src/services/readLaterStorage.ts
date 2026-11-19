import { ReadLaterItem } from '../types';
import { getPrivacyModeStatus } from './privacyService';

const STORAGE_KEY = 'aegis_read_later_queue';
export const EVENT_READ_LATER_CHANGE = 'aegis-read-later-change';

const DEFAULT_READ_LATER: ReadLaterItem[] = [
  {
    id: 'rl-cf-quantum',
    title: 'Cloudflare: Post-Quantum Cryptography & ML-KEM Key Exchange',
    url: 'https://cloudflare.com/learning/security/post-quantum-cryptography',
    domain: 'cloudflare.com',
    excerpt: 'Detailed analysis of NIST-approved post-quantum algorithms and how Kyber/ML-KEM secures TLS handshakes against future quantum attacks.',
    savedAt: new Date(Date.now() - 3600000 * 4).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timestamp: Date.now() - 3600000 * 4,
    readTimeMinutes: 5,
    isRead: false,
    category: 'Security',
    threatStatus: 'clean',
    tags: ['Post-Quantum', 'NIST', 'Cryptography'],
  },
  {
    id: 'rl-ncbi-alphafold',
    title: 'Nature: Accurate structure prediction of biomolecular interactions with AlphaFold 3',
    url: 'https://ncbi.nlm.nih.gov/pmc/articles/PMC11114973/',
    domain: 'ncbi.nlm.nih.gov',
    excerpt: 'Deep learning breakthroughs allowing joint prediction of proteins, nucleic acids, small molecules, and chemical modifications with atomic precision.',
    savedAt: new Date(Date.now() - 3600000 * 18).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timestamp: Date.now() - 3600000 * 18,
    readTimeMinutes: 8,
    isRead: false,
    category: 'Research',
    threatStatus: 'clean',
    tags: ['Biology', 'AlphaFold', 'Peer-Reviewed'],
  },
  {
    id: 'rl-github-csp',
    title: 'GitHub Engineering: Mitigating XSS with Strict Content Security Policy',
    url: 'https://github.com/blog/strict-csp-mitigations',
    domain: 'github.com',
    excerpt: 'A comprehensive study on deploying nonce-based CSP level 3 across high-traffic single-page applications without breaking modern dynamic widgets.',
    savedAt: new Date(Date.now() - 3600000 * 48).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timestamp: Date.now() - 3600000 * 48,
    readTimeMinutes: 6,
    isRead: true,
    category: 'Technology',
    threatStatus: 'clean',
    tags: ['WebSec', 'CSP', 'FrontEnd'],
  },
];

function notifyChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_READ_LATER_CHANGE));
  }
}

export function getStoredReadLaterList(): ReadLaterItem[] {
  if (getPrivacyModeStatus()) {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_READ_LATER));
      return DEFAULT_READ_LATER;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_READ_LATER;
  } catch (err) {
    console.error('Failed to read from read-later localStorage:', err);
    return DEFAULT_READ_LATER;
  }
}

export function addReadLaterItem(item: Omit<ReadLaterItem, 'id' | 'savedAt' | 'timestamp' | 'isRead'> & { excerpt?: string; readTimeMinutes?: number }): ReadLaterItem {
  const current = getStoredReadLaterList();
  
  // Check if item already exists by URL
  const existingIdx = current.findIndex(
    (i) => i.url.toLowerCase().trim() === item.url.toLowerCase().trim()
  );

  const newItem: ReadLaterItem = {
    id: existingIdx >= 0 ? current[existingIdx].id : `rl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: item.title || item.domain,
    url: item.url,
    domain: item.domain,
    excerpt: item.excerpt || `Saved from ${item.domain} for distraction-free reading later.`,
    savedAt: new Date().toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timestamp: Date.now(),
    readTimeMinutes: item.readTimeMinutes || Math.floor(Math.random() * 4) + 3,
    isRead: false,
    category: item.category || 'General',
    threatStatus: item.threatStatus || 'clean',
    tags: item.tags || [item.domain],
  };

  let updated: ReadLaterItem[];
  if (existingIdx >= 0) {
    // Update existing item to unread and move to top
    updated = [newItem, ...current.filter((_, idx) => idx !== existingIdx)];
  } else {
    updated = [newItem, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  } catch (err) {
    console.error('Failed to persist to read later queue:', err);
  }

  return newItem;
}

export function toggleReadLaterItemStatus(id: string): boolean {
  const current = getStoredReadLaterList();
  let nextState = false;
  const updated = current.map((item) => {
    if (item.id === id) {
      nextState = !item.isRead;
      return { ...item, isRead: nextState };
    }
    return item;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  } catch (err) {
    console.error('Failed to toggle read state:', err);
  }

  return nextState;
}

export function deleteReadLaterItem(id: string): void {
  const current = getStoredReadLaterList();
  const updated = current.filter((item) => item.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  } catch (err) {
    console.error('Failed to delete read later item:', err);
  }
}

export function clearCompletedReadLater(): void {
  const current = getStoredReadLaterList();
  const updated = current.filter((item) => !item.isRead);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();
  } catch (err) {
    console.error('Failed to clear completed items:', err);
  }
}

export function clearAllReadLater(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    notifyChange();
  } catch (err) {
    console.error('Failed to clear read later queue:', err);
  }
}

export function isUrlInReadLater(url: string): boolean {
  const current = getStoredReadLaterList();
  return current.some((item) => item.url.toLowerCase().trim() === url.toLowerCase().trim() && !item.isRead);
}
