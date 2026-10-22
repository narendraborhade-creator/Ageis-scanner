/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare namespace JSX {
  interface IntrinsicElements {
    webview: any;
  }
}

interface Window {
  isAegisDesktop?: boolean;
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
