/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Aegis Unified Browser Settings & Tools Hub
 * Integrates:
 * 1. Chromium Depot Tools Studio (https://chromium.googlesource.com/chromium/tools/depot_tools)
 * 2. Cybersecurity APIs Intelligence Hub (https://github.com/jaegeral/security-apis)
 * 3. All 10 Aegis Core Browser Features as dedicated setting sections
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Shield,
  ShieldAlert,
  Globe,
  GitCompare,
  BarChart2,
  BookOpen,
  Bot,
  Key,
  Puzzle,
  Sliders,
  Info,
  Search,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Trash2,
} from 'lucide-react';
import { ChromiumDepotToolsView } from './ChromiumDepotToolsView';
import { SecurityApisHubView } from './SecurityApisHubView';
import { CyberScene3D } from './CyberScene3D';
import { DnsScannerView } from './DnsScannerView';
import { WebsiteComparatorView } from './WebsiteComparatorView';
import { ThreatBlockerView } from './ThreatBlockerView';
import { SecurityAnalyticsView } from './SecurityAnalyticsView';
import { ScienceSearchView } from './ScienceSearchView';
import { GeminiCopilotView } from './GeminiCopilotView';
import { PasswordVaultManager } from './PasswordVaultManager';
import { ExtensionExportView } from './ExtensionExportView';
import { AboutUsView } from './AboutUsView';
import { BrowserTab } from '../types';

export type SettingsSectionId =
  | 'depot-tools'
  | 'security-apis'
  | '3d-scanner'
  | 'dns'
  | 'compare'
  | 'threat-shield'
  | 'analytics'
  | 'science'
  | 'ai-copilot'
  | 'vault'
  | 'extensions'
  | 'general'
  | 'about';

interface AegisSettingsHubProps {
  initialSection?: SettingsSectionId;
  activeTab: BrowserTab;
  tabs: BrowserTab[];
  onClose: () => void;
  onNavigateToUrl: (url: string) => void;
  onOpenCommandPalette?: () => void;
  onOpenThemeModal?: () => void;
  isDesktop?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const AegisSettingsHub: React.FC<AegisSettingsHubProps> = ({
  initialSection = 'depot-tools',
  activeTab,
  tabs,
  onClose,
  onNavigateToUrl,
  onOpenCommandPalette,
  onOpenThemeModal,
  isDesktop = false,
  isFullscreen: controlledFullscreen,
  onToggleFullscreen,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection);
  const [searchFilter, setSearchFilter] = useState('');
  const [internalFullscreen, setInternalFullscreen] = useState(true);

  const isFullscreen = controlledFullscreen !== undefined ? controlledFullscreen : internalFullscreen;
  const toggleFullscreen = onToggleFullscreen || (() => setInternalFullscreen((prev) => !prev));

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Settings navigation items
  const SECTIONS: Array<{
    id: SettingsSectionId;
    title: string;
    category: 'engine' | 'security' | 'tools' | 'system';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    desc: string;
    badge?: string;
  }> = [
    {
      id: 'depot-tools',
      title: 'Chromium & Depot Tools',
      category: 'engine',
      icon: Cpu,
      color: 'text-cyan-400',
      desc: 'Build studio, gclient, gn args, ninja & runtime flags',
      badge: 'Upstream Git',
    },
    {
      id: 'security-apis',
      title: 'Security APIs Intelligence',
      category: 'security',
      icon: Database,
      color: 'text-indigo-400',
      desc: 'jaegeral/security-apis hub, CIRCL CVEs, URLhaus & API keys',
      badge: '30+ APIs',
    },
    {
      id: '3d-scanner',
      title: '3D Shape Mesh Scanner',
      category: 'security',
      icon: Shield,
      color: 'text-cyan-400',
      desc: 'Three.js real-time WebGL core & domain security topology',
      badge: '60 FPS',
    },
    {
      id: 'dns',
      title: 'DNS Cryptographic Scanner',
      category: 'security',
      icon: Globe,
      color: 'text-emerald-400',
      desc: 'Quad9, Cloudflare & Google DoH, DNSSEC & latency benchmarks',
      badge: 'DoH Active',
    },
    {
      id: 'compare',
      title: 'Website Comparator',
      category: 'security',
      icon: GitCompare,
      color: 'text-blue-400',
      desc: 'Side-by-side TLS, cipher suite & HTTP header security matrix',
    },
    {
      id: 'threat-shield',
      title: 'Threat Shield & Quarantine',
      category: 'security',
      icon: ShieldAlert,
      color: 'text-rose-400',
      desc: 'Real-time tracker blocker, malicious IP isolation & zero-trust sandbox',
    },
    {
      id: 'analytics',
      title: 'Security Analytics',
      category: 'security',
      icon: BarChart2,
      color: 'text-teal-400',
      desc: 'Attack vector donut, threat velocity & certificate trends',
    },
    {
      id: 'science',
      title: 'Science Literature Search',
      category: 'tools',
      icon: BookOpen,
      color: 'text-purple-400',
      desc: 'PubMed, arXiv preprints, Europe PMC & OpenAlex papers',
      badge: 'Open Access',
    },
    {
      id: 'ai-copilot',
      title: 'Gemini AI Copilot',
      category: 'tools',
      icon: Bot,
      color: 'text-cyan-300',
      desc: 'Cyber Sentinel AI assistant for vulnerability analysis',
      badge: 'AI Active',
    },
    {
      id: 'vault',
      title: 'Password & Key Vault',
      category: 'tools',
      icon: Key,
      color: 'text-amber-400',
      desc: 'Zero-knowledge AES-GCM local credentials storage',
      badge: 'Encrypted',
    },
    {
      id: 'extensions',
      title: 'Chrome Extensions',
      category: 'tools',
      icon: Puzzle,
      color: 'text-indigo-400',
      desc: 'Manifest v3 extension manager & declarativeNetRequest rules',
    },
    {
      id: 'general',
      title: 'Preferences & Themes',
      category: 'system',
      icon: Sliders,
      color: 'text-slate-300',
      desc: 'Appearance, themes, cache wipe & hardware acceleration',
    },
    {
      id: 'about',
      title: 'About Aegis Team',
      category: 'system',
      icon: Info,
      color: 'text-cyan-400',
      desc: 'Architecture, engineering team & release specifications',
    },
  ];

  const filteredSections = SECTIONS.filter(
    (s) =>
      !searchFilter ||
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#030712]/98 backdrop-blur-2xl flex flex-col text-slate-100 font-mono text-xs overflow-hidden ${
        isFullscreen ? '' : 'p-3 sm:p-6'
      }`}
    >
      {/* Top Application Bar for Settings */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Aegis System Settings & Tools Hub</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                12 Systematic Categories
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Chromium depot_tools, jaegeral/security-apis, 3D WebGL core, DoH scanners & security engines
            </p>
          </div>
        </div>

        {/* Global Settings Search Filter */}
        <div className="flex-1 max-w-xs mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter settings or tools..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/60 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none placeholder-slate-500"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Window / Drawer Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
            title={isFullscreen ? 'Windowed View' : 'Fullscreen Settings'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
            title="Close Settings and Return to Browser"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Settings Body: Two-Column Responsive Layout with Independent Smooth Scrolling */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Settings Sidebar (Always Scrollable, Never Trapped) */}
        <aside className="w-64 sm:w-72 border-r border-slate-800 bg-[#060a14] flex flex-col shrink-0 overflow-y-auto scrollbar-thin p-2.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-2.5 py-1">
            Browser Settings & Architecture
          </div>

          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-bold'
                    : 'bg-slate-900/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs truncate">{sec.title}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{sec.desc}</div>
                  </div>
                </div>
                {sec.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 shrink-0 ml-1">
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-auto border-t border-slate-800/80 p-2 space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-[11px]">
              <div className="text-slate-400">Current Tab:</div>
              <div className="font-bold text-cyan-300 truncate">{activeTab.domain}</div>
              <div className="text-[10px] text-emerald-400">Score: {activeTab.securityScore}% · SSL {activeTab.sslGrade}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors cursor-pointer"
            >
              ← Back to Web Page
            </button>
          </div>
        </aside>

        {/* Right Settings Detail Panel (Fully Scrollable Content Container) */}
        <main className="flex-1 bg-slate-950/90 overflow-y-auto scrollbar-thin p-4 sm:p-6 min-h-0 space-y-6">
          {/* 1. CHROMIUM & DEPOT TOOLS */}
          {activeSection === 'depot-tools' && (
            <div className="space-y-4">
              <ChromiumDepotToolsView onNavigateToBrowserUrl={onNavigateToUrl} />
            </div>
          )}

          {/* 2. JAEGERAL/SECURITY-APIS INTELLIGENCE */}
          {activeSection === 'security-apis' && (
            <div className="space-y-4">
              <SecurityApisHubView
                onNavigateToBrowserUrl={(url) => {
                  onNavigateToUrl(url);
                  onClose();
                }}
                currentBrowserDomain={activeTab.domain}
              />
            </div>
          )}

          {/* 3. 3D SHAPE SCANNER MESH */}
          {activeSection === '3d-scanner' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-slate-100 font-mono">3D Web Shape Mesh Scanner</h3>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    WebGL 60 FPS Engine
                  </span>
                </div>
                <div className="w-full h-72 rounded-xl overflow-hidden bg-black/80 border border-slate-800 relative">
                  <CyberScene3D statusMode={activeTab.threatStatus === 'clean' ? 'safe' : 'alert'} interactive={true} className="w-full h-full" />
                  <div className="absolute bottom-2 left-2 text-[10px] font-mono text-cyan-300 bg-black/70 px-2 py-0.5 rounded">
                    Interactive 3D Quantum Core · Drag to rotate geometry
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Security Score</div>
                    <div className="text-base font-bold text-emerald-400">{activeTab.securityScore}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">SSL Grade</div>
                    <div className="text-base font-bold text-cyan-300">{activeTab.sslGrade}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Trackers Blocked</div>
                    <div className="text-base font-bold text-amber-400">{activeTab.trackersBlocked}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Latency</div>
                    <div className="text-base font-bold text-teal-300">{activeTab.latencyMs}ms</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. DNS ORIGIN SCANNER */}
          {activeSection === 'dns' && (
            <div className="space-y-4">
              <DnsScannerView initialDomain={activeTab.domain && activeTab.domain !== 'aegis.local' ? activeTab.domain : 'cloudflare.com'} />
            </div>
          )}

          {/* 5. WEBSITE COMPARATOR */}
          {activeSection === 'compare' && (
            <div className="space-y-4">
              <WebsiteComparatorView
                initialSiteA={activeTab.domain && activeTab.domain !== 'aegis.local' ? activeTab.domain : 'cloudflare.com'}
                initialSiteB="wikipedia.org"
              />
            </div>
          )}

          {/* 6. THREAT SHIELD */}
          {activeSection === 'threat-shield' && (
            <div className="space-y-4">
              <ThreatBlockerView
                onNavigateToBrowser={(url) => {
                  onNavigateToUrl(url);
                  onClose();
                }}
                currentBrowserUrl={activeTab.url}
              />
            </div>
          )}

          {/* 7. SECURITY ANALYTICS */}
          {activeSection === 'analytics' && (
            <div className="space-y-4">
              <SecurityAnalyticsView />
            </div>
          )}

          {/* 8. SCIENCE LITERATURE SEARCH */}
          {activeSection === 'science' && (
            <div className="space-y-4">
              <ScienceSearchView />
            </div>
          )}

          {/* 9. GEMINI AI COPILOT */}
          {activeSection === 'ai-copilot' && (
            <div className="space-y-4">
              <GeminiCopilotView currentUrl={activeTab.url} currentDomain={activeTab.domain} />
            </div>
          )}

          {/* 10. PASSWORD VAULT */}
          {activeSection === 'vault' && (
            <div className="space-y-4">
              <PasswordVaultManager />
            </div>
          )}

          {/* 11. CHROME EXTENSIONS */}
          {activeSection === 'extensions' && (
            <div className="space-y-4">
              <ExtensionExportView />
            </div>
          )}

          {/* 12. GENERAL PREFERENCES & THEMES */}
          {activeSection === 'general' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-slate-100 font-mono">Browser & Security Preferences</h4>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  {/* Theme Trigger */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="font-semibold text-slate-200">Color Palette & Theme</div>
                      <div className="text-[11px] text-slate-400">Choose between Cyber Midnight, Matrix Green, or Obsidian Dark</div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenThemeModal}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer"
                    >
                      Change Theme
                    </button>
                  </div>

                  {/* Command Palette (Ctrl+K) */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="font-semibold text-slate-200">Command Palette Shortcut</div>
                      <div className="text-[11px] text-slate-400">Quick action switcher for tabs, DoH flush & quarantine controls</div>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenCommandPalette}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      Open (Ctrl+K)
                    </button>
                  </div>

                  {/* Clear History & Bookmarks */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="font-semibold text-rose-300">Purge Browsing Data</div>
                      <div className="text-[11px] text-slate-400">Wipe stored history, cached thumbnails & bookmarks</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('aegis_browser_history');
                        window.location.reload();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                    >
                      Clear History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 13. ABOUT TEAM */}
          {activeSection === 'about' && (
            <div className="space-y-4">
              <AboutUsView />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
