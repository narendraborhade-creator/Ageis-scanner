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
import { Navbar } from './components/Navbar';
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
import {
  getPrivacyModeStatus,
  togglePrivacyMode,
  clearBrowserCookies,
} from './services/privacyService';
import { getStoredTheme, applyThemeToDOM } from './services/themeService';
import { CheckCircle2, RotateCcw, Command } from 'lucide-react';

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

  // Restore scroll position & notify session resumption
  useEffect(() => {
    if (initialSession) {
      if (initialSession.scrollPosition?.y > 0 || initialSession.scrollPosition?.x > 0) {
        restoreScrollPosition(initialSession.scrollPosition.y, initialSession.scrollPosition.x);
      }
      const count = initialSession.browser?.tabs?.length ?? 1;
      setSessionToast(
        `Session Resumed: Restored ${count} tab${count === 1 ? '' : 's'}, omnibar content, and scroll position (${initialSession.scrollPosition?.y || 0}px).`
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

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#030712] text-slate-100 cyber-grid flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Session Resumed Feedback Banner */}
      {sessionToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md p-3.5 rounded-xl bg-cyan-950/95 border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sessionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSessionToast(null)}
            className="text-cyan-400 hover:text-cyan-100 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        openTabsCount={browserOpenTabsCount}
        onOpenCloudflareVerify={() => setShowCfModal(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main App Container (with mobile bottom bar clearance and safe-area inset) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:py-8 space-y-5 md:space-y-8 overflow-x-hidden">
        {activeTab === 'browser' && (
          <BrowserView
            initialUrl={browserInitialUrl}
            onScanDns={handleScanDnsFromBrowser}
            onOpenCompare={handleOpenCompareFromBrowser}
            onOpenScience={handleOpenScienceFromBrowser}
            onTabsCountChange={setBrowserOpenTabsCount}
          />
        )}

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
      </main>

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

      {/* Quiet Footer with Contributors Showcase */}
      <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
            <span className="font-bold text-slate-300 font-mono">Aegis 3D Safe Browser</span>
            <span aria-hidden="true">·</span>
            <span>Created by <strong className="text-slate-300 font-medium">Narendra Borhade</strong></span>
            <span aria-hidden="true">·</span>
            <span>Frontend by <strong className="text-cyan-300 font-medium">Aditya Gaikwad</strong></span>
            <a
              href="mailto:gaikwadaditya0309@gmail.com"
              className="text-cyan-400 hover:text-cyan-200 hover:underline font-mono text-[11px]"
              title="Email Frontend Developer Aditya Gaikwad"
            >
              (gaikwadaditya0309@gmail.com)
            </a>
            <span aria-hidden="true">·</span>
            <span>Security by <strong className="text-teal-300 font-medium">Ghanshyam Jadhav</strong></span>
            <a
              href="mailto:ghanshamjadhav8210@gmail.com"
              className="text-teal-400 hover:text-teal-200 hover:underline font-mono text-[11px]"
              title="Email Security Contributor Ghanshyam Jadhav"
            >
              (ghanshamjadhav8210@gmail.com)
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 text-slate-400">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hover:text-cyan-300 transition-colors flex items-center gap-1 font-mono text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800 hover:border-cyan-500/40"
              title="Open Command Palette (Ctrl+K or ⌘K)"
            >
              <Command className="w-3 h-3 text-cyan-400" />
              <span>Palette (Ctrl+K)</span>
            </button>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <button
              onClick={() => setShowCfModal(true)}
              className="hover:text-amber-300 transition-colors flex items-center gap-1 font-mono text-[11px]"
            >
              <span>Cloudflare Verified</span>
            </button>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <button
              onClick={handleResetSession}
              className="hover:text-rose-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
              title="Purge saved session state and reload"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Session</span>
            </button>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <button
              onClick={() => setActiveTab('extension')}
              className="hover:text-cyan-300 transition-colors"
            >
              Extension & Vercel
            </button>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <button
              onClick={() => setActiveTab('about')}
              className="hover:text-cyan-300 transition-colors font-medium text-slate-300"
            >
              Team & Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Real-Time Offline Mode & Service Worker Shell Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
