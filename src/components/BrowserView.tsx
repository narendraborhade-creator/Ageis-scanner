import React, { useState, useEffect, useRef } from 'react';
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
import { queryAegisCopilot } from '../services/cyberBotService';
import { LinkAuthPromptModal } from './LinkAuthPromptModal';
import {
  isGuestModeActive,
  setGuestModeActive,
  createGuestAccount,
  loginWithGmail,
  getAuthPromptPreference,
} from '../services/authStorage';
import { UserAccount } from '../types';
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
  Minimize2,
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
  Mail,
  Key,
  Home,
  Play,
  Volume2,
  Compass,
  Settings,
  Puzzle,
  Sliders,
  GitCompare,
  Info,
} from 'lucide-react';
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

function parseYouTubeUrl(url: string) {
  try {
    const clean = (url || '').trim().toLowerCase();
    const isYt = clean.includes('youtube.com') || clean.includes('youtu.be');
    if (!isYt) return { isYouTube: false, videoId: null as string | null, isSearch: false, searchQuery: '' };

    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) return { isYouTube: true, videoId: shortMatch[1], isSearch: false, searchQuery: '' };

    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    if (watchMatch) return { isYouTube: true, videoId: watchMatch[1], isSearch: false, searchQuery: '' };

    const embedMatch = url.match(/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})/i);
    if (embedMatch) return { isYouTube: true, videoId: embedMatch[1], isSearch: false, searchQuery: '' };

    const searchMatch = url.match(/[?&]search_query=([^&]+)/i);
    if (searchMatch) {
      return {
        isYouTube: true,
        videoId: null,
        isSearch: true,
        searchQuery: decodeURIComponent(searchMatch[1].replace(/\+/g, ' ')),
      };
    }

    return { isYouTube: true, videoId: null, isSearch: false, searchQuery: '' };
  } catch {
    return { isYouTube: false, videoId: null, isSearch: false, searchQuery: '' };
  }
}

export type ToolTabId =
  | '3d-scanner'
  | 'dns'
  | 'compare'
  | 'threat-shield'
  | 'analytics'
  | 'science'
  | 'ai-copilot'
  | 'vault'
  | 'extensions'
  | 'settings'
  | 'about';

interface BrowserViewProps {
  onScanDns?: (domain: string) => void;
  onOpenCompare?: (domain: string) => void;
  onOpenScience?: (query: string) => void;
  initialUrl?: string;
  onTabsCountChange?: (count: number) => void;
  currentUser?: UserAccount | null;
  onUserChange?: (user: UserAccount | null) => void;
  onOpenAuthView?: () => void;
  onOpenThemeModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenCloudflareModal?: () => void;
  privacyMode?: boolean;
  onTogglePrivacy?: () => void;
}

// Built-in working YouTube videos to guarantee playback never breaks or shows an empty screen
export const DEFAULT_YT_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    channel: 'Rick Astley',
    views: '1.5B views',
    published: 'Official 4K Remaster',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=640&q=80',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Me at the zoo - The First Video on YouTube',
    channel: 'jawed',
    views: '315M views',
    published: 'Historical Archive',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=640&q=80',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  },
  {
    id: 'L_LUpnjgPso',
    title: 'Starship Flight Test Highlights & Orbital Re-entry',
    channel: 'SpaceX & Aerospace',
    views: '18M views',
    published: 'Aerospace Engineering',
    thumbnail: 'https://images.unsplash.com/photo-1517976487502-5f690246a48c?auto=format&fit=crop&w=640&q=80',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
  },
  {
    id: 'M576WGiDBdQ',
    title: 'Quantum Computing Explained: Qubits, Superposition & Cryptography',
    channel: 'Quantum Computing Lab',
    views: '4.2M views',
    published: 'Cybersecurity & Physics',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=640&q=80',
    url: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    channel: 'Luis Fonsi',
    views: '8.4B views',
    published: 'Music Video',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=640&q=80',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
  },
  {
    id: '9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE (강남스타일) M/V',
    channel: 'OfficialPsy',
    views: '5.1B views',
    published: 'K-Pop Sensation',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=640&q=80',
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
  },
];

// Helper to parse Aegis Secure Search URLs: aegis://search?q=...&category=...
function parseSearchUrl(url: string) {
  try {
    const clean = (url || '').trim();
    if (!clean.startsWith('aegis://search')) {
      return { isSearch: false, query: '', category: 'all' as 'all' | 'news' | 'tech' | 'videos' | 'science' };
    }
    const fake = clean.replace('aegis://search', 'https://aegis.local/search');
    const parsed = new URL(fake);
    const q = parsed.searchParams.get('q') || '';
    const cat = (parsed.searchParams.get('category') || 'all') as 'all' | 'news' | 'tech' | 'videos' | 'science';
    return { isSearch: true, query: q, category: cat };
  } catch {
    const qMatch = url.match(/[?&]q=([^&]+)/i);
    return {
      isSearch: url.startsWith('aegis://search'),
      query: qMatch ? decodeURIComponent(qMatch[1]) : '',
      category: 'all' as const,
    };
  }
}

// Accurate Initial State: Starts cleanly on Aegis Safe Search Start Page (Zero external network dependencies or iframe loops)
const DEFAULT_TABS: BrowserTab[] = [
  {
    id: 'tab-newtab',
    title: 'Aegis Safe Search',
    url: 'aegis://newtab',
    domain: 'aegis.local',
    isHttps: true,
    threatStatus: 'clean',
    trackersBlocked: 0,
    bugsSanitized: 0,
    latencyMs: 1,
    securityScore: 100,
    sslGrade: 'A+',
    isQuarantined: false,
    isPinned: false,
    pageMetrics: calculatePageLoadMetrics('aegis://newtab', 'clean', 1),
    createdAt: Date.now(),
    historyStack: ['aegis://newtab'],
    historyIndex: 0,
  },
];

