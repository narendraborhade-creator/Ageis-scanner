/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Detects whether the app is executing inside a Capacitor native mobile wrapper (Android / iOS).
 */
export function isCapacitorPlatform(): boolean {
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
 * Checks if the current environment is a mobile form factor or native mobile app.
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    isCapacitorPlatform() ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
}

/**
 * Resolves the backend base URL for API proxying.
 * On Android Capacitor APK, since there is no local Node.js proxy server,
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
