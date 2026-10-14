/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavTab, UserAccount } from './types';
import { getStoredUser } from './services/authStorage';
import {
  getStoredSessionState,
  saveSessionState,
  restoreScrollPosition,
  clearSessionState,
} from './services/sessionStateService';
import { BrowserView } from './components/BrowserView';
import { DnsScannerView } from './components/DnsScannerView';
import { WebsiteComparatorView } from './components/WebsiteComparatorView';
import { ThreatBlockerView } from './components/ThreatBlockerView';
import { SecurityAnalyticsView } from './components/SecurityAnalyticsView';
import { ScienceSearchView } from './components/ScienceSearchView';
import { GeminiCopilotView } from './components/GeminiCopilotView';
import { AuthView } from './components/AuthView';
import { AboutUsView } from './components/AboutUsView';
import { ExtensionExportView } from './components/ExtensionExportView';
import { CloudflareVerificationModal } from './components/CloudflareVerificationModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import {
  getPrivacyModeStatus,
  togglePrivacyMode,
  clearBrowserCookies,
  EVENT_PRIVACY_MODE_CHANGE,
} from './services/privacyService';
import {
  getStoredTheme,
  applyThemeToDOM,
  AppThemeId,
  EVENT_THEME_CHANGE,
} from './services/themeService';
import {
  CheckCircle2,
  RotateCcw,
  Command,
  Puzzle,
  Minus,
  Square,
  X,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Lock,
  Star,
  BookOpen,
  Shield,
  ShieldAlert,
  Globe,
  GitCompare,
  Activity,
  Atom,
  Cpu,
  Monitor,
  Info,
  User,
  Palette,
  EyeOff,
  Zap,
  Plus,
  Menu,
} from 'lucide-react';

