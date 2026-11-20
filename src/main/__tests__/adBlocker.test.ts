import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  session: {
    defaultSession: {
      webRequest: {
        onBeforeRequest: vi.fn(),
      },
    },
  },
}));
import {
  isAdOrTrackerUrl,
  isAdBlockerEnabled,
  toggleAdBlocker,
  getAdBlockerStats,
} from '../adBlocker';

describe('AdBlocker Core Intelligence', () => {
  beforeEach(() => {
    // Ensure blocker is enabled for testing
    toggleAdBlocker(true);
  });

  it('correctly identifies known advertising and tracker domains', () => {
    expect(isAdOrTrackerUrl('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')).toBe(true);
    expect(isAdOrTrackerUrl('https://securepubads.g.doubleclick.net/gampad/ads')).toBe(true);
    expect(isAdOrTrackerUrl('https://www.google-analytics.com/analytics.js')).toBe(true);
    expect(isAdOrTrackerUrl('https://ib.adnxs.com/seg?add=1')).toBe(true);
    expect(isAdOrTrackerUrl('https://static.criteo.net/js/ld/ld.js')).toBe(true);
    expect(isAdOrTrackerUrl('https://static.hotjar.com/c/hotjar-123.js')).toBe(true);
    expect(isAdOrTrackerUrl('https://connect.facebook.net/en_US/fbevents.js')).toBe(true);
    expect(isAdOrTrackerUrl('https://aax.amazon-adsystem.com/e/dtb/bid')).toBe(true);
  });

  it('allows benign search, content, and application domains', () => {
    expect(isAdOrTrackerUrl('https://www.google.com/search?q=cybersecurity')).toBe(false);
    expect(isAdOrTrackerUrl('https://github.com/torvalds/linux')).toBe(false);
    expect(isAdOrTrackerUrl('https://en.wikipedia.org/wiki/Computer_security')).toBe(false);
    expect(isAdOrTrackerUrl('https://news.ycombinator.com/item?id=123')).toBe(false);
  });

  it('safely handles malformed and non-HTTP URLs', () => {
    expect(isAdOrTrackerUrl('')).toBe(false);
    expect(isAdOrTrackerUrl('javascript:void(0)')).toBe(false);
    expect(isAdOrTrackerUrl('data:text/html,<div>Hello</div>')).toBe(false);
    expect(isAdOrTrackerUrl('about:blank')).toBe(false);
  });

  it('correctly toggles enabled/disabled state', () => {
    expect(isAdBlockerEnabled()).toBe(true);
    toggleAdBlocker(false);
    expect(isAdBlockerEnabled()).toBe(false);
    toggleAdBlocker(true);
    expect(isAdBlockerEnabled()).toBe(true);
  });

  it('provides stats object with blocked count and recent URLs array', () => {
    const stats = getAdBlockerStats();
    expect(typeof stats.blockedCount).toBe('number');
    expect(Array.isArray(stats.recentBlockedUrls)).toBe(true);
  });
});
