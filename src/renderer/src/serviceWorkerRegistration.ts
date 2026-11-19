/**
 * Service Worker Registration for Aegis 3D Safe Browser
 * Manages caching of the browser shell, static assets, and offline mode.
 */

export interface ServiceWorkerStatus {
  isRegistered: boolean;
  isOfflineReady: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

type StatusCallback = (status: ServiceWorkerStatus) => void;
const listeners: Set<StatusCallback> = new Set();

let currentStatus: ServiceWorkerStatus = {
  isRegistered: false,
  isOfflineReady: false,
  hasUpdate: false,
  registration: null,
};

function notifyListeners() {
  listeners.forEach((callback) => callback(currentStatus));
}

export function subscribeServiceWorkerStatus(callback: StatusCallback): () => void {
  listeners.add(callback);
  callback(currentStatus);
  return () => {
    listeners.delete(callback);
  };
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Actively unregister all existing service workers and purge caches
  // to prevent zombie workers from serving stale index.html or intercepting proxy navigation
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('[Aegis SW] Unregistered legacy service worker');
    }
  });

  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key);
      }
    });
  }
}

export async function clearAppCacheAndReload(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    window.location.reload();
  } catch (err) {
    console.error('[Aegis SW] Failed to clear caches:', err);
  }
}
