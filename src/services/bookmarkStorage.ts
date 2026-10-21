import { BookmarkItem } from '../types';

const STORAGE_KEY_BOOKMARKS = 'aegis_browser_bookmarks';
const CLEANUP_MIGRATION_KEY = 'aegis_bookmarks_accurate_v1';

export const RECOMMENDED_SAMPLE_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'rec-1',
    title: 'Cloudflare: Web Security & DNS',
    url: 'https://cloudflare.com',
    domain: 'cloudflare.com',
    addedAt: 'Oct 11',
    category: 'Security',
  },
  {
    id: 'rec-2',
    title: 'GitHub: Where the world builds',
    url: 'https://github.com',
    domain: 'github.com',
    addedAt: 'Oct 11',
    category: 'Developer',
  },
  {
    id: 'rec-3',
    title: 'NCBI PubMed Research Index',
    url: 'https://ncbi.nlm.nih.gov',
    domain: 'ncbi.nlm.nih.gov',
    addedAt: 'Oct 10',
    category: 'Science',
  },
  {
    id: 'rec-4',
    title: 'arXiv Scientific Preprints',
    url: 'https://arxiv.org',
    domain: 'arxiv.org',
    addedAt: 'Oct 09',
    category: 'Science',
  },
  {
    id: 'rec-5',
    title: 'Wikipedia Free Encyclopedia',
    url: 'https://wikipedia.org',
    domain: 'wikipedia.org',
    addedAt: 'Oct 08',
    category: 'Reference',
  },
];

/**
 * Returns user bookmarks from localStorage.
 * Accurate default: Empty array ([]) if the user has not added any bookmarks.
 */
export function getStoredBookmarks(): BookmarkItem[] {
  try {
    const migrated = localStorage.getItem(CLEANUP_MIGRATION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);

    if (!migrated) {
      // One-time migration: purge legacy auto-seeded 5 dummy bookmarks (bm-1 to bm-5)
      // to ensure accurate 0 bookmarks state for users who haven't saved any bookmarks
      localStorage.setItem(CLEANUP_MIGRATION_KEY, 'true');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (
            Array.isArray(parsed) &&
            parsed.length === 5 &&
            parsed.every((b: any) => typeof b.id === 'string' && b.id.startsWith('bm-'))
          ) {
            // These are the exact 5 unrequested dummy bookmarks
            localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify([]));
            return [];
          }
        } catch {
          // ignore
        }
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Default to empty array - accurate state with 0 bookmarks
    return [];
  } catch {
    return [];
  }
}

export function saveStoredBookmarks(bookmarks: BookmarkItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
  } catch (err) {
    console.error('Failed to save bookmarks:', err);
  }
}

export function addBookmark(item: {
  title: string;
  url: string;
  domain: string;
  category?: string;
}): BookmarkItem[] {
  const bookmarks = getStoredBookmarks();
  // Check if URL is already bookmarked
  const exists = bookmarks.find((b) => b.url.toLowerCase() === item.url.toLowerCase());
  if (exists) return bookmarks;

  const now = new Date();
  const addedAt = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const newBookmark: BookmarkItem = {
    id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: item.title,
    url: item.url,
    domain: item.domain,
    category: item.category || 'General',
    addedAt,
  };

  const updated = [newBookmark, ...bookmarks];
  saveStoredBookmarks(updated);
  return updated;
}

export function deleteBookmark(id: string): BookmarkItem[] {
  const bookmarks = getStoredBookmarks();
  const updated = bookmarks.filter((b) => b.id !== id);
  saveStoredBookmarks(updated);
  return updated;
}

export function clearAllBookmarks(): BookmarkItem[] {
  saveStoredBookmarks([]);
  return [];
}

export function seedRecommendedBookmarks(): BookmarkItem[] {
  saveStoredBookmarks(RECOMMENDED_SAMPLE_BOOKMARKS);
  return RECOMMENDED_SAMPLE_BOOKMARKS;
}

export function toggleBookmark(item: {
  title: string;
  url: string;
  domain: string;
  category?: string;
}): { isBookmarked: boolean; list: BookmarkItem[] } {
  const bookmarks = getStoredBookmarks();
  const existing = bookmarks.find((b) => b.url.toLowerCase() === item.url.toLowerCase().trim());

  if (existing) {
    const updated = deleteBookmark(existing.id);
    return { isBookmarked: false, list: updated };
  } else {
    const updated = addBookmark(item);
    return { isBookmarked: true, list: updated };
  }
}
