/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';

/**
 * Detects whether the app is executing inside a Capacitor native mobile wrapper (Android / iOS).
 */
export function isCapacitorPlatform(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Explicit native user-agent tag injected by Android MainActivity.java
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('AegisSafeBrowserMobile')) {
    return true;
  }

  // 2. Capacitor native platform detection
  try {
    if (Capacitor.isNativePlatform()) return true;
    const platform = Capacitor.getPlatform();
    if (platform === 'android' || platform === 'ios') return true;
  } catch {}

  const win = window as any;
  // 3. Global Capacitor object or native protocols
  if (Boolean(win.Capacitor?.isNativePlatform?.()) || Boolean(win.Capacitor)) {
    return true;
  }

  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') {
    return true;
  }

  // 4. Android Capacitor default origin (https://localhost with no development port)
  if (
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    !Boolean(win.isAegisDesktop) &&
    window.location.port !== '3000' &&
    window.location.port !== '5173'
  ) {
    return true;
  }

  return false;
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
 * Resolves the backend base URL for API proxying and security scanning.
 * - On Electron Desktop (.exe): returns http://127.0.0.1:3000 (embedded desktop proxy).
 * - On Local Dev Server: returns '' (relative to dev server port).
 * - On Android APK, iOS, Mobile Web, and Production Web: ALWAYS returns https://www.aegisscans.dev!
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://www.aegisscans.dev';

  const win = window as any;

  // 1. Electron Desktop with embedded Express server
  if (Boolean(win.isAegisDesktop)) {
    return 'http://127.0.0.1:3000';
  }

  // 2. Local Node/Vite development server (port 3000 or 5173 on localhost) when NOT in Capacitor
  const isLocalDevServer =
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    (window.location.port === '3000' || window.location.port === '5173') &&
    !isCapacitorPlatform();

  if (isLocalDevServer) {
    return '';
  }

  // 3. Android APK, iOS, PWA, Mobile, and Production Web:
  // All traffic routes to canonical high-performance backend at https://www.aegisscans.dev
  return 'https://www.aegisscans.dev';
}

/**
 * Resolves a full endpoint URL incorporating getApiBaseUrl().
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${clean}`;
}
