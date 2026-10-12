import React, { useState, useEffect } from 'react';
import { NavTab, UserAccount } from '../types';
import {
  getPrivacyModeStatus,
  togglePrivacyMode,
  EVENT_PRIVACY_MODE_CHANGE,
  clearBrowserCookies,
} from '../services/privacyService';
import {
  Shield,
  Globe,
  Cpu,
  User,
  Download,
  Info,
  Search,
  GitCompare,
  Atom,
  EyeOff,
  Eye,
  Menu,
  X,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  Monitor,
  Zap,
  Activity,
  Palette,
} from 'lucide-react';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import {
  getStoredTheme,
  applyThemeToDOM,
  AppThemeId,
  EVENT_THEME_CHANGE,
  AVAILABLE_THEMES,
} from '../services/themeService';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserAccount | null;
  openTabsCount?: number;
  onOpenCloudflareVerify?: () => void;
  onOpenCommandPalette?: () => void;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'browser', label: 'Browser', icon: Search },
  { id: 'dns-scanner', label: 'DNS Scan', icon: Globe },
  { id: 'compare', label: 'Compare Sites', icon: GitCompare },
  { id: 'threat-blocker', label: 'Threat Shield', icon: Shield },
  { id: 'security-analytics', label: 'Security Analytics', icon: Activity },
  { id: 'science', label: 'Science Skills', icon: Atom },
  { id: 'gemini-copilot', label: 'Gemini AI', icon: Cpu },
  { id: 'extension', label: 'Chrome Extension', icon: Monitor },
  { id: 'about', label: 'About Us', icon: Info },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  user,
  openTabsCount = 1,
  onOpenCloudflareVerify,
  onOpenCommandPalette,
}) => {
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => getPrivacyModeStatus());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [themeModalOpen, setThemeModalOpen] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<AppThemeId>(() => getStoredTheme());

  // Sync theme across application & windows
  useEffect(() => {
    applyThemeToDOM(currentTheme);

    const handleThemeEvent = (e: any) => {
      if (e.detail?.theme) {
        setCurrentTheme(e.detail.theme);
      }
    };
    window.addEventListener(EVENT_THEME_CHANGE, handleThemeEvent);
    return () => window.removeEventListener(EVENT_THEME_CHANGE, handleThemeEvent);
  }, [currentTheme]);

  // Sync privacy mode events across tabs and windows
  useEffect(() => {
    const handlePrivacyEvent = (e: any) => {
      if (typeof e.detail?.enabled === 'boolean') {
        setPrivacyMode(e.detail.enabled);
      }
    };
    window.addEventListener(EVENT_PRIVACY_MODE_CHANGE, handlePrivacyEvent);
    return () => window.removeEventListener(EVENT_PRIVACY_MODE_CHANGE, handlePrivacyEvent);
  }, []);

  const handleTogglePrivacy = () => {
    const res = togglePrivacyMode();
    setPrivacyMode(res.enabled);

    if (res.enabled) {
      setToastMessage(
        'Zero-Trace Privacy Mode Active: Browsing history and session cookies cleared for this session.'
      );
    } else {
      setToastMessage('Standard Mode Active: Ephemeral privacy mode disengaged.');
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleManualClearData = () => {
    clearBrowserCookies();
    setToastMessage('Session cookies and local cache purged.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleMobileNavSelect = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-cyan-500/20 backdrop-blur-2xl">
        {/* Primary Top Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('browser')}
            className="flex items-center gap-2 sm:gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-sm sm:text-base md:text-lg leading-tight">
                AEGIS 3D
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-widest uppercase -mt-0.5 sm:-mt-1 hidden xs:inline">
                Safe Web Browser
              </span>
            </div>
          </button>

          {/* Zone 2: Desktop Navigation Links (Hidden on small mobile screens) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-medium text-slate-300 flex-1 max-w-3xl justify-center">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)] font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? item.id === 'threat-blocker'
                          ? 'text-rose-400'
                          : item.id === 'science'
                          ? 'text-teal-300'
                          : item.id === 'gemini-copilot'
                          ? 'text-amber-400'
                          : 'text-cyan-300'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.id === 'browser' && openTabsCount > 1 && (
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-500/30">
                      {openTabsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Privacy Mode Toggle & Actions (Desktop & Mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Command Palette Quick Switcher Trigger */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border bg-slate-900/90 border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)] group"
                title="Open Command Palette & Quick Switcher (Ctrl+K or ⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Quick Switcher</span>
                <kbd className="hidden sm:inline-flex items-center text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1 rounded ml-0.5">
                  ⌘K
                </kbd>
                <span className="sm:hidden font-bold">⌘K</span>
              </button>
            )}

            {/* In-App PWA Install Action */}
            <PWAInstallButton />

            {/* Cloudflare Turnstile Verification */}
            {onOpenCloudflareVerify && (
              <button
                type="button"
                onClick={onOpenCloudflareVerify}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border bg-slate-900 border-amber-500/40 text-amber-300 hover:bg-amber-950/40 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                title="Cloudflare Turnstile Verified: DDoS & Bot Protection Active"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Cloudflare</span>
                <span className="sm:hidden font-bold">CF</span>
              </button>
            )}

            {/* Custom Visual Themes Switcher */}
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border bg-slate-900 border-slate-700/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-slate-850"
              title="Customize visual theme (Cyberpunk, OLED, Matrix, Amber, Violet, Slate)"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Theme</span>
            </button>

            {/* Privacy Mode Toggle */}
            <button
              type="button"
              onClick={handleTogglePrivacy}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                privacyMode
                  ? 'bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-purple-300 hover:border-purple-500/30'
              }`}
              title={
                privacyMode
                  ? 'Privacy Mode is ACTIVE (zero history or cookies recorded)'
                  : 'Activate Privacy Mode (clears history & cookies for this session)'
              }
            >
              <EyeOff className={`w-3.5 h-3.5 ${privacyMode ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {privacyMode ? 'Privacy: ON' : 'Privacy Mode'}
              </span>
              <span className="sm:hidden font-bold">
                {privacyMode ? 'Incognito' : 'Privacy'}
              </span>
            </button>

            {/* Desktop User Account Link */}
            <button
              type="button"
              onClick={() => onSelectTab('auth')}
              className={`hidden sm:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'auth'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-200 bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline max-w-[100px] truncate">
                {user ? user.name : 'Sign In'}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                {user?.databaseProvider === 'firebase'
                  ? 'Firebase'
                  : user?.databaseProvider === 'mongodb'
                  ? 'MongoDB'
                  : 'DB'}
              </span>
            </button>

            {/* Mobile Hamburger / Menu Button (Mobile Only) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Toast Alert Notification for Privacy Mode Activations */}
        {toastMessage && (
          <div className="bg-gradient-to-r from-purple-950/95 via-slate-950 to-cyan-950/95 border-b border-purple-500/40 px-4 py-2 text-xs font-mono flex items-center justify-between text-purple-200 shadow-xl transition-all">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-200 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* MOBILE FULL-SCREEN SLIDE-OUT DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-950/80 backdrop-blur-md">
          {/* Overlay dismissal */}
          <div
            className="flex-1"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="bg-slate-950 border-t border-cyan-500/30 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-slate-100 font-mono">Aegis Mobile Navigator</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Privacy Mode Card */}
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <EyeOff className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-xs font-bold text-purple-200">Zero-Trace Privacy Mode</div>
                  <div className="text-[10px] text-slate-400">Clears history & cookies on enable</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTogglePrivacy}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  privacyMode
                    ? 'bg-purple-500 text-slate-950'
                    : 'bg-slate-900 border border-slate-800 text-purple-300'
                }`}
              >
                {privacyMode ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Mobile Command Palette Quick Switcher Trigger */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCommandPalette();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs font-mono text-cyan-200 hover:bg-cyan-950/70 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <div className="text-left">
                    <div className="font-bold text-slate-100">Command Palette</div>
                    <div className="text-[10px] text-cyan-300">Switch tabs & security actions</div>
                  </div>
                </div>
                <kbd className="text-[10px] bg-cyan-900/60 text-cyan-200 px-2 py-1 rounded border border-cyan-500/40 font-mono">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Mobile Navigation List */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-1">
                Navigation
              </span>
              <div className="grid grid-cols-2 gap-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMobileNavSelect(item.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-mono transition-all text-left ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-cyan-400" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile User & Session Purge */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => handleMobileNavSelect('auth')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>{user ? user.name : 'Sign In / Account'}</span>
                </div>
                <span className="text-[10px] text-emerald-400 uppercase bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {user?.databaseProvider || 'Local DB'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setThemeModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 hover:border-cyan-500/40"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Custom Themes</span>
                </div>
                <span className="text-[10px] text-cyan-300 uppercase bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  {AVAILABLE_THEMES.find((t) => t.id === currentTheme)?.name || 'Theme'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleManualClearData}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-mono transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Session Cache & Cookies Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (md:hidden) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 border-t border-cyan-500/20 backdrop-blur-2xl px-2 py-2 flex items-center justify-around shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => onSelectTab('browser')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors relative ${
            activeTab === 'browser' ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-mono">Browser</span>
          {openTabsCount > 1 && (
            <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-mono text-[9px] font-bold flex items-center justify-center">
              {openTabsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('threat-blocker')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors ${
            activeTab === 'threat-blocker' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-mono">Shield</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('dns-scanner')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors ${
            activeTab === 'dns-scanner' ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-5 h-5" />
          <span className="text-[10px] font-mono">DNS</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('gemini-copilot')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors ${
            activeTab === 'gemini-copilot' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span className="text-[10px] font-mono">AI Copilot</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-mono">More</span>
        </button>
      </nav>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        currentTheme={currentTheme}
        onThemeSelect={(t) => setCurrentTheme(t)}
      />
    </>
  );
};
