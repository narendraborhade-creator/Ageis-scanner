const { contextBridge, ipcRenderer } = require('electron');

// Expose safe desktop Chromium APIs to the Aegis UI
contextBridge.exposeInMainWorld('isAegisDesktop', true);
contextBridge.exposeInMainWorld('aegisDesktopApi', {
  isDesktop: true,
  engine: 'Chromium',
  version: process.versions.chrome,
  electronVersion: process.versions.electron,
  nodeVersion: process.versions.node,
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  openDevTools: () => ipcRenderer.send('open-devtools'),
  printPage: () => ipcRenderer.send('print-page'),
  zoomIn: () => ipcRenderer.send('zoom-in'),
  zoomOut: () => ipcRenderer.send('zoom-out'),
  zoomReset: () => ipcRenderer.send('zoom-reset'),
  onOpenNewTab: (callback) => {
    const listener = (_event, url) => callback(url);
    ipcRenderer.on('aegis-open-new-tab', listener);
    return () => ipcRenderer.removeListener('aegis-open-new-tab', listener);
  },
});
