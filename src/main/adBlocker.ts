import { app, session, ipcMain, BrowserWindow, Session } from 'electron';

export interface AdBlockerStats {
  blockedCount: number;
  recentBlockedUrls: string[];
}

// Comprehensive set of known advertising, telemetry, tracker, and cryptomining root domains
const AD_TRACKER_DOMAINS = new Set<string>([
  // Google Ad & Tracking Services
  'doubleclick.net',
  'googleadservices.com',
  'googlesyndication.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'google-analytics.com',
  'ssl.google-analytics.com',
  'googletagservices.com',
  'googletagmanager.com',

  // Major Ad Networks & Real-Time Bidding (RTB) Platforms
  'adnxs.com',
  'criteo.com',
  'criteo.net',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'casalemedia.com',
  'bidswitch.net',
  'smartadserver.com',
  'yieldmo.com',
  'adform.net',
  'zedo.com',
  'tribalfusion.com',
  'taboola.com',
  'outbrain.com',
  'revcontent.com',
  'adroll.com',
  'advertising.com',
  'adtechus.com',
  'popads.net',
  'propellerads.com',
  'exoclick.com',
  'trafficjunky.com',
  'juicyads.com',
  'mgid.com',
  'infolinks.com',
  'exponential.com',
  'chitika.com',
  'contextweb.com',
  'sovrn.com',
  'lijit.com',
  'spotxchange.com',
  'spotx.tv',
  'tremorhub.com',
  'innovid.com',
  'flashtalking.com',
  'serving-sys.com',
  'sizmek.com',
  'moatads.com',
  'moat.com',

  // Mobile Ad Networks
  'adcolony.com',
  'applovin.com',
  'unityads.unity3d.com',
  'vungle.com',
  'chartboost.com',
  'ironsrc.com',

  // Analytics & User Session Recording Trackers
  'hotjar.com',
  'segment.io',
  'segment.com',
  'mixpanel.com',
  'quantserve.com',
  'scorecardresearch.com',
  'chartbeat.com',
  'newrelic.com',
  'crazyegg.com',
  'fullstory.com',
  'clarity.ms',
  'mouseflow.com',
  'inspectlet.com',
  'luckyorange.com',
  'mc.yandex.ru',
  'metrika.yandex.ru',
  'analytics.yahoo.com',

  // Social Ad Trackers & Conversion Pixels
  'ads.twitter.com',
  'analytics.twitter.com',
  'ads.linkedin.com',
  'px.ads.linkedin.com',
  'snap.licdn.com',
  'analytics.tiktok.com',
  'ads.pinterest.com',
  'ct.pinterest.com',
  'tr.snapchat.com',
  'ads-twitter.com',

  // Amazon & E-Commerce Ads
  'amazon-adsystem.com',
  'aax.amazon-adsystem.com',
  'adserver.yahoo.com',
  'gemini.yahoo.com',

  // Browser Miners & Malicious Coin Hive clones
  'coinhive.com',
  'coin-hive.com',
  'crypto-loot.com',
  'webminepool.com'
]);

// URL patterns specifically matching ad/tracking endpoints
const AD_URL_PATTERNS = [
  /\/pagead\/(lvz|js|img)/i,
  /\/pagead2\./i,
  /fbevents\.js/i,
  /connect\.facebook\.net\/.*\/fbevents\.js/i,
  /\/google-analytics\.com\/(analytics|ga)\.js/i,
  /\/gtag\/js/i,
  /\/ads?\.(js|php)/i,
  /\/beacon\.min\.js/i
];

let blockerEnabled = true;
let blockedCount = 0;
const recentBlockedUrls: string[] = [];
const attachedSessions = new WeakSet<Session>();
let broadcastTimer: NodeJS.Timeout | null = null;
let currentWindow: BrowserWindow | null = null;

/**
 * Checks if a URL targets an ad or tracker domain/pattern
 */
