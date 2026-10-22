const { contextBridge, ipcRenderer } = require('electron');

// Expose safe desktop Chromium APIs to the Aegis UI
contextBridge.exposeInMainWorld('aegisDesktopApi', {
  isDesktop: true,
  engine: 'Chromium',
  version: process.versions.chrome,
  electronVersion: process.versions.electron,
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  openDevTools: () => ipcRenderer.send('open-devtools'),
});

// Flag for React components to know native Chromium webview is supported
window.isAegisDesktop = true;
