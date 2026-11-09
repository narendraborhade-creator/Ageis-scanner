import { describe, it, expect, vi } from 'vitest';
import {
  fetchGoogleSuggestionsDirect,
  fetchGoogleDatabaseSearchResults,
  testGoogleFirestoreDatabase,
} from '../googleDatabaseService';

describe('googleDatabaseService', () => {
  it('fetchGoogleSuggestionsDirect returns empty array for blank query', async () => {
    const res = await fetchGoogleSuggestionsDirect('');
    expect(res).toEqual([]);
  });

  it('fetchGoogleDatabaseSearchResults returns empty results for blank query', async () => {
    const res = await fetchGoogleDatabaseSearchResults('');
    expect(res.results).toEqual([]);
    expect(res.source).toBe('empty');
  });

  it('fetchGoogleDatabaseSearchResults provides verified results when querying a topic', async () => {
    const res = await fetchGoogleDatabaseSearchResults('cybersecurity', 'all');
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.results.some((r) => r.domain.includes('google.com') || r.domain.includes('wikipedia.org'))).toBe(true);
    expect(res.source).toBeDefined();
  });

  it('testGoogleFirestoreDatabase successfully tests connection and validates collections', async () => {
    const res = await testGoogleFirestoreDatabase({
      apiKey: '',
      authDomain: 'aegis-safe-browser.firebaseapp.com',
      projectId: 'aegis-safe-browser-2026',
      firestoreDatabaseId: '(default)',
      isConnected: false,
    });

    expect(res.success).toBe(true);
    expect(res.projectId).toBe('aegis-safe-browser-2026');
    expect(res.collections.length).toBeGreaterThanOrEqual(4);
    expect(res.collections.some((c) => c.name === 'users')).toBe(true);
  });
});
