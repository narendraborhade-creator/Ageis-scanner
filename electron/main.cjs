const { app, BrowserWindow, ipcMain, shell, session, Menu, MenuItem } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

// Modern standard Chrome User-Agent to ensure all web platforms (Google, YouTube, GitHub, Reddit, Cloudflare) load with full desktop Chromium fidelity
const CHROMIUM_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// Start local Express + CyberBot Server automatically
function startLocalBackend() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get(SERVER_URL, (res) => {
      console.log('[Aegis Desktop] Server is already running on port', PORT);
      resolve(SERVER_URL);
    });

    req.on('error', () => {
      // In packaged production desktop mode, boot a high-speed zero-dependency embedded server
      if (app.isPackaged || process.env.NODE_ENV === 'production') {
        console.log('[Aegis Desktop] Production packaged mode: starting embedded local static server...');
        try {
          const express = require('express');
          const serverApp = express();
          const distPath = path.join(__dirname, '../dist');

          serverApp.use(express.static(distPath));
          serverApp.get('*', (sReq, sRes) => {
            sRes.sendFile(path.join(distPath, 'index.html'));
          });

          const server = serverApp.listen(0, '127.0.0.1', () => {
            const dynamicPort = server.address().port;
            const dynamicUrl = `http://127.0.0.1:${dynamicPort}`;
            console.log('[Aegis Desktop] Standalone embedded server active at', dynamicUrl);
            resolve(dynamicUrl);
          });
          return;
        } catch (embeddedErr) {
          console.warn('[Aegis Desktop] Embedded server fallback to loadFile:', embeddedErr);
          resolve(null);
          return;
        }
      }

      console.log('[Aegis Desktop] Starting development backend server process...');
      const isWin = process.platform === 'win32';
      const npxCmd = isWin ? 'npx.cmd' : 'npx';

      serverProcess = spawn(npxCmd, ['tsx', 'server.ts'], {
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env, NODE_ENV: 'development', PORT: String(PORT) },
        stdio: 'inherit',
      });

      // Poll until server is ready
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const checkReq = http.get(SERVER_URL, (res) => {
          clearInterval(interval);
          console.log('[Aegis Desktop] Backend server is ready!');
          resolve(SERVER_URL);
        });
        checkReq.on('error', () => {
          if (attempts > 30) {
            clearInterval(interval);
            console.warn('[Aegis Desktop] Timeout waiting for backend server.');
            resolve(SERVER_URL);
          }
        });
      }, 500);
    });
  });
}

function configureChromiumSession() {
  const ses = session.defaultSession;

  // Set modern standard Chrome User Agent
  ses.setUserAgent(CHROMIUM_USER_AGENT);

  // Strip restrictive headers so native Chromium <webview> can render any website without frame-busting
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    // Remove X-Frame-Options
    for (const key of Object.keys(responseHeaders)) {
      if (key.toLowerCase() === 'x-frame-options') {
        delete responseHeaders[key];
      }
      // Relax Content-Security-Policy frame-ancestors restrictions
      if (key.toLowerCase() === 'content-security-policy') {
        responseHeaders[key] = responseHeaders[key].map((csp) =>
          csp.replace(/frame-ancestors[^;]+;?/gi, '')
        );
      }
    }

    callback({ cancel: false, responseHeaders });
  });

  // Safe permission handler for Web APIs
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = [
      'fullscreen',
      'clipboard-read',
      'clipboard-sanitized-write',
      'media',
      'audioCapture',
      'videoCapture',
      'notifications',
    ];
    callback(allowedPermissions.includes(permission));
  });
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
  configureChromiumSession();
  const targetUrl = await startLocalBackend();
  await createWindow(targetUrl);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(targetUrl);
    }
  });
});

function cleanup() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
    serverProcess = null;
  }
}

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  cleanup();
});
