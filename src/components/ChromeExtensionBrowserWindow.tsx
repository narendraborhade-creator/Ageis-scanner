import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Lock,
  Star,
  Puzzle,
  MoreVertical,
  Plus,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Bookmark,
  Cpu,
  KeyRound,
  Eye,
  Maximize2,
  Minimize2,
  Download,
  Terminal,
} from 'lucide-react';

export interface ExtensionTabItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  isHttps: boolean;
  sslGrade: 'A+' | 'A' | 'B' | 'C';
  threatStatus: 'clean' | 'warning' | 'blocked';
  trackersBlocked: number;
  securityScore: number;
  latencyMs: number;
  history: string[];
  historyIndex: number;
}

const DEFAULT_TABS: ExtensionTabItem[] = [
  {
    id: 'ext-tab-1',
    title: 'Cloudflare - Connectivity Cloud',
    url: 'https://cloudflare.com',
    domain: 'cloudflare.com',
    isHttps: true,
    sslGrade: 'A+',
    threatStatus: 'clean',
    trackersBlocked: 0,
    securityScore: 99,
    latencyMs: 14,
    history: ['https://cloudflare.com'],
    historyIndex: 0,
  },
  {
    id: 'ext-tab-2',
    title: 'GitHub: Where the world builds software',
    url: 'https://github.com',
    domain: 'github.com',
    isHttps: true,
    sslGrade: 'A+',
    threatStatus: 'clean',
    trackersBlocked: 2,
    securityScore: 96,
    latencyMs: 28,
    history: ['https://github.com'],
    historyIndex: 0,
  },
  {
    id: 'ext-tab-3',
    title: 'arXiv: Scientific Papers Database',
    url: 'https://arxiv.org/abs/2301.00001',
    domain: 'arxiv.org',
    isHttps: true,
    sslGrade: 'A',
    threatStatus: 'clean',
    trackersBlocked: 1,
    securityScore: 92,
    latencyMs: 45,
    history: ['https://arxiv.org/abs/2301.00001'],
    historyIndex: 0,
  },
];

const QUICK_BOOKMARKS = [
  { title: 'GitHub', url: 'https://github.com', domain: 'github.com' },
  { title: 'Cloudflare', url: 'https://cloudflare.com', domain: 'cloudflare.com' },
  { title: 'Wikipedia', url: 'https://wikipedia.org', domain: 'wikipedia.org' },
  { title: 'arXiv Science', url: 'https://arxiv.org', domain: 'arxiv.org' },
  { title: 'NASA JPL', url: 'https://nasa.gov', domain: 'nasa.gov' },
  { title: 'DuckDuckGo', url: 'https://duckduckgo.com', domain: 'duckduckgo.com' },
];

interface ChromeExtensionBrowserWindowProps {
  onOpenInFullBrowser?: (url: string) => void;
  onOpenVault?: () => void;
}