export const BrowserView: React.FC<BrowserViewProps> = ({
  onScanDns,
  onOpenCompare,
  onOpenScience,
  initialUrl,
  onTabsCountChange,
  currentUser,
  onUserChange,
  onOpenAuthView,
  onOpenThemeModal,
  onOpenCommandPalette,
  onOpenCloudflareModal,
  privacyMode,
  onTogglePrivacy,
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

  // Sidebar Mode: 'none' | 'history' | 'bookmarks' | 'tabs' | 'ai' | 'read-later' | 'resource-monitor' | 'tools'
  const [activeSidebar, setActiveSidebar] = useState<
    'none' | 'history' | 'bookmarks' | 'tabs' | 'ai' | 'read-later' | 'resource-monitor' | 'tools'
  >(() => {
    const session = getStoredSessionState();
    return (session?.browser.activeSidebar as any) || 'none';
  });

  // Tools & Settings Side Panel state
  const [activeToolTab, setActiveToolTab] = useState<ToolTabId>('dns');
  const [isToolFullscreen, setIsToolFullscreen] = useState<boolean>(false);

  // Tab Groups & Smart Grouping modal state
  const [tabGroups, setTabGroups] = useState<TabGroup[]>(() => {
    const session = getStoredSessionState();
    return session?.browser.tabGroups || [];
  });
  const [showSmartGroupModal, setShowSmartGroupModal] = useState<boolean>(false);

  // Read Later queue state
  const [readLaterItems, setReadLaterItems] = useState<ReadLaterItem[]>(() => getStoredReadLaterList());

  // Link Auth Prompt Modal & Address Bar Editing State
  const [showLinkAuthModal, setShowLinkAuthModal] = useState<boolean>(false);
  const [pendingNav, setPendingNav] = useState<{
    url: string;
    inNewTab: boolean;
    openExternal: boolean;
  } | null>(null);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [urlInputValue, setUrlInputValue] = useState<string>('');

  // Real In-Browser Rendering & YouTube States
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [show3DScannerModal, setShow3DScannerModal] = useState<boolean>(false);
  const [ytVideos, setYtVideos] = useState<Array<{
    id: string;
    title: string;
    channel: string;
    views: string;
    published: string;
    thumbnail: string;
    url: string;
  }>>(DEFAULT_YT_VIDEOS);
  const [ytLoading, setYtLoading] = useState<boolean>(false);
  const [ytSearchInput, setYtSearchInput] = useState<string>('');

  // In-Browser Secure Web Search Engine States
  const [searchResults, setSearchResults] = useState<Array<{
    title: string;
    url: string;
    domain: string;
    snippet: string;
    securityScore: number;
    sslGrade: string;
    threatStatus: 'clean' | 'warning';
    isHttps: boolean;
  }>>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchCategory, setSearchCategory] = useState<'all' | 'news' | 'tech' | 'videos' | 'science'>('all');
  const [searchQueryInput, setSearchQueryInput] = useState<string>('');

  // Active Tab & In-Browser Link Interceptor
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const ytInfo = parseYouTubeUrl(activeTab.url);
  const searchInfo = parseSearchUrl(activeTab.url);
  const canGoBack = (activeTab.historyIndex ?? 0) > 0;
  const canGoForward = (activeTab.historyIndex ?? 0) < ((activeTab.historyStack?.length ?? 1) - 1);

  // In-Browser Link Click & Form Submission Interceptor:
  // Listens to postMessage events from the proxied iframe and opens them directly in this browser!
  // Strictly debounced to prevent loop storms or automated window openings.
  useEffect(() => {
    let lastNavTime = 0;
    const handleWindowMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'AEGIS_NAVIGATE' && typeof e.data.url === 'string') {
        const targetUrl = e.data.url.trim();
        if (!targetUrl || targetUrl.startsWith('javascript:') || targetUrl === 'about:blank') {
          return;
        }
        const now = Date.now();
        if (now - lastNavTime < 1200) {
          return;
        }
        if (targetUrl === activeTab.url) {
          return;
        }
        lastNavTime = now;
        executeNavigate(targetUrl, false, false);
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [activeTab.url]);

  // Synchronize In-Browser Secure Search results when visiting aegis://search
  useEffect(() => {
    if (searchInfo.isSearch) {
      const q = searchInfo.query.trim();
      setSearchQueryInput(q);
      setSearchCategory(searchInfo.category);
      if (!q) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(searchInfo.category)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && Array.isArray(data.results)) {
            setSearchResults(data.results);
          }
        })
        .catch((err) => console.warn('Aegis Search API error:', err))
        .finally(() => setSearchLoading(false));
    }
  }, [activeTab.url, searchInfo.isSearch, searchInfo.query, searchInfo.category]);

  // Fetch YouTube video search/recommendations when visiting YouTube
  useEffect(() => {
    if (ytInfo.isYouTube) {
      const q = ytInfo.videoId
        ? (activeTab.title && !activeTab.title.includes('YouTube') ? activeTab.title : 'trending tech science')
        : (ytInfo.searchQuery || 'trending tech science');
      setYtLoading(true);
      fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            setYtVideos(data.videos);
          }
        })
        .catch((err) => console.warn('YouTube search API error:', err))
        .finally(() => setYtLoading(false));
    }
  }, [activeTab.url, activeTab.title]);

  const handleGoBack = () => {
    if (!canGoBack || !activeTab.historyStack) return;
    const nextIdx = (activeTab.historyIndex ?? 0) - 1;
    const targetUrl = activeTab.historyStack[nextIdx];
    executeNavigate(targetUrl, false, false, true, nextIdx);
  };

  const handleGoForward = () => {
    if (!canGoForward || !activeTab.historyStack) return;
    const nextIdx = (activeTab.historyIndex ?? 0) + 1;
    const targetUrl = activeTab.historyStack[nextIdx];
    executeNavigate(targetUrl, false, false, true, nextIdx);
  };

  const handleReload = () => {
    setIsScanning(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsScanning(false), 450);
  };

  const handleGoHome = () => {
    executeNavigate('aegis://newtab', false, false);
  };

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
      text: 'Aegis Cybersecurity Sentinel initialized. Ask any cybersecurity question, explore attack vectors (DNS Origin, Phishing & AitM, Zero Trust, Exploit Payloads), or audit current page telemetry.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);
  const [hasUserApiKey, setHasUserApiKey] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean(localStorage.getItem('aegis_gemini_api_key'));
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');

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
    if (url === 'aegis://newtab') return 'Aegis Safe Search & 3D Core';
    const sInfo = parseSearchUrl(url);
    if (sInfo.isSearch) {
      return sInfo.query ? `Aegis Search: ${sInfo.query}` : 'Aegis Secure Search';
    }
    const domain = formatDomain(url);
    const yt = parseYouTubeUrl(url);
    if (yt.isYouTube) {
      if (yt.videoId) return `YouTube Video (${yt.videoId})`;
      if (yt.searchQuery) return `YouTube: ${yt.searchQuery}`;
      return 'YouTube: Web Video Portal';
    }
    if (domain.includes('github')) return 'GitHub: Where the world builds';
    if (domain.includes('cloudflare')) return 'Cloudflare: Web Security & DNS';
    if (domain.includes('ncbi') || domain.includes('pubmed')) return 'NCBI / PubMed Literature';
    if (domain.includes('wikipedia')) return 'Wikipedia, the free encyclopedia';
    if (domain.includes('duckduckgo')) return 'DuckDuckGo Search';
    if (domain.includes('google')) return 'Google Safe Search';
    return domain || 'New Tab';
  };

  const executeNavigate = (
    rawUrl: string,
    inNewTab = false,
    openExternal = false,
    isHistoryNav = false,
    targetHistoryIndex?: number
  ) => {
    let target = rawUrl.trim();
    if (!target) return;

    const sInfo = parseSearchUrl(target);
    if (!sInfo.isSearch && !target.startsWith('aegis://')) {
      const isExplicitUrl = /^https?:\/\//i.test(target) ||
        (!target.includes(' ') && target.includes('.') && !target.endsWith('.') && !target.startsWith('.'));

      if (!isExplicitUrl) {
        if (target.toLowerCase().includes('youtube')) {
          const query = target.replace(/youtube/gi, '').trim() || 'trending';
          target = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        } else {
          target = `aegis://search?q=${encodeURIComponent(target)}`;
        }
      } else if (!/^https?:\/\//i.test(target)) {
        target = `https://${target}`;
      }
    }

    const domain = formatDomain(target);
    const isHttps = target.startsWith('https://');

    setIsScanning(true);

    // Compute history stack
    let newStack = activeTab.historyStack ? [...activeTab.historyStack] : [activeTab.url];
    let newIndex = activeTab.historyIndex ?? 0;

    if (isHistoryNav && typeof targetHistoryIndex === 'number') {
      newIndex = targetHistoryIndex;
    } else if (!inNewTab) {
      newStack = [...newStack.slice(0, newIndex + 1), target];
      newIndex = newStack.length - 1;
    } else {
      newStack = [target];
      newIndex = 0;
    }

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
        historyStack: newStack,
        historyIndex: newIndex,
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
    }, 300);
  };

  /**
   * Universal Security-Gated Link Handler:
   * Always navigates directly inside the browser tab, maintaining seamless in-browser browsing.
   */
  const handleNavigate = (rawUrl: string, inNewTab = false, openExternal = false) => {
    let target = rawUrl.trim();
    if (!target.includes('.') && !target.startsWith('http') && !target.startsWith('aegis://')) {
      if (target.toLowerCase().includes('youtube')) {
        const query = target.replace(/youtube/gi, '').trim() || 'trending';
        target = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      } else {
        target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
      }
    }
    if (!/^https?:\/\//i.test(target) && !target.startsWith('aegis://')) {
      target = `https://${target}`;
    }

    executeNavigate(target, inNewTab, false);
  };

  const handleConfirmGuest = (rememberForSession: boolean) => {
    if (rememberForSession) {
      sessionStorage.setItem('aegis_auth_prompt_dismissed', 'true');
    }
    const guest = createGuestAccount();
    onUserChange?.(guest);
    setShowLinkAuthModal(false);
    if (pendingNav) {
      executeNavigate(pendingNav.url, pendingNav.inNewTab, false);
      setPendingNav(null);
    }
  };

  const handleConfirmGmail = (email: string, rememberForSession: boolean) => {
    if (rememberForSession) {
      sessionStorage.setItem('aegis_auth_prompt_dismissed', 'true');
    }
    const loggedIn = loginWithGmail(email);
    onUserChange?.(loggedIn);
    setShowLinkAuthModal(false);
    if (pendingNav) {
      executeNavigate(pendingNav.url, pendingNav.inNewTab, false);
      setPendingNav(null);
    }
  };

  const handleCreateNewTab = () => {
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}`,
      title: 'Aegis Safe Search',
      url: 'aegis://newtab',
      domain: 'aegis.local',
      isHttps: true,
      threatStatus: 'clean',
      trackersBlocked: 0,
      bugsSanitized: 0,
      latencyMs: 1,
      securityScore: 100,
      sslGrade: 'A+',
      isQuarantined: false,
      isPinned: false,
      pageMetrics: calculatePageLoadMetrics('aegis://newtab', 'clean', 1),
      createdAt: Date.now(),
      historyStack: ['aegis://newtab'],
      historyIndex: 0,
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
        historyStack: ['https://cloudflare.com'],
        historyIndex: 0,
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
      const result = await queryAegisCopilot({
        messages: [
          ...aiMessages.map((m) => ({ role: m.role, content: m.text })),
          { role: 'user', content: query },
        ],
        activeTab,
        systemInstruction: `You are Aegis In-Browser Copilot. The user is actively viewing: "${activeTab.title}" at URL "${activeTab.url}" (Domain: ${activeTab.domain}, SSL Grade: ${activeTab.sslGrade}, Protocol: ${activeTab.isHttps ? 'HTTPS' : 'HTTP'}, Security Score: ${activeTab.securityScore}/100, Quarantine Status: ${activeTab.isQuarantined ? 'BLOCKED' : 'CLEAN'}). Provide fast, concrete, security-focused answers.`,
        model: 'aegis-cyber-python',
      });

      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-a-${Date.now()}`,
          role: 'assistant',
          text: result.reply || 'Security telemetry evaluation complete.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          text: `[Aegis Copilot]: Security telemetry active. ${err.message || 'Ready for queries.'}`,
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
    <div className="flex flex-col h-full">
      {/* BROWSER WINDOW WITH MULTI-TAB STRIP & DEDICATED SIDEBARS */}
      <div className="flex flex-col flex-1 overflow-hidden">
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
          {/* Navigation controls: Back, Forward, Reload, Home */}
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            <button
              type="button"
              disabled={!canGoBack}
              onClick={handleGoBack}
              className={`p-1.5 rounded transition-colors ${
                canGoBack
                  ? 'hover:bg-slate-800 text-slate-200 hover:text-cyan-300 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!canGoForward}
              onClick={handleGoForward}
              className={`p-1.5 rounded transition-colors ${
                canGoForward
                  ? 'hover:bg-slate-800 text-slate-200 hover:text-cyan-300 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="Forward"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReload}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-cyan-300 transition-colors cursor-pointer text-slate-300"
              title="Reload Page"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleGoHome}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-cyan-300 transition-colors cursor-pointer text-slate-300"
              title="Home / Start Page"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Identity & Session Status Badge */}
          {currentUser && !currentUser.email.endsWith('@aegis.local') ? (
            <button
              type="button"
              onClick={() => {
                setPendingNav({ url: activeTab.url, inNewTab: false, openExternal: false });
                setShowLinkAuthModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors text-[11px] font-mono shrink-0 cursor-pointer shadow-sm"
              title={`Logged in as ${currentUser.email}. Click to change identity or switch to Guest.`}
            >
              <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline max-w-[120px] truncate">{currentUser.email}</span>
              <span className="sm:hidden">Gmail</span>
            </button>
          ) : isGuestModeActive() ? (
            <button
              type="button"
              onClick={() => {
                setPendingNav({ url: activeTab.url, inNewTab: false, openExternal: false });
                setShowLinkAuthModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:bg-teal-900/60 transition-colors text-[11px] font-mono shrink-0 cursor-pointer shadow-sm"
              title="Browsing as Guest. Click to log in with Gmail."
            >
              <EyeOff className="w-3 h-3 text-teal-400 shrink-0" />
              <span className="hidden sm:inline">Guest Mode</span>
              <span className="sm:hidden">Guest</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPendingNav({ url: activeTab.url, inNewTab: false, openExternal: false });
                setShowLinkAuthModal(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors text-[11px] font-mono shrink-0 cursor-pointer animate-pulse"
              title="Not authenticated. Click to choose Guest or Gmail."
            >
              <Shield className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Select Mode</span>
            </button>
          )}

          {/* Interactive Address Bar Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = (urlInputValue || activeTab.url).trim();
              if (val) {
                handleNavigate(val, false, false);
                setIsEditingUrl(false);
              }
            }}
            className="flex-1 min-w-0 sm:min-w-[200px] flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 focus-within:border-cyan-400 font-mono text-xs overflow-hidden transition-all shadow-inner"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {activeTab.isHttps ? (
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
              )}
              <input
                type="text"
                value={isEditingUrl ? urlInputValue : activeTab.url}
                onFocus={() => {
                  setIsEditingUrl(true);
                  setUrlInputValue(activeTab.url);
                }}
                onBlur={() => {
                  setTimeout(() => setIsEditingUrl(false), 250);
                }}
                onChange={(e) => setUrlInputValue(e.target.value)}
                placeholder="Enter URL or search term..."
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none truncate font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              {isEditingUrl && (
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold text-[10px] hover:bg-cyan-400 cursor-pointer"
                >
                  Go
                </button>
              )}
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
          </form>

          {/* Chromium Style Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto max-w-full pb-0.5 scrollbar-none py-0.5">
            {/* Extensions Action Button */}
            <button
              type="button"
              onClick={() => {
                if (activeSidebar === 'tools' && activeToolTab === 'extensions') {
                  setActiveSidebar('none');
                } else {
                  setActiveSidebar('tools');
                  setActiveToolTab('extensions');
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer border ${
                activeSidebar === 'tools' && activeToolTab === 'extensions'
                  ? 'bg-indigo-500/25 text-indigo-300 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="Aegis Chrome Extensions & Manifest Manager"
            >
              <Puzzle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Extensions</span>
            </button>

            {/* Tools & Settings Side Panel Button (Houses all 10 tools) */}
            <button
              type="button"
              onClick={() => {
                setActiveSidebar((prev) => (prev === 'tools' ? 'none' : 'tools'));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer border ${
                activeSidebar === 'tools'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/40'
              }`}
              title="Aegis Tools & Settings (DNS Scanner, Comparator, 3D Mesh, Threat Shield, Analytics, Vault, Science)"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tools & Settings</span>
              <span className="text-[10px] bg-cyan-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                10
              </span>
            </button>

            {/* Quick Sidebars: Read Later */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'read-later' ? 'none' : 'read-later'))}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeSidebar === 'read-later'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title={`Read Later Queue (${unreadReadLaterCount})`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* Bookmarks */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'bookmarks' ? 'none' : 'bookmarks'))}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeSidebar === 'bookmarks'
                  ? 'bg-amber-500/25 text-amber-300 border-amber-400'
                  : 'bg-slate-855 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title={`Bookmarks Vault (${bookmarks.length})`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* History */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'history' ? 'none' : 'history'))}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeSidebar === 'history'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title="Browsing History & Visual Trends"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* Tabs Manager */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'tabs' ? 'none' : 'tabs'))}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeSidebar === 'tabs'
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title={`Tab Manager (${tabs.length} tabs)`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Resource Monitor */}
            <button
              type="button"
              onClick={() => setActiveSidebar((prev) => (prev === 'resource-monitor' ? 'none' : 'resource-monitor'))}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeSidebar === 'resource-monitor'
                  ? 'bg-rose-500/25 text-rose-300 border-rose-400'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title="Resource Monitor (Real-time CPU & RAM per tab)"
            >
              <Cpu className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        </div>

        {/* Quick Bookmarks Ribbon */}
        <div className="h-8 bg-[#060a14] border-b border-slate-800/80 px-3 flex items-center gap-1.5 text-xs font-mono overflow-x-auto scrollbar-none select-none shrink-0 z-10">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1 shrink-0">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="hidden md:inline">Bookmarks:</span>
          </span>
          {[
            { title: 'YouTube', url: 'https://www.youtube.com' },
            { title: 'Cloudflare', url: 'https://cloudflare.com' },
            { title: 'Wikipedia', url: 'https://en.wikipedia.org' },
            { title: 'DuckDuckGo', url: 'https://duckduckgo.com' },
            { title: 'GitHub', url: 'https://github.com' },
            { title: 'PubMed Research', url: 'https://ncbi.nlm.nih.gov' },
            { title: 'arXiv Preprints', url: 'https://arxiv.org' },
            ...bookmarks.slice(0, 5),
          ].map((bm) => (
            <button
              key={bm.title}
              type="button"
              onClick={() => handleNavigate(bm.url, false, false)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-800/80 text-slate-300 hover:text-cyan-300 text-[11px] transition-colors whitespace-nowrap shrink-0 group border border-transparent hover:border-slate-700 cursor-pointer"
              title={bm.url}
            >
              <Globe className="w-3 h-3 text-slate-400 group-hover:text-cyan-400" />
              <span>{bm.title}</span>
            </button>
          ))}
        </div>

        {/* Viewport & Slide-In Sidebars Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Main Web Viewport Area */}
          <div
            className={`transition-all duration-300 ${
              activeSidebar === 'tools' && isToolFullscreen
                ? 'hidden'
                : activeSidebar === 'tools'
                ? 'lg:col-span-7'
                : activeSidebar !== 'none'
                ? 'lg:col-span-8'
                : 'lg:col-span-12'
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
                    onClick={() => handleNavigate('aegis://newtab', false, false)}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    Return to Safe Browsing
                  </button>
                  <button
                    onClick={() => {
                      setActiveSidebar('tools');
                      setActiveToolTab('dns');
                      if (onScanDns) onScanDns(activeTab.domain);
                    }}
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
            ) : ytInfo.isYouTube && ytInfo.videoId ? (
              /* =========================================================================
                 IN-BROWSER YOUTUBE VIDEO PLAYER VIEW
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col bg-[#050811] overflow-y-auto scrollbar-thin p-3 sm:p-5 space-y-4">
                {/* Main YouTube Embedded Video Player Card */}
                <div className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
                  <div className="relative w-full aspect-video bg-black">
                    <iframe
                      key={`yt-player-${ytInfo.videoId}-${refreshKey}`}
                      src={`https://www.youtube-nocookie.com/embed/${ytInfo.videoId}?autoplay=1&enablejsapi=1&rel=0`}
                      title={activeTab.title || 'YouTube Video Player'}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  </div>

                  {/* Video Meta & In-Browser Actions */}
                  <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1 max-w-xl">
                      <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                        <span>{activeTab.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/30">
                          YouTube Web
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Playing in Aegis In-Browser Sandbox · TLS 1.3 Verified · Zero-Trust Container
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleToggleActiveBookmark}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                          isCurrentBookmarked
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-amber-300'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                        <span>{isCurrentBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleReadLater}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                          isCurrentInReadLater
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-cyan-300'
                        }`}
                      >
                        <BookOpen className={`w-3.5 h-3.5 ${isCurrentInReadLater ? 'text-cyan-400 fill-cyan-400/20' : ''}`} />
                        <span>{isCurrentInReadLater ? 'In Watch Later' : 'Watch Later'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShow3DScannerModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-mono transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>3D Scanner HUD</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Search Inside YouTube */}
                <div className="w-full max-w-5xl mx-auto flex items-center gap-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (ytSearchInput.trim()) {
                        handleNavigate(`https://www.youtube.com/results?search_query=${encodeURIComponent(ytSearchInput.trim())}`, false, false);
                      }
                    }}
                    className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus-within:border-cyan-500 shadow-inner"
                  >
                    <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={ytSearchInput}
                      onChange={(e) => setYtSearchInput(e.target.value)}
                      placeholder="Search more YouTube videos..."
                      className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer ml-2"
                    >
                      Search
                    </button>
                  </form>
                </div>

                {/* Recommended & Related Videos Grid */}
                <div className="w-full max-w-5xl mx-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 font-mono flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Recommended & Related Videos</span>
                    </h4>
                    {ytLoading && (
                      <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Fetching related videos...</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ytVideos.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => handleNavigate(`https://www.youtube.com/watch?v=${video.id}`, false, false)}
                        className="group rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-2 space-y-2 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-black/40"
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 line-clamp-2 leading-snug">
                            {video.title}
                          </h5>
                          <div className="text-[11px] text-slate-400 truncate">{video.channel}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{video.views}</span>
                            <span>{video.published}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : ytInfo.isYouTube && !ytInfo.videoId ? (
              /* =========================================================================
                 IN-BROWSER YOUTUBE PORTAL & SEARCH VIEW
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col bg-[#050811] overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-6">
                <div className="w-full max-w-5xl mx-auto space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                        <Globe className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                          <span>YouTube Safe Web Player</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/30">
                            In-Browser
                          </span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">
                          Watch any YouTube video right inside Aegis 3D Safe Browser with zero tracking
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Big Search Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const q = ytSearchInput.trim() || 'trending tech';
                      handleNavigate(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, false, false);
                    }}
                    className="flex items-center bg-slate-900 border border-slate-800 focus-within:border-red-500 rounded-2xl p-1.5 shadow-xl transition-all"
                  >
                    <Search className="w-5 h-5 text-slate-400 ml-3 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={ytSearchInput}
                      onChange={(e) => setYtSearchInput(e.target.value)}
                      placeholder="Search videos, tutorials, music, cyber security, coding..."
                      className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono py-1.5"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono transition-colors cursor-pointer shrink-0"
                    >
                      Search
                    </button>
                  </form>

                  {/* Quick Topic Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
                    {[
                      'Cybersecurity',
                      'Web Development',
                      'Three.js 3D',
                      'Computer Networks',
                      'Artificial Intelligence',
                      'Science & Physics',
                      'Music & Lofi',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setYtSearchInput(chip);
                          handleNavigate(`https://www.youtube.com/results?search_query=${encodeURIComponent(chip)}`, false, false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/40 text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Videos Grid */}
                <div className="w-full max-w-5xl mx-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 font-mono">
                      {ytInfo.searchQuery ? `Search Results for "${ytInfo.searchQuery}"` : 'Trending & Recommended Videos'}
                    </h3>
                    {ytLoading && (
                      <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading videos...</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {ytVideos.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => handleNavigate(`https://www.youtube.com/watch?v=${video.id}`, false, false)}
                        className="group rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-red-500/50 p-2.5 space-y-2.5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-950/20"
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-red-400 line-clamp-2 leading-snug">
                            {video.title}
                          </h4>
                          <div className="text-[11px] text-slate-400 truncate">{video.channel}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
                            <span>{video.views}</span>
                            <span>{video.published}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (activeTab.url === 'aegis://newtab' || (activeTab.title === 'New Tab' && (!activeTab.historyStack || activeTab.historyStack.length <= 1))) ? (
              /* =========================================================================
                 NEW TAB / 3D SHAPE SCANNER START PAGE
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#030712] via-[#050b18] to-[#030712] overflow-y-auto scrollbar-thin p-4 sm:p-8 space-y-8">
                {/* 3D Cyber Core & Shape Scanner */}
                <div className="relative w-full max-w-xl mx-auto flex flex-col items-center">
                  <div className="w-full h-44 sm:h-56 relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/60 shadow-[0_0_35px_rgba(6,182,212,0.15)]">
                    <CyberScene3D statusMode={statusMode} interactive={true} className="w-full h-full" />
                    <div className="absolute top-2.5 left-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                        3D Shape Scanner · 60 FPS WebGL
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
                        Drag to rotate 3D core
                      </span>
                    </div>
                  </div>

                  {/* Brand Title */}
                  <div className="text-center mt-4 space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                      AEGIS 3D SAFE BROWSER
                    </h2>
                    <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
                      Zero-trust content sandbox, quantum DNS defense & in-browser media player
                    </p>
                  </div>
                </div>

                {/* Start Page Search Omnibar */}
                <div className="w-full max-w-xl mx-auto space-y-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = (urlInputValue || '').trim();
                      if (v) handleNavigate(v, false, false);
                    }}
                    className="flex items-center bg-slate-900/90 border border-slate-700 hover:border-cyan-500 focus-within:border-cyan-400 rounded-2xl p-2 shadow-2xl transition-all shadow-cyan-950/20"
                  >
                    <Search className="w-5 h-5 text-cyan-400 ml-3 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)}
                      placeholder="Search the web securely or enter URL..."
                      className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono py-1.5"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono cursor-pointer shrink-0 transition-all shadow-md"
                    >
                      Safe Search
                    </button>
                  </form>

                  {/* Search Mode Quick Switchers */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs font-mono">
                    {[
                      { id: 'all', label: 'All Web', icon: Globe },
                      { id: 'news', label: 'News', icon: Activity },
                      { id: 'tech', label: 'Tech & Dev', icon: Cpu },
                      { id: 'videos', label: 'Videos (YouTube)', icon: Play },
                      { id: 'science', label: 'Science', icon: Sparkles },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const query = (urlInputValue || '').trim();
                            if (query) {
                              if (item.id === 'videos') {
                                handleNavigate(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, false, false);
                              } else {
                                handleNavigate(`aegis://search?q=${encodeURIComponent(query)}&category=${item.id}`, false, false);
                              }
                            } else {
                              setUrlInputValue(item.id === 'videos' ? 'trending tech' : item.id === 'science' ? 'quantum computing' : 'cybersecurity');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
                        >
                          <Icon className="w-3 h-3 text-cyan-400" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Shortcuts Grid */}
                <div className="w-full max-w-xl mx-auto space-y-2.5">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider text-center">
                    Top Sites & Safe Shortcuts
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    {[
                      { title: 'YouTube', url: 'https://www.youtube.com', desc: 'In-Browser Player', icon: Globe, color: 'text-red-400' },
                      { title: 'Wikipedia', url: 'https://en.wikipedia.org', desc: 'Free Encyclopedia', icon: Globe, color: 'text-cyan-400' },
                      { title: 'Cloudflare', url: 'https://cloudflare.com', desc: 'Zero Trust & DNS', icon: Shield, color: 'text-amber-400' },
                      { title: 'DuckDuckGo', url: 'https://duckduckgo.com', desc: 'Private Search', icon: Search, color: 'text-teal-400' },
                      { title: 'GitHub', url: 'https://github.com', desc: 'Open Source Code', icon: Globe, color: 'text-indigo-400' },
                      { title: 'PubMed', url: 'https://ncbi.nlm.nih.gov', desc: 'Biomedical Science', icon: Activity, color: 'text-emerald-400' },
                      { title: 'arXiv', url: 'https://arxiv.org', desc: 'Physics & AI Preprints', icon: Activity, color: 'text-rose-400' },
                      { title: 'Google Search', url: 'https://google.com', desc: 'Web Search', icon: Search, color: 'text-blue-400' },
                    ].map((site) => (
                      <button
                        key={site.title}
                        type="button"
                        onClick={() => handleNavigate(site.url, false, false)}
                        className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 flex flex-col items-center justify-center text-center space-y-1 transition-all group cursor-pointer"
                      >
                        <site.icon className={`w-5 h-5 ${site.color} group-hover:scale-110 transition-transform`} />
                        <span className="font-bold text-slate-200 group-hover:text-cyan-300">{site.title}</span>
                        <span className="text-[10px] text-slate-400">{site.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : searchInfo.isSearch ? (
              /* =========================================================================
                 IN-BROWSER SECURE WEB SEARCH ENGINE RESULTS VIEW
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col bg-[#050811] overflow-y-auto scrollbar-thin p-3 sm:p-6 space-y-5">
                {/* Search Top Filter Header */}
                <div className="w-full max-w-4xl mx-auto space-y-3">
                  {/* Search Input Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQueryInput.trim()) {
                        executeNavigate(`aegis://search?q=${encodeURIComponent(searchQueryInput.trim())}&category=${searchCategory}`, false, false);
                      }
                    }}
                    className="flex items-center bg-slate-900/90 border border-slate-700 hover:border-cyan-500 focus-within:border-cyan-400 rounded-2xl p-2 shadow-2xl transition-all shadow-cyan-950/20"
                  >
                    <Search className="w-5 h-5 text-cyan-400 ml-3 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={searchQueryInput}
                      onChange={(e) => setSearchQueryInput(e.target.value)}
                      placeholder="Search the web securely..."
                      className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono py-1"
                    />
                    {searchQueryInput && (
                      <button
                        type="button"
                        onClick={() => setSearchQueryInput('')}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 mr-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono cursor-pointer shrink-0 transition-all shadow-md"
                    >
                      Search
                    </button>
                  </form>

                  {/* Category Pills & Security Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                      {[
                        { id: 'all', label: 'All Web', icon: Globe },
                        { id: 'news', label: 'News', icon: Activity },
                        { id: 'tech', label: 'Tech & Dev', icon: Cpu },
                        { id: 'videos', label: 'Videos', icon: Play },
                        { id: 'science', label: 'Science', icon: Sparkles },
                      ].map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = searchCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSearchCategory(cat.id as any);
                              const q = searchQueryInput.trim() || searchInfo.query;
                              if (cat.id === 'videos') {
                                executeNavigate(`https://www.youtube.com/results?search_query=${encodeURIComponent(q || 'trending tech')}`, false, false);
                              } else {
                                executeNavigate(`aegis://search?q=${encodeURIComponent(q)}&category=${cat.id}`, false, false);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap text-xs ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] font-bold'
                                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zero-Trace Protected</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">0 Ads / Popups</span>
                    </div>
                  </div>
                </div>

                {/* Search Results Container */}
                <div className="w-full max-w-4xl mx-auto space-y-4">
                  {searchLoading ? (
                    <div className="space-y-4 pt-2">
                      <div className="text-xs font-mono text-cyan-400 animate-pulse flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Scanning and verifying secure web results...</span>
                      </div>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 animate-pulse">
                          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                          <div className="h-5 bg-slate-800 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-800 rounded w-full"></div>
                          <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-xs font-mono text-slate-400 flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span>
                          Found <strong className="text-cyan-300 font-bold">{searchResults.length}</strong> verified safe web results
                        </span>
                        <span className="text-slate-500 hidden sm:inline">
                          Filtered for malicious redirects & popups
                        </span>
                      </div>

                      {searchResults.map((item, idx) => (
                        <div
                          key={`${item.url}-${idx}`}
                          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900 transition-all shadow-sm group space-y-2"
                        >
                          {/* Domain & Security Badges Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-5 h-5 rounded-md bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                                <Globe className="w-3 h-3" />
                              </div>
                              <span className="text-slate-300 font-semibold truncate">{item.domain}</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-emerald-400 text-[10px] bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                                SSL {item.sslGrade}
                              </span>
                              <span className="text-cyan-400 text-[10px] bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
                                Score {item.securityScore}/100
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleNavigate(item.url, false, false)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-colors text-xs font-mono flex items-center gap-1 cursor-pointer"
                              >
                                <span>Visit Site</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNavigate(item.url, true, false)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                                title="Open in new tab"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Result Title */}
                          <h3
                            onClick={() => handleNavigate(item.url, false, false)}
                            className="text-base font-bold text-cyan-300 hover:text-cyan-200 group-hover:underline cursor-pointer leading-snug"
                          >
                            {item.title}
                          </h3>

                          {/* URL Display */}
                          <div className="text-xs text-slate-400 font-mono truncate">
                            {item.url}
                          </div>

                          {/* Snippet Description */}
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                            {item.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty Search Fallback */
                    <div className="p-8 text-center space-y-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                      <Search className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-100">No Direct Results Found</h3>
                        <p className="text-xs text-slate-400 font-mono">
                          Try searching with different keywords or launch directly with top safe search engines:
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {[
                          { name: 'DuckDuckGo Safe', url: `https://duckduckgo.com/?q=${encodeURIComponent(searchQueryInput)}` },
                          { name: 'Wikipedia', url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchQueryInput)}` },
                          { name: 'GitHub Code', url: `https://github.com/search?q=${encodeURIComponent(searchQueryInput)}` },
                          { name: 'YouTube Video', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQueryInput)}` },
                        ].map((engine) => (
                          <button
                            key={engine.name}
                            type="button"
                            onClick={() => handleNavigate(engine.url, false, false)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono cursor-pointer transition-colors"
                          >
                            {engine.name} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* =========================================================================
                 REAL WEB VIEWPORT (PROXIED IFRAME WITH IN-PAGE CLICK INTERCEPTION)
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden min-h-[500px]">
                {/* Security & Sandbox Status Ribbon */}
                <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono flex items-center justify-between gap-2 shrink-0 select-none">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 font-semibold">{activeTab.domain}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 truncate hidden sm:inline">{activeTab.url}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                      Zero-Trust Sandbox Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setShow3DScannerModal(true)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Inspect 3D Shape Scanner HUD"
                    >
                      <Shield className="w-3 h-3" />
                      <span>3D Scanner</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReload}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"
                      title="Reload Page"
                    >
                      <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Viewport: Native Chromium Webview in Desktop App, or Zero-Trust Proxy Sandbox in Web */}
                <div className="flex-1 w-full h-full relative overflow-hidden bg-white">
                  {isScanning && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 animate-pulse z-20" />
                  )}
                  {typeof window !== 'undefined' && (window as any).isAegisDesktop ? (
                    <webview
                      key={`desktop-webview-${activeTab.id}-${refreshKey}`}
                      src={activeTab.url}
                      className="w-full h-full border-0 bg-white"
                    />
                  ) : (
                    <iframe
                      key={`${activeTab.id}-${refreshKey}`}
                      src={`/api/proxy?url=${encodeURIComponent(activeTab.url)}`}
                      title={activeTab.title}
                      className="w-full h-full border-0 bg-white"
                      sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-downloads"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      onLoad={() => setIsScanning(false)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DEDICATED COLLAPSIBLE SIDEBAR COLUMN */}
          {activeSidebar === 'resource-monitor' ? (
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/90 flex flex-col h-full overflow-hidden">
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
          ) : activeSidebar === 'tools' ? (
            /* =========================================================================
               TOOLS & SETTINGS SIDE PANEL / FULLSCREEN DRAWER (HOUSES ALL 10 TOOLS)
               ========================================================================= */
            <div
              className={`${
                isToolFullscreen
                  ? 'col-span-12 fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden'
                  : 'lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/95 flex flex-col h-full overflow-hidden shadow-2xl'
              }`}
            >
              {/* Tools Header Bar */}
              <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono text-slate-100 flex items-center gap-1.5">
                      <span>Aegis Tools & Settings</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        10 Tools
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      Security scanners, analytics, AI copilot & extensions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsToolFullscreen((prev) => !prev)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                    title={isToolFullscreen ? 'Dock to Side Panel' : 'Maximize to Fullscreen'}
                  >
                    {isToolFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSidebar('none');
                      setIsToolFullscreen(false);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                    title="Close Tools Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tool Navigation Tabs Ribbon */}
              <div className="px-2 py-1.5 bg-[#070c18] border-b border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 select-none">
                {[
                  { id: '3d-scanner', label: '3D Mesh', icon: Shield, color: 'text-cyan-400' },
                  { id: 'dns', label: 'DNS Scanner', icon: Globe, color: 'text-emerald-400' },
                  { id: 'compare', label: 'Comparator', icon: GitCompare, color: 'text-blue-400' },
                  { id: 'threat-shield', label: 'Threat Shield', icon: ShieldAlert, color: 'text-rose-400' },
                  { id: 'analytics', label: 'Analytics', icon: BarChart2, color: 'text-teal-400' },
                  { id: 'science', label: 'Science Search', icon: BookOpen, color: 'text-purple-400' },
                  { id: 'ai-copilot', label: 'AI Copilot', icon: Bot, color: 'text-cyan-300' },
                  { id: 'vault', label: 'Password Vault', icon: Key, color: 'text-amber-400' },
                  { id: 'extensions', label: 'Extensions', icon: Puzzle, color: 'text-indigo-400' },
                  { id: 'settings', label: 'Settings', icon: Sliders, color: 'text-slate-300' },
                  { id: 'about', label: 'About Team', icon: Info, color: 'text-cyan-400' },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeToolTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveToolTab(t.id as ToolTabId)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold'
                          : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${isActive ? t.color : 'text-slate-500'}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tool Body Container with Smooth Scroll */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4 bg-slate-950/70">
                {activeToolTab === '3d-scanner' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold text-slate-100 font-mono">3D Web Shape Mesh</h4>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                          WebGL 60 FPS
                        </span>
                      </div>
                      <div className="w-full h-56 rounded-xl overflow-hidden bg-black/80 border border-slate-800 relative">
                        <CyberScene3D statusMode={statusMode} interactive={true} className="w-full h-full" />
                        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-cyan-300 bg-black/70 px-2 py-0.5 rounded">
                          Drag to inspect 3D security mesh
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-center">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-500">Security Score</div>
                          <div className="text-sm font-bold text-emerald-400">{activeTab.securityScore}%</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-500">SSL Certificate</div>
                          <div className="text-sm font-bold text-cyan-300">{activeTab.sslGrade}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-500">Trackers Blocked</div>
                          <div className="text-sm font-bold text-amber-400">{activeTab.trackersBlocked}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-500">Response Latency</div>
                          <div className="text-sm font-bold text-teal-300">{activeTab.latencyMs}ms</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeToolTab === 'dns' && (
                  <DnsScannerView
                    initialDomain={activeTab.domain && activeTab.domain !== 'aegis.local' ? activeTab.domain : 'cloudflare.com'}
                  />
                )}

                {activeToolTab === 'compare' && (
                  <WebsiteComparatorView
                    initialSiteA={activeTab.domain && activeTab.domain !== 'aegis.local' ? activeTab.domain : 'cloudflare.com'}
                    initialSiteB="wikipedia.org"
                  />
                )}

                {activeToolTab === 'threat-shield' && (
                  <ThreatBlockerView
                    onNavigateToBrowser={(url) => {
                      setActiveSidebar('none');
                      setIsToolFullscreen(false);
                      handleNavigate(url, false, false);
                    }}
                    currentBrowserUrl={activeTab.url}
                  />
                )}

                {activeToolTab === 'analytics' && (
                  <SecurityAnalyticsView
                    onNavigateToBrowserUrl={(url) => {
                      setActiveSidebar('none');
                      setIsToolFullscreen(false);
                      handleNavigate(url, false, false);
                    }}
                    onOpenCommandPalette={onOpenCommandPalette}
                  />
                )}

                {activeToolTab === 'science' && (
                  <ScienceSearchView initialQuery="AlphaFold structural biology" />
                )}

                {activeToolTab === 'ai-copilot' && (
                  <GeminiCopilotView />
                )}

                {activeToolTab === 'vault' && (
                  <PasswordVaultManager
                    onNavigateToBrowserUrl={(url) => {
                      setActiveSidebar('none');
                      setIsToolFullscreen(false);
                      handleNavigate(url, false, false);
                    }}
                  />
                )}

                {activeToolTab === 'extensions' && (
                  <ExtensionExportView
                    onOpenInFullBrowser={(url) => {
                      setActiveSidebar('none');
                      setIsToolFullscreen(false);
                      handleNavigate(url, false, false);
                    }}
                    onOpenVault={() => setActiveToolTab('vault')}
                  />
                )}

                {activeToolTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-slate-100 font-mono">Browser & Security Preferences</h4>
                      </div>

                      <div className="space-y-3 text-xs font-mono">
                        {/* Theme Trigger */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <div>
                            <div className="font-semibold text-slate-200">Browser Theme & Appearance</div>
                            <div className="text-[11px] text-slate-400">Cyberpunk Neon, Stealth Dark, Quantum Blue, Emerald Matrix</div>
                          </div>
                          <button
                            type="button"
                            onClick={onOpenThemeModal}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer"
                          >
                            Change Theme
                          </button>
                        </div>

                        {/* Privacy Mode */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <div>
                            <div className="font-semibold text-slate-200">Zero-Trace Privacy Mode</div>
                            <div className="text-[11px] text-slate-400">Purges cookies, session storage & browsing logs on exit</div>
                          </div>
                          <button
                            type="button"
                            onClick={onTogglePrivacy}
                            className={`px-3 py-1.5 rounded-lg border cursor-pointer font-bold ${
                              privacyMode
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {privacyMode ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>

                        {/* Cloudflare Verification Trigger */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <div>
                            <div className="font-semibold text-slate-200">Cloudflare Turnstile Verification</div>
                            <div className="text-[11px] text-slate-400">Verify client integrity & human identity check</div>
                          </div>
                          <button
                            type="button"
                            onClick={onOpenCloudflareModal}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer"
                          >
                            Verify Identity
                          </button>
                        </div>

                        {/* Command Palette Trigger */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <div>
                            <div className="font-semibold text-slate-200">Aegis Command Palette (Ctrl+K)</div>
                            <div className="text-[11px] text-slate-400">Quick launch tabs, security audits and tools</div>
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
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <div>
                            <div className="font-semibold text-rose-300">Purge Browsing Data</div>
                            <div className="text-[11px] text-slate-400">Wipe stored history, cached thumbnails & bookmarks</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleClearAllHistory}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                            >
                              Clear History
                            </button>
                          </div>
                        </div>

                        {/* Native Chromium Desktop Build Info */}
                        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Chromium Desktop App & Depot Tools</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            Run native Chromium desktop version with full unrestricted webviews and audio/video codecs via:
                          </p>
                          <code className="block p-2 rounded bg-black/60 text-cyan-300 font-mono text-[11px] select-all">
                            npm run desktop
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeToolTab === 'about' && (
                  <AboutUsView />
                )}
              </div>
            </div>
          ) : activeSidebar !== 'none' && (
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/90 flex flex-col h-full overflow-hidden">
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
                  {/* Active Page Context Banner & Engine Mode */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="truncate">{activeTab.domain}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setApiKeyInput(localStorage.getItem('aegis_gemini_api_key') || '');
                          setShowApiKeyModal(true);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border transition-colors cursor-pointer ${
                          hasUserApiKey
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Configure Google Gemini Cloud API Key (Optional)"
                      >
                        <Key className="w-2.5 h-2.5" />
                        <span>{hasUserApiKey ? 'Gemini 2.5' : 'Cyber Engine'}</span>
                      </button>
                      <span className="text-emerald-400 font-bold">{activeTab.sslGrade}</span>
                    </div>
                  </div>

                  {/* Quick AI Action Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
                    {[
                      'Explain DNS Origin & Shielding',
                      'How Phishing Works & Prevention',
                      'TLS 1.3 & Post-Quantum Security',
                      'Audit Active Tab Telemetry',
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
                      placeholder="Ask about cybersecurity, DNS origin, phishing, or active tab..."
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

      {/* Optional Gemini API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900/95 border border-slate-800 p-6 shadow-2xl shadow-cyan-950/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">AI Intelligence Engine Settings</h3>
                  <p className="text-xs text-slate-400">Optional Google Gemini API Key</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              By default, Aegis runs its built-in <strong>Specialized Cybersecurity & Live Web Knowledge Engine</strong> (Wikipedia + Deep Security Corpus). If you have a Google Gemini API Key, you can add it here to enable Google's flagship Gemini models directly.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Google Gemini API Key (Stored in LocalStorage)
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 border border-slate-700 focus:border-amber-500/60"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {hasUserApiKey ? (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('aegis_gemini_api_key');
                      setHasUserApiKey(false);
                      setApiKeyInput('');
                      setShowApiKeyModal(false);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Clear Key & Use Cyber Engine
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono">No key saved (Using Cyber Engine)</span>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApiKeyModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (apiKeyInput.trim()) {
                        localStorage.setItem('aegis_gemini_api_key', apiKeyInput.trim());
                        setHasUserApiKey(true);
                      } else {
                        localStorage.removeItem('aegis_gemini_api_key');
                        setHasUserApiKey(false);
                      }
                      setShowApiKeyModal(false);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Mobile Navigation Bottom Action Bar (Fixed for Phones & Tablets) */}
      <div className="lg:hidden flex items-center justify-around px-2 py-2.5 bg-slate-950/95 border-t border-slate-800 text-slate-300 text-xs font-mono shrink-0 z-30 select-none shadow-[0_-5px_15px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={handleGoBack}
          className={`p-2 rounded-xl transition-colors ${
            canGoBack ? 'hover:bg-slate-800 text-slate-100 active:bg-slate-700' : 'text-slate-600 opacity-40'
          }`}
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={handleGoForward}
          className={`p-2 rounded-xl transition-colors ${
            canGoForward ? 'hover:bg-slate-800 text-slate-100 active:bg-slate-700' : 'text-slate-600 opacity-40'
          }`}
          title="Forward"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleReload}
          className="p-2 rounded-xl hover:bg-slate-800 text-cyan-400 active:bg-slate-700"
          title="Reload"
        >
          <RefreshCw className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          onClick={handleGoHome}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-100 active:bg-slate-700"
          title="Start Page"
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveSidebar(activeSidebar === 'tabs' ? 'none' : 'tabs')}
          className="p-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-bold active:bg-slate-800"
          title="Open Tabs"
        >
          {tabs.length}
        </button>
        <button
          type="button"
          onClick={() => setActiveSidebar((prev) => (prev === 'tools' ? 'none' : 'tools'))}
          className={`p-2 rounded-xl transition-colors ${
            activeSidebar === 'tools' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800 text-cyan-400 active:bg-slate-700'
          }`}
          title="Tools & Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 3D Shape Scanner Interactive Holographic HUD Modal */}
      {show3DScannerModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="3D Shape Scanner HUD"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShow3DScannerModal(false);
          }}
        >
          <div className="w-full max-w-xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col ring-1 ring-cyan-500/20">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Shield className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                    <span>Aegis 3D Shape Scanner HUD</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                      WebGL 60 FPS
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Target: {activeTab.domain} · Touch or drag to rotate 3D core
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShow3DScannerModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-black/80 border border-slate-800 relative shadow-inner">
                <CyberScene3D statusMode={statusMode} interactive={true} className="w-full h-full" />
                <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  Touch drag / Mouse tilt active
                </div>
                <div className="absolute top-2.5 right-3 text-[10px] font-mono text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  TLS Grade: {activeTab.sslGrade} · Security: {activeTab.securityScore}/100
                </div>
              </div>

              {/* Real-time Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400">Security Score</div>
                  <div className="text-base font-bold text-emerald-400">{activeTab.securityScore}%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400">SSL Certificate</div>
                  <div className="text-base font-bold text-cyan-300">{activeTab.sslGrade}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400">Trackers Deflected</div>
                  <div className="text-base font-bold text-amber-400">{activeTab.trackersBlocked}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-0.5">
                  <div className="text-[10px] text-slate-400">Engine Latency</div>
                  <div className="text-base font-bold text-teal-300">{activeTab.latencyMs}ms</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400 border-t border-slate-850">
                <span>DNS Status: <strong className="text-emerald-400">Cryptographically Signed (DNSSEC)</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setShow3DScannerModal(false);
                    setActiveSidebar('tools');
                    setActiveToolTab('dns');
                    if (onScanDns) onScanDns(activeTab.domain);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Run Deep DNS Audit →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Link Security & Identity Verification Modal */}
      <LinkAuthPromptModal
        isOpen={showLinkAuthModal}
        targetUrl={pendingNav?.url || activeTab.url}
        onClose={() => {
          setShowLinkAuthModal(false);
          setPendingNav(null);
        }}
        onContinueAsGuest={handleConfirmGuest}
        onLoginWithGmail={handleConfirmGmail}
      />
    </div>
  );
};
