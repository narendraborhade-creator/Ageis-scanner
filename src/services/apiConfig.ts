/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';

/**
 * Detects whether the app is executing inside a Capacitor native mobile wrapper (Android / iOS).
 */
export function isCapacitorPlatform(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
    const platform = Capacitor.getPlatform();
    if (platform === 'android' || platform === 'ios') return true;
  } catch {}

  if (typeof window === 'undefined') return false;
  const win = window as any;
  return Boolean(
    win.Capacitor?.isNativePlatform?.() ||
    Boolean(win.Capacitor) ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !Boolean(win.isAegisDesktop))
  );
}

/**
 * Detects whether the app is running as an installed Progressive Web App (PWA) on mobile / desktop.
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Checks if the current environment is a mobile form factor, native mobile APK, or PWA.
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    isCapacitorPlatform() ||
    isStandalonePWA() ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
}

/**
 * Resolves the backend base URL for API proxying.
 * On Android Capacitor APK or local mobile wrapper,
 * requests are routed to the canonical live backend at https://www.aegisscans.dev.
 */
export function getApiBaseUrl(): string {
  if (isCapacitorPlatform()) {
    return 'https://www.aegisscans.dev';
  }
  return '';
}

/**
 * Resolves a full endpoint URL incorporating getApiBaseUrl().
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${clean}`;
}
