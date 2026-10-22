/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from './types';
import { getStoredUser } from './services/authStorage';
import {
  getStoredSessionState,
  clearSessionState,
} from './services/sessionStateService';
import { BrowserView } from './components/BrowserView';
import { CloudflareVerificationModal } from './components/CloudflareVerificationModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import {
  getPrivacyModeStatus,
  togglePrivacyMode,
  clearBrowserCookies,
} from './services/privacyService';
import {
  getStoredTheme,
  applyThemeToDOM,
  AppThemeId,
  EVENT_THEME_CHANGE,
} from './services/themeService';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const initialSession = getStoredSessionState();

  const [user, setUser] = useState<UserAccount | null>(() => getStoredUser());
  const [browserInitialUrl, setBrowserInitialUrl] = useState<string>(
    () => initialSession?.browser?.omnibarInput || 'aegis://newtab'
  );
  const [sessionToast, setSessionToast] = useState<string | null>(null);
  const [showCfModal, setShowCfModal] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<AppThemeId>(() => getStoredTheme());
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => getPrivacyModeStatus());

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Toast Notification Alert */}
      {sessionToast && (
        <div className="fixed top-12 right-4 z-50 max-w-md p-3.5 rounded-xl bg-cyan-950/95 border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sessionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSessionToast(null)}
            className="text-cyan-400 hover:text-cyan-100 text-xs cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Single Browser View: Full Height, Zero Duplicate Header/Footer, Unified Chromium Chrome */}
      <main className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col">
        <BrowserView
          initialUrl={browserInitialUrl}
          currentUser={user}
          onUserChange={setUser}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenCloudflareModal={() => setShowCfModal(true)}
          privacyMode={privacyMode}
          onTogglePrivacy={handleTogglePrivacy}
        />
      </main>

      {/* Global Modals */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={() => {}}
        onNavigateToBrowserUrl={(url) => {
          setBrowserInitialUrl(url);
          setIsCommandPaletteOpen(false);
        }}
        onOpenCloudflareModal={() => {
          setIsCommandPaletteOpen(false);
          setShowCfModal(true);
        }}
        onTogglePrivacyMode={handleTogglePrivacy}
        onPurgeCookies={() => {
          const count = clearBrowserCookies();
          setSessionToast(`Purged ${count} browser cookies and cleared session tokens.`);
          setTimeout(() => setSessionToast(null), 3500);
        }}
        onResetSession={handleResetSession}
        isPrivacyModeActive={privacyMode}
      />

      <CloudflareVerificationModal
        isOpen={showCfModal}
        onClose={() => setShowCfModal(false)}
      />

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onThemeSelect={(t) => setCurrentTheme(t)}
      />
    </div>
  );
}
