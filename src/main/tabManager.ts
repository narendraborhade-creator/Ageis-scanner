import { WebContentsView, BrowserWindow, ipcMain, Menu, MenuItem, clipboard } from 'electron';
import { attachSessionToAdBlocker } from './adBlocker';

export interface TabBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TabNavigationState {
  id: string;
  tabId: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  zoomFactor: number;
}

export interface TabInstance {
  id: string;
  view: WebContentsView;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  zoomFactor: number;
  isPrivate?: boolean;
}

const CHROMIUM_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let mainWindow: BrowserWindow | null = null;
const tabs = new Map<string, TabInstance>();
let activeTabId: string | null = null;
let currentBounds: TabBounds = { x: 0, y: 88, width: 1440, height: 832 };

/**
 * Format a raw search query or domain into a fully qualified navigation URL
 */
function normalizeUrl(inputUrl: string): string {
  if (!inputUrl) return 'about:blank';
  const trimmed = inputUrl.trim();
  if (
    trimmed.startsWith('aegis:') ||
    trimmed.startsWith('about:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('chrome:')
  ) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // Check if it looks like a domain name with TLD
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  // Fall back to Google Search
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

/**
 * Broadcast tab navigation state to the renderer
 */
function emitNavigationState(tab: TabInstance): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const payload: TabNavigationState = {
    id: tab.id,
    tabId: tab.id,
    url: tab.url,
    title: tab.title || tab.url,
    canGoBack: tab.canGoBack,
    canGoForward: tab.canGoForward,
    isLoading: tab.isLoading,
    zoomFactor: tab.zoomFactor,
  };

  try {
    mainWindow.webContents.send('aegis-tabs-navigation-state', payload);
  } catch (err) {
    console.warn('[TabManager] Failed to emit navigation state:', err);
  }
}

/**
 * Setup native context menu on right-click within the WebContentsView
 */
function setupContextMenu(view: WebContentsView): void {
  view.webContents.on('context-menu', (_e, params) => {
    const menu = new Menu();

    if (params.linkURL) {
      menu.append(
        new MenuItem({
          label: 'Open Link in New Tab',
          click: () => {
            const newId = `tab-${Date.now()}`;
            createTab(newId, params.linkURL);
            switchTab(newId);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('aegis-tab-created', { id: newId, url: params.linkURL });
            }
          },
        })
      );
      menu.append(
        new MenuItem({
          label: 'Copy Link Address',
          click: () => clipboard.writeText(params.linkURL),
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    if (params.hasImageContents && params.srcURL) {
      menu.append(
        new MenuItem({
          label: 'Open Image in New Tab',
          click: () => {
            const newId = `tab-${Date.now()}`;
            createTab(newId, params.srcURL);
            switchTab(newId);
          },
        })
      );
      menu.append(
        new MenuItem({
          label: 'Copy Image Address',
          click: () => clipboard.writeText(params.srcURL),
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    if (params.selectionText) {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      menu.append(
        new MenuItem({
          label: `Search Google for "${params.selectionText.slice(0, 24)}..."`,
          click: () => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`;
            const newId = `tab-${Date.now()}`;
            createTab(newId, searchUrl);
            switchTab(newId);
          },
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    } else if (params.isEditable) {
      menu.append(new MenuItem({ label: 'Undo', role: 'undo' }));
      menu.append(new MenuItem({ label: 'Redo', role: 'redo' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'Cut', role: 'cut' }));
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
      menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    menu.append(
      new MenuItem({
        label: 'Back',
        enabled: view.webContents.canGoBack(),
        click: () => view.webContents.goBack(),
      })
    );
    menu.append(
      new MenuItem({
        label: 'Forward',
        enabled: view.webContents.canGoForward(),
        click: () => view.webContents.goForward(),
      })
    );
    menu.append(
      new MenuItem({
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => view.webContents.reload(),
      })
    );
    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(
      new MenuItem({
        label: 'Print...',
        accelerator: 'CmdOrCtrl+P',
        click: () => view.webContents.print(),
      })
    );

    menu.append(
      new MenuItem({
        label: 'Inspect Element',
        click: () => {
          view.webContents.inspectElement(params.x, params.y);
          if (!view.webContents.isDevToolsOpened()) {
            view.webContents.openDevTools({ mode: 'detach' });
          }
        },
      })
    );

    menu.popup();
  });
}

/**
 * Creates and initializes a native WebContentsView tab
 */
export function createTab(id: string, initialUrl?: string, isPrivate?: boolean): TabInstance {
  if (tabs.has(id)) {
    const existing = tabs.get(id)!;
    if (initialUrl && initialUrl !== existing.url) {
      navigateTab(id, initialUrl);
    }
    return existing;
  }

  const webPrefs: Electron.WebPreferences = {
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
    spellcheck: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
  };

  // Pure in-memory session partition for zero-trace private tabs
  if (isPrivate) {
    webPrefs.partition = `incognito-${Date.now()}-${id}`;
  }

  const view = new WebContentsView({
    webPreferences: webPrefs,
  });

  // Attach session to network AdBlocker
  attachSessionToAdBlocker(view.webContents.session);

  // Set modern Chromium desktop User-Agent
  try {
    view.webContents.setUserAgent(CHROMIUM_USER_AGENT);
  } catch {}

  const tab: TabInstance = {
    id,
    view,
    url: initialUrl || 'about:blank',
    title: isPrivate ? 'Private Tab' : 'New Tab',
    canGoBack: false,
    canGoForward: false,
    isLoading: false,
    zoomFactor: 1.0,
    isPrivate: Boolean(isPrivate),
  };

  // Setup navigation event listeners
  view.webContents.on('did-start-loading', () => {
    tab.isLoading = true;
    emitNavigationState(tab);
  });

  view.webContents.on('did-finish-load', () => {
    tab.isLoading = false;
    tab.url = view.webContents.getURL();
    tab.title = view.webContents.getTitle();
    tab.canGoBack = view.webContents.canGoBack();
    tab.canGoForward = view.webContents.canGoForward();
    emitNavigationState(tab);
  });

  view.webContents.on('page-title-updated', (_event, title) => {
    tab.title = title;
    emitNavigationState(tab);
  });

  view.webContents.on('did-navigate', (_event, url) => {
    tab.url = url;
    tab.canGoBack = view.webContents.canGoBack();
    tab.canGoForward = view.webContents.canGoForward();
    emitNavigationState(tab);
  });

  view.webContents.on('did-navigate-in-page', (_event, url) => {
    tab.url = url;
    tab.canGoBack = view.webContents.canGoBack();
    tab.canGoForward = view.webContents.canGoForward();
    emitNavigationState(tab);
  });

  view.webContents.on('did-fail-load', () => {
    tab.isLoading = false;
    emitNavigationState(tab);
  });

  // Intercept window.open or target="_blank" links
  view.webContents.setWindowOpenHandler(({ url }) => {
    const newId = `tab-${Date.now()}`;
    createTab(newId, url, tab.isPrivate);
    switchTab(newId);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('aegis-tab-created', { id: newId, url, isPrivate: tab.isPrivate });
    }
    return { action: 'deny' };
  });

  setupContextMenu(view);

  // Add view to mainWindow hierarchy
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.contentView.addChildView(view);
  }

  tabs.set(id, tab);

  // Check if initial URL is internal or external
  const isInternal =
    !initialUrl ||
    initialUrl === 'about:blank' ||
    initialUrl.startsWith('aegis:') ||
    initialUrl.startsWith('chrome:');

  // If no tab is currently active, activate this tab immediately
  if (!activeTabId) {
    activeTabId = id;
    if (isInternal) {
      view.setVisible(false);
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    } else {
      view.setVisible(true);
      applyCurrentBounds(view);
    }
  } else {
    view.setVisible(false);
    view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  }

  if (initialUrl && !isInternal) {
    navigateTab(id, initialUrl);
  }

  return tab;
}

/**
 * Switches the active tab to target tab id
 */
export function switchTab(id: string): void {
  const target = tabs.get(id);
  if (!target) return;

  // Hide the previous active tab
  if (activeTabId && activeTabId !== id) {
    const prev = tabs.get(activeTabId);
    if (prev) {
      prev.view.setVisible(false);
      prev.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
  }

  activeTabId = id;

  if (mainWindow && !mainWindow.isDestroyed()) {
    // Bring to top
    mainWindow.contentView.addChildView(target.view);
  }

  const isInternal =
    !target.url ||
    target.url === 'about:blank' ||
    target.url.startsWith('aegis:') ||
    target.url.startsWith('chrome:');

  if (isInternal) {
    target.view.setVisible(false);
    target.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
  } else {
    target.view.setVisible(true);
    applyCurrentBounds(target.view);
  }

  emitNavigationState(target);
}

/**
 * Closes and removes a tab
 */
export function closeTab(id: string): void {
  const tab = tabs.get(id);
  if (!tab) return;

  tabs.delete(id);

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.contentView.removeChildView(tab.view);
    } catch {}
  }

  try {
    tab.view.webContents.close();
  } catch {}

  if (activeTabId === id) {
    const remainingKeys = Array.from(tabs.keys());
    if (remainingKeys.length > 0) {
      switchTab(remainingKeys[remainingKeys.length - 1]);
    } else {
      activeTabId = null;
    }
  }
}

/**
 * Navigates a tab to a specified URL
 */
export function navigateTab(id: string, targetUrl: string): void {
  let tab = tabs.get(id);
  if (!tab) {
    tab = createTab(id, targetUrl);
    switchTab(id);
    return;
  }

  const resolved = normalizeUrl(targetUrl);
  tab.url = resolved;

  const isInternal =
    !resolved ||
    resolved === 'about:blank' ||
    resolved.startsWith('aegis:') ||
    resolved.startsWith('chrome:');

  if (isInternal) {
    tab.isLoading = false;
    tab.view.setVisible(false);
    tab.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    tab.view.webContents.loadURL('about:blank').catch(() => {});
    emitNavigationState(tab);
    return;
  }

  if (activeTabId === id) {
    tab.view.setVisible(true);
    applyCurrentBounds(tab.view);
  }

  tab.isLoading = true;
  emitNavigationState(tab);

  tab.view.webContents.loadURL(resolved).catch((err) => {
    console.warn(`[TabManager] Failed loading ${resolved}:`, err.message);
    tab.isLoading = false;
    emitNavigationState(tab);
  });
}

/**
 * Reloads the contents of a tab
 */
export function reloadTab(id: string): void {
  const tab = tabs.get(id);
  if (tab) {
    tab.view.webContents.reload();
  }
}

/**
 * Navigates back in history
 */
export function goBackTab(id: string): void {
  const tab = tabs.get(id);
  if (tab && tab.view.webContents.canGoBack()) {
    tab.view.webContents.goBack();
  }
}

/**
 * Navigates forward in history
 */
export function goForwardTab(id: string): void {
  const tab = tabs.get(id);
  if (tab && tab.view.webContents.canGoForward()) {
    tab.view.webContents.goForward();
  }
}

/**
 * Sets zoom factor for a tab
 */
export function setTabZoom(id: string, factor: number): void {
  const tab = tabs.get(id);
  if (tab) {
    const clamped = Math.max(0.25, Math.min(factor, 5.0));
    tab.zoomFactor = clamped;
    tab.view.webContents.setZoomFactor(clamped);
    emitNavigationState(tab);
  }
}

/**
 * Applies current bounds to a WebContentsView
 */
function applyCurrentBounds(view: WebContentsView): void {
  const safeBounds = {
    x: Math.round(currentBounds.x),
    y: Math.round(currentBounds.y),
    width: Math.max(0, Math.round(currentBounds.width)),
    height: Math.max(0, Math.round(currentBounds.height)),
  };
  try {
    view.setBounds(safeBounds);
  } catch (err) {
    console.warn('[TabManager] Failed setting view bounds:', err);
  }
}

/**
 * Updates dynamic container bounds requested from Renderer
 */
export function updateTabBounds(bounds: TabBounds): void {
  if (!bounds) return;
  currentBounds = {
    x: Math.max(0, bounds.x || 0),
    y: Math.max(0, bounds.y || 0),
    width: Math.max(0, bounds.width || 0),
    height: Math.max(0, bounds.height || 0),
  };

  if (activeTabId && tabs.has(activeTabId)) {
    const active = tabs.get(activeTabId)!;
    applyCurrentBounds(active.view);
  }
}

/**
 * Initialize Tab Manager and bind IPC channels
 */
export function initTabManager(win: BrowserWindow): void {
  mainWindow = win;

  // Handle window resizing to keep active tab view in sync
  win.on('resize', () => {
    if (activeTabId && tabs.has(activeTabId)) {
      const active = tabs.get(activeTabId)!;
      applyCurrentBounds(active.view);
    }
  });

  // Helper to ensure IPC calls originate from the verified main renderer window
  const isAuthorizedSender = (e: any): boolean => {
    return Boolean(mainWindow && !mainWindow.isDestroyed() && e.sender === mainWindow.webContents);
  };

  // Tab management IPC Handlers
  ipcMain.removeHandler('aegis-tabs-create');
  ipcMain.handle('aegis-tabs-create', (e, id: string, url?: string, isPrivate?: boolean) => {
    if (!isAuthorizedSender(e)) return;
    createTab(id, url, isPrivate);
  });

  ipcMain.removeHandler('aegis-tabs-switch');
  ipcMain.handle('aegis-tabs-switch', (e, id: string) => {
    if (!isAuthorizedSender(e)) return;
    switchTab(id);
  });

  ipcMain.removeHandler('aegis-tabs-close');
  ipcMain.handle('aegis-tabs-close', (e, id: string) => {
    if (!isAuthorizedSender(e)) return;
    closeTab(id);
  });

  // Listen to both 'aegis-tabs-update-bounds' and 'set-tab-bounds'
  ipcMain.removeHandler('aegis-tabs-update-bounds');
  ipcMain.handle('aegis-tabs-update-bounds', (e, bounds: TabBounds) => {
    if (!isAuthorizedSender(e)) return;
    updateTabBounds(bounds);
  });

  ipcMain.removeAllListeners('set-tab-bounds');
  ipcMain.on('set-tab-bounds', (e, bounds: TabBounds) => {
    if (!isAuthorizedSender(e)) return;
    updateTabBounds(bounds);
  });

  ipcMain.removeHandler('set-tab-bounds');
  ipcMain.handle('set-tab-bounds', (e, bounds: TabBounds) => {
    if (!isAuthorizedSender(e)) return;
    updateTabBounds(bounds);
  });

  ipcMain.removeHandler('aegis-tabs-navigate');
  ipcMain.handle('aegis-tabs-navigate', (e, id: string, url: string) => {
    if (!isAuthorizedSender(e)) return;
    navigateTab(id, url);
  });

  ipcMain.removeHandler('aegis-tabs-reload');
  ipcMain.handle('aegis-tabs-reload', (e, id: string) => {
    if (!isAuthorizedSender(e)) return;
    reloadTab(id);
  });

  ipcMain.removeHandler('aegis-tabs-go-back');
  ipcMain.handle('aegis-tabs-go-back', (e, id: string) => {
    if (!isAuthorizedSender(e)) return;
    goBackTab(id);
  });

  ipcMain.removeHandler('aegis-tabs-go-forward');
  ipcMain.handle('aegis-tabs-go-forward', (e, id: string) => {
    if (!isAuthorizedSender(e)) return;
    goForwardTab(id);
  });

  ipcMain.removeHandler('aegis-tabs-zoom');
  ipcMain.handle('aegis-tabs-zoom', (e, id: string, factor: number) => {
    if (!isAuthorizedSender(e)) return;
    setTabZoom(id, factor);
  });

  ipcMain.removeHandler('aegis-tabs-get-active');
  ipcMain.handle('aegis-tabs-get-active', () => {
    if (!activeTabId || !tabs.has(activeTabId)) return null;
    const tab = tabs.get(activeTabId)!;
    return {
      id: tab.id,
      tabId: tab.id,
      url: tab.url,
      title: tab.title,
      canGoBack: tab.canGoBack,
      canGoForward: tab.canGoForward,
      isLoading: tab.isLoading,
      zoomFactor: tab.zoomFactor,
    };
  });
}
