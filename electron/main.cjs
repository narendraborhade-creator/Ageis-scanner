const { app, BrowserWindow, ipcMain, shell, session, Menu, MenuItem } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Append Chromium switches to prevent any "refused to connect" or frame-busting on Google, YouTube, etc.
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests,IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('ignore-certificate-errors');

let mainWindow = null;

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

// Modern standard Chrome User-Agent to ensure all web platforms (Google, YouTube, GitHub, Reddit, Cloudflare) load with full desktop Chromium fidelity
const CHROMIUM_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// Built-in zero-dependency local static server for packaged desktop runtime
function startLocalBackend() {
  // In packaged production desktop mode (.exe), boot our high-speed zero-dependency embedded server immediately
  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    return new Promise((resolve) => {
      try {
        const distPath = path.join(__dirname, '../dist');

        const mimeTypes = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.webmanifest': 'application/manifest+json',
          '.woff2': 'font/woff2',
          '.woff': 'font/woff',
          '.ttf': 'font/ttf',
        };

        const server = http.createServer((sReq, sRes) => {
          let reqPath = sReq.url.split('?')[0];
          if (reqPath === '/' || !reqPath) reqPath = '/index.html';
          let filePath = path.join(distPath, reqPath);

          // Prevent path traversal
          if (!filePath.startsWith(distPath)) {
            sRes.statusCode = 403;
            return sRes.end('Forbidden');
          }

          fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
              filePath = path.join(distPath, 'index.html');
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            sRes.setHeader('Content-Type', contentType);
            sRes.setHeader('Access-Control-Allow-Origin', '*');
            fs.createReadStream(filePath).pipe(sRes);
          });
        });

        server.listen(0, '127.0.0.1', () => {
          const dynamicPort = server.address().port;
          const dynamicUrl = `http://127.0.0.1:${dynamicPort}`;
          console.log('[Aegis Desktop] Standalone zero-dependency embedded server active at', dynamicUrl);
          resolve(dynamicUrl);
        });

        server.on('error', (embeddedErr) => {
          console.warn('[Aegis Desktop] Embedded server fallback to loadFile:', embeddedErr);
          resolve(null);
        });
      } catch (embeddedErr) {
        console.warn('[Aegis Desktop] Embedded server fallback to loadFile:', embeddedErr);
        resolve(null);
      }
    });
  }

  // Development mode: check if dev server is running on localhost:3000
  return new Promise((resolve) => {
    const req = http.get(SERVER_URL, (res) => {
      console.log('[Aegis Desktop] Dev server is active on port', PORT);
      resolve(SERVER_URL);
    });

    req.on('error', () => {
      console.log('[Aegis Desktop] Dev server not detected, serving built dist bundle...');
      resolve(null);
    });
  });
}