interface ExtensionDefinition {
  id: NavTab;
  title: string;
  category: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

const EXTENSIONS_LIST: ExtensionDefinition[] = [
  {
    id: 'dns-scanner',
    title: 'DNS Scanner & WHOIS',
    category: 'Network Security',
    desc: 'Live DNS record resolution, A/AAAA/CAA checks & nameserver audit',
    icon: Globe,
    color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30',
  },
  {
    id: 'compare',
    title: 'Compare Sites',
    category: 'Threat Analysis',
    desc: 'Side-by-side SSL grades, latency metrics & security score analysis',
    icon: GitCompare,
    color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30',
  },
  {
    id: 'threat-blocker',
    title: 'Threat Shield',
    category: 'Zero-Trust Defense',
    desc: 'Zero-trust sandbox, malware quarantining & heuristic URL classifier',
    icon: ShieldAlert,
    color: 'text-rose-400 bg-rose-950/80 border-rose-500/30',
  },
  {
    id: 'security-analytics',
    title: 'Security Analytics',
    category: 'Telemetry Radar',
    desc: 'Heuristic radar telemetry, live incident streams & TLS health index',
    icon: Activity,
    color: 'text-blue-400 bg-blue-950/80 border-blue-500/30',
  },
  {
    id: 'science',
    title: 'Science Skills',
    category: 'Research Engine',
    desc: 'Deep scientific search, PubMed index, AlphaFold structures & citations',
    icon: Atom,
    color: 'text-teal-300 bg-teal-950/80 border-teal-500/30',
  },
  {
    id: 'gemini-copilot',
    title: 'Aegis CyberBot',
    category: 'Cyber Security AI',
    desc: 'Specialized Python cybersecurity engine, exploit inspector & threat glossary',
    icon: Shield,
    color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30',
  },
  {
    id: 'extension',
    title: 'Chrome Extension Export',
    category: 'Chromium Tools',
    desc: 'Download Manifest V3 package & export Aegis Shield to Google Chrome',
    icon: Monitor,
    color: 'text-indigo-400 bg-indigo-950/80 border-indigo-500/30',
  },
  {
    id: 'auth',
    title: 'Identity Vault & Keys',
    category: 'Authentication',
    desc: 'Biometric passkeys, zero-knowledge encryption & session token vaults',
    icon: User,
    color: 'text-purple-400 bg-purple-950/80 border-purple-500/30',
  },
  {
    id: 'about',
    title: 'About Aegis 3D',
    category: 'Documentation',
    desc: 'Core architecture documentation, contributors & security team policy',
    icon: Info,
    color: 'text-slate-300 bg-slate-900 border-slate-700',
  },
];

const QUICK_BOOKMARKS = [
  { title: 'Cloudflare', url: 'https://cloudflare.com' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'PubMed Research', url: 'https://ncbi.nlm.nih.gov' },
  { title: 'arXiv Preprints', url: 'https://arxiv.org' },
  { title: 'Wikipedia', url: 'https://wikipedia.org' },
];

export default function App() {
  const initialSession = getStoredSessionState();

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    return initialSession?.activeNavTab || 'browser';
  });
  const [user, setUser] = useState<UserAccount | null>(() => getStoredUser());
  const [dnsTargetDomain, setDnsTargetDomain] = useState(() => initialSession?.dnsTargetDomain || 'cloudflare.com');
  const [compareSiteA, setCompareSiteA] = useState(() => initialSession?.compareSiteA || 'cloudflare.com');
  const [scienceInitialQuery, setScienceInitialQuery] = useState(() => initialSession?.scienceQuery || 'AlphaFold structural biology');
  const [browserInitialUrl, setBrowserInitialUrl] = useState(() => initialSession?.browser?.omnibarInput || 'https://cloudflare.com');
  const [browserOpenTabsCount, setBrowserOpenTabsCount] = useState(() => initialSession?.browser?.tabs?.length ?? 1);
  const [sessionToast, setSessionToast] = useState<string | null>(null);
  const [showCfModal, setShowCfModal] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Browser Chrome specific UI states
  const [isExtensionsMenuOpen, setIsExtensionsMenuOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<AppThemeId>(() => getStoredTheme());
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => getPrivacyModeStatus());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [urlInputValue, setUrlInputValue] = useState<string>(() => {
    return initialSession?.activeNavTab && initialSession.activeNavTab !== 'browser'
      ? `aegis://${initialSession.activeNavTab}`
      : initialSession?.browser?.omnibarInput || 'https://cloudflare.com';
  });

  // Global Ctrl+K / Cmd+K Command Palette Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    applyThemeToDOM(getStoredTheme());
  }, []);

  // Sync theme changes across application
  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      if (e.detail?.theme) {
        setCurrentTheme(e.detail.theme);
      }
    };
    window.addEventListener(EVENT_THEME_CHANGE, handleThemeEvent);
    return () => window.removeEventListener(EVENT_THEME_CHANGE, handleThemeEvent);
  }, []);

  // Sync privacy mode events across tabs & windows
  useEffect(() => {
    const handlePrivacyEvent = (e: any) => {
      if (typeof e.detail?.enabled === 'boolean') {
        setPrivacyMode(e.detail.enabled);
      }
    };
    window.addEventListener(EVENT_PRIVACY_MODE_CHANGE, handlePrivacyEvent);
    return () => window.removeEventListener(EVENT_PRIVACY_MODE_CHANGE, handlePrivacyEvent);
  }, []);

  // Restore scroll position & notify session resumption
  useEffect(() => {
    if (initialSession) {
      if (initialSession.scrollPosition?.y > 0 || initialSession.scrollPosition?.x > 0) {
        restoreScrollPosition(initialSession.scrollPosition.y, initialSession.scrollPosition.x);
      }
      const count = initialSession.browser?.tabs?.length ?? 1;
      setSessionToast(
        `Session Resumed: Restored ${count} tab${count === 1 ? '' : 's'}, omnibar content, and scroll position.`
      );
      const timer = setTimeout(() => setSessionToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Debounced window scroll position tracker
  useEffect(() => {
    let scrollTimeout: number;
    const handleScroll = () => {
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        saveSessionState({
          scrollPosition: { x: window.scrollX, y: window.scrollY },
        });
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Save activeNavTab, domain inputs on change
  useEffect(() => {
    saveSessionState({
      activeNavTab: activeTab,
      dnsTargetDomain,
      compareSiteA,
      scienceQuery: scienceInitialQuery,
    });
  }, [activeTab, dnsTargetDomain, compareSiteA, scienceInitialQuery]);

  // Sync address bar input value with activeTab and browserInitialUrl
  useEffect(() => {
    if (activeTab === 'browser') {
      setUrlInputValue(browserInitialUrl);
    } else {
      setUrlInputValue(`aegis://${activeTab}`);
    }
  }, [activeTab, browserInitialUrl]);

  useEffect(() => {
    // Listen for storage updates
    const handleStorage = () => {
      setUser(getStoredUser());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleScanDnsFromBrowser = (domain: string) => {
    setDnsTargetDomain(domain);
    setActiveTab('dns-scanner');
  };

  const handleOpenCompareFromBrowser = (domain: string) => {
    setCompareSiteA(domain);
    setActiveTab('compare');
  };

  const handleOpenScienceFromBrowser = (query: string) => {
    setScienceInitialQuery(query);
    setActiveTab('science');
  };

  const handleNavigateToBrowserFromSimulator = (url: string) => {
    setBrowserInitialUrl(url);
    setActiveTab('browser');
  };

  const handleResetSession = () => {
    clearSessionState();
    window.location.reload();
  };

  const handleTogglePrivacy = () => {
    const res = togglePrivacyMode();
    setPrivacyMode(res.enabled);
    setSessionToast(
      res.enabled
        ? 'Zero-Trace Privacy Mode Active: History and session cookies cleared.'
        : 'Standard Browsing Mode Active: Privacy mode disengaged.'
    );
    setTimeout(() => setSessionToast(null), 3500);
  };

  const handleAddressBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInputValue.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('aegis://')) {
      const ext = trimmed.replace('aegis://', '').toLowerCase() as NavTab;
      const validTabs: NavTab[] = [
        'browser',
        'dns-scanner',
        'compare',
        'threat-blocker',
        'security-analytics',
        'science',
        'gemini-copilot',
        'auth',
        'about',
        'extension',
      ];
      if (validTabs.includes(ext)) {
        setActiveTab(ext);
        return;
      }
    }

    let targetUrl = trimmed;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = `https://${targetUrl}`;
      } else {
        targetUrl = `https://duckduckgo.com/?q=${encodeURIComponent(targetUrl)}`;
      }
    }
    setBrowserInitialUrl(targetUrl);
    setActiveTab('browser');
  };

  const activeExtensionDef = EXTENSIONS_LIST.find((ext) => ext.id === activeTab);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Session Resumed / Privacy Toast Alert */}
      {sessionToast && (
        <div className="fixed top-24 right-4 z-50 max-w-md p-3.5 rounded-xl bg-cyan-950/95 border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sessionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSessionToast(null)}
            className="text-cyan-400 hover:text-cyan-100 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          ZONE 1: BROWSER TITLE BAR + TAB STRIP
          ========================================================================= */}
      <header className="h-10 sm:h-11 bg-[#070a13] border-b border-slate-800/80 px-2 sm:px-3 flex items-center justify-between gap-2 select-none shrink-0 z-30">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('browser')}
            className="flex items-center gap-1.5 focus:outline-none cursor-pointer group"
            title="Aegis 3D Safe Browser Home"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 text-xs sm:text-sm">
                AEGIS 3D
              </span>
              <span className="hidden lg:inline text-[9px] text-slate-500 font-mono tracking-wider uppercase border border-slate-800 px-1 py-0.2 rounded">
                SAFE BROWSER
              </span>
            </div>
          </button>
          <div className="h-4 w-px bg-slate-800 hidden xs:block mx-1" />
        </div>

        {/* Center: Browser Tab Strip */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none h-full px-1">
          {/* Primary Web Browser Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono transition-all cursor-pointer h-full border-t border-x ${
              activeTab === 'browser'
                ? 'bg-[#0f1523] text-cyan-300 border-slate-700/80 border-t-cyan-400 font-semibold shadow-sm'
                : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border-transparent'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'browser' ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="max-w-[120px] sm:max-w-[180px] truncate text-left">
              {browserInitialUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'Cloudflare: Web Security'}
            </span>
            {browserOpenTabsCount > 1 && (
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/30">
                {browserOpenTabsCount}
              </span>
            )}
          </button>

          {/* About Us Tab (Always visible in browser tab strip) */}
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono transition-all cursor-pointer h-full border-t border-x ${
              activeTab === 'about'
                ? 'bg-[#0f1523] text-cyan-300 border-slate-700/80 border-t-cyan-400 font-semibold shadow-sm'
                : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border-transparent'
            }`}
            title="About Aegis 3D: Architecture, Creators & Security Policy"
          >
            <Info className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'about' ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="truncate text-left">About Us</span>
          </button>

          {/* Active Extension Tab (renders dynamically when viewing other extension panels) */}
          {activeTab !== 'browser' && activeTab !== 'about' && activeExtensionDef && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono bg-[#0f1523] text-cyan-300 border-slate-700/80 border-t border-t-cyan-400 font-semibold shadow-sm h-full group"
            >
              <Puzzle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="max-w-[120px] sm:max-w-[160px] truncate">
                {activeExtensionDef.title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('browser');
                }}
                className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-0.5"
                title="Close Extension Panel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* New Tab Button [+] */}
          <button
            type="button"
            onClick={() => {
              setBrowserInitialUrl('https://cloudflare.com');
              setActiveTab('browser');
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
            title="Open New Web Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Privacy, Theme, User Profile & Window Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Privacy / Incognito Mode Toggle */}
          <button
            type="button"
            onClick={handleTogglePrivacy}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              privacyMode
                ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-purple-300 hover:border-purple-500/30'
            }`}
            title={
              privacyMode
                ? 'Privacy Mode is ACTIVE (zero history recorded)'
                : 'Activate Privacy Mode (clears session history & cookies)'
            }
          >
            <EyeOff className={`w-3.5 h-3.5 ${privacyMode ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden md:inline font-medium">
              {privacyMode ? 'Incognito' : 'Privacy'}
            </span>
          </button>

          {/* Theme Selector Trigger */}
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Customize visual theme"
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Theme</span>
          </button>

          {/* User Account / Vault Link */}
          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
              activeTab === 'auth'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-800'
            }`}
            title={user ? `Signed in as ${user.name}` : 'Sign In to Aegis Vault'}
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline max-w-[80px] truncate">{user ? user.name : 'Sign In'}</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-300 cursor-pointer"
            title="Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Decorative Window Controls (Chrome/OS Style) */}
          <div className="hidden sm:flex items-center gap-1 ml-1 pl-2 border-l border-slate-800 text-slate-400">
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              title="Minimize Window"
              onClick={() => {
                setSessionToast('Aegis browser window minimized.');
                setTimeout(() => setSessionToast(null), 2500);
              }}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              title="Maximize / Restore"
              onClick={() => {
                setSessionToast('Aegis browser window maximized.');
                setTimeout(() => setSessionToast(null), 2500);
              }}
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
              title="Reset Session and Purge Cache"
              onClick={handleResetSession}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          ZONE 2: ADDRESS BAR & TOOLBAR
          ========================================================================= */}
      <section className="h-11 sm:h-12 bg-[#0b101c] border-b border-slate-800/90 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 select-none shrink-0 relative z-20">
        {/* Navigation Buttons: Back, Forward, Reload */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'browser') {
                setActiveTab('browser');
              }
            }}
            disabled={activeTab === 'browser'}
            className={`p-1.5 rounded-lg border transition-colors ${
              activeTab !== 'browser'
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-cyan-500/40 cursor-pointer shadow-sm'
                : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
            }`}
            title={activeTab !== 'browser' ? 'Return to Browser' : 'Back'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled
            className="p-1.5 rounded-lg border bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed"
            title="Forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSessionToast('Reloading page with verified TLS certificates and clean DNS cache...');
              setTimeout(() => setSessionToast(null), 2500);
            }}
            className="p-1.5 rounded-lg border bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer"
            title="Reload Current Page"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Central Omnibar Address Bar */}
        <form
          onSubmit={handleAddressBarSubmit}
          className="flex-1 max-w-4xl flex items-center bg-slate-950/90 border border-slate-700/80 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50 rounded-xl px-2.5 sm:px-3 py-1 transition-all shadow-[0_0_15px_rgba(0,0,0,0.4)]"
        >
          {/* Security Indicator Icon */}
          <div className="flex items-center gap-1.5 mr-2 shrink-0">
            {activeTab === 'browser' ? (
              <span
                className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded"
                title="TLS 1.3 Verified Connection"
              >
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Secure</span>
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded"
                title="Aegis Sandboxed Internal Protocol"
              >
                <Puzzle className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Aegis Internal</span>
              </span>
            )}
          </div>

          {/* Editable URL Input */}
          <input
            type="text"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            placeholder="Search or enter web URL / aegis://extension"
            className="w-full bg-transparent text-xs sm:text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none"
          />

          {/* Right badges inside address bar */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {activeTab === 'browser' && (
              <span className="hidden md:inline text-[10px] font-mono text-teal-400 bg-teal-950/50 border border-teal-500/30 px-1.5 py-0.5 rounded">
                SSL A+
              </span>
            )}
            {/* Bookmark Star Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsBookmarked((prev) => !prev);
                setSessionToast(
                  !isBookmarked
                    ? `Added "${activeTab === 'browser' ? browserInitialUrl : `aegis://${activeTab}`}" to Bookmarks (★)`
                    : 'Removed from Bookmarks'
                );
                setTimeout(() => setSessionToast(null), 3000);
              }}
              className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                isBookmarked ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this Page (★)'}
            >
              <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </form>

        {/* Action Buttons: Read Later & Extensions Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Read Later Quick Trigger */}
          <button
            type="button"
            onClick={() => {
              setSessionToast(`Saved "${activeTab === 'browser' ? browserInitialUrl : `aegis://${activeTab}`}" to Reading Queue (📖)`);
              setTimeout(() => setSessionToast(null), 3000);
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border bg-slate-900 border-slate-700/80 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Add page to Read Later reading list"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Read Later</span>
          </button>

          {/* Extensions Puzzle-Piece Dropdown Button (🧩) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExtensionsMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                isExtensionsMenuOpen || activeTab !== 'browser'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-semibold'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-slate-800'
              }`}
              title="Aegis Security Extensions & Tools"
            >
              <Puzzle className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Extensions</span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform ${isExtensionsMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* EXTENSIONS DROPDOWN MENU */}
            {isExtensionsMenuOpen && (
              <>
                {/* Backdrop dismissal */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExtensionsMenuOpen(false)}
                />

                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-xs font-mono text-slate-200">
                        Installed Aegis Extensions
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">
                      {EXTENSIONS_LIST.length} Built-in
                    </span>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {EXTENSIONS_LIST.map((ext) => {
                      const Icon = ext.icon;
                      const isActive = activeTab === ext.id;
                      return (
                        <button
                          key={ext.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(ext.id);
                            setIsExtensionsMenuOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 group ${
                            isActive
                              ? 'bg-cyan-500/15 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-lg border shrink-0 ${ext.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-semibold font-mono truncate ${
                                  isActive ? 'text-cyan-300' : 'text-slate-200 group-hover:text-cyan-300'
                                }`}
                              >
                                {ext.title}
                              </span>
                              {isActive ? (
                                <span className="text-[9px] font-mono uppercase bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.2 rounded shrink-0">
                                  Active
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-slate-500 shrink-0">
                                  aegis://{ext.id}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {ext.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('extension');
                        setIsExtensionsMenuOpen(false);
                      }}
                      className="text-cyan-400 hover:text-cyan-200 hover:underline"
                    >
                      Export Manifest V3 Package →
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExtensionsMenuOpen(false)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ZONE 3: QUICK BOOKMARKS BAR
          ========================================================================= */}
      <section className="h-7 sm:h-8 bg-[#070a13] border-b border-slate-800/80 px-3 flex items-center gap-1.5 text-xs font-mono overflow-x-auto scrollbar-none select-none shrink-0 z-10">
        <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1 shrink-0">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="hidden md:inline">Bookmarks:</span>
        </span>
        {QUICK_BOOKMARKS.map((bm) => (
          <button
            key={bm.title}
            type="button"
            onClick={() => {
              setBrowserInitialUrl(bm.url);
              setActiveTab('browser');
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-800/80 text-slate-300 hover:text-cyan-300 text-[11px] transition-colors whitespace-nowrap shrink-0 group border border-transparent hover:border-slate-700 cursor-pointer"
            title={bm.url}
          >
            <Globe className="w-3 h-3 text-slate-400 group-hover:text-cyan-400" />
            <span>{bm.title}</span>
          </button>
        ))}
      </section>

      {/* =========================================================================
          ZONE 4: MAIN CONTENT (Full Viewport, No max-width, Scrollable)
          ========================================================================= */}
      <div className="flex-1 overflow-auto overflow-x-hidden min-h-0 bg-[#030712] relative flex flex-col">
        {/* Browser View Content */}
        {activeTab === 'browser' && (
          <div className="w-full flex-1">
            <BrowserView
              initialUrl={browserInitialUrl}
              onScanDns={handleScanDnsFromBrowser}
              onOpenCompare={handleOpenCompareFromBrowser}
              onOpenScience={handleOpenScienceFromBrowser}
              onTabsCountChange={setBrowserOpenTabsCount}
            />
          </div>
        )}

        {/* Extension Panel Content (treated as browser extension pages) */}
        {activeTab !== 'browser' && (
          <div className="w-full flex-1 flex flex-col">
            {/* Extension Header Banner */}
            <div className="bg-slate-900/90 border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between text-xs font-mono sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Puzzle className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">
                    {activeExtensionDef?.title || activeTab}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-cyan-400 bg-cyan-950 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[10px]">
                    aegis://{activeTab}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('browser')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500/40 transition-colors text-xs font-mono cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Return to Browser</span>
                <X className="w-3 h-3 ml-1 text-slate-400" />
              </button>
            </div>

            {/* Extension View Body */}
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
              {activeTab === 'dns-scanner' && (
                <DnsScannerView initialDomain={dnsTargetDomain} />
              )}

              {activeTab === 'compare' && (
                <WebsiteComparatorView initialSiteA={compareSiteA} initialSiteB="wikipedia.org" />
              )}

              {activeTab === 'threat-blocker' && (
                <ThreatBlockerView
                  onNavigateToBrowser={handleNavigateToBrowserFromSimulator}
                  currentBrowserUrl={browserInitialUrl}
                />
              )}

              {activeTab === 'security-analytics' && (
                <SecurityAnalyticsView
                  onNavigateToBrowserUrl={handleNavigateToBrowserFromSimulator}
                  onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                />
              )}

              {activeTab === 'science' && (
                <ScienceSearchView initialQuery={scienceInitialQuery} />
              )}

              {activeTab === 'gemini-copilot' && (
                <GeminiCopilotView />
              )}

              {activeTab === 'auth' && (
                <AuthView
                  currentUser={user}
                  onUserChange={setUser}
                  onNavigateToBrowserUrl={handleNavigateToBrowserFromSimulator}
                />
              )}

              {activeTab === 'about' && (
                <AboutUsView />
              )}

              {activeTab === 'extension' && (
                <ExtensionExportView
                  onOpenInFullBrowser={handleNavigateToBrowserFromSimulator}
                  onOpenVault={() => setActiveTab('auth')}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ZONE 5: BROWSER STATUS BAR
          ========================================================================= */}
      <footer className="h-7 bg-[#070a13] border-t border-slate-800/80 text-[11px] font-mono text-slate-400 px-3 flex items-center justify-between select-none shrink-0 z-30">
        {/* Left Telemetry Indicators */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Secure</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 flex items-center gap-1">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>SSL: <strong className="text-emerald-400">A+</strong></span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Latency: <strong className="text-cyan-300">24ms</strong>
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            Trackers: <strong className="text-amber-400">6 blocked</strong>
          </span>
          <span className="text-slate-600 hidden lg:inline">|</span>
          <span className="text-slate-400 hidden lg:inline flex items-center gap-1">
            <span>TLS:</span>
            <span className="text-teal-300 font-bold">ML-KEM-768</span>
          </span>
        </div>

        {/* Center / Contributors Credits */}
        <div className="hidden xl:flex items-center gap-2 text-[10px] text-slate-500 truncate">
          <span>Aegis 3D Safe Browser</span>
          <span>·</span>
          <span>Created by <strong className="text-slate-300 font-medium">Narendra Borhade</strong></span>
          <span>·</span>
          <span>Frontend by <strong className="text-cyan-300 font-medium">Aditya Gaikwad</strong></span>
          <a
            href="mailto:gaikwadaditya0309@gmail.com"
            className="text-cyan-400/80 hover:text-cyan-300 hover:underline"
            title="Email Frontend Developer Aditya Gaikwad"
          >
            (gaikwadaditya0309@gmail.com)
          </a>
          <span>·</span>
          <span>Security by <strong className="text-teal-300 font-medium">Ghanshyam Jadhav</strong></span>
          <a
            href="mailto:ghanshamjadhav8210@gmail.com"
            className="text-teal-400/80 hover:text-teal-300 hover:underline"
            title="Email Security Contributor Ghanshyam Jadhav"
          >
            (ghanshamjadhav8210@gmail.com)
          </a>
        </div>

        {/* Right Status Actions & Shortlinks */}
        <div className="flex items-center gap-3 shrink-0 text-slate-400">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hover:text-cyan-300 transition-colors hidden sm:flex items-center gap-1 cursor-pointer"
            title="Open Command Palette (Ctrl+K or ⌘K)"
          >
            <Command className="w-3 h-3 text-cyan-400" />
            <span>Palette (Ctrl+K)</span>
          </button>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <button
            type="button"
            onClick={() => setShowCfModal(true)}
            className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer text-amber-400/90"
            title="Cloudflare Turnstile Verified Protection"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="hidden xs:inline">Verified</span>
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={handleResetSession}
            className="hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset Session and Purge Storage"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <span className="text-slate-600 hidden md:inline">|</span>
          <button
            type="button"
            onClick={() => setActiveTab('extension')}
            className="hover:text-cyan-300 transition-colors hidden md:inline cursor-pointer"
            title="Chrome Extension & Vercel Export"
          >
            Extension
          </button>
          <span className="text-slate-600 hidden md:inline">|</span>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className="hover:text-cyan-300 transition-colors hidden md:inline cursor-pointer text-slate-300"
            title="Team & Security Policy"
          >
            Team
          </button>
        </div>
      </footer>

      {/* =========================================================================
          MODALS & OVERLAYS
          ========================================================================= */}
      {/* Global Command Palette Modal (Ctrl+K or Cmd+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onNavigateToBrowserUrl={handleNavigateToBrowserFromSimulator}
        onOpenCloudflareModal={() => setShowCfModal(true)}
        onTogglePrivacyMode={() => {
          const res = togglePrivacyMode();
          setSessionToast(
            res.enabled
              ? 'Zero-Trace Privacy Mode Active: History and session cookies cleared.'
              : 'Standard Browsing Mode Active: Privacy mode disengaged.'
          );
          setTimeout(() => setSessionToast(null), 3500);
        }}
        onPurgeCookies={() => {
          const count = clearBrowserCookies();
          setSessionToast(`Purged ${count} browser cookies and cleared session tokens.`);
          setTimeout(() => setSessionToast(null), 3500);
        }}
        onResetSession={handleResetSession}
        isPrivacyModeActive={getPrivacyModeStatus()}
      />

      {/* Cloudflare Verification Challenge Modal */}
      <CloudflareVerificationModal
        isOpen={showCfModal}
        onClose={() => setShowCfModal(false)}
      />

      {/* Custom Visual Themes Switcher Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onThemeSelect={(t) => setCurrentTheme(t)}
      />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-950/80 backdrop-blur-md">
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          <div className="bg-slate-950 border-t border-cyan-500/30 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-slate-100 font-mono">Aegis Navigation Drawer</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('browser');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs flex items-center gap-2.5"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Web Browser Main View</span>
              </button>

              {EXTENSIONS_LIST.map((ext) => {
                const Icon = ext.icon;
                return (
                  <button
                    key={ext.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(ext.id);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-850 text-slate-300 font-mono text-xs flex items-center gap-2.5"
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{ext.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleTogglePrivacy();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-mono text-purple-400 flex items-center gap-1.5"
              >
                <EyeOff className="w-4 h-4" />
                <span>Toggle Privacy Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsThemeModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-mono text-cyan-400 flex items-center gap-1.5"
              >
                <Palette className="w-4 h-4" />
                <span>Change Theme</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Offline Mode & Service Worker Shell Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
