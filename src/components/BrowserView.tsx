import React, { useState, useEffect, useRef } from 'react';
import { CyberScene3D } from './CyberScene3D';
import { Omnibar } from './Omnibar';
import { ReadLaterPanel } from './ReadLaterPanel';
import { EnhancedVisualHistoryPanel } from './EnhancedVisualHistoryPanel';
import { analyzeUrlThreats } from '../services/threatEngine';
import { getStoredHistory, addHistoryItem, deleteHistoryItem, clearAllHistory } from '../services/historyStorage';
import {
  getStoredBookmarks,
  addBookmark,
  deleteBookmark,
  toggleBookmark,
  clearAllBookmarks,
  seedRecommendedBookmarks,
} from '../services/bookmarkStorage';
import {
  getStoredReadLaterList,
  addReadLaterItem,
  deleteReadLaterItem,
  isUrlInReadLater,
  EVENT_READ_LATER_CHANGE,
} from '../services/readLaterStorage';
import { getStoredSessionState, saveSessionState } from '../services/sessionStateService';
import { calculatePageLoadMetrics, PageLoadMetrics } from '../services/performanceMetricsService';
import { BrowserTab, BrowserHistoryItem, BookmarkItem, ReadLaterItem, TabGroup, TabGroupColor } from '../types';
import { ResourceMonitorSidebar } from './ResourceMonitorSidebar';
import { SmartTabGroupModal } from './SmartTabGroupModal';
import { TabHoverPreviewCard } from './TabHoverPreviewCard';
import { TabSnapshotThumbnail } from './TabSnapshotThumbnail';
import { autoGroupTabs } from '../services/resourceMonitorService';
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  Lock,
  EyeOff,
  Radio,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Bug,
  Plus,
  X,
  Globe,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Copy,
  Check,
  History,
  Layers,
  Sparkles,
  Trash2,
  Search,
  Pin,
  PinOff,
  CopyPlus,
  Bot,
  Send,
  User,
  PanelRightClose,
  Star,
  Bookmark,
  BookOpen,
  TrendingUp,
  BarChart2,
  Activity,
  FolderPlus,
  Zap,
  Cpu,
  Moon,
  Sun,
} from 'lucide-react';

interface BrowserViewProps {
  onScanDns: (domain: string) => void;
  onOpenCompare: (domain: string) => void;
  onOpenScience: (query: string) => void;
  initialUrl?: string;
  onTabsCountChange?: (count: number) => void;
}

// Accurate Initial State: Exactly 1 default tab
const DEFAULT_TABS: BrowserTab[] = [
  {
    id: 'tab-cloudflare',
    title: 'Cloudflare: Web Security & DNS',
    url: 'https://cloudflare.com',
    domain: 'cloudflare.com',
    isHttps: true,
    threatStatus: 'clean',
    trackersBlocked: 6,
    bugsSanitized: 2,
    latencyMs: 24,
    securityScore: 98,
    sslGrade: 'A+',
    isQuarantined: false,
    isPinned: false,
    pageMetrics: calculatePageLoadMetrics('https://cloudflare.com', 'clean', 24),
    createdAt: Date.now(),
  },
];

