import { contextBridge, ipcRenderer } from 'electron';

export interface AegisTabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AegisNavigationState {
  id: string;
  tabId: string;
  url: string;
  title?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
  zoomFactor?: number;
}

export interface AegisAdBlockerStats {
  blockedCount: number;
  recentBlockedUrls: string[];
}

const aegis = {
  tabs: {
    createTab: (id: string, url?: string): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-create', id, url),
    switchTab: (id: string): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-switch', id),
    closeTab: (id: string): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-close', id),
    updateBounds: (bounds: AegisTabBounds): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-update-bounds', bounds),
    navigate: (id: string, url: string): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-navigate', id, url),
    reload: (id: string): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-reload', id),
    goBack: (id: string): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-go-back', id),
    goForward: (id: string): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-go-forward', id),
    zoom: (id: string, factor: number): Promise<void> =>
      ipcRenderer.invoke('aegis-tabs-zoom', id, factor),
    onNavigationStateChange: (
      callback: (state: AegisNavigationState) => void
    ): (() => void) => {
      const listener = (_e: any, state: AegisNavigationState) => callback(state);
      ipcRenderer.on('aegis-tabs-navigation-state', listener);
      return () => ipcRenderer.removeListener('aegis-tabs-navigation-state', listener);
    },
    onTabCreated: (callback: (tab: { id: string; url: string }) => void): (() => void) => {
      const listener = (_e: any, tab: { id: string; url: string }) => callback(tab);
      ipcRenderer.on('aegis-tab-created', listener);
      return () => {
        ipcRenderer.removeListener('aegis-tab-created', listener);
      };
    },
  },
  adBlocker: {
    isEnabled: (): Promise<boolean> =>
      ipcRenderer.invoke('aegis-adblocker-is-enabled'),
    toggle: (enabled?: boolean): Promise<boolean> =>
      ipcRenderer.invoke('aegis-adblocker-toggle', enabled),
    getStats: (): Promise<AegisAdBlockerStats> =>
      ipcRenderer.invoke('aegis-adblocker-get-stats'),
    onStatsUpdated: (
      callback: (stats: AegisAdBlockerStats) => void
    ): (() => void) => {
      const listener = (_e: any, stats: AegisAdBlockerStats) => callback(stats);
      ipcRenderer.on('aegis-adblocker-stats', listener);
      return () => ipcRenderer.removeListener('aegis-adblocker-stats', listener);
    },
  },
  window: {
    minimize: (): void => ipcRenderer.send('minimize-window'),
    maximize: (): void => ipcRenderer.send('maximize-window'),
    close: (): void => ipcRenderer.send('close-window'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('aegis-window-is-maximized'),
    openDevTools: (): void => ipcRenderer.send('open-devtools'),
    printPage: (): void => ipcRenderer.send('print-page'),
    openExternal: (url: string): void => {
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        ipcRenderer.send('open-external', url);
      }
    },
  },
  pythonBot: {
    getStatus: (): Promise<any> => ipcRenderer.invoke('python-bot:get-status'),
    onStatusChange: (callback: (status: any) => void): (() => void) => {
      const listener = (_e: any, status: any) => callback(status);
      ipcRenderer.on('python-bot:status', listener);
      return () => ipcRenderer.removeListener('python-bot:status', listener);
    },
    chat: (data: any): Promise<any> => ipcRenderer.invoke('python-bot:chat', data),
    analyze: (payload: any): Promise<any> => ipcRenderer.invoke('python-bot:analyze', payload),
  },
};

// Expose aegis API to renderer context
contextBridge.exposeInMainWorld('aegis', aegis);
contextBridge.exposeInMainWorld('isAegisDesktop', true);

// Expose legacy aegisDesktopApi for full backward compatibility
contextBridge.exposeInMainWorld('aegisDesktopApi', {
  isDesktop: true,
  engine: 'Chromium',
  version: process.versions.chrome,
  electronVersion: process.versions.electron,
  minimize: aegis.window.minimize,
  maximize: aegis.window.maximize,
  close: aegis.window.close,
  openDevTools: aegis.window.openDevTools,
  printPage: aegis.window.printPage,
  zoomIn: () => ipcRenderer.send('zoom-in'),
  zoomOut: () => ipcRenderer.send('zoom-out'),
  zoomReset: () => ipcRenderer.send('zoom-reset'),
  openExternal: aegis.window.openExternal,
  onOpenNewTab: (callback: (url: string) => void) => {
    const listener = (_event: any, url: string) => callback(url);
    ipcRenderer.on('aegis-open-new-tab', listener);
    return () => ipcRenderer.removeListener('aegis-open-new-tab', listener);
  },
});