export const ChromeExtensionBrowserWindow: React.FC<ChromeExtensionBrowserWindowProps> = ({
  onOpenInFullBrowser,
  onOpenVault,
}) => {
  const [tabs, setTabs] = useState<ExtensionTabItem[]>(DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState<string>('ext-tab-2');
  const [inputUrl, setInputUrl] = useState<string>('https://github.com');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(true);
  const [showExtensionPopup, setShowExtensionPopup] = useState<boolean>(false);
  const [showChromeMenu, setShowChromeMenu] = useState<boolean>(false);
  const [showSslModal, setShowSslModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Synchronize omnibar text when active tab changes
  useEffect(() => {
    if (activeTab) {
      setInputUrl(activeTab.url);
      setIsBookmarked(QUICK_BOOKMARKS.some((b) => b.url === activeTab.url));
    }
  }, [activeTabId]);

  // Navigate active tab to new URL or search query
  const handleNavigate = (rawTarget: string, openInNewTab = false) => {
    let target = rawTarget.trim();
    if (!target) return;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        // Search query
        target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
      }
    }

    let domain = 'web';
    try {
      domain = new URL(target).hostname;
    } catch {
      domain = target.replace(/https?:\/\//, '').split('/')[0];
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);

    const isSuspicious = target.includes('phish') || target.includes('malware') || target.endsWith('.xyz');

    if (openInNewTab) {
      const newId = 'ext-tab-' + Date.now();
      const newTabItem: ExtensionTabItem = {
        id: newId,
        title: domain.replace('www.', ''),
        url: target,
        domain: domain,
        isHttps: target.startsWith('https://'),
        sslGrade: isSuspicious ? 'C' : 'A+',
        threatStatus: isSuspicious ? 'blocked' : 'clean',
        trackersBlocked: isSuspicious ? 12 : 1,
        securityScore: isSuspicious ? 22 : 95,
        latencyMs: Math.floor(Math.random() * 30) + 12,
        history: [target],
        historyIndex: 0,
      };
      setTabs((prev) => [...prev, newTabItem]);
      setActiveTabId(newId);
    } else {
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id === activeTabId) {
            const nextHistory = [...tab.history.slice(0, tab.historyIndex + 1), target];
            return {
              ...tab,
              title: domain.replace('www.', ''),
              url: target,
              domain: domain,
              isHttps: target.startsWith('https://'),
              sslGrade: isSuspicious ? 'C' : 'A+',
              threatStatus: isSuspicious ? 'blocked' : 'clean',
              trackersBlocked: isSuspicious ? 12 : tab.trackersBlocked,
              securityScore: isSuspicious ? 22 : 95,
              history: nextHistory,
              historyIndex: nextHistory.length - 1,
            };
          }
          return tab;
        })
      );
    }
  };

  const handleAddNewTab = () => {
    const newId = 'ext-tab-' + Date.now();
    const newTabItem: ExtensionTabItem = {
      id: newId,
      title: 'New Tab',
      url: 'https://duckduckgo.com',
      domain: 'duckduckgo.com',
      isHttps: true,
      sslGrade: 'A+',
      threatStatus: 'clean',
      trackersBlocked: 0,
      securityScore: 98,
      latencyMs: 15,
      history: ['https://duckduckgo.com'],
      historyIndex: 0,
    };
    setTabs((prev) => [...prev, newTabItem]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (idToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // Don't close last tab, reset to start page
      handleNavigate('https://cloudflare.com');
      return;
    }
    const filtered = tabs.filter((t) => t.id !== idToClose);
    setTabs(filtered);
    if (activeTabId === idToClose) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  const handleBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const nextIdx = activeTab.historyIndex - 1;
    const prevUrl = activeTab.history[nextIdx];
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, url: prevUrl, historyIndex: nextIdx } : t))
    );
  };

  const handleForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    const nextIdx = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[nextIdx];
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, url: nextUrl, historyIndex: nextIdx } : t))
    );
  };

  const handleReload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  return (
    <div
      className={`w-full transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#090d16] p-2 flex flex-col'
          : 'relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#090d16] shadow-[0_0_50px_rgba(6,182,212,0.15)]'
      }`}
    >
      {/* 1. Authentic Chrome Window Title Bar */}
      <div className="bg-[#1e222d] border-b border-[#2d3343] px-3 py-1.5 flex items-center justify-between select-none">
        {/* Left: Extension Wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Shield className="w-3 h-3" />
          </div>
          <span className="text-xs font-sans font-medium text-slate-300 flex items-center gap-1.5">
            <span>Aegis Safe Browser</span>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/30">
              Chrome Extension v2.4
            </span>
          </span>
        </div>

        {/* Center: Active tab title badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono max-w-sm truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate">{activeTab?.title}</span>
        </div>

        {/* Right: Window Control Buttons (Chrome Style: Minimize, Maximize, Close) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Browser Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 cursor-pointer" title="Minimize" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 cursor-pointer" title="Expand" />
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80 cursor-pointer" title="Close" />
        </div>
      </div>

      {/* 2. Authentic Chrome Tab Strip */}
      <div className="bg-[#141824] px-2 pt-2 flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-[#252c3d]">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group relative flex items-center gap-2 px-3 py-2 max-w-[210px] min-w-[120px] rounded-t-xl text-xs font-sans cursor-pointer transition-all border-t border-x ${
                  isActive
                    ? 'bg-[#1e2333] text-slate-100 border-[#3b445c] shadow-sm font-medium z-10'
                    : 'bg-[#10141f] text-slate-400 border-transparent hover:bg-[#181d2c] hover:text-slate-300'
                }`}
              >
                {/* Tab Favicon */}
                <div className="shrink-0">
                  {tab.threatStatus === 'blocked' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  ) : tab.domain.includes('github') ? (
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  ) : tab.domain.includes('cloudflare') ? (
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>

                {/* Tab Title */}
                <span className="truncate flex-1 text-left text-[11px] leading-tight select-none">
                  {tab.title}
                </span>

                {/* Tab Close 'x' button */}
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 opacity-60 group-hover:opacity-100 hover:bg-slate-700/80 hover:text-slate-100 transition-colors"
                  title="Close Tab"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}

          {/* Chrome '+' New Tab Button */}
          <button
            type="button"
            onClick={handleAddNewTab}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#1e2333] hover:text-cyan-300 transition-colors ml-1 shrink-0"
            title="Open New Tab inside Extension"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Authentic Chrome Omnibar Navigation Toolbar */}
      <div className="bg-[#1e2333] px-3 py-2 border-b border-[#2b3347] flex items-center gap-2">
        {/* Navigation Buttons: Back, Forward, Reload, Home */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={handleBack}
            disabled={!activeTab || activeTab.historyIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Click to go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Click to go forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReload}
            className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${isLoading ? 'animate-spin text-cyan-400' : ''}`}
            title="Reload this page"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('https://cloudflare.com')}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors hidden sm:block"
            title="Open home page"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Omnibar (Address Input) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(inputUrl);
          }}
          className="flex-1 flex items-center gap-2 bg-[#121622] rounded-full px-3.5 py-1.5 border border-[#2e374d] focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all text-xs"
        >
          {/* SSL Lock button */}
          <button
            type="button"
            onClick={() => setShowSslModal(!showSslModal)}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono transition-colors shrink-0"
            title="View site security & SSL grade"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden xs:inline">{activeTab?.sslGrade || 'A+'}</span>
          </button>

          {/* URL text input */}
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Search with DuckDuckGo or enter URL (e.g. github.com)"
            className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none font-mono text-xs"
          />

          {/* Omnibar Star Bookmark action */}
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`transition-colors shrink-0 ${isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="Bookmark this tab"
          >
            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>
        </form>

        {/* Extension Toolbar: Chrome Extension Puzzle + Aegis Shield Extension Action + Menu */}
        <div className="flex items-center gap-1 relative text-slate-300">
          {/* Aegis Shield Extension Action (Click opens Extension HUD) */}
          <button
            type="button"
            onClick={() => setShowExtensionPopup(!showExtensionPopup)}
            className={`relative p-1.5 rounded-lg border transition-all ${
              showExtensionPopup
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'hover:bg-slate-800 text-cyan-400 border-transparent'
            }`}
            title="Aegis 3D Safe Browser Extension HUD"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950 flex items-center justify-center font-mono">
              ✓
            </span>
          </button>

          {/* Chrome Extensions Puzzle Icon */}
          <button
            type="button"
            onClick={() => setShowExtensionPopup(!showExtensionPopup)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
            title="Extensions"
          >
            <Puzzle className="w-4 h-4" />
          </button>

          {/* Chrome 3-Dots Menu */}
          <button
            type="button"
            onClick={() => setShowChromeMenu(!showChromeMenu)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Customize and control Aegis"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Extension HUD Popout Overlay (When Extension Icon is Clicked) */}
          {showExtensionPopup && (
            <div className="absolute right-0 top-10 z-50 w-80 glass-panel rounded-2xl p-4 border border-cyan-500/40 shadow-2xl bg-slate-950/95 space-y-3 font-sans animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-cyan-500/20 text-cyan-300">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">Aegis 3D Extension HUD</h5>
                    <span className="text-[10px] text-emerald-400 font-mono">Zero-Trust Guard: ACTIVE</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExtensionPopup(false)}
                  className="text-slate-400 hover:text-slate-100 text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Live domain metrics */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Current Site</span>
                  <span className="text-cyan-300 font-bold truncate max-w-[140px]">
                    {activeTab?.domain}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Trackers Blocked</span>
                  <span className="text-emerald-400 font-bold">{activeTab?.trackersBlocked} Blocked</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">DoH DNS Security</span>
                  <span className="text-teal-300 font-bold">1.1.1.1 Encrypted</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Open Tabs</span>
                  <span className="text-slate-200">{tabs.length} Running in Extension</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                {onOpenVault && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtensionPopup(false);
                      onOpenVault();
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-mono transition-colors text-center"
                  >
                    Open Password Vault
                  </button>
                )}
                {onOpenInFullBrowser && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtensionPopup(false);
                      onOpenInFullBrowser(activeTab.url);
                    }}
                    className="flex-1 py-1.5 px-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-lg text-[11px] transition-all text-center"
                  >
                    Full 3D View
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Chrome 3-Dots Dropdown Menu */}
          {showChromeMenu && (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1 text-xs text-slate-300 font-sans space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  handleAddNewTab();
                  setShowChromeMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between"
              >
                <span>New Tab</span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+T</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenVault) onOpenVault();
                  setShowChromeMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-cyan-300"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Web Crypto Passwords</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleNavigate('https://github.com', true);
                  setShowChromeMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open GitHub in Tab</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                  setShowChromeMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Toggle Fullscreen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Authentic Chrome Bookmarks Bar */}
      <div className="bg-[#181d2a] px-3 py-1.5 border-b border-[#242b3b] flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] text-slate-300 font-sans">
        <Bookmark className="w-3 h-3 text-cyan-400 shrink-0" />
        <span className="text-slate-500 text-[10px] font-mono shrink-0">Bookmarks:</span>
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
          {QUICK_BOOKMARKS.map((b) => (
            <button
              key={b.url}
              type="button"
              onClick={() => handleNavigate(b.url)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 text-slate-300"
            >
              <Globe className="w-2.5 h-2.5 text-slate-400" />
              <span>{b.title}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNavigate('https://cloudflare.com/threat-test.html', true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 transition-colors whitespace-nowrap shrink-0"
          >
            <Shield className="w-2.5 h-2.5 text-rose-400" />
            <span>Threat Simulation Tab</span>
          </button>
        </div>
      </div>

      {/* 5. Browser Tab Content Canvas (Opens all tabs in it itself!) */}
      <div className="flex-1 bg-[#090d16] min-h-[460px] p-4 sm:p-6 flex flex-col justify-between space-y-6">
        {/* Active Tab Header Card */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 bg-slate-950/80 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${
                  activeTab.threatStatus === 'blocked'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                }`}
              >
                {activeTab.threatStatus === 'blocked' ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                ) : (
                  <Globe className="w-6 h-6 text-cyan-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{activeTab.title}</h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      activeTab.threatStatus === 'blocked'
                        ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {activeTab.threatStatus === 'blocked' ? 'MALWARE BLOCKED' : 'VERIFIED SAFE'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                  <span className="text-cyan-400">{activeTab.url}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeTab.domain}</span>
                </div>
              </div>
            </div>

            {/* Quick in-tab actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigate('https://github.com', true)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open github.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('https://wikipedia.org', true)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-teal-400" />
                <span>Open wikipedia.org</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Security & Web Content Inspector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <span className="text-[10px] uppercase font-mono text-slate-400">SSL / TLS Cipher</span>
            <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>TLS 1.3 / Grade {activeTab.sslGrade}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Validated using DoH DNS (1.1.1.1). Forward secrecy enabled with ECDHE key exchange.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <span className="text-[10px] uppercase font-mono text-slate-400">Active Tab Protection</span>
            <div className="text-base font-bold text-cyan-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>{activeTab.trackersBlocked} Trackers Blocked</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Heuristic script sandbox preventing canvas fingerprinting and DOM injection attacks.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <span className="text-[10px] uppercase font-mono text-slate-400">Latency & Integrity</span>
            <div className="text-base font-bold text-teal-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>{activeTab.latencyMs} ms · Score {activeTab.securityScore}/100</span>
            </div>
            <p className="text-[11px] text-slate-400">
              High speed edge routing with zero telemetry transmission or ad-network beacons.
            </p>
          </div>
        </div>

        {/* Simulated Web Viewport Frame */}
        <div className="rounded-xl border border-slate-800 bg-[#060912] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-slate-300">
                Sandboxed Webpage Engine: <span className="text-cyan-400">{activeTab.url}</span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Tabs Running in Extension: {tabs.length}
            </span>
          </div>

          {/* Webpage Content Simulation */}
          {activeTab.domain.includes('github') ? (
            <div className="space-y-4 text-xs font-sans text-slate-300">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                    GH
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">github.com / narendra-borade / aegis-browser</h4>
                    <p className="text-[11px] text-slate-400">Safe Web Browser with 3D Cyber Scene and Extension</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-indigo-300">Public Repo</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="text-slate-400">// Repository clone command</div>
                <div className="text-cyan-300 bg-slate-900 p-2 rounded select-all">git clone https://github.com/narendra-borade/aegis-browser.git</div>
                <div className="text-slate-400 pt-2">// In-Tab status</div>
                <div className="text-emerald-400">✓ Page loaded directly inside Aegis Chrome Extension window!</div>
              </div>
            </div>
          ) : activeTab.domain.includes('cloudflare') ? (
            <div className="space-y-4 text-xs font-sans text-slate-300">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                    CF
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100">Cloudflare Edge & DNS Services</h4>
                    <p className="text-[11px] text-slate-400">DoH 1.1.1.1 Gateway with Zero Trust Access & WAF</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-950 text-emerald-300">Operational</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="text-slate-400">Edge Gateway Ping: <span className="text-emerald-400 font-bold">14ms</span></div>
                <div className="text-slate-400">DNSSEC Enforcement: <span className="text-cyan-300 font-bold">Strict Validation</span></div>
                <div className="text-slate-400">Malicious Requests Blocked: <span className="text-amber-300 font-bold">1,842 requests</span></div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3 font-mono text-xs">
              <Globe className="w-8 h-8 mx-auto text-cyan-400 opacity-80" />
              <div className="text-slate-200 font-bold">Viewing: {activeTab.title}</div>
              <p className="text-slate-400 text-[11px] max-w-md mx-auto">
                Navigated safely to <code>{activeTab.url}</code>. All tabs, cookies, and network requests are managed directly within this extension window.
              </p>
            </div>
          )}
        </div>

        {/* Bottom tab switcher bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-500">Tabs ({tabs.length}):</span>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  tab.id === activeTabId
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.domain}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddNewTab}
              className="text-cyan-400 hover:underline font-mono text-[11px] flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>New Tab</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