export const BrowserView: React.FC<BrowserViewProps> = ({
  onScanDns,
  onOpenCompare,
  onOpenScience,
  initialUrl,
  onTabsCountChange,
}) => {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => {
    const session = getStoredSessionState();
    return session?.browser.tabs?.length ? session.browser.tabs : DEFAULT_TABS;
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const session = getStoredSessionState();
    if (session?.browser.activeTabId && session.browser.tabs?.some((t) => t.id === session.browser.activeTabId)) {
      return session.browser.activeTabId;
    }
    return DEFAULT_TABS[0].id;
  });
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<BrowserTab[]>(() => {
    const session = getStoredSessionState();
    return session?.browser.recentlyClosedTabs || [];
  });
  const [isScanning, setIsScanning] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Sidebar Mode: 'none' | 'history' | 'bookmarks' | 'tabs' | 'ai' | 'read-later' | 'resource-monitor'
  const [activeSidebar, setActiveSidebar] = useState<
    'none' | 'history' | 'bookmarks' | 'tabs' | 'ai' | 'read-later' | 'resource-monitor'
  >(() => {
    const session = getStoredSessionState();
    return (session?.browser.activeSidebar as any) || 'none';
  });

  // Tab Groups & Smart Grouping modal state
  const [tabGroups, setTabGroups] = useState<TabGroup[]>(() => {
    const session = getStoredSessionState();
    return session?.browser.tabGroups || [];
  });
  const [showSmartGroupModal, setShowSmartGroupModal] = useState<boolean>(false);

  // Read Later queue state
  const [readLaterItems, setReadLaterItems] = useState<ReadLaterItem[]>(() => getStoredReadLaterList());

  useEffect(() => {
    const handleReadLaterChange = () => {
      setReadLaterItems(getStoredReadLaterList());
    };
    window.addEventListener(EVENT_READ_LATER_CHANGE, handleReadLaterChange);
    return () => window.removeEventListener(EVENT_READ_LATER_CHANGE, handleReadLaterChange);
  }, []);

  // Auto-save browser state to session storage
  useEffect(() => {
    const current = tabs.find((t) => t.id === activeTabId) || tabs[0];
    saveSessionState({
      browser: {
        tabs,
        activeTabId,
        omnibarInput: current ? current.url : 'https://cloudflare.com',
        activeSidebar,
        tabGroups,
        recentlyClosedTabs,
      },
    });
  }, [tabs, activeTabId, activeSidebar, tabGroups, recentlyClosedTabs]);

  // History state & Visual trends mode: 'list' | 'trends'
  const [history, setHistory] = useState<BrowserHistoryItem[]>(() => getStoredHistory());
  const [historySearch, setHistorySearch] = useState('');
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'trends'>('list');

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => getStoredBookmarks());
  const [bookmarkSearch, setBookmarkSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddBookmarkModal, setShowAddBookmarkModal] = useState(false);
  const [newBmTitle, setNewBmTitle] = useState('');
  const [newBmUrl, setNewBmUrl] = useState('');
  const [newBmCategory, setNewBmCategory] = useState('General');

  // In-Browser AI Assistant state
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      id: 'ai-init',
      role: 'assistant',
      text: 'Aegis In-Browser Assistant initialized. I am monitoring your active tabs and can analyze real-time DNS records, SSL cipher suites, or phishing indicators for this page.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // Hover-state tab preview card state (snapshot thumbnail popup)
  const [hoveredTab, setHoveredTab] = useState<{
    tab: BrowserTab;
    position: { left: number; top: number; width: number };
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPreviewCardHoveredRef = useRef<boolean>(false);

  // Clear hover preview timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleTabMouseEnter = (e: React.MouseEvent<HTMLDivElement>, tab: BrowserTab) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = { left: rect.left, top: rect.bottom, width: rect.width };

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (hoveredTab) {
      setHoveredTab({ tab, position: pos });
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredTab({ tab, position: pos });
      }, 180);
    }
  };

  const handleTabMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isPreviewCardHoveredRef.current) {
        setHoveredTab(null);
      }
    }, 140);
  };

  const handleToggleSuspendTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          const nextSuspended = !t.isSuspended;
          return {
            ...t,
            isSuspended: nextSuspended,
            cpuPercent: nextSuspended ? 0 : 3.2,
            memoryMb: nextSuspended ? 12 : 52,
          };
        }
        return t;
      })
    );
  };

  // Synchronize open tabs count to Navbar badge
  useEffect(() => {
    if (onTabsCountChange) {
      onTabsCountChange(tabs.length);
    }
  }, [tabs.length, onTabsCountChange]);

  // Handle external navigation requests
  useEffect(() => {
    if (initialUrl) {
      handleNavigate(initialUrl, false, false);
    }
  }, [initialUrl]);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // Synchronize history when Privacy Mode is activated/deactivated
  useEffect(() => {
    const handlePrivacyChange = (e: any) => {
      if (e.detail?.enabled) {
        setHistory([]);
      } else {
        setHistory(getStoredHistory());
      }
    };
    window.addEventListener('aegis-privacy-mode-change', handlePrivacyChange);
    return () => window.removeEventListener('aegis-privacy-mode-change', handlePrivacyChange);
  }, []);

  // Current active tab object
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const isCurrentBookmarked = bookmarks.some(
    (b) => b.url.toLowerCase() === activeTab.url.toLowerCase().trim()
  );

  const unreadReadLaterCount = readLaterItems.filter((i) => !i.isRead).length;
  const isCurrentInReadLater = isUrlInReadLater(activeTab.url);

  const handleToggleReadLater = () => {
    if (isCurrentInReadLater) {
      const match = readLaterItems.find(
        (i) => i.url.toLowerCase().trim() === activeTab.url.toLowerCase().trim()
      );
      if (match) {
        deleteReadLaterItem(match.id);
        setReadLaterItems(getStoredReadLaterList());
      }
    } else {
      addReadLaterItem({
        title: activeTab.title,
        url: activeTab.url,
        domain: activeTab.domain,
        excerpt: `Saved from ${activeTab.domain} with active ${activeTab.sslGrade} TLS security and zero-trust verification.`,
        category: activeTab.domain.includes('ncbi') || activeTab.domain.includes('arxiv')
          ? 'Research'
          : activeTab.domain.includes('cloudflare') || activeTab.domain.includes('security')
          ? 'Security'
          : activeTab.domain.includes('github')
          ? 'Technology'
          : 'General',
        threatStatus: activeTab.threatStatus,
        readTimeMinutes: Math.floor(Math.random() * 4) + 3,
        tags: [activeTab.domain, activeTab.sslGrade],
      });
      setReadLaterItems(getStoredReadLaterList());
    }
  };

  const formatDomain = (url: string) => {
    return url.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0];
  };

  const getCleanTitle = (url: string) => {
    const domain = formatDomain(url);
    if (domain.includes('github')) return 'GitHub: Where the world builds';
    if (domain.includes('cloudflare')) return 'Cloudflare: Web Security & DNS';
    if (domain.includes('ncbi') || domain.includes('pubmed')) return 'NCBI / PubMed Literature';
    if (domain.includes('wikipedia')) return 'Wikipedia, the free encyclopedia';
    if (domain.includes('google')) return 'Google Safe Search';
    return domain;
  };

  const handleNavigate = (rawUrl: string, inNewTab = false, openExternal = true) => {
    let target = rawUrl.trim();

    // If search keyword without dot or protocol, route to Science or Web Search
    if (!target.includes('.') && !target.startsWith('http')) {
      onOpenScience(target);
      return;
    }

    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    const domain = formatDomain(target);
    const isHttps = target.startsWith('https://');

    // Launch in separate page / window if requested
    if (openExternal) {
      try {
        window.open(target, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Could not launch external browser window:', err);
      }
    }

    setIsScanning(true);

    setTimeout(() => {
      const threatCheck = analyzeUrlThreats(target);
      const isQuarantined = threatCheck.isBlocked;
      const title = getCleanTitle(target);
      const securityScore = isQuarantined ? 25 : isHttps ? 95 : 45;

      const latencyMs = isQuarantined ? 14 : Math.floor(Math.random() * 25) + 20;
      const pageMetrics = calculatePageLoadMetrics(
        target,
        isQuarantined ? 'blocked' : 'clean',
        latencyMs
      );

      const updatedTab: BrowserTab = {
        id: inNewTab ? `tab-${Date.now()}` : activeTab.id,
        title,
        url: target,
        domain,
        isHttps,
        threatStatus: isQuarantined ? 'blocked' : 'clean',
        trackersBlocked: isQuarantined ? activeTab.trackersBlocked + 4 : activeTab.trackersBlocked,
        bugsSanitized: isQuarantined ? activeTab.bugsSanitized + 2 : activeTab.bugsSanitized,
        latencyMs,
        securityScore,
        sslGrade: isQuarantined ? 'F' : isHttps ? 'A+' : 'C',
        isQuarantined,
        isPinned: activeTab.isPinned || false,
        pageMetrics,
        createdAt: Date.now(),
      };

      // Record to LocalStorage History
      const updatedHistory = addHistoryItem({
        url: target,
        title,
        domain,
        isHttps,
        threatStatus: isQuarantined ? 'blocked' : 'clean',
        securityScore,
      });
      setHistory(updatedHistory);

      if (inNewTab) {
        setTabs((prev) => [...prev, updatedTab]);
        setActiveTabId(updatedTab.id);
      } else {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTab.id ? updatedTab : t))
        );
      }

      setIsScanning(false);
    }, 400);
  };

  const handleCreateNewTab = () => {
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
      url: 'https://cloudflare.com',
      domain: 'cloudflare.com',
      isHttps: true,
      threatStatus: 'clean',
      trackersBlocked: 0,
      bugsSanitized: 0,
      latencyMs: 25,
      securityScore: 98,
      sslGrade: 'A+',
      isQuarantined: false,
      isPinned: false,
      pageMetrics: calculatePageLoadMetrics('https://cloudflare.com', 'clean', 25),
      createdAt: Date.now(),
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (e: React.MouseEvent, tabIdToClose: string) => {
    e.stopPropagation();
    const target = tabs.find((t) => t.id === tabIdToClose);
    if (target) {
      setRecentlyClosedTabs((prev) => [target, ...prev].slice(0, 10));
    }

    if (tabs.length === 1) {
      const resetTab: BrowserTab = {
        id: `tab-${Date.now()}`,
        title: 'New Tab',
        url: 'https://cloudflare.com',
        domain: 'cloudflare.com',
        isHttps: true,
        threatStatus: 'clean',
        trackersBlocked: 0,
        bugsSanitized: 0,
        latencyMs: 28,
        securityScore: 95,
        sslGrade: 'A',
        isQuarantined: false,
        isPinned: false,
        createdAt: Date.now(),
      };
      setTabs([resetTab]);
      setActiveTabId(resetTab.id);
      return;
    }

    const remaining = tabs.filter((t) => t.id !== tabIdToClose);
    setTabs(remaining);

    if (activeTabId === tabIdToClose) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const handleTogglePinTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  const handleDuplicateTab = (tabToDuplicate: BrowserTab) => {
    const dup: BrowserTab = {
      ...tabToDuplicate,
      id: `tab-${Date.now()}`,
      createdAt: Date.now(),
    };
    setTabs((prev) => [...prev, dup]);
    setActiveTabId(dup.id);
  };

  const handleCloseOtherTabs = () => {
    setTabs([activeTab]);
  };

  const handleRestoreRecentlyClosed = () => {
    if (recentlyClosedTabs.length === 0) return;
    const [toRestore, ...rest] = recentlyClosedTabs;
    setRecentlyClosedTabs(rest);
    setTabs((prev) => [...prev, toRestore]);
    setActiveTabId(toRestore.id);
  };

  // Bookmark handlers
  const handleToggleActiveBookmark = () => {
    const result = toggleBookmark({
      title: activeTab.title,
      url: activeTab.url,
      domain: activeTab.domain,
      category: 'General',
    });
    setBookmarks(result.list);
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = deleteBookmark(id);
    setBookmarks(updated);
  };

  const handleClearAllBookmarks = () => {
    const empty = clearAllBookmarks();
    setBookmarks(empty);
  };

  const handleSeedSampleBookmarks = () => {
    const seeded = seedRecommendedBookmarks();
    setBookmarks(seeded);
  };

  const handleAddCustomBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBmUrl.trim()) return;
    let url = newBmUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const domain = formatDomain(url);
    const title = newBmTitle.trim() || getCleanTitle(url);

    const updated = addBookmark({
      title,
      url,
      domain,
      category: newBmCategory,
    });
    setBookmarks(updated);
    setNewBmTitle('');
    setNewBmUrl('');
    setShowAddBookmarkModal(false);
  };

  // History handlers
  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleClearAllHistory = () => {
    const updated = clearAllHistory();
    setHistory(updated);
  };

  const handleCopyUrl = () => {
    if (!activeTab) return;
    navigator.clipboard.writeText(activeTab.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const handleLaunchExternalWindow = () => {
    if (!activeTab) return;
    window.open(activeTab.url, '_blank', 'noopener,noreferrer');
  };

  // In-Browser AI Assistant Handler
  const handleSendAiMessage = async (customText?: string) => {
    const query = (customText || aiInput).trim();
    if (!query || aiLoading) return;

    const userMsg = {
      id: `ai-u-${Date.now()}`,
      role: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...aiMessages.map((m) => ({ role: m.role, content: m.text })),
            { role: 'user', content: query },
          ],
          systemInstruction: `You are Aegis In-Browser Copilot. The user is actively viewing: "${activeTab.title}" at URL "${activeTab.url}" (Domain: ${activeTab.domain}, SSL Grade: ${activeTab.sslGrade}, Protocol: ${activeTab.isHttps ? 'HTTPS' : 'HTTP'}, Security Score: ${activeTab.securityScore}/100, Quarantine Status: ${activeTab.isQuarantined ? 'BLOCKED' : 'CLEAN'}). Provide fast, concrete, security-focused answers.`,
          model: 'models/gemini-3.8-flash',
        }),
      });

      const data = await response.json();
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-a-${Date.now()}`,
          role: 'assistant',
          text: data.reply || 'Analysis completed with verified status.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: `[Neural Copilot Alert]: ${err.message || 'Failed to connect to AI engine.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Visual History Trends Computations
  const totalVisits = history.length;
  const cleanVisits = history.filter((h) => h.threatStatus !== 'blocked').length;
  const blockedVisits = history.filter((h) => h.threatStatus === 'blocked').length;
  const safePercentage = totalVisits > 0 ? Math.round((cleanVisits / totalVisits) * 100) : 100;
  const avgSecurityScore =
    totalVisits > 0
      ? Math.round(history.reduce((acc, h) => acc + (h.securityScore || 80), 0) / totalVisits)
      : 95;
  const httpsVisits = history.filter((h) => h.isHttps).length;
  const httpsPercentage = totalVisits > 0 ? Math.round((httpsVisits / totalVisits) * 100) : 100;

  // Domain Frequency Aggregation
  const domainCounts: Record<string, number> = {};
  history.forEach((h) => {
    domainCounts[h.domain] = (domainCounts[h.domain] || 0) + 1;
  });
  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const filteredHistory = history.filter(
    (h) =>
      h.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.domain.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.url.toLowerCase().includes(historySearch.toLowerCase())
  );

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(bookmarkSearch.toLowerCase()) ||
      b.domain.toLowerCase().includes(bookmarkSearch.toLowerCase()) ||
      b.url.toLowerCase().includes(bookmarkSearch.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || (b.category || 'General') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Security', 'Developer', 'Science', 'General'];

  const statusMode = activeTab.isQuarantined ? 'threat' : isScanning ? 'scanning' : 'safe';

  return (
    <div className="space-y-6">
      {/* 3D Holographic Cyber Hero Shield */}
      <div className="relative glass-panel rounded-2xl p-5 border border-cyan-500/20 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: 3D WebGL Canvas */}
          <div className="lg:col-span-5 h-56 md:h-64 rounded-xl overflow-hidden glass-panel border border-cyan-500/20 relative">
            <CyberScene3D statusMode={statusMode} className="w-full h-full" />
            <div className="absolute bottom-2 left-3 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/20">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>3D Quantum Threat Core: {statusMode.toUpperCase()}</span>
            </div>
          </div>

          {/* Right Column: Omnibar & Real-Time Browser Telemetry */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Zero-Trust Omnibar & Multi-Tab Browser</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Tabs: <strong className="text-cyan-300 font-bold">{tabs.length}</strong> · Bookmarks: <strong className="text-amber-400 font-bold">{bookmarks.length}</strong>
                </span>
              </div>

              <Omnibar
                currentUrl={activeTab.url}
                onNavigate={handleNavigate}
                onScanDns={onScanDns}
                onNewTab={handleCreateNewTab}
                latencyMs={activeTab.latencyMs}
                isHttps={activeTab.isHttps}
                threatStatus={activeTab.threatStatus}
                metrics={activeTab.pageMetrics || calculatePageLoadMetrics(activeTab.url, activeTab.threatStatus, activeTab.latencyMs)}
                onMetricsUpdate={(newM) => {
                  setTabs((prev) =>
                    prev.map((t) => (t.id === activeTab.id ? { ...t, pageMetrics: newM } : t))
                  );
                }}
              />
            </div>

            {/* Quick Chrome-Style Bookmarks Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80 text-xs font-mono scrollbar-none">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Bookmarks:</span>
              </span>

              {bookmarks.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">
                  0 saved · Click the star (★) or Add to save pages
                </span>
              ) : (
                bookmarks.slice(0, 6).map((bm) => (
                  <button
                    key={bm.id}
                    type="button"
                    onClick={() => handleNavigate(bm.url, false, false)}
                    className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 text-[11px] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                    title={bm.url}
                  >
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                    <span className="max-w-[120px] truncate">{bm.title}</span>
                  </button>
                ))
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveSidebar('bookmarks');
                  setShowAddBookmarkModal(true);
                  setNewBmUrl(activeTab.url);
                  setNewBmTitle(activeTab.title);
                }}
                className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 text-[10px] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                title="Add Bookmark"
              >
                <Plus className="w-3 h-3 text-cyan-400" />
                <span>Add</span>
              </button>
            </div>

            {/* Live Security Metrics Strip for Active Tab */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="glass-panel p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Protocol</span>
                </div>
                <div className="text-xs font-bold text-slate-100 font-mono mt-0.5">
                  {activeTab.isHttps ? 'TLS 1.3 / HSTS' : 'Insecure HTTP'}
                </div>
              </div>

              <div className="glass-panel p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <EyeOff className="w-3 h-3 text-cyan-400" />
                  <span>Trackers Blocked</span>
                </div>
                <div className="text-xs font-bold text-cyan-300 font-mono mt-0.5 tabular-nums">
                  {activeTab.trackersBlocked} Injected
                </div>
              </div>

              <div className="glass-panel p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Bug className="w-3 h-3 text-amber-400" />
                  <span>Bugs & Vulns</span>
                </div>
                <div className="text-xs font-bold text-amber-300 font-mono mt-0.5 tabular-nums">
                  {activeTab.bugsSanitized} Disarmed
                </div>
              </div>

              <div className="glass-panel p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Shield className="w-3 h-3 text-teal-400" />
                  <span>SSL Grade</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                  Grade {activeTab.sslGrade}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHROME-STYLE BROWSER WINDOW WITH MULTI-TAB STRIP & DEDICATED SIDEBARS */}
      <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden shadow-2xl">
        {/* Google Chrome Style Tab Strip */}
        <div className="flex items-center px-2 pt-2 bg-slate-950/90 border-b border-slate-800/80 gap-1 overflow-x-auto scrollbar-none select-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isSuspended = tab.isSuspended;
            return (
              <div
                key={tab.id}
                onMouseEnter={(e) => handleTabMouseEnter(e, tab)}
                onMouseLeave={handleTabMouseLeave}
                onClick={() => {
                  setHoveredTab(null);
                  setActiveTabId(tab.id);
                  if (tab.isSuspended) {
                    setTabs((prev) =>
                      prev.map((t) =>
                        t.id === tab.id
                          ? { ...t, isSuspended: false, cpuPercent: 3.2, memoryMb: 52.0 }
                          : t
                      )
                    );
                  }
                }}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-t-xl text-xs font-mono transition-all cursor-pointer max-w-[240px] min-w-[130px] border-t border-x ${
                  isActive
                    ? 'bg-slate-900/90 border-cyan-400/50 text-cyan-300 shadow-[0_-2px_10px_rgba(6,182,212,0.15)] font-semibold z-10'
                    : isSuspended
                    ? 'bg-slate-950/30 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900/30 opacity-75'
                    : 'bg-slate-950/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                {/* Pin / Favicon / Sleep Icon */}
                {isSuspended ? (
                  <span title="Tab is sleeping to conserve CPU & RAM">
                    <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </span>
                ) : tab.isPinned ? (
                  <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : tab.isQuarantined ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : tab.isHttps ? (
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}

                {/* Tab Title */}
                <span className="truncate flex-1 text-[11px]">
                  {tab.title}
                </span>

                {/* Group Tag Chip (if assigned) */}
                {tab.groupTitle && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border truncate max-w-[65px] shrink-0 hidden sm:inline ${
                      tab.groupColor === 'purple'
                        ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
                        : tab.groupColor === 'emerald'
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        : tab.groupColor === 'amber'
                        ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                        : tab.groupColor === 'rose'
                        ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                        : tab.groupColor === 'blue'
                        ? 'bg-blue-950/80 border-blue-500/40 text-blue-300'
                        : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                    }`}
                    title={`Group: ${tab.groupTitle}`}
                  >
                    {tab.groupTitle.split(' ')[0]}
                  </span>
                )}

                {/* Close Tab Button (Chrome 'x') */}
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className="w-4 h-4 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-slate-800 hover:text-rose-400 transition-all shrink-0 cursor-pointer"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Plus (+) New Tab Button (Just like Chrome) */}
          <button
            type="button"
            onClick={handleCreateNewTab}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors ml-1 shrink-0 cursor-pointer"
            title="Open New Tab (Chrome Style)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Smart Tab Grouping Action Button */}
          <button
            type="button"
            onClick={() => setShowSmartGroupModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors ml-1 shrink-0 text-xs font-mono cursor-pointer"
            title="Smart Tab Grouping (Auto-cluster tabs by category)"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Groups</span>
            {tabGroups.length > 0 && (
              <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded-full border border-cyan-500/30">
                {tabGroups.length}
              </span>
            )}
          </button>
        </div>

        {/* Chrome Navigation Toolbar with History, Bookmarks, Tabs, and AI Copilot Buttons */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/70 border-b border-slate-800 gap-3">
          {/* Navigation controls */}
          <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
            <button
              onClick={() => handleNavigate('https://cloudflare.com', false, false)}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              title="Previous"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNavigate('https://github.com', false, false)}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              title="Next"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleNavigate(activeTab.url, false, false)}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Reload Page"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Address Preview Pill with Star Bookmark Action */}
          <div className="flex-1 min-w-[200px] flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2 truncate">
              {activeTab.isHttps ? (
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
              )}
              <span className="text-slate-200 truncate">{activeTab.url}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Quick Save to Read Later Action */}
              <button
                type="button"
                onClick={handleToggleReadLater}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isCurrentInReadLater
                    ? 'text-cyan-400 hover:text-cyan-300'
                    : 'text-slate-500 hover:text-cyan-400'
                }`}
                title={isCurrentInReadLater ? 'In Read Later queue' : 'Save to Read Later queue'}
              >
                <BookOpen className={`w-3.5 h-3.5 ${isCurrentInReadLater ? 'text-cyan-400 fill-cyan-400/20' : ''}`} />
              </button>

              {/* Star Bookmark Icon Button */}
              <button
                type="button"
                onClick={handleToggleActiveBookmark}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isCurrentBookmarked
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-slate-500 hover:text-amber-400'
                }`}
                title={isCurrentBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
              >
                <Star className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="text-slate-400 hover:text-cyan-300 p-1 transition-colors cursor-pointer"
                title="Copy URL"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Tools & Sidebars Toggles */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Open in Separate Real Browser Window */}
            <button
              type="button"
              onClick={handleLaunchExternalWindow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              title="Open in Separate Browser Window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Real Window</span>
            </button>

            {/* Read Later Queue Sidebar Button */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'read-later' ? 'none' : 'read-later'))}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                activeSidebar === 'read-later'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Toggle Read Later Queue"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Read Later ({unreadReadLaterCount})</span>
            </button>

            {/* Bookmarks Sidebar Button */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'bookmarks' ? 'none' : 'bookmarks'))}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                activeSidebar === 'bookmarks'
                  ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Toggle Bookmarks Sidebar"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Bookmarks ({bookmarks.length})</span>
            </button>

            {/* History & Trends Sidebar Button */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'history' ? 'none' : 'history'))}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                activeSidebar === 'history'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Toggle Browsing History & Trends"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>History & Trends</span>
            </button>

            {/* Tab Manager Sidebar Button */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'tabs' ? 'none' : 'tabs'))}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                activeSidebar === 'tabs'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Toggle Tab Manager Sidebar"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Tabs ({tabs.length})</span>
            </button>

            {/* In-Browser AI Assistant Button */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'ai' ? 'none' : 'ai'))}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                activeSidebar === 'ai'
                  ? 'bg-teal-500/25 text-teal-300 border-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Toggle In-Browser AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>AI Copilot</span>
            </button>

            {/* Resource Monitor Sidebar Button */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'resource-monitor' ? 'none' : 'resource-monitor'))}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                activeSidebar === 'resource-monitor'
                  ? 'bg-rose-500/25 text-rose-300 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Toggle Resource Monitor (Real-time CPU & RAM per tab, sleep management)"
            >
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
              <span>Resource Monitor</span>
            </button>
          </div>
        </div>

        {/* Viewport & Slide-In Sidebars Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Main Web Viewport Area */}
          <div
            className={`transition-all duration-300 ${
              activeSidebar !== 'none' ? 'lg:col-span-8' : 'lg:col-span-12'
            }`}
          >
            {activeTab.isQuarantined ? (
              /* THREAT BLOCKED INTERCEPTOR VIEW */
              <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-rose-950/40 to-slate-950/80 space-y-6 h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.35)]">
                  <ShieldAlert className="w-9 h-9" />
                </div>

                <div className="max-w-2xl mx-auto space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-rose-300">
                    Aegis Security Intercept: Malicious Threat Blocked
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Aegis 3D Safe Browser prevented an untrusted connection to{' '}
                    <code className="text-rose-400 font-mono bg-rose-950/60 px-1 py-0.5 rounded">
                      {activeTab.url}
                    </code>
                    . The site exhibited malicious signatures or severe security vulnerabilities.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleNavigate('https://cloudflare.com', false, false)}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    Return to Safe Browsing
                  </button>
                  <button
                    onClick={() => onScanDns(activeTab.domain)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Inspect DNS Origin
                  </button>
                  <button
                    onClick={handleCreateNewTab}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-cyan-300 text-xs rounded-xl border border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    + Open Clean Tab
                  </button>
                </div>
              </div>
            ) : (
              /* SAFE BROWSING VERIFIED PREVIEW */
              <div className="p-6 sm:p-8 space-y-6 bg-slate-950/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        <span>{activeTab.domain}</span>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                          Zero-Trust Verified
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Encrypted TLS 1.3 handshake verified · No credential harvesters detected · Content sandbox active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleLaunchExternalWindow}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 rounded-lg hover:border-cyan-400 transition-colors cursor-pointer"
                    >
                      <span>Launch in Separate Window</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sandboxed Safe Simulation Rendering Container */}
                <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-6 min-h-[340px] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="max-w-lg space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                      <Shield className="w-7 h-7" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-100 font-mono">
                      {activeTab.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      Target Host: <code className="text-cyan-300 font-semibold">{activeTab.url}</code>
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You are browsing in an isolated container that strips third-party tracking beacons, blocks malicious JavaScript vectors, and audits DNS records continuously.
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={handleLaunchExternalWindow}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Separate Page ({activeTab.domain})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateNewTab}
                      className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Open New Browser Tab</span>
                    </button>
                  </div>

                  {/* Active Security Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xs font-mono text-slate-400">
                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                      CSP: Enforced
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                      Cookies: SameSite Strict
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                      X-Frame-Options: SAMEORIGIN
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                      DNSSEC: Cryptographically Signed
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DEDICATED COLLAPSIBLE SIDEBAR COLUMN */}
          {activeSidebar === 'resource-monitor' ? (
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/90 flex flex-col h-[560px]">
              <ResourceMonitorSidebar
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={(id) => {
                  setActiveTabId(id);
                  const t = tabs.find((x) => x.id === id);
                  if (t?.isSuspended) {
                    setTabs((prev) =>
                      prev.map((x) =>
                        x.id === id
                          ? { ...x, isSuspended: false, cpuPercent: 3.2, memoryMb: 52.0 }
                          : x
                      )
                    );
                  }
                }}
                onCloseTab={(id) => handleCloseTab({ stopPropagation: () => {} } as any, id)}
                onUpdateTabs={setTabs}
                onCloseSidebar={() => setActiveSidebar('none')}
              />
            </div>
          ) : activeSidebar !== 'none' && (
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/90 flex flex-col h-[560px]">
              {/* SIDEBAR HEADER */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                  {activeSidebar === 'read-later' && (
                    <>
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>Read Later Queue ({unreadReadLaterCount})</span>
                    </>
                  )}
                  {activeSidebar === 'history' && (
                    <>
                      <History className="w-4 h-4 text-cyan-400" />
                      <span>Enhanced Visual History</span>
                    </>
                  )}
                  {activeSidebar === 'bookmarks' && (
                    <>
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      <span>Bookmarks Vault ({bookmarks.length})</span>
                    </>
                  )}
                  {activeSidebar === 'tabs' && (
                    <>
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>Tab Manager ({tabs.length})</span>
                    </>
                  )}
                  {activeSidebar === 'ai' && (
                    <>
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <span>In-Browser AI Copilot</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSidebar('none')}
                  className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close sidebar"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>

              {/* 1. BOOKMARKS SIDEBAR VIEW */}
              {activeSidebar === 'bookmarks' && (
                <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
                  {/* Search bookmarks and add button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={bookmarkSearch}
                        onChange={(e) => setBookmarkSearch(e.target.value)}
                        placeholder="Search bookmarks..."
                        className="w-full glass-input rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddBookmarkModal(!showAddBookmarkModal)}
                      className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                      title="Add new bookmark"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {bookmarks.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllBookmarks}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                        title="Clear all bookmarks"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Add Bookmark Form Modal / Card */}
                  {showAddBookmarkModal && (
                    <form
                      onSubmit={handleAddCustomBookmark}
                      className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-amber-400 font-bold">
                        <span>Add New Bookmark</span>
                        <button
                          type="button"
                          onClick={() => setShowAddBookmarkModal(false)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={newBmTitle}
                        onChange={(e) => setNewBmTitle(e.target.value)}
                        placeholder="Title (e.g. GitHub)"
                        className="w-full glass-input rounded-md px-2.5 py-1 text-slate-100"
                      />
                      <input
                        type="text"
                        value={newBmUrl}
                        onChange={(e) => setNewBmUrl(e.target.value)}
                        placeholder="URL (e.g. github.com)"
                        className="w-full glass-input rounded-md px-2.5 py-1 text-slate-100"
                        required
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={newBmCategory}
                          onChange={(e) => setNewBmCategory(e.target.value)}
                          className="flex-1 glass-input rounded-md px-2 py-1 text-slate-100 bg-slate-950"
                        >
                          <option value="General">General</option>
                          <option value="Security">Security</option>
                          <option value="Developer">Developer</option>
                          <option value="Science">Science</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Category Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Bookmarks List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {filteredBookmarks.length > 0 ? (
                      filteredBookmarks.map((bm) => (
                        <div
                          key={bm.id}
                          className="group p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-400/40 transition-all text-xs font-mono space-y-1 relative"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              onClick={() => handleNavigate(bm.url, false, false)}
                              className="font-semibold text-slate-200 hover:text-amber-300 cursor-pointer truncate flex-1 block"
                            >
                              {bm.title}
                            </span>
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleNavigate(bm.url, true, false)}
                                className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-200 cursor-pointer"
                                title="Open in new tab"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBookmark(bm.id)}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                                title="Delete bookmark"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-400 truncate">
                            {bm.url}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                            <span>{bm.domain}</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                              {bm.category || 'General'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : bookmarks.length === 0 ? (
                      <div className="text-center py-10 px-4 text-xs font-mono space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <Bookmark className="w-6 h-6 opacity-80" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-200">No Bookmarks Saved Yet</div>
                          <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs mx-auto">
                            Accurate bookmark count: 0. You haven't bookmarked any websites yet. Click the star icon (★) in the omnibar to save pages.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
                          <button
                            type="button"
                            onClick={handleToggleActiveBookmark}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>Bookmark Current Page ({activeTab.domain})</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSeedSampleBookmarks}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] transition-colors cursor-pointer"
                          >
                            + Load Sample Security Sites
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-xs font-mono space-y-2">
                        <Bookmark className="w-6 h-6 mx-auto opacity-40" />
                        <p>No bookmarks match your search filter.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. ENHANCED VISUAL HISTORY SIDEBAR VIEW */}
              {activeSidebar === 'history' && (
                <EnhancedVisualHistoryPanel
                  history={history}
                  onNavigate={(url, newTab) => handleNavigate(url, !!newTab, false)}
                  onDeleteItem={handleDeleteHistoryItem}
                  onClearAll={handleClearAllHistory}
                  onBookmarkChanged={() => setBookmarks(getStoredBookmarks())}
                />
              )}

              {/* 3. READ LATER QUEUE SIDEBAR VIEW */}
              {activeSidebar === 'read-later' && (
                <ReadLaterPanel
                  currentTab={activeTab}
                  onNavigate={(url, newTab) => handleNavigate(url, !!newTab, false)}
                />
              )}

              {/* 3. TAB MANAGER SIDEBAR VIEW */}
              {activeSidebar === 'tabs' && (
                <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
                  {/* Bulk Actions */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCreateNewTab}
                      className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Tab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSmartGroupModal(true)}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                      title="Smart Tab Grouping"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Groups ({tabGroups.length})</span>
                    </button>

                    {tabs.length > 1 && (
                      <button
                        type="button"
                        onClick={handleCloseOtherTabs}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-mono transition-colors cursor-pointer"
                        title="Close other tabs"
                      >
                        Close Others
                      </button>
                    )}

                    {recentlyClosedTabs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRestoreRecentlyClosed}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 text-xs font-mono transition-colors cursor-pointer"
                        title="Reopen recently closed tab"
                      >
                        Undo
                      </button>
                    )}
                  </div>

                  {/* Open tabs list */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {tabs.map((tab, idx) => {
                      const isCurrent = tab.id === activeTabId;
                      return (
                        <div
                          key={tab.id}
                          className={`p-3 rounded-xl border transition-all text-xs font-mono space-y-1.5 ${
                            isCurrent
                              ? 'bg-slate-900 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div
                              onClick={() => {
                                setActiveTabId(tab.id);
                                if (tab.isSuspended) {
                                  setTabs((prev) =>
                                    prev.map((t) =>
                                      t.id === tab.id
                                        ? { ...t, isSuspended: false, cpuPercent: 3.2, memoryMb: 52.0 }
                                        : t
                                    )
                                  );
                                }
                              }}
                              className="flex items-center gap-2 truncate cursor-pointer flex-1"
                            >
                              <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                              <span className={`font-semibold truncate ${isCurrent ? 'text-cyan-300' : 'text-slate-200'}`}>
                                {tab.title}
                              </span>
                              {tab.groupTitle && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/30 truncate max-w-[80px]">
                                  {tab.groupTitle}
                                </span>
                              )}
                              {tab.isSuspended && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  Sleep
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePinTab(tab.id)}
                                className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                                  tab.isPinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                                }`}
                                title={tab.isPinned ? 'Unpin tab' : 'Pin tab'}
                              >
                                {tab.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicateTab(tab)}
                                className="p-1 rounded text-slate-500 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"
                                title="Duplicate tab"
                              >
                                <CopyPlus className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleCloseTab(e, tab.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                                title="Close tab"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-400 truncate">
                            {tab.url}
                          </div>

                          {/* Miniature visual snapshot preview */}
                          <div
                            onClick={() => {
                              setActiveTabId(tab.id);
                              if (tab.isSuspended) {
                                handleToggleSuspendTab(tab.id);
                              }
                            }}
                            className="cursor-pointer overflow-hidden rounded-lg border border-slate-800/80 hover:border-cyan-500/40 transition-all"
                            title="Click to switch to this tab"
                          >
                            <TabSnapshotThumbnail tab={tab} showChromeBar={false} className="!h-20" />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                            <span>{tab.domain}</span>
                            <span className="text-emerald-400">{tab.isHttps ? 'TLS 1.3' : 'Insecure'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. IN-BROWSER AI ASSISTANT VIEW */}
              {activeSidebar === 'ai' && (
                <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-2">
                  {/* Active Page Context Banner */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">Context: {activeTab.domain}</span>
                    <span className="text-emerald-400 font-bold">Grade {activeTab.sslGrade}</span>
                  </div>

                  {/* Quick AI Action Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
                    {[
                      'Audit SSL security',
                      'Check phishing risk',
                      'Explain DNS origin',
                      'Trackers report',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSendAiMessage(chip)}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-teal-300 whitespace-nowrap cursor-pointer transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Message Thread */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin text-xs">
                    {aiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] rounded-xl p-2.5 space-y-1 ${
                            msg.role === 'user'
                              ? 'bg-cyan-500/25 border border-cyan-500/40 text-cyan-200'
                              : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="text-[10px] opacity-60 font-mono flex items-center justify-between">
                            <span>{msg.role === 'user' ? 'You' : 'Aegis Copilot'}</span>
                            <span>{msg.time}</span>
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                        </div>

                        {msg.role === 'user' && (
                          <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    ))}

                    {aiLoading && (
                      <div className="flex items-center gap-2 text-xs text-teal-400 font-mono">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Copilot analyzing page security...</span>
                      </div>
                    )}
                    <div ref={aiChatEndRef} />
                  </div>

                  {/* Input box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAiMessage();
                    }}
                    className="flex gap-1.5 pt-1 border-t border-slate-800"
                  >
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder={`Ask Copilot about ${activeTab.domain}...`}
                      className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading || !aiInput.trim()}
                      className="p-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Smart Tab Grouping Modal */}
      <SmartTabGroupModal
        isOpen={showSmartGroupModal}
        onClose={() => setShowSmartGroupModal(false)}
        tabs={tabs}
        tabGroups={tabGroups}
        onUpdateTabsAndGroups={(updatedTabs, updatedGroups) => {
          setTabs(updatedTabs);
          setTabGroups(updatedGroups);
        }}
      />

      {/* Floating Hover-State Tab Preview Card */}
      {hoveredTab && (
        <TabHoverPreviewCard
          tab={hoveredTab.tab}
          isActive={hoveredTab.tab.id === activeTabId}
          position={hoveredTab.position}
          onSelectTab={(id) => {
            setActiveTabId(id);
            setHoveredTab(null);
            const t = tabs.find((x) => x.id === id);
            if (t?.isSuspended) {
              setTabs((prev) =>
                prev.map((x) =>
                  x.id === id
                    ? { ...x, isSuspended: false, cpuPercent: 3.2, memoryMb: 52.0 }
                    : x
                )
              );
            }
          }}
          onCloseTab={(e, id) => {
            setHoveredTab(null);
            handleCloseTab(e, id);
          }}
          onToggleSuspend={handleToggleSuspendTab}
          onTogglePin={handleTogglePinTab}
          onDuplicate={(tabToDup) => {
            setHoveredTab(null);
            handleDuplicateTab(tabToDup);
          }}
          onMouseEnter={() => {
            isPreviewCardHoveredRef.current = true;
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            isPreviewCardHoveredRef.current = false;
            hoverTimeoutRef.current = setTimeout(() => {
              setHoveredTab(null);
            }, 120);
          }}
        />
      )}
    </div>
  );
};
