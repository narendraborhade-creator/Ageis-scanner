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

export interface AegisAPI {
  tabs: {
    createTab: (id: string, url?: string) => Promise<void>;
    switchTab: (id: string) => Promise<void>;
    closeTab: (id: string) => Promise<void>;
    updateBounds: (bounds: AegisTabBounds) => Promise<void>;
    navigate: (id: string, url: string) => Promise<void>;
    reload: (id: string) => Promise<void>;
    goBack: (id: string) => Promise<void>;
    goForward: (id: string) => Promise<void>;
    zoom: (id: string, factor: number) => Promise<void>;
    onNavigationStateChange: (
      callback: (state: AegisNavigationState) => void
    ) => () => void;
    onTabCreated: (
      callback: (tab: { id: string; url: string }) => void
    ) => () => void;
  };
  adBlocker: {
    isEnabled: () => Promise<boolean>;
    toggle: (enabled?: boolean) => Promise<boolean>;
    getStats: () => Promise<AegisAdBlockerStats>;
    onStatsUpdated: (
      callback: (stats: AegisAdBlockerStats) => void
    ) => () => void;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    openDevTools: () => void;
    printPage: () => void;
    openExternal: (url: string) => void;
  };
  pythonBot: {
    getStatus: () => Promise<any>;
    onStatusChange: (callback: (status: any) => void) => () => void;
    chat: (data: any) => Promise<any>;
    analyze: (payload: any) => Promise<any>;
  };
}

declare global {
  interface Window {
    isAegisDesktop?: boolean;
    aegis: AegisAPI;
    aegisDesktopApi?: {
      isDesktop: boolean;
      engine: string;
      version: string;
      electronVersion: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      openDevTools: () => void;
      printPage: () => void;
      zoomIn: () => void;
      zoomOut: () => void;
      zoomReset: () => void;
      openExternal: (url: string) => void;
      onOpenNewTab: (callback: (url: string) => void) => () => void;
    };
  }
}