function configureChromiumSession(targetSession) {
  const ses = targetSession || session.defaultSession;
  if (!ses) return;

  // Set modern standard Chrome User Agent
  try {
    ses.setUserAgent(CHROMIUM_USER_AGENT);
  } catch {}

  const filter = { urls: ['*://*/*'] };

  // Intercept request headers so Google, YouTube, and web servers see a direct top-level browser navigation
  try {
    ses.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      const requestHeaders = { ...details.requestHeaders };

      requestHeaders['User-Agent'] = CHROMIUM_USER_AGENT;

      // Ensure Sec-Fetch headers mimic standard top-level desktop browser navigation
      if (requestHeaders['Sec-Fetch-Dest'] === 'iframe') {
        requestHeaders['Sec-Fetch-Dest'] = 'document';
      }
      if (requestHeaders['Sec-Fetch-Mode'] === 'nested-navigate') {
        requestHeaders['Sec-Fetch-Mode'] = 'navigate';
      }
      if (requestHeaders['Sec-Fetch-Site'] === 'cross-site') {
        requestHeaders['Sec-Fetch-Site'] = 'none';
      }

      callback({ cancel: false, requestHeaders });
    });
  } catch (err) {
    console.warn('[Aegis Desktop] onBeforeSendHeaders warning:', err);
  }

  // Strip restrictive headers (X-Frame-Options, CSP, COOP, COEP) so Google and any website can render seamlessly
  try {
    ses.webRequest.onHeadersReceived(filter, (details, callback) => {
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
    console.warn('[Aegis Desktop] onHeadersReceived warning:', err);
  }

  // Safe permission handler for Web APIs
  try {
    ses.setPermissionRequestHandler((webContents, permission, callback) => {
      const allowedPermissions = [
        'fullscreen',
        'clipboard-read',
        'clipboard-sanitized-write',
        'media',
        'audioCapture',
        'videoCapture',
        'notifications',
        'geolocation',
      ];
      callback(allowedPermissions.includes(permission));
    });
  } catch {}
}

async function createWindow(targetUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 380,
    minHeight: 560,
    title: 'Aegis 3D Safe Browser (Chromium Powered)',
    backgroundColor: '#030712',
    icon: path.join(__dirname, '../public/icon.svg'),
    frame: true, // Native title bar + buttons, matching Google Chrome
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      webviewTag: true, // Enables native Chromium <webview> rendering engine
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: true,
      webSecurity: false, // Disables iframe/webview frame-busting blocks for authentic full-fidelity browsing
      allowRunningInsecureContent: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Load the application from local embedded server or directly from dist/index.html
  if (targetUrl) {
    await mainWindow.loadURL(targetUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Global web-contents handler for webviews (links opening new windows, right-click context menu, DevTools)
app.on('web-contents-created', (_event, contents) => {
  // Capture new window requests from webviews and redirect them to open in a new Aegis tab
  contents.setWindowOpenHandler(({ url }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('aegis-open-new-tab', url);
    }
    return { action: 'deny' };
  });

  // Native Chromium Context Menu on right click (Inspect, Reload, Copy, Paste, Print)
  contents.on('context-menu', (_e, params) => {
    const menu = new Menu();

    if (params.linkURL) {
      menu.append(
        new MenuItem({
          label: 'Open Link in New Tab',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('aegis-open-new-tab', params.linkURL);
            }
          },
        })
      );
      menu.append(
        new MenuItem({
          label: 'Copy Link Address',
          role: 'copyLink',
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    if (params.hasImageContents && params.srcURL) {
      menu.append(
        new MenuItem({
          label: 'Open Image in New Tab',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('aegis-open-new-tab', params.srcURL);
            }
          },
        })
      );
      menu.append(
        new MenuItem({
          label: 'Copy Image Address',
          click: () => {
            const { clipboard } = require('electron');
            clipboard.writeText(params.srcURL);
          },
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    if (params.selectionText) {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      menu.append(
        new MenuItem({
          label: `Search Aegis for "${params.selectionText.slice(0, 20)}..."`,
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send(
                'aegis-open-new-tab',
                `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`
              );
            }
          },
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    } else {
      if (params.isEditable) {
        menu.append(new MenuItem({ label: 'Undo', role: 'undo' }));
        menu.append(new MenuItem({ label: 'Redo', role: 'redo' }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ label: 'Cut', role: 'cut' }));
        menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
        menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
        menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));
        menu.append(new MenuItem({ type: 'separator' }));
      }
    }

    menu.append(
      new MenuItem({
        label: 'Back',
        enabled: contents.canGoBack(),
        click: () => contents.goBack(),
      })
    );
    menu.append(
      new MenuItem({
        label: 'Forward',
        enabled: contents.canGoForward(),
        click: () => contents.goForward(),
      })
    );
    menu.append(
      new MenuItem({
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => contents.reload(),
      })
    );
    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(
      new MenuItem({
        label: 'Print...',
        accelerator: 'CmdOrCtrl+P',
        click: () => contents.print(),
      })
    );

    menu.append(
      new MenuItem({
        label: 'Inspect Element',
        click: () => {
          contents.inspectElement(params.x, params.y);
          if (!contents.isDevToolsOpened()) {
            contents.openDevTools({ mode: 'detach' });
          }
        },
      })
    );

    menu.popup();
  });
});

// Window management IPC
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('open-devtools', () => {
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  }
});

ipcMain.on('print-page', () => {
  if (mainWindow) {
    mainWindow.webContents.print();
  }
});

ipcMain.on('zoom-in', () => {
  if (mainWindow) {
    const current = mainWindow.webContents.getZoomFactor();
    mainWindow.webContents.setZoomFactor(Math.min(current + 0.1, 3.0));
  }
});

ipcMain.on('zoom-out', () => {
  if (mainWindow) {
    const current = mainWindow.webContents.getZoomFactor();
    mainWindow.webContents.setZoomFactor(Math.max(current - 0.1, 0.4));
  }
});

ipcMain.on('zoom-reset', () => {
  if (mainWindow) {
    mainWindow.webContents.setZoomFactor(1.0);
  }
});

app.whenReady().then(async () => {
  // Configure default session and webview partitions
  configureChromiumSession(session.defaultSession);
  configureChromiumSession(session.fromPartition('persist:aegis-browser'));
  configureChromiumSession(session.fromPartition('persist:aegis'));

  // Ensure any newly spawned webview or window partition inherits Google-compatible headers
  app.on('session-created', (ses) => {
    configureChromiumSession(ses);
  });

  const targetUrl = await startLocalBackend();
  await createWindow(targetUrl);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(targetUrl);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
