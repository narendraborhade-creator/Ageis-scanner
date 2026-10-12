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
    console.log('[Aegis SW] Service Worker not supported in this environment');
    return;
  }

  // Register when the window is loaded to prevent competing with initial render
  window.addEventListener('load', async () => {
    try {
      // Register our core service worker which caches the browser shell and static assets
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      currentStatus = {
        ...currentStatus,
        isRegistered: true,
        registration,
      };
      notifyListeners();

      console.log('[Aegis SW] Service Worker registered with scope:', registration.scope);

      // Check if this registration is already active and caching
      if (registration.active) {
        currentStatus.isOfflineReady = true;
        notifyListeners();
      }

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[Aegis SW] New content available; please refresh.');
              currentStatus.hasUpdate = true;
            } else {
              console.log('[Aegis SW] Content cached for offline use.');
              currentStatus.isOfflineReady = true;
            }
            notifyListeners();
          }
        });
      });
    } catch (error) {
      console.warn('[Aegis SW] Service worker registration encountered an issue:', error);
    }
  });

  // Track controlling service worker changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[Aegis SW] New service worker took control');
    currentStatus.isOfflineReady = true;
    notifyListeners();
  });
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
