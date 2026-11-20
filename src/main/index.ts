import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { initTabManager } from './tabManager';
import { initAdBlocker } from './adBlocker';
import {
  startPythonBot,
  stopPythonBot,
  registerIpcHandlers as registerPythonBotIpc,
} from './pythonBotManager';

// Single Instance Lock: prevents duplicate background processes from locking cache and storage
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// High-performance flags and Google authentication compatibility
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');

let mainWindow: BrowserWindow | null = null;

const CHROMIUM_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const GOOGLE_AUTH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0';

function isGoogleAuthUrl(url?: string): boolean {
  if (!url) return false;
  return /accounts\.google\.|myaccount\.google\.|accounts\.youtube\.|oauth\.google\.|google\.[a-z.]+\/(signin|ServiceLogin|o\/oauth2|interactiveconsent)/i.test(
    url
  );
}

/**
 * Configure top-level session headers to ensure modern website and auth compatibility
 */
function configureSessionHeaders(targetSession: Electron.Session): void {
  if (!targetSession) return;

  try {
    targetSession.setUserAgent(CHROMIUM_USER_AGENT);
  } catch {}

  const filter = { urls: ['*://*/*'] };

  try {
    targetSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      const requestHeaders = { ...details.requestHeaders };
      const url = details.url || '';

      if (isGoogleAuthUrl(url)) {
        requestHeaders['User-Agent'] = GOOGLE_AUTH_USER_AGENT;
        for (const h of Object.keys(requestHeaders)) {
          if (h.toLowerCase().startsWith('sec-ch-ua')) {
            delete requestHeaders[h];
          }
        }
      } else {
        requestHeaders['User-Agent'] = CHROMIUM_USER_AGENT;
      }

      callback({ cancel: false, requestHeaders });
    });
  } catch (err) {
    console.warn('[Main] onBeforeSendHeaders warning:', err);
  }

  // Strip restrictive headers so websites can be previewed/embedded without frame errors
  try {
    targetSession.webRequest.onHeadersReceived(filter, (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };

      for (const key of Object.keys(responseHeaders)) {
        const lower = key.toLowerCase();
        if (
          lower === 'x-frame-options' ||
          lower === 'content-security-policy' ||
          lower === 'content-security-policy-report-only' ||
          lower === 'cross-origin-opener-policy' ||
          lower === 'cross-origin-embedder-policy' ||
          lower === 'cross-origin-resource-policy'
        ) {
          delete responseHeaders[key];
        }
      }

      callback({ cancel: false, responseHeaders });
    });
  } catch (err) {
    console.warn('[Main] onHeadersReceived warning:', err);
  }

  // Grant safe permissions for Web APIs
  try {
    targetSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      const allowed = [
        'fullscreen',
        'clipboard-read',
        'clipboard-sanitized-write',
        'media',
        'audioCapture',
        'videoCapture',
        'notifications',
        'geolocation',
      ];
      callback(allowed.includes(permission));
    });
  } catch {}
}

function resolvePreloadPath(): string {
  const mjs = path.join(__dirname, '../preload/index.mjs');
  if (fs.existsSync(mjs)) return mjs;
  const js = path.join(__dirname, '../preload/index.js');
  if (fs.existsSync(js)) return js;
  const cjs = path.join(__dirname, '../preload/index.cjs');
  if (fs.existsSync(cjs)) return cjs;
  return mjs;
}

/**
 * Creates the primary browser window
 */
async function createWindow(): Promise<BrowserWindow> {
  const iconPath = path.join(__dirname, '../../public/icon.svg');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 420,
    minHeight: 560,
    title: 'Aegis 3D Safe Browser',
    backgroundColor: '#030712',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: true,
    webPreferences: {
      preload: resolvePreloadPath(),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Initialize Tab Manager with native WebContentsViews
  initTabManager(mainWindow);

  // Initialize Network AdBlocker
  initAdBlocker(mainWindow, session.defaultSession);

  // Load UI from dev server or bundled dist
  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    const packagedHtml = path.join(__dirname, '../renderer/index.html');
    const fallbackDistHtml = path.join(__dirname, '../../dist/index.html');

    if (fs.existsSync(packagedHtml)) {
      await mainWindow.loadFile(packagedHtml);
    } else if (fs.existsSync(fallbackDistHtml)) {
      await mainWindow.loadFile(fallbackDistHtml);
    } else {
      console.error('[Main] Could not locate UI html file:', packagedHtml);
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// Helper to ensure IPC calls originate from the verified main renderer window
const isAuthorizedSender = (e: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): boolean => {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && e.sender === mainWindow.webContents);
};

// Window Management IPC Handlers
ipcMain.on('minimize-window', (e) => {
  if (!isAuthorizedSender(e)) return;
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', (e) => {
  if (!isAuthorizedSender(e)) return;
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', (e) => {
  if (!isAuthorizedSender(e)) return;
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('aegis-window-is-maximized', (e) => {
  if (!isAuthorizedSender(e)) return false;
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.on('open-devtools', (e) => {
  if (!isAuthorizedSender(e)) return;
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  }
});

ipcMain.on('print-page', (e) => {
  if (!isAuthorizedSender(e)) return;
  if (mainWindow) {
    mainWindow.webContents.print();
  }
});

ipcMain.on('zoom-in', (e) => {
  if (!isAuthorizedSender(e)) return;
  if (mainWindow) {
    const current = mainWindow.webContents.getZoomFactor();
    mainWindow.webContents.setZoomFactor(Math.min(current + 0.1, 3.0));
  }
});

ipcMain.on('zoom-out', (e) => {
  if (!isAuthorizedSender(e)) return;
  if (mainWindow) {
    const current = mainWindow.webContents.getZoomFactor();
    mainWindow.webContents.setZoomFactor(Math.max(current - 0.1, 0.4));
  }
});

ipcMain.on('zoom-reset', (e) => {
  if (!isAuthorizedSender(e)) return;
  if (mainWindow) {
    mainWindow.webContents.setZoomFactor(1.0);
  }
});

ipcMain.on('open-external', (e, url: string) => {
  if (!isAuthorizedSender(e)) return;
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

// App Lifecycle
app.whenReady().then(async () => {
  configureSessionHeaders(session.defaultSession);

  // Register Python Bot IPC and launch child process
  try {
    registerPythonBotIpc();
    startPythonBot().catch((err) => {
      console.warn('[Main] Python Bot start deferred or non-blocking:', err);
    });
  } catch (err) {
    console.warn('[Main] Failed to start Python Bot:', err);
  }

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function cleanup(): void {
  try {
    stopPythonBot();
  } catch (err) {
    console.warn('[Main] Cleanup warning:', err);
  }
}

app.on('before-quit', cleanup);
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
