/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

export interface AegisTabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AegisNavigationState {
  tabId: string;
  url: string;
  title?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
}

export interface AegisAdBlockerStats {
  blockedCount: number;
  recentBlockedUrls: string[];
}

export interface AegisAPI {
  tabs: {
    createTab: (tabId: string, url: string) => Promise<void>;
    switchTab: (tabId: string) => Promise<void>;
    closeTab: (tabId: string) => Promise<void>;
    updateBounds: (bounds: AegisTabBounds) => Promise<void> | void;
    navigate: (tabId: string, url: string) => Promise<void>;
    reload: (tabId: string) => Promise<void>;
    goBack: (tabId: string) => Promise<void>;
    goForward: (tabId: string) => Promise<void>;
    zoom: (tabId: string, factor: number) => Promise<void>;
    onNavigationStateChange?: (callback: (state: AegisNavigationState) => void) => () => void;
    onTabCreated?: (callback: (tab: any) => void) => () => void;
  };
  adBlocker: {
    isEnabled: () => Promise<boolean>;
    toggle: (enabled?: boolean) => Promise<boolean>;
    getStats: () => Promise<AegisAdBlockerStats>;
    onStatsUpdated: (callback: (stats: AegisAdBlockerStats) => void) => () => void;
  };
  window?: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    openDevTools: () => void;
  };
  pythonBot?: {
    getStatus: () => Promise<any>;
    onStatusChange: (callback: (status: any) => void) => () => void;
    chat: (data: any) => Promise<any>;
    analyze: (payload: any) => Promise<any>;
  };
}

declare global {
  interface Window {
    isAegisDesktop?: boolean;
    aegis?: AegisAPI;
    aegisDesktopApi?: {
      isDesktop: boolean;
      engine: string;
      version: string;
      electronVersion: string;
      nodeVersion: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      openDevTools: () => void;
      printPage: () => void;
      zoomIn: () => void;
      zoomOut: () => void;
      zoomReset: () => void;
      onOpenNewTab: (callback: (url: string) => void) => () => void;
    };
  }
}
