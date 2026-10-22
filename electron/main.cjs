const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;

// Start local Express + CyberBot Server automatically
function startLocalBackend() {
  return new Promise((resolve) => {
    // Check if server is already running on port
    const http = require('http');
    const req = http.get(SERVER_URL, (res) => {
      console.log('[Aegis Desktop] Server is already running on port', PORT);
      resolve(true);
    });

    req.on('error', () => {
      console.log('[Aegis Desktop] Starting backend server process...');
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
          resolve(true);
        });
        checkReq.on('error', () => {
          if (attempts > 30) {
            clearInterval(interval);
            console.warn('[Aegis Desktop] Timeout waiting for backend server.');
            resolve(false);
          }
        });
      }, 500);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 380,
    minHeight: 560,
    title: 'Aegis 3D Safe Browser',
    backgroundColor: '#030712',
    icon: path.join(__dirname, '../public/icon.svg'),
    frame: true, // Native title bar + buttons, matching Google Chrome
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      webviewTag: true, // Enables native Chromium <webview> rendering engine!
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Load the application
  await mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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
  if (mainWindow) mainWindow.webContents.openDevTools();
});

app.whenReady().then(async () => {
  // Configure safe certificate handling and permissions for the desktop browser
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['fullscreen', 'clipboard-read', 'clipboard-sanitized-write'];
    callback(allowedPermissions.includes(permission));
  });

  await startLocalBackend();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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