export function isAdOrTrackerUrl(targetUrl: string): boolean {
  if (!targetUrl || typeof targetUrl !== 'string') return false;

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return false;
  }

  // Only filter HTTP and HTTPS traffic
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check exact hostname or subdomain of blocked root domain
  if (AD_TRACKER_DOMAINS.has(hostname)) {
    return true;
  }

  for (const domain of AD_TRACKER_DOMAINS) {
    if (hostname.endsWith('.' + domain)) {
      return true;
    }
  }

  // Check specific ad script URL patterns
  const fullPath = parsed.pathname + parsed.search;
  for (const pattern of AD_URL_PATTERNS) {
    if (pattern.test(fullPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Schedules a debounced broadcast of blocker stats to renderer windows
 */
function scheduleBroadcast(): void {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    broadcastStats();
  }, 100);
}

/**
 * Broadcasts stats to all active BrowserWindow instances
 */
export function broadcastStats(): void {
  const payload: AdBlockerStats = {
    blockedCount,
    recentBlockedUrls: [...recentBlockedUrls]
  };

  try {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed() && win.webContents) {
        win.webContents.send('aegis-adblocker-stats', payload);
      }
    }
  } catch (err) {
    console.warn('[AdBlocker] Failed to broadcast stats:', err);
  }
}

/**
 * Attach the request filter to an Electron session
 */
export function attachSessionToAdBlocker(targetSession: Session): void {
  if (!targetSession || attachedSessions.has(targetSession)) return;
  attachedSessions.add(targetSession);

  const filter = { urls: ['*://*/*'] };

  targetSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    if (!blockerEnabled) {
      callback({ cancel: false });
      return;
    }

    if (isAdOrTrackerUrl(details.url)) {
      blockedCount++;
      const sanitizedUrl = details.url.split('?')[0];
      recentBlockedUrls.unshift(sanitizedUrl);
      if (recentBlockedUrls.length > 50) {
        recentBlockedUrls.length = 50;
      }
      scheduleBroadcast();
      callback({ cancel: true });
      return;
    }

    callback({ cancel: false });
  });
}

/**
 * Get current blocker stats
 */
export function getAdBlockerStats(): AdBlockerStats {
  return {
    blockedCount,
    recentBlockedUrls: [...recentBlockedUrls]
  };
}

/**
 * Check if the ad blocker is active
 */
export function isAdBlockerEnabled(): boolean {
  return blockerEnabled;
}

/**
 * Toggle ad blocker status
 */
export function toggleAdBlocker(enabled?: boolean): boolean {
  if (typeof enabled === 'boolean') {
    blockerEnabled = enabled;
  } else {
    blockerEnabled = !blockerEnabled;
  }
  scheduleBroadcast();
  return blockerEnabled;
}

/**
 * Initialize Ad Blocker and register IPC handlers
 */
export function initAdBlocker(win?: BrowserWindow, defaultSes?: Session): void {
  if (win) {
    currentWindow = win;
  }

  const ses = defaultSes || session.defaultSession;
  if (ses) {
    attachSessionToAdBlocker(ses);
  }

  // Ensure any newly created session partition is also protected
  app.on('session-created', (newSes: Session) => {
    attachSessionToAdBlocker(newSes);
  });

  // Register IPC handlers (idempotent)
  const isAuthorized = (e: any): boolean => {
    return Boolean(currentWindow && !currentWindow.isDestroyed() && e.sender === currentWindow.webContents);
  };

  ipcMain.removeHandler('aegis-adblocker-is-enabled');
  ipcMain.handle('aegis-adblocker-is-enabled', () => isAdBlockerEnabled());

  ipcMain.removeHandler('aegis-adblocker-toggle');
  ipcMain.handle('aegis-adblocker-toggle', (event, enabled?: boolean) => {
    if (!isAuthorized(event)) return isAdBlockerEnabled();
    return toggleAdBlocker(enabled);
  });

  ipcMain.removeHandler('aegis-adblocker-get-stats');
  ipcMain.handle('aegis-adblocker-get-stats', () => getAdBlockerStats());
}
