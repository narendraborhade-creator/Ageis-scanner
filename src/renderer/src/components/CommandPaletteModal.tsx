import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavTab } from '../types';
import {
  Search,
  Globe,
  Radio,
  Scale,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  User,
  Monitor,
  Info,
  Zap,
  Lock,
  EyeOff,
  Trash2,
  Download,
  RotateCcw,
  ArrowRight,
  CornerDownLeft,
  Users,
  Mail,
  Shield,
  Code2,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  History,
  Activity,
  BarChart3,
  Palette,
} from 'lucide-react';
import { AVAILABLE_THEMES, setStoredTheme } from '../services/themeService';

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Tabs & Navigation' | 'Security Features' | 'Contributors & Team' | 'Quick Actions' | 'Visual Themes';
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onNavigateToBrowserUrl?: (url: string) => void;
  onOpenCloudflareModal?: () => void;
  onTogglePrivacyMode?: () => void;
  onPurgeCookies?: () => void;
  onResetSession?: () => void;
  isPrivacyModeActive?: boolean;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onNavigateToBrowserUrl,
  onOpenCloudflareModal,
  onTogglePrivacyMode,
  onPurgeCookies,
  onResetSession,
  isPrivacyModeActive = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Define full command repository
  const allCommands: CommandItem[] = useMemo(() => {
    return [
      // --- Tabs & Navigation ---
      {
        id: 'nav-browser',
        title: '3D Safe Web Browser',
        description: 'Interactive browsing canvas with threat sandbox and DoH resolution',
        category: 'Tabs & Navigation',
        icon: Globe,
        badge: 'Tab 1',
        keywords: ['browser', 'web', 'navigate', 'url', 'tabs', 'surf', 'explore', '3d'],
        action: () => {
          onSelectTab('browser');
          onClose();
        },
      },
      {
        id: 'nav-dns',
        title: 'Zero-Trust DNS Scanner',
        description: 'Cryptographic DNSSEC verification, DoH latency, and MX/TXT records',
        category: 'Tabs & Navigation',
        icon: Radio,
        badge: 'Tab 2',
        keywords: ['dns', 'domain', 'lookup', 'records', 'dnssec', 'doh', 'scanner', 'cloudflare'],
        action: () => {
          onSelectTab('dns-scanner');
          onClose();
        },
      },
      {
        id: 'nav-compare',
        title: 'Website Threat Comparator',
        description: 'Side-by-side cyber threat posture and TLS certificate analyzer',
        category: 'Tabs & Navigation',
        icon: Scale,
        badge: 'Tab 3',
        keywords: ['compare', 'comparator', 'differential', 'side by side', 'benchmark', 'ssl'],
        action: () => {
          onSelectTab('compare');
          onClose();
        },
      },
      {
        id: 'nav-threat',
        title: 'Real-time Threat Blocker & Heatmap',
        description: 'Automated background security scans, D3 30-day heatmap & threat log',
        category: 'Tabs & Navigation',
        icon: ShieldAlert,
        badge: 'Tab 4',
        badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-950/40',
        keywords: ['threat', 'malware', 'blocker', 'heatmap', 'd3', 'scan', 'vulnerability', 'xss'],
        action: () => {
          onSelectTab('threat-blocker');
          onClose();
        },
      },
      {
        id: 'nav-analytics',
        title: 'Security Analytics & Threat Trends (D3.js)',
        description: 'Interactive D3.js real-time threat detection trends & blocked attack vectors',
        category: 'Tabs & Navigation',
        icon: Activity,
        badge: 'Tab 5',
        badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
        keywords: ['analytics', 'security', 'd3', 'trends', 'vectors', 'charts', 'telemetry', 'blocked', 'threats', 'soc'],
        action: () => {
          onSelectTab('security-analytics');
          onClose();
        },
      },
      {
        id: 'nav-science',
        title: 'Peer-Reviewed Science Engine',
        description: 'Authoritative research search across Europe PMC, arXiv, and PubMed',
        category: 'Tabs & Navigation',
        icon: GraduationCap,
        badge: 'Tab 5',
        keywords: ['science', 'papers', 'research', 'arxiv', 'pubmed', 'ncbi', 'openalex'],
        action: () => {
          onSelectTab('science');
          onClose();
        },
      },
      {
        id: 'nav-copilot',
        title: 'Gemini Cyber AI Copilot',
        description: 'Intelligent security advisor and payload vulnerability diagnostics',
        category: 'Tabs & Navigation',
        icon: Sparkles,
        badge: 'Tab 6',
        badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
        keywords: ['gemini', 'copilot', 'ai', 'assistant', 'chat', 'intelligence', 'audit'],
        action: () => {
          onSelectTab('gemini-copilot');
          onClose();
        },
      },
      {
        id: 'nav-auth',
        title: 'Zero-Trust Auth & Web Crypto Vault',
        description: 'Hardware-backed AES-256 encrypted credential vault & multi-cloud DB',
        category: 'Tabs & Navigation',
        icon: User,
        badge: 'Tab 7',
        keywords: ['auth', 'login', 'vault', 'passwords', 'encryption', 'aes', 'credentials', 'keys'],
        action: () => {
          onSelectTab('auth');
          onClose();
        },
      },
      {
        id: 'nav-extension',
        title: 'Chrome Extension Standalone Mode',
        description: 'Browser-like extension preview and Manifest V3 downloadable package',
        category: 'Tabs & Navigation',
        icon: Monitor,
        badge: 'Tab 8',
        keywords: ['extension', 'chrome', 'manifest', 'export', 'zip', 'standalone', 'browser'],
        action: () => {
          onSelectTab('extension');
          onClose();
        },
      },
      {
        id: 'nav-about',
        title: 'Contributors & Security Policy',
        description: 'Team directory: Narendra Borhade, Aditya Gaikwad, and Ghanshyam Jadhav',
        category: 'Tabs & Navigation',
        icon: Info,
        badge: 'Tab 9',
        keywords: ['about', 'contributors', 'team', 'author', 'aditya gaikwad', 'ghanshyam jadhav', 'narendra borhade', 'email'],
        action: () => {
          onSelectTab('about');
          onClose();
        },
      },

      // --- Security Features & Tools ---
      {
        id: 'sec-scan',
        title: 'Run Automated Background Vulnerability Scan',
        description: 'Audits current active website for headers, obsolete libs & XSS vectors',
        category: 'Security Features',
        icon: ShieldAlert,
        badge: 'Security Audit',
        badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-950/40',
        keywords: ['vulnerability', 'scan', 'background', 'audit', 'headers', 'csp', 'libraries'],
        action: () => {
          onSelectTab('threat-blocker');
          onClose();
        },
      },
      {
        id: 'sec-cf-turnstile',
        title: 'Trigger Cloudflare Turnstile Verification',
        description: 'Zero-Trust human challenge & DDoS clearance verification dialog',
        category: 'Security Features',
        icon: Zap,
        badge: 'Cloudflare',
        badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
        keywords: ['cloudflare', 'turnstile', 'verification', 'captcha', 'bot', 'ddos', 'security'],
        action: () => {
          onClose();
          onOpenCloudflareModal?.();
        },
      },
      {
        id: 'sec-crypto-vault',
        title: 'Open Encrypted Web Crypto Password Vault',
        description: 'Access AES-GCM 256-bit protected credentials with PBKDF2 derivation',
        category: 'Security Features',
        icon: Lock,
        badge: 'AES-256 GCM',
        badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
        keywords: ['password', 'vault', 'crypto', 'credentials', 'keys', 'master password', 'lock'],
        action: () => {
          onSelectTab('auth');
          onClose();
        },
      },
      {
        id: 'sec-read-later',
        title: 'Open Read Later Queue & Saved Articles',
        description: 'View saved distraction-free reading articles persisted in local storage',
        category: 'Security Features',
        icon: BookOpen,
        badge: 'Read Later',
        badgeColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/40',
        keywords: ['read later', 'reading list', 'queue', 'articles', 'saved', 'offline', 'pocket', 'read'],
        action: () => {
          onSelectTab('browser');
          onClose();
        },
      },
      {
        id: 'sec-visual-history',
        title: 'Open Enhanced Visual History & Analytics',
        description: 'Interactive timeline clustering, hourly activity intensity heatmap & integrity trends',
        category: 'Security Features',
        icon: History,
        badge: 'Visual Trends',
        badgeColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/40',
        keywords: ['history', 'timeline', 'trends', 'analytics', 'visual history', 'hourly', 'domains'],
        action: () => {
          onSelectTab('browser');
          onClose();
        },
      },
      {
        id: 'sec-privacy-mode',
        title: isPrivacyModeActive ? 'Deactivate Privacy Mode' : 'Activate Privacy Mode (Incognito)',
        description: isPrivacyModeActive
          ? 'Resume local session persistence and browser history logging'
          : 'Zero tracking: clears current session cookies, tabs history & cache',
        category: 'Security Features',
        icon: EyeOff,
        badge: isPrivacyModeActive ? 'Active' : 'Privacy',
        badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-950/40',
        keywords: ['privacy', 'incognito', 'cookies', 'history', 'private', 'tracking', 'purge'],
        action: () => {
          onTogglePrivacyMode?.();
          onClose();
        },
      },
      {
        id: 'sec-purge-cache',
        title: 'Purge Browsing Cookies & Cache',
        description: 'Instantly remove tracking tokens, DOM storage & session headers',
        category: 'Security Features',
        icon: Trash2,
        badge: 'Sanitize',
        keywords: ['clear', 'cookies', 'cache', 'purge', 'storage', 'sanitize', 'clean'],
        action: () => {
          onPurgeCookies?.();
          onClose();
        },
      },
      {
        id: 'sec-export-extension',
        title: 'Download Manifest V3 Chrome Extension (.zip)',
        description: 'Bundle background service worker, ruleset & browser simulator',
        category: 'Security Features',
        icon: Download,
        badge: 'Manifest V3',
        badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40',
        keywords: ['chrome', 'extension', 'download', 'zip', 'install', 'manifest', 'unpacked'],
        action: () => {
          onSelectTab('extension');
          onClose();
        },
      },
      {
        id: 'sec-reset-session',
        title: 'Reset Session State & Reload',
        description: 'Clear saved tab list, omnibar inputs and restore default session',
        category: 'Security Features',
        icon: RotateCcw,
        badge: 'Reset',
        keywords: ['reset', 'reload', 'restart', 'restore', 'factory', 'default'],
        action: () => {
          onClose();
          onResetSession?.();
        },
      },

      // --- Contributors & Team ---
      {
        id: 'team-aditya',
        title: 'Aditya Gaikwad (Frontend Developer)',
        description: 'Frontend engineer: React cyber UI, Command Palette (Ctrl+K), and mobile design',
        category: 'Contributors & Team',
        icon: Code2,
        badge: 'gaikwadaditya0309@gmail.com',
        badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40',
        keywords: ['aditya', 'gaikwad', 'frontend', 'developer', 'engineer', 'ui', 'email', 'contributor'],
        action: () => {
          onSelectTab('about');
          onClose();
        },
      },
      {
        id: 'team-ghanshyam',
        title: 'Ghanshyam Jadhav (Core Security & Systems Contributor)',
        description: 'Security engineer: Threat detection engine, DNS validation, and system integrity',
        category: 'Contributors & Team',
        icon: Shield,
        badge: 'Security Contributor',
        badgeColor: 'text-teal-400 border-teal-500/30 bg-teal-950/40',
        keywords: ['ghanshyam', 'jadhav', 'security', 'contributor', 'systems', 'threat', 'architect'],
        action: () => {
          onSelectTab('about');
          onClose();
        },
      },
      {
        id: 'team-narendra',
        title: 'Narendra Borhade (Creator & Lead Architect)',
        description: 'Founder & Principal Architect of Aegis 3D Safe Browser zero-trust platform',
        category: 'Contributors & Team',
        icon: User,
        badge: 'narendra.via.mail@gmail.com',
        badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
        keywords: ['narendra', 'borhade', 'creator', 'founder', 'author', 'lead', 'email'],
        action: () => {
          onSelectTab('about');
          onClose();
        },
      },
      {
        id: 'team-email-aditya',
        title: 'Email Aditya Gaikwad Directly',
        description: 'Send direct frontend inquiries or feedback to gaikwadaditya0309@gmail.com',
        category: 'Contributors & Team',
        icon: Mail,
        badge: 'Mailto',
        keywords: ['email', 'contact', 'aditya', 'gaikwad', 'inquiry', 'message'],
        action: () => {
          window.open('mailto:gaikwadaditya0309@gmail.com?subject=Aegis%203D%20Safe%20Browser%20Inquiry', '_blank');
          onClose();
        },
      },
      {
        id: 'team-email-narendra',
        title: 'Email Narendra Borhade Directly',
        description: 'Send direct security architecture inquiries to narendra.via.mail@gmail.com',
        category: 'Contributors & Team',
        icon: Mail,
        badge: 'Mailto',
        keywords: ['email', 'contact', 'narendra', 'borhade', 'inquiry', 'message'],
        action: () => {
          window.open('mailto:narendra.via.mail@gmail.com?subject=Aegis%203D%20Safe%20Browser%20Inquiry', '_blank');
          onClose();
        },
      },
      ...AVAILABLE_THEMES.map((theme) => ({
        id: `theme-${theme.id}`,
        title: `Switch Theme: ${theme.name}`,
        description: theme.tagline,
        category: 'Visual Themes' as const,
        icon: Palette,
        badge: theme.badge,
        badgeColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/40',
        keywords: ['theme', 'color', 'dark', 'matrix', 'oled', 'amber', 'violet', 'style', 'appearance', theme.id, theme.name.toLowerCase()],
        action: () => {
          setStoredTheme(theme.id);
          onClose();
        },
      })),
    ];
  }, [
    isPrivacyModeActive,
    onClose,
    onNavigateToBrowserUrl,
    onOpenCloudflareModal,
    onPurgeCookies,
    onResetSession,
    onSelectTab,
    onTogglePrivacyMode,
  ]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return allCommands;
    }

    const matched = allCommands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(trimmed);
      const matchDesc = cmd.description.toLowerCase().includes(trimmed);
      const matchCategory = cmd.category.toLowerCase().includes(trimmed);
      const matchKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(trimmed));
      const matchBadge = cmd.badge?.toLowerCase().includes(trimmed);
      return matchTitle || matchDesc || matchCategory || matchKeywords || matchBadge;
    });

    // Dynamic URL open option if user typed a web address or domain
    const isUrlLike =
      trimmed.includes('.') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://');

    if (isUrlLike && onNavigateToBrowserUrl) {
      const targetUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;

      matched.unshift({
        id: 'dynamic-url-nav',
        title: `Open URL: "${targetUrl}"`,
        description: 'Navigate to target web address inside 3D Safe Browser with live threat shields',
        category: 'Quick Actions',
        icon: Globe,
        badge: 'Direct Navigation',
        badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40',
        action: () => {
          onNavigateToBrowserUrl(targetUrl);
          onClose();
        },
      });
    }

    return matched;
  }, [allCommands, query, onNavigateToBrowserUrl, onClose]);

  // Handle keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filteredCommands.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Keep selected element in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl bg-[#030712] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-cyan-500/20">
        {/* Top Search Input Box */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, switch tab, search security features, or enter URL..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/60"
            >
              Clear
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded shadow-sm">
              <span>ESC to exit</span>
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40 scrollbar-thin">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No matching commands or features</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for <span className="text-cyan-400">"threat"</span>,{' '}
                <span className="text-cyan-400">"aditya"</span>,{' '}
                <span className="text-cyan-400">"vault"</span>,{' '}
                <span className="text-cyan-400">"privacy"</span>, or typing a domain like{' '}
                <span className="text-cyan-400">"github.com"</span>.
              </p>
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'hover:bg-slate-900/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-slate-100 truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                              item.badgeColor || 'text-cyan-300 border-cyan-500/30 bg-cyan-950/40'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                      {item.category}
                    </span>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                        <span>Enter</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Status / Navigation Hints */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1 hidden xs:flex">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-300/80">
            <span>Contributors:</span>
            <span className="text-slate-300">Narendra B.</span>
            <span>·</span>
            <span className="text-cyan-300 font-semibold">Aditya G.</span>
            <span>·</span>
            <span className="text-teal-300">Ghanshyam J.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
