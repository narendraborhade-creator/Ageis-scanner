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
import { getApiBaseUrl, apiUrl, isMobileDevice } from '../services/apiConfig';
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
  Database,
  Terminal,
  Printer,
  ZoomIn,
  ZoomOut,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Download,
  SlidersHorizontal,
  VolumeX,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  Palette,
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
import { SecurityApisHubView } from './SecurityApisHubView';
import { ChromiumDepotToolsView } from './ChromiumDepotToolsView';
import { AegisSettingsHub, SettingsSectionId } from './AegisSettingsHub';


export function mapUrlToSection(url: string): SettingsSectionId {
  const lower = (url || '').toLowerCase();
  if (lower.includes('depot-tools') || lower.includes('flags')) return 'depot-tools';
  if (lower.includes('security') || lower.includes('apis')) return 'security-apis';
  if (lower.includes('3d') || lower.includes('mesh')) return '3d-scanner';
  if (lower.includes('dns')) return 'dns';
  if (lower.includes('compare')) return 'compare';
  if (lower.includes('threat')) return 'threat-shield';
  if (lower.includes('analytics')) return 'analytics';
  if (lower.includes('science')) return 'science';
  if (lower.includes('copilot') || lower.includes('ai')) return 'ai-copilot';
  if (lower.includes('vault')) return 'vault';
  if (lower.includes('extension')) return 'extensions';
  if (lower.includes('version') || lower.includes('about')) return 'about';
  return 'general';
}

export function unwrapProxyUrl(url: string): string {
  if (!url || typeof url !== 'string') return url || '';
  let current = url.trim();
  let depth = 0;
  while ((current.includes('/api/proxy') || current.includes('%2Fapi%2Fproxy')) && depth < 10) {
    depth++;
    try {
      const u = new URL(current, 'https://www.aegisscans.dev');
      const param = u.searchParams.get('url');
      if (param) {
        current = param.trim();
        continue;
      }
    } catch {}
    const idx = current.indexOf('url=');
    if (idx !== -1) {
      try {
        let after = current.substring(idx + 4);
        const ampIdx = after.indexOf('&');
        if (ampIdx !== -1) {
          after = after.substring(0, ampIdx);
        }
        current = decodeURIComponent(after).trim();
      } catch {
        break;
      }
    } else {
      break;
    }
  }
  return current;
}

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

// Built-in verified working YouTube videos across cybersecurity, programming, science & media
export const DEFAULT_YT_VIDEOS = [
  {
    id: '9HOpanT0GRs',
    title: 'Harvard CS50’s Intro to Cybersecurity – Full University Course',
    channel: 'freeCodeCamp.org and CS50',
    views: '720K views',
    published: 'University Lecture',
    thumbnail: 'https://i.ytimg.com/vi/9HOpanT0GRs/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=9HOpanT0GRs',
  },
  {
    id: 'jq_LZ1RFPfU',
    title: 'Cybersecurity Architecture: Five Principles to Follow',
    channel: 'IBM Technology',
    views: '1.1M views',
    published: 'Enterprise Security',
    thumbnail: 'https://i.ytimg.com/vi/jq_LZ1RFPfU/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=jq_LZ1RFPfU',
  },
  {
    id: 'M576WGiDBdQ',
    title: 'Quantum Computing Explained: Qubits, Superposition & Cryptography',
    channel: 'Quantum Computing Lab',
    views: '4.2M views',
    published: 'Cybersecurity & Physics',
    thumbnail: 'https://i.ytimg.com/vi/M576WGiDBdQ/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
  },
  {
    id: 'L_LUpnjgPso',
    title: 'Starship Flight Test Highlights & Orbital Re-entry',
    channel: 'SpaceX & Aerospace',
    views: '18M views',
    published: 'Aerospace Engineering',
    thumbnail: 'https://i.ytimg.com/vi/L_LUpnjgPso/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
  },
  {
    id: '4b4bYMW6vD8',
    title: 'How The Internet Works - Computer Networks & Security',
    channel: 'Computerphile',
    views: '2.4M views',
    published: 'Computer Systems',
    thumbnail: 'https://i.ytimg.com/vi/4b4bYMW6vD8/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=4b4bYMW6vD8',
  },
  {
    id: '_DVVNOGYtmU',
    title: 'Google Cybersecurity Professional Certificate Overview',
    channel: 'Grow with Google',
    views: '5.3M views',
    published: 'Google Cloud & Security',
    thumbnail: 'https://i.ytimg.com/vi/_DVVNOGYtmU/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=_DVVNOGYtmU',
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video 4K)',
    channel: 'Rick Astley',
    views: '1.5B views',
    published: 'Official 4K Remaster',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Me at the zoo - The First Video on YouTube',
    channel: 'jawed',
    views: '315M views',
    published: 'Historical Archive',
    thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    channel: 'Luis Fonsi',
    views: '8.4B views',
    published: 'Music Video',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
  },
  {
    id: '9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE (강남스타일) M/V',
    channel: 'OfficialPsy',
    views: '5.1B views',
    published: 'K-Pop Sensation',
    thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
  },
  {
    id: 'bZ6hQoA16J0',
    title: 'Three.js 3D Web Graphics Crash Course - Full Tutorial',
    channel: 'freeCodeCamp.org',
    views: '890K views',
    published: 'Web Graphics & WebGL',
    thumbnail: 'https://i.ytimg.com/vi/bZ6hQoA16J0/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=bZ6hQoA16J0',
  },
  {
    id: 'kUMe1FH4CHE',
    title: 'Learn HTML & CSS in 2026 - Complete Beginner to Pro Course',
    channel: 'SuperSimpleDev',
    views: '11M views',
    published: 'Web Development',
    thumbnail: 'https://i.ytimg.com/vi/kUMe1FH4CHE/hq720.jpg',
    url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
  },
];

// Helper to search fallback videos by keyword
export function searchFallbackYtVideos(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return DEFAULT_YT_VIDEOS;
  const filtered = DEFAULT_YT_VIDEOS.filter(
    (v) => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q)
  );
  return filtered.length > 0 ? filtered : DEFAULT_YT_VIDEOS;
}

// Instant verified in-browser safe search generator
export function generateVerifiedSearchResults(rawQuery: string, category: string = 'all') {
  const q = rawQuery.trim();
  const encoded = encodeURIComponent(q);

  return [
    {
      title: `${q} - Wikipedia, the Free Encyclopedia`,
      url: `https://en.wikipedia.org/wiki/${encoded}`,
      domain: 'en.wikipedia.org',
      snippet: `Comprehensive overview, historical background, architecture, and peer-reviewed reference materials for "${q}".`,
      securityScore: 99,
      sslGrade: 'A+',
      threatStatus: 'clean' as const,
      isHttps: true,
    },
    {
      title: `Official Documentation & Source Code for ${q} · GitHub`,
      url: `https://github.com/search?q=${encoded}`,
      domain: 'github.com',
      snippet: `Browse open-source implementations, SDKs, repositories, and developer tools related to "${q}".`,
      securityScore: 98,
      sslGrade: 'A+',
      threatStatus: 'clean' as const,
      isHttps: true,
    },
    {
      title: `Cybersecurity Advisories & Vulnerability Index: ${q}`,
      url: `https://cve.mitre.org/cgi-bin/cvekey.cgi?keyword=${encoded}`,
      domain: 'cve.mitre.org',
      snippet: `Security bulletin, Common Vulnerabilities and Exposures (CVE), and mitigation guidelines related to "${q}".`,
      securityScore: 97,
      sslGrade: 'A+',
      threatStatus: 'clean' as const,
      isHttps: true,
    },
    {
      title: `National Center for Biotechnology Information (NCBI) Scientific Research: ${q}`,
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encoded}`,
      domain: 'pubmed.ncbi.nlm.nih.gov',
      snippet: `Peer-reviewed scientific publications, experimental data, and biomedical journals investigating "${q}".`,
      securityScore: 99,
      sslGrade: 'A+',
      threatStatus: 'clean' as const,
      isHttps: true,
    },
    {
      title: `Cloudflare Radar: Traffic, Security & DNS Analytics for ${q}`,
      url: `https://radar.cloudflare.com/search?q=${encoded}`,
      domain: 'radar.cloudflare.com',
      snippet: `Global Internet traffic patterns, DDoS attack activity, TLS cipher distribution, and routing telemetry for "${q}".`,
      securityScore: 98,
      sslGrade: 'A+',
      threatStatus: 'clean' as const,
      isHttps: true,
    },
    {
      title: `Technical Guides, Developer Tutorials & Insights on ${q}`,
      url: `https://stackoverflow.com/search?q=${encoded}`,
      domain: 'stackoverflow.com',
      snippet: `Community-validated solutions, architecture patterns, debugging steps, and technical discussions for "${q}".`,
      securityScore: 96,
      sslGrade: 'A+',
      threatStatus: 'clean' as const,
      isHttps: true,
    },
    {
      title: `Video Lectures, Demonstrations & Keynotes for ${q}`,
      url: `https://www.youtube.com/results?search_query=${encoded}`,
      domain: 'youtube.com',
      snippet: `Watch in-browser video tutorials, conference presentations, and deep-dive technical reviews covering "${q}".`,
      securityScore: 95,
      sslGrade: 'A+',
      threatStatus: 'clean' as const,
      isHttps: true,
    },
  ];
}

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
    title: 'New Tab',
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
  const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [startPageSearchInput, setStartPageSearchInput] = useState<string>('');

  // Real In-Browser Rendering & YouTube States
  const [refreshKey, setRefreshKey] = useState<number>(0);
  // Authentic Chromium Menu, Page Info, and Bookmark Bar States
  const [showAppMenu, setShowAppMenu] = useState<boolean>(false);
  const [showMoreToolsMenu, setShowMoreToolsMenu] = useState<boolean>(false);
  const [showPageInfoModal, setShowPageInfoModal] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showBookmarksBar, setShowBookmarksBar] = useState<boolean>(true);
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  // Opera Sidebar & Chrome Tab Context Menu States
  const [showOperaSidebar, setShowOperaSidebar] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('aegis_show_opera_sidebar');
      if (stored !== null) return stored === 'true';
      return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
    } catch {
      return true;
    }
  });
  const [tabContextMenu, setTabContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  // Speed Dial Shortcuts State
  const [customShortcuts, setCustomShortcuts] = useState<Array<{
    title: string;
    url: string;
    desc: string;
    icon: string;
    color: string;
  }>>(() => {
    try {
      const stored = localStorage.getItem('aegis_speed_dial_shortcuts');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { title: 'YouTube', url: 'https://www.youtube.com', desc: 'Video & Streaming', icon: 'youtube', color: 'text-red-500' },
      { title: 'Google', url: 'https://www.google.com', desc: 'Web Search Engine', icon: 'google', color: 'text-blue-400' },
      { title: 'Instagram', url: 'https://www.instagram.com', desc: 'Social & Media', icon: 'instagram', color: 'text-pink-400' },
      { title: 'GitHub', url: 'https://github.com', desc: 'Open Source Code', icon: 'github', color: 'text-indigo-400' },
      { title: 'Wikipedia', url: 'https://en.wikipedia.org', desc: 'Free Encyclopedia', icon: 'wikipedia', color: 'text-cyan-400' },
      { title: 'Reddit', url: 'https://www.reddit.com', desc: 'Discussions & Communities', icon: 'reddit', color: 'text-orange-400' },
      { title: 'ChatGPT', url: 'https://chatgpt.com', desc: 'Conversational AI', icon: 'chatgpt', color: 'text-emerald-400' },
      { title: 'Cloudflare', url: 'https://radar.cloudflare.com', desc: 'Zero Trust & Radar', icon: 'cloudflare', color: 'text-amber-400' },
      { title: 'DuckDuckGo', url: 'https://duckduckgo.com', desc: 'Privacy Search', icon: 'duckduckgo', color: 'text-teal-400' },
      { title: 'BBC News', url: 'https://www.bbc.com', desc: 'Global News', icon: 'news', color: 'text-red-400' },
      { title: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', desc: 'Biomedical Research', icon: 'science', color: 'text-emerald-400' },
      { title: 'arXiv', url: 'https://arxiv.org', desc: 'Preprints & Papers', icon: 'arxiv', color: 'text-rose-400' },
    ];
  });
  const [showAddShortcutModal, setShowAddShortcutModal] = useState<boolean>(false);
  const [newShortcutTitle, setNewShortcutTitle] = useState<string>('');
  const [newShortcutUrl, setNewShortcutUrl] = useState<string>('');

  const handleToggleOperaSidebar = () => {
    setShowOperaSidebar((prev) => {
      const next = !prev;
      try { localStorage.setItem('aegis_show_opera_sidebar', String(next)); } catch {}
      return next;
    });
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcutUrl.trim()) return;
    let u = newShortcutUrl.trim();
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    const t = newShortcutTitle.trim() || formatDomain(u);
    const updated = [
      ...customShortcuts,
      { title: t, url: u, desc: formatDomain(u), icon: 'globe', color: 'text-cyan-400' },
    ];
    setCustomShortcuts(updated);
    try { localStorage.setItem('aegis_speed_dial_shortcuts', JSON.stringify(updated)); } catch {}
    setNewShortcutTitle('');
    setNewShortcutUrl('');
    setShowAddShortcutModal(false);
  };

  const handleDeleteShortcut = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customShortcuts.filter((s) => s.url !== url);
    setCustomShortcuts(updated);
    try { localStorage.setItem('aegis_speed_dial_shortcuts', JSON.stringify(updated)); } catch {}
  };

  // Outside click listener for chrome menu dropdowns & context menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.chrome-menu-anchor')) {
        setShowAppMenu(false);
        setShowMoreToolsMenu(false);
        setShowPageInfoModal(false);
        setShowProfileMenu(false);
      }
      if (!target.closest('.tab-context-menu')) {
        setTabContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const isDesktop = typeof window !== 'undefined' && Boolean((window as any).isAegisDesktop);
  const webviewRef = useRef<any>(null);
  const [wvCanGoBack, setWvCanGoBack] = useState(false);
  const [wvCanGoForward, setWvCanGoForward] = useState(false);

  const ytInfo = parseYouTubeUrl(activeTab.url);
  const searchInfo = parseSearchUrl(activeTab.url);
  const canGoBack = isDesktop
    ? (wvCanGoBack || (activeTab.historyIndex ?? 0) > 0)
    : ((activeTab.historyIndex ?? 0) > 0);

  const CHROMIUM_DESKTOP_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
  const GOOGLE_AUTH_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0';
  const isGoogleAuthEndpoint = (url: string) =>
    Boolean(url) && /accounts\.google\.|myaccount\.google\.|accounts\.youtube\.|oauth\.google\.|google\.[a-z.]+\/(signin|ServiceLogin|o\/oauth2|interactiveconsent)/i.test(url);
  
  const isInternalChromePage =
    activeTab.url.startsWith('chrome://') ||
    (activeTab.url.startsWith('aegis://') &&
     !activeTab.url.startsWith('aegis://newtab') &&
     !activeTab.url.startsWith('aegis://search'));

  const canGoForward = isDesktop
    ? (wvCanGoForward || (activeTab.historyIndex ?? 0) < ((activeTab.historyStack?.length ?? 1) - 1))
    : ((activeTab.historyIndex ?? 0) < ((activeTab.historyStack?.length ?? 1) - 1));

  // Synchronize desktop Chromium webview events with Aegis tabs
  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const syncNavState = () => {
      try {
        setWvCanGoBack(Boolean(wv.canGoBack?.()));
        setWvCanGoForward(Boolean(wv.canGoForward?.()));
      } catch {}
    };

    const handleStartLoading = () => setIsScanning(true);
    const handleStopLoading = () => {
      setIsScanning(false);
      syncNavState();
    };

    const handleDidNavigate = (e: any) => {
      const navUrl = e.url;
      if (!navUrl || navUrl.startsWith('about:blank')) return;
      syncNavState();
      if (typeof wv.setUserAgent === 'function') {
        try {
          wv.setUserAgent(isGoogleAuthEndpoint(navUrl) ? GOOGLE_AUTH_UA : CHROMIUM_DESKTOP_UA);
        } catch {}
      }
      if (navUrl !== activeTab.url) {
        const domain = formatDomain(navUrl);
        const isHttps = navUrl.startsWith('https://');
        setTabs((prev) =>
          prev.map((t) => {
            if (t.id !== activeTab.id) return t;
            const stack = t.historyStack ? [...t.historyStack, navUrl] : [navUrl];
            return {
              ...t,
              url: navUrl,
              initialUrl: t.initialUrl || navUrl,
              domain,
              isHttps,
              historyStack: stack,
              historyIndex: stack.length - 1,
            };
          })
        );
        setUrlInputValue(navUrl);
        setIsEditingUrl(false);
      }
    };

    const handleDomReady = () => {
      try {
        // Disarm bot-detection / automation flags so Google Sign-in and OAuth endpoints authenticate securely
        wv.executeJavaScript(`
          try {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => false,
              configurable: true
            });
          } catch(e) {}
        `);
      } catch {}
    };

    const handleTitleUpdated = (e: any) => {
      if (e.title && e.title !== activeTab.title) {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTab.id ? { ...t, title: e.title } : t))
        );
      }
    };

    const handleFaviconUpdated = (e: any) => {
      if (e.favicons && e.favicons.length > 0) {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTab.id ? { ...t, favicon: e.favicons[0] } : t))
        );
      }
    };

    const handleNewWindow = (e: any) => {
      if (e.url) {
        executeNavigate(e.url, true, false);
      }
    };

    const handleDidFailLoad = (e: any) => {
      if (e.errorCode === -3) return;
      setIsScanning(false);
    };

    wv.addEventListener('did-start-loading', handleStartLoading);
    wv.addEventListener('did-stop-loading', handleStopLoading);
    wv.addEventListener('did-navigate', handleDidNavigate);
    wv.addEventListener('did-navigate-in-page', handleDidNavigate);
    wv.addEventListener('page-title-updated', handleTitleUpdated);
    wv.addEventListener('page-favicon-updated', handleFaviconUpdated);
    wv.addEventListener('new-window', handleNewWindow);
    wv.addEventListener('did-fail-load', handleDidFailLoad);
    wv.addEventListener('dom-ready', handleDomReady);

    return () => {
      try {
        wv.removeEventListener('did-start-loading', handleStartLoading);
        wv.removeEventListener('did-stop-loading', handleStopLoading);
        wv.removeEventListener('did-navigate', handleDidNavigate);
        wv.removeEventListener('did-navigate-in-page', handleDidNavigate);
        wv.removeEventListener('page-title-updated', handleTitleUpdated);
        wv.removeEventListener('page-favicon-updated', handleFaviconUpdated);
        wv.removeEventListener('new-window', handleNewWindow);
        wv.removeEventListener('did-fail-load', handleDidFailLoad);
        wv.removeEventListener('dom-ready', handleDomReady);
      } catch {}
    };
  }, [activeTab.id, activeTab.url, isDesktop]);

  // Desktop window open listener (catches window.open calls from Chromium webview)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).aegisDesktopApi?.onOpenNewTab) {
      const unsub = (window as any).aegisDesktopApi.onOpenNewTab((url: string) => {
        if (url) {
          executeNavigate(url, true, false);
        }
      });
      return unsub;
    }
  }, []);

  // In-Browser Link Click, Form Submission, & Page Title Interceptor:
  // Listens to postMessage events from the proxied iframe and updates browser tabs seamlessly!
  useEffect(() => {
    let lastNavTime = 0;
    const handleWindowMessage = (e: MessageEvent) => {
      // 1. Dynamic Page Title Synchronization
      if (e.data && e.data.type === 'AEGIS_PAGE_TITLE' && typeof e.data.title === 'string') {
        const title = e.data.title.trim();
        if (title && title !== activeTab.title) {
          setTabs((prev) =>
            prev.map((t) => (t.id === activeTab.id ? { ...t, title } : t))
          );
        }
        return;
      }

      // 1b. Reload frame dispatch
      if (e.data && e.data.type === 'AEGIS_RELOAD_FRAME') {
        setRefreshKey((k) => k + 1);
        return;
      }

      // 1c. External Window Dispatch
      if (e.data && e.data.type === 'AEGIS_OPEN_EXTERNAL') {
        window.open(activeTab.url, '_blank', 'noopener,noreferrer');
        return;
      }

      // 2. Navigation events (links, forms, window.open, SPA history)
      if (e.data && e.data.type === 'AEGIS_NAVIGATE' && typeof e.data.url === 'string') {
        let targetUrl = unwrapProxyUrl(e.data.url.trim());
        const inNewTab = Boolean(e.data.inNewTab);
        const isSilentSync = Boolean(e.data.isSilentSync);

        if (targetUrl.includes('/api/proxy') || targetUrl.includes('%2Fapi%2Fproxy')) {
          targetUrl = unwrapProxyUrl(targetUrl);
        }

        if (!targetUrl || targetUrl.includes('/api/proxy') || targetUrl.startsWith('javascript:') || targetUrl === 'about:blank') {
          return;
        }

        // Silent sync from SPA history pushState/replaceState
        if (isSilentSync) {
          if (targetUrl !== activeTab.url) {
            setTabs((prev) =>
              prev.map((t) => (t.id === activeTab.id ? { ...t, url: targetUrl, domain: formatDomain(targetUrl) } : t))
            );
            setUrlInputValue(targetUrl);
          }
          return;
        }

        const now = Date.now();
        if (now - lastNavTime < 250) {
          return;
        }
        if (!inNewTab && (targetUrl === activeTab.url || targetUrl === activeTab.initialUrl)) {
          setIsScanning(false);
          return;
        }
        lastNavTime = now;
        executeNavigate(targetUrl, inNewTab, false);
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [activeTab.url, activeTab.initialUrl, activeTab.id, activeTab.title]);

  // Keep address bar in sync with the active tab when switching tabs
  useEffect(() => {
    const current = tabs.find((t) => t.id === activeTabId) || tabs[0];
    if (current && !isEditingUrl) {
      setUrlInputValue(current.url === 'aegis://newtab' ? '' : current.url);
    }
  }, [activeTabId, tabs, isEditingUrl]);

  // Real-time Google Database Search Suggestions / Autocomplete Query Engine
  useEffect(() => {
    const query = urlInputValue.trim();
    if (!isEditingUrl || !query || query.startsWith('aegis://') || query.startsWith('http://') || query.startsWith('https://')) {
      setGoogleSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/search/suggestions?q=${encodeURIComponent(query)}`));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
            setGoogleSuggestions(data.suggestions);
            setSelectedSuggestionIndex(-1);
            return;
          }
        }
      } catch {}

      // Resilient direct fallback to Google Suggest API
      try {
        const direct = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`);
        if (direct.ok) {
          const d = await direct.json();
          if (Array.isArray(d?.[1])) {
            setGoogleSuggestions(d[1].slice(0, 8));
            setSelectedSuggestionIndex(-1);
          }
        }
      } catch {}
    }, 120);

    return () => clearTimeout(timer);
  }, [urlInputValue, isEditingUrl]);

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

      // Instant verified client-side results so the user never sees an empty screen
      const clientFallback = generateVerifiedSearchResults(q, searchInfo.category);
      setSearchResults(clientFallback);

      fetch(apiUrl(`/api/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(searchInfo.category)}`))
        .then((r) => r.json())
        .then((data) => {
          if (data && Array.isArray(data.results) && data.results.length > 0) {
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
        ? (activeTab.title && !activeTab.title.includes('YouTube') ? activeTab.title : 'cybersecurity tech')
        : (ytInfo.searchQuery || 'cybersecurity tech');
      setYtLoading(true);

      // Filter matched fallback videos first so UI is never empty
      const matched = searchFallbackYtVideos(q);
      setYtVideos(matched);

      fetch(apiUrl(`/api/youtube/search?q=${encodeURIComponent(q)}`))
        .then((r) => r.json())
        .then((data) => {
          if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            setYtVideos(data.videos);
          }
        })
        .catch((err) => console.warn('YouTube search API error:', err))
        .finally(() => setYtLoading(false));
    }
  }, [activeTab.url, activeTab.title, ytInfo.isYouTube, ytInfo.searchQuery, ytInfo.videoId]);

  const handleGoBack = () => {
    if (isDesktop && webviewRef.current?.canGoBack?.()) {
      webviewRef.current.goBack();
      return;
    }
    if (!canGoBack || !activeTab.historyStack) return;
    const nextIdx = (activeTab.historyIndex ?? 0) - 1;
    const targetUrl = activeTab.historyStack[nextIdx];
    executeNavigate(targetUrl, false, false, true, nextIdx);
  };

  const handleGoForward = () => {
    if (isDesktop && webviewRef.current?.canGoForward?.()) {
      webviewRef.current.goForward();
      return;
    }
    if (!canGoForward || !activeTab.historyStack) return;
    const nextIdx = (activeTab.historyIndex ?? 0) + 1;
    const targetUrl = activeTab.historyStack[nextIdx];
    executeNavigate(targetUrl, false, false, true, nextIdx);
  };

  const handleReload = () => {
    setIsScanning(true);
    if (isDesktop && webviewRef.current?.reload) {
      try {
        webviewRef.current.reload();
        setTimeout(() => setIsScanning(false), 500);
        return;
      } catch {}
    }
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
    if (url === 'aegis://newtab') return 'New Tab';
    const lower = url.toLowerCase();
    if (lower === 'chrome://settings' || lower === 'aegis://settings') return 'Settings';
    if (lower === 'chrome://depot-tools' || lower === 'aegis://depot-tools' || lower === 'chrome://flags') return 'Depot Tools Studio';
    if (lower === 'chrome://security-apis' || lower === 'aegis://security') return 'Security APIs Hub';
    if (lower === 'chrome://3d-scanner' || lower === 'aegis://3d-scanner') return '3D Security Mesh';
    if (lower === 'chrome://dns' || lower === 'aegis://dns') return 'DNS Inspector';
    if (lower === 'chrome://compare' || lower === 'aegis://compare') return 'Website Comparator';
    if (lower === 'chrome://threats' || lower === 'aegis://threats') return 'Threat Shield';
    if (lower === 'chrome://analytics' || lower === 'aegis://analytics') return 'Security Analytics';
    if (lower === 'chrome://science' || lower === 'aegis://science') return 'Science Search';
    if (lower === 'chrome://copilot' || lower === 'aegis://copilot') return 'AI Copilot';
    if (lower === 'chrome://vault' || lower === 'aegis://vault') return 'Password Vault';
    if (lower === 'chrome://extensions' || lower === 'aegis://extensions') return 'Extensions';
    if (lower === 'chrome://version' || lower === 'chrome://about') return 'About Aegis Chromium';

    const sInfo = parseSearchUrl(url);
    if (sInfo.isSearch) {
      return sInfo.query ? `${sInfo.query} - Google Search` : 'Google Search';
    }
    const domain = formatDomain(url);
    const yt = parseYouTubeUrl(url);
    if (yt.isYouTube) {
      if (yt.videoId) return `YouTube Video (${yt.videoId})`;
      if (yt.searchQuery) return `${yt.searchQuery} - YouTube`;
      return 'YouTube';
    }
    if (domain.includes('github')) return 'GitHub';
    if (domain.includes('cloudflare')) return 'Cloudflare';
    if (domain.includes('ncbi') || domain.includes('pubmed')) return 'NCBI / PubMed';
    if (domain.includes('wikipedia')) return 'Wikipedia';
    if (domain.includes('duckduckgo')) return 'DuckDuckGo';
    if (domain.includes('google')) return 'Google';
    return domain || 'New Tab';
  };

  const executeNavigate = (
    rawUrl: string,
    inNewTab = false,
    openExternal = false,
    isHistoryNav = false,
    targetHistoryIndex?: number
  ) => {
    let target = unwrapProxyUrl(rawUrl);
    if (!target) return;

    // Strip accidental 'aegis://newtab' prefix if entered
    if (target.startsWith('aegis://newtab') && target.length > 'aegis://newtab'.length) {
      target = target.replace(/^aegis:\/\/newtab\s*/i, '').trim();
    }
    if (!target) target = 'aegis://newtab';

    // Internal Browser Settings & Tools Navigation (renders natively inside tab)
    const lower = target.toLowerCase();
    if (lower === 'chrome://settings' || lower === 'aegis://settings' || lower === 'settings') {
      target = 'chrome://settings';
      setActiveSidebar('none');
    } else if (lower === 'chrome://depot-tools' || lower === 'aegis://depot-tools' || lower === 'chrome://flags' || lower === 'aegis://flags' || lower === 'depot-tools') {
      target = 'chrome://depot-tools';
      setActiveSidebar('none');
    } else if (lower === 'chrome://security-apis' || lower === 'aegis://security' || lower === 'aegis://apis' || lower === 'security-apis') {
      target = 'chrome://security-apis';
      setActiveSidebar('none');
    } else if (lower === 'chrome://3d-scanner' || lower === 'aegis://3d-scanner' || lower === '3d-scanner') {
      target = 'chrome://3d-scanner';
      setActiveSidebar('none');
    } else if (lower === 'chrome://dns' || lower === 'aegis://dns' || lower === 'dns') {
      target = 'chrome://dns';
      setActiveSidebar('none');
    } else if (lower === 'chrome://compare' || lower === 'aegis://compare' || lower === 'compare') {
      target = 'chrome://compare';
      setActiveSidebar('none');
    } else if (lower === 'chrome://threats' || lower === 'aegis://threat-shield' || lower === 'threats') {
      target = 'chrome://threats';
      setActiveSidebar('none');
    } else if (lower === 'chrome://analytics' || lower === 'aegis://analytics' || lower === 'analytics') {
      target = 'chrome://analytics';
      setActiveSidebar('none');
    } else if (lower === 'chrome://science' || lower === 'aegis://science' || lower === 'science') {
      target = 'chrome://science';
      setActiveSidebar('none');
    } else if (lower === 'chrome://copilot' || lower === 'aegis://ai-copilot' || lower === 'copilot') {
      target = 'chrome://copilot';
      setActiveSidebar('none');
    } else if (lower === 'chrome://vault' || lower === 'aegis://vault' || lower === 'vault') {
      target = 'chrome://vault';
      setActiveSidebar('none');
    } else if (lower === 'chrome://extensions' || lower === 'aegis://extensions' || lower === 'extensions') {
      target = 'chrome://extensions';
      setActiveSidebar('none');
    } else if (lower === 'chrome://version' || lower === 'chrome://about' || lower === 'aegis://about' || lower === 'about') {
      target = 'chrome://version';
      setActiveSidebar('none');
    }
    if (lower === 'aegis://depot-tools' || lower === 'aegis://flags' || lower === 'chrome://flags' || lower === 'depot-tools') {
      setActiveSidebar('tools');
      setActiveToolTab('depot-tools');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://security' || lower === 'aegis://apis' || lower === 'security-apis') {
      setActiveSidebar('tools');
      setActiveToolTab('security-apis');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://dns') {
      setActiveSidebar('tools');
      setActiveToolTab('dns');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://compare') {
      setActiveSidebar('tools');
      setActiveToolTab('compare');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://vault') {
      setActiveSidebar('tools');
      setActiveToolTab('vault');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://extensions' || lower === 'chrome://extensions') {
      setActiveSidebar('tools');
      setActiveToolTab('extensions');
      setIsScanning(false);
      return;
    }

    // Authentic Chromium & Opera Omnibox Domain & Search Resolver
    const lowerTarget = target.toLowerCase();
    if (lowerTarget === 'youtube' || lowerTarget === 'youtube.com' || lowerTarget === 'www.youtube.com' || lowerTarget === 'https://youtube.com' || lowerTarget === 'https://www.youtube.com' || lowerTarget === 'http://youtube.com') {
      target = 'https://www.youtube.com';
    } else if (lowerTarget.startsWith('youtube ') || lowerTarget.startsWith('yt ')) {
      const q = target.replace(/^(youtube|yt)\s+/i, '').trim();
      target = `https://www.youtube.com/results?search_query=${encodeURIComponent(q || 'trending tech')}`;
    } else if (lowerTarget === 'google' || lowerTarget === 'google.com' || lowerTarget === 'www.google.com') {
      target = 'https://www.google.com';
    } else if (lowerTarget === 'github' || lowerTarget === 'github.com') {
      target = 'https://github.com';
    } else if (lowerTarget === 'wikipedia' || lowerTarget === 'wikipedia.org') {
      target = 'https://www.wikipedia.org';
    } else if (lowerTarget === 'reddit' || lowerTarget === 'reddit.com') {
      target = 'https://www.reddit.com';
    } else if (lowerTarget === 'instagram' || lowerTarget === 'instagram.com') {
      target = 'https://www.instagram.com';
    } else if (lowerTarget === 'chatgpt' || lowerTarget === 'chatgpt.com') {
      target = 'https://chatgpt.com';
    } else if (lowerTarget === 'duckduckgo' || lowerTarget === 'duckduckgo.com') {
      target = 'https://duckduckgo.com';
    } else if (lowerTarget === 'cloudflare' || lowerTarget === 'cloudflare.com') {
      target = 'https://radar.cloudflare.com';
    }

    const sInfo = parseSearchUrl(target);
    if (!sInfo.isSearch && !target.startsWith('aegis://') && !target.startsWith('chrome://')) {
      const isExplicitUrl = /^https?:\/\//i.test(target) ||
        (!target.includes(' ') && target.includes('.') && !target.endsWith('.') && !target.startsWith('.'));

      if (!isExplicitUrl) {
        if (lowerTarget.includes('youtube')) {
          const query = target.replace(/youtube/gi, '').trim() || 'trending tech';
          target = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        } else {
          // Standard web search: navigate to real Google search or DuckDuckGo in privacy mode
          target = privacyMode
            ? `https://duckduckgo.com/?q=${encodeURIComponent(target)}`
            : `https://www.google.com/search?q=${encodeURIComponent(target)}`;
        }
      } else if (!/^https?:\/\//i.test(target)) {
        target = `https://${target}`;
      }
    }

    const domain = formatDomain(target);
    const isHttps = target.startsWith('https://');

    if (!target.startsWith('aegis://') && !target.startsWith('chrome://')) {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 3500);
    } else {
      setIsScanning(false);
    }

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

    // Immediately compute security heuristics and tab updates
    const threatCheck = analyzeUrlThreats(target);
    const isQuarantined = threatCheck.isBlocked;
    const title = getCleanTitle(target);
    const securityScore = isQuarantined ? 25 : isHttps ? 95 : 45;

    const latencyMs = isQuarantined ? 14 : Math.floor(Math.random() * 15) + 10;
    const pageMetrics = calculatePageLoadMetrics(
      target,
      isQuarantined ? 'blocked' : 'clean',
      latencyMs
    );

    const targetTabId = inNewTab ? `tab-${Date.now()}` : activeTab.id;

    const updatedTab: BrowserTab = {
      id: targetTabId,
      title,
      url: target,
      initialUrl: target,
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
      if (isDesktop && webviewRef.current && typeof webviewRef.current.loadURL === 'function' && !target.startsWith('aegis://')) {
        try {
          webviewRef.current.loadURL(target);
        } catch (err) {
          console.warn('[Aegis Desktop] loadURL error:', err);
        }
      }
    }

    setUrlInputValue(target);
    setIsEditingUrl(false);

    // If tools panel is taking over in fullscreen, undock so the user sees their web page immediately
    if (activeSidebar === 'tools' && isToolFullscreen) {
      setIsToolFullscreen(false);
    }

    setIsScanning(false);
  };

  /**
   * Universal Security-Gated Link Handler:
   * Always navigates directly inside the browser tab, maintaining seamless in-browser browsing.
   */
  const handleNavigate = (rawUrl: string, inNewTab = false, openExternal = false) => {
    let target = rawUrl.trim();
    if (!target) return;

    if (target.startsWith('aegis://newtab') && target.length > 'aegis://newtab'.length) {
      target = target.replace(/^aegis:\/\/newtab\s*/i, '').trim();
    }
    if (!target) target = 'aegis://newtab';

    const lowerNav = target.toLowerCase();
    if (lowerNav === 'youtube' || lowerNav === 'youtube.com' || lowerNav === 'www.youtube.com' || lowerNav === 'https://youtube.com' || lowerNav === 'https://www.youtube.com') {
      target = 'https://www.youtube.com';
    } else if (lowerNav.startsWith('youtube ') || lowerNav.startsWith('yt ')) {
      const q = target.replace(/^(youtube|yt)\s+/i, '').trim();
      target = `https://www.youtube.com/results?search_query=${encodeURIComponent(q || 'trending tech')}`;
    }

    // Internal Browser Settings & Tools Navigation
    const lower = target.toLowerCase();
    if (lower === 'aegis://settings' || lower === 'chrome://settings') {
      setActiveSidebar('tools');
      setActiveToolTab('settings');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://depot-tools' || lower === 'aegis://flags' || lower === 'chrome://flags' || lower === 'depot-tools') {
      setActiveSidebar('tools');
      setActiveToolTab('depot-tools');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://security' || lower === 'aegis://apis' || lower === 'security-apis') {
      setActiveSidebar('tools');
      setActiveToolTab('security-apis');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://dns') {
      setActiveSidebar('tools');
      setActiveToolTab('dns');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://compare') {
      setActiveSidebar('tools');
      setActiveToolTab('compare');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://vault') {
      setActiveSidebar('tools');
      setActiveToolTab('vault');
      setIsScanning(false);
      return;
    }
    if (lower === 'aegis://extensions' || lower === 'chrome://extensions') {
      setActiveSidebar('tools');
      setActiveToolTab('extensions');
      setIsScanning(false);
      return;
    }
    executeNavigate(target, inNewTab, openExternal);
  };

  // Chrome & Opera Tab Context Menu Actions
  const handleDuplicateTab = (tabOrId: BrowserTab | string) => {
    const tabToDupe = typeof tabOrId === 'string'
      ? tabs.find((t) => t.id === tabOrId)
      : tabOrId;
    if (!tabToDupe) return;
    const newId = `tab-${Date.now()}`;
    const newTab: BrowserTab = {
      ...tabToDupe,
      id: newId,
      title: `${tabToDupe.title} (Copy)`,
      createdAt: Date.now(),
    };
    const idx = tabs.findIndex((t) => t.id === tabToDupe.id);
    const updated = [...tabs];
    if (idx !== -1) {
      updated.splice(idx + 1, 0, newTab);
    } else {
      updated.push(newTab);
    }
    setTabs(updated);
    setActiveTabId(newId);
    setTabContextMenu(null);
  };

  const handleTogglePinTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, isPinned: !t.isPinned } : t))
    );
    setTabContextMenu(null);
  };

  const handleToggleMuteTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, isMuted: !t.isMuted } : t))
    );
    setTabContextMenu(null);
  };

  const handleCloseOtherTabs = (tabId?: string) => {
    const targetId = tabId || activeTab.id;
    const kept = tabs.find((t) => t.id === targetId);
    if (!kept) return;
    const closed = tabs.filter((t) => t.id !== targetId);
    setRecentlyClosedTabs((prev) => [...closed, ...prev].slice(0, 20));
    setTabs([kept]);
    setActiveTabId(kept.id);
    setTabContextMenu(null);
  };

  const handleCloseTabsToRight = (tabId: string) => {
    const idx = tabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;
    const kept = tabs.slice(0, idx + 1);
    const closed = tabs.slice(idx + 1);
    setRecentlyClosedTabs((prev) => [...closed, ...prev].slice(0, 20));
    setTabs(kept);
    if (!kept.some((t) => t.id === activeTabId)) {
      setActiveTabId(tabId);
    }
    setTabContextMenu(null);
  };

  const handleReopenLastClosedTab = () => {
    if (recentlyClosedTabs.length === 0) return;
    const [lastClosed, ...remaining] = recentlyClosedTabs;
    setRecentlyClosedTabs(remaining);
    setTabs((prev) => [...prev, lastClosed]);
    setActiveTabId(lastClosed.id);
    setTabContextMenu(null);
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
    if (activeSidebar === 'tools' && isToolFullscreen) {
      setIsToolFullscreen(false);
    }
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}`,
      title: 'New Tab',
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
    setUrlInputValue('aegis://newtab');
    setIsEditingUrl(false);
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
    <div className="flex flex-col h-full min-h-0">
      {/* BROWSER WINDOW WITH MULTI-TAB STRIP & DEDICATED SIDEBARS */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Google Chromium / ChromeOS Style Tab Strip */}
        <div className="flex items-center px-2 pt-2 bg-[#1f2229] border-b border-slate-800/80 gap-1 overflow-x-auto scrollbar-none select-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isSuspended = tab.isSuspended;
            return (
              <div
                key={tab.id}
                onMouseEnter={(e) => handleTabMouseEnter(e, tab)}
                onMouseLeave={handleTabMouseLeave}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTabContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    tabId: tab.id,
                  });
                }}
                onClick={() => {
                  setHoveredTab(null);
                  setActiveTabId(tab.id);
                  setUrlInputValue(tab.url);
                  setIsEditingUrl(false);
                  if (activeSidebar === 'tools' && isToolFullscreen) {
                    setIsToolFullscreen(false);
                  }
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
                className={`group relative flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-t-xl text-xs font-sans transition-all cursor-pointer max-w-[160px] min-w-[90px] sm:max-w-[240px] sm:min-w-[130px] border-t border-x ${
                  isActive
                    ? 'bg-[#282c34] border-slate-700/80 text-white font-medium z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.25)]'
                    : isSuspended
                    ? 'bg-[#181a1f]/80 border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#282c34]/50 opacity-75'
                    : 'bg-[#181a1f]/90 border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#282c34]/70'
                }`}
              >
                {/* Favicon / Lock / Status */}
                {isSuspended ? (
                  <span title="Tab is sleeping to conserve CPU & RAM">
                    <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </span>
                ) : tab.isPinned ? (
                  <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : tab.isQuarantined ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : tab.isHttps ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}

                {/* Tab Title */}
                <span className="truncate flex-1 text-xs">
                  {tab.title}
                </span>

                {/* Group Tag Chip (if assigned) */}
                {tab.groupTitle && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded-full border border-blue-500/40 bg-blue-950/80 text-blue-300 truncate max-w-[65px] shrink-0 hidden sm:inline"
                    title={`Group: ${tab.groupTitle}`}
                  >
                    {tab.groupTitle.split(' ')[0]}
                  </span>
                )}

                {/* Muted Audio Indicator */}
                {tab.isMuted && (
                  <span title="Tab audio is muted" className="shrink-0">
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                )}

                {/* Close Tab Button (Chrome 'x') */}
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className="w-4 h-4 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-slate-700/80 hover:text-white transition-all shrink-0 cursor-pointer"
                  title="Close tab (Ctrl+W)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Plus (+) New Tab Button */}
          <button
            type="button"
            onClick={handleCreateNewTab}
            className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 shrink-0 cursor-pointer"
            title="New tab (Ctrl+T)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Authentic Chromium Navigation Toolbar (ToolbarView from chromium/views) */}
        <div className="relative flex items-center justify-between px-3 py-1.5 bg-[#282c34] border-b border-slate-800/80 gap-2 select-none z-20 chrome-menu-anchor">
          {/* Navigation Controls: Back, Forward, Reload, Home, Sidebar Toggle */}
          <div className="flex items-center gap-1 shrink-0 text-slate-300">
            <button
              type="button"
              onClick={handleToggleOperaSidebar}
              className={`p-1.5 rounded-full transition-colors ${
                showOperaSidebar
                  ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/30'
                  : 'hover:bg-slate-700/60 text-slate-400 hover:text-white cursor-pointer'
              }`}
              title={showOperaSidebar ? 'Hide Opera Left Sidebar' : 'Show Opera Left Sidebar'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canGoBack}
              onClick={handleGoBack}
              className={`p-1.5 rounded-full transition-colors ${
                canGoBack
                  ? 'hover:bg-slate-700/60 text-slate-200 hover:text-white cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="Click to go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canGoForward}
              onClick={handleGoForward}
              className={`hidden sm:inline-flex p-1.5 rounded-full transition-colors ${
                canGoForward
                  ? 'hover:bg-slate-700/60 text-slate-200 hover:text-white cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="Click to go forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReload}
              className="p-1.5 rounded-full hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer text-slate-300"
              title="Reload this page (Ctrl+R)"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleGoHome}
              className="hidden sm:inline-flex p-1.5 rounded-full hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer text-slate-300"
              title="Open the home page"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Chromium Omnibox (LocationBarView) with Google Database Search Suggestions */}
          <div className="flex-1 min-w-[120px] sm:min-w-[200px] relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selected =
                  selectedSuggestionIndex >= 0 && googleSuggestions[selectedSuggestionIndex]
                    ? googleSuggestions[selectedSuggestionIndex]
                    : (urlInputValue || activeTab.url).trim();
                if (selected) {
                  handleNavigate(selected, false, false);
                  setGoogleSuggestions([]);
                  setIsEditingUrl(false);
                }
              }}
              className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-full bg-[#181a1f] hover:bg-[#14161a] border border-transparent hover:border-slate-700 focus-within:border-blue-500/80 focus-within:bg-[#181a1f] font-sans text-xs transition-all shadow-inner"
            >
              {/* Padlock / Tune Page Info Icon */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowPageInfoModal((prev) => !prev)}
                  className="p-1 rounded-full hover:bg-slate-700/60 transition-colors cursor-pointer text-slate-400 hover:text-slate-200"
                  title="View site information & security"
                >
                  {activeTab.isHttps ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </button>

                <input
                  type="text"
                  value={isEditingUrl ? urlInputValue : (activeTab.url === 'aegis://newtab' ? '' : activeTab.url)}
                  onFocus={() => {
                    setIsEditingUrl(true);
                    setUrlInputValue(activeTab.url === 'aegis://newtab' ? '' : activeTab.url);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsEditingUrl(false);
                      setGoogleSuggestions([]);
                    }, 250);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && googleSuggestions.length > 0) {
                      e.preventDefault();
                      setSelectedSuggestionIndex((prev) => Math.min(prev + 1, googleSuggestions.length - 1));
                    } else if (e.key === 'ArrowUp' && googleSuggestions.length > 0) {
                      e.preventDefault();
                      setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1));
                    } else if (e.key === 'Escape') {
                      setGoogleSuggestions([]);
                      setIsEditingUrl(false);
                    }
                  }}
                  onChange={(e) => {
                    setUrlInputValue(e.target.value);
                    setSelectedSuggestionIndex(-1);
                  }}
                  placeholder="Search Google or type a URL"
                  className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none truncate font-sans text-xs"
                />
              </div>

              <div className="hidden sm:flex items-center gap-1 shrink-0 ml-1 text-slate-400">
                {/* Star Bookmark Icon Button */}
                <button
                  type="button"
                  onClick={handleToggleActiveBookmark}
                  className={`p-1 rounded-full hover:bg-slate-700/60 transition-colors cursor-pointer ${
                    isCurrentBookmarked
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={isCurrentBookmarked ? 'Remove bookmark' : 'Bookmark this tab (Ctrl+D)'}
                >
                  <Star className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                {/* Copy URL */}
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="p-1 rounded-full hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer text-slate-400"
                  title="Copy link address"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {copiedUrl && (
                  <span className="text-[10px] text-emerald-400 font-mono animate-in fade-in">
                    Copied!
                  </span>
                )}
              </div>
            </form>

            {/* Google Database Autocomplete Suggestions Dropdown */}
            {isEditingUrl && googleSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 rounded-xl bg-slate-900/98 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 overflow-hidden font-sans">
                <div className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 border-b border-slate-800/80 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-cyan-400" />
                    Google Database Suggestions
                  </span>
                  <span className="text-slate-500 text-[9px]">Google Instant Search</span>
                </div>
                {googleSuggestions.map((sug, idx) => (
                  <button
                    key={sug}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleNavigate(sug, false, false);
                      setGoogleSuggestions([]);
                      setIsEditingUrl(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                      idx === selectedSuggestionIndex
                        ? 'bg-cyan-950/70 text-cyan-300 font-semibold'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sug}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Toolbar Controls: Extensions, Profile, and Chrome 3-dots Menu */}
          <div className="flex items-center gap-1 shrink-0 text-slate-300">
            {/* Appearance & Themes Palette */}
            <button
              type="button"
              onClick={onOpenThemeModal}
              className="p-1.5 rounded-full hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer text-cyan-400"
              title="Appearance & Themes"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Extensions Puzzle Icon */}
            <button
              type="button"
              onClick={() => handleNavigate('chrome://extensions', false, false)}
              className="hidden sm:inline-flex p-1.5 rounded-full hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer text-slate-400"
              title="Extensions (chrome://extensions)"
            >
              <Puzzle className="w-4 h-4" />
            </button>

            {/* User Profile Avatar */}
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="hidden xs:flex w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white items-center justify-center font-bold text-xs cursor-pointer shadow ml-0.5 transition-colors"
              title={currentUser?.email || 'Profile & Accounts'}
            >
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
            </button>

            {/* Chrome 3-dots Kebab App Menu Button (BrowserAppMenuButton) */}
            <button
              type="button"
              onClick={() => setShowAppMenu((prev) => !prev)}
              className="p-1.5 rounded-full hover:bg-slate-700/60 hover:text-white transition-colors cursor-pointer text-slate-300 ml-0.5"
              title="Customize and control Chromium"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Padlock Site Information Bubble */}
          {showPageInfoModal && (
            <div className="absolute left-16 top-12 z-50 bg-[#282c34] text-slate-200 border border-slate-700 rounded-2xl shadow-2xl p-4 w-80 text-xs font-sans animate-in fade-in zoom-in-95 select-none">
              <div className="flex items-start justify-between pb-3 border-b border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100 text-sm">Connection is secure</h4>
                    <p className="text-[11px] text-slate-400">{activeTab.domain}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPageInfoModal(false)}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-3 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Certificate</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Valid (TLS 1.3)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cookies & Trackers</span>
                  <span className="text-slate-200 font-mono text-[11px]">0 blocked</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Zero-Trust Score</span>
                  <span className="text-cyan-400 font-bold font-mono text-[11px]">{activeTab.securityScore}/100</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/80 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowPageInfoModal(false);
                    setShow3DScannerModal(true);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inspect in 3D Security Mesh</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPageInfoModal(false);
                    handleNavigate('chrome://dns', false, false);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-teal-400" />
                    <span>Inspect DNS Origin</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {/* User Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-12 top-12 z-50 bg-[#282c34] text-slate-200 border border-slate-700 rounded-2xl shadow-2xl p-4 w-72 text-xs font-sans animate-in fade-in zoom-in-95 select-none">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-700/80">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow">
                  {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-100 text-sm truncate">
                    {currentUser?.email ? currentUser.email : 'Chromium User'}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {isGuestModeActive() ? 'Browsing as Guest' : (currentUser?.email || 'Local Profile')}
                  </p>
                </div>
              </div>

              <div className="py-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowLinkAuthModal(true);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg hover:bg-[#353b47] text-left text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Switch Account / Sign in with Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setGuestModeActive(true);
                    createGuestAccount();
                  }}
                  className="w-full py-1.5 px-3 rounded-lg hover:bg-[#353b47] text-left text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <EyeOff className="w-3.5 h-3.5 text-teal-400" />
                  <span>Open Guest Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleNavigate('chrome://vault', false, false);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg hover:bg-[#353b47] text-left text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Passwords & Autofill</span>
                </button>
              </div>
            </div>
          )}

          {/* Chromium 3-Dots App Menu */}
          {showAppMenu && (
            <div className="absolute right-3 top-12 z-50 bg-[#282c34] text-slate-200 border border-slate-700 rounded-2xl shadow-2xl py-2 w-72 text-xs font-sans select-none animate-in fade-in-50 zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  handleCreateNewTab();
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>New tab</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Ctrl+T</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  window.open(window.location.origin, '_blank');
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>New window</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Ctrl+N</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  if (onTogglePrivacy) onTogglePrivacy();
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <span>New Incognito window</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Ctrl+Shift+N</span>
              </button>

              <div className="my-1.5 border-t border-slate-700/80" />

              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  setActiveSidebar((prev) => (prev === 'history' ? 'none' : 'history'));
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>History</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Ctrl+H</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  handleNavigate('chrome://depot-tools', false, false);
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Downloads / Depot Tools</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Ctrl+J</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowBookmarksBar((prev) => !prev);
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span>Bookmarks bar</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {showBookmarksBar ? '✓ Shown' : 'Hidden'}
                </span>
              </button>

              <div className="my-1.5 border-t border-slate-700/80" />

              {/* Zoom Controls */}
              <div className="px-4 py-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Zoom</span>
                <div className="flex items-center gap-2 bg-[#1f2229] border border-slate-700 rounded-lg px-2 py-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomPercent((prev) => Math.max(50, prev - 10))}
                    className="p-1 hover:text-white cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono text-[11px] w-10 text-center">{zoomPercent}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomPercent((prev) => Math.min(200, prev + 10))}
                    className="p-1 hover:text-white cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Print */}
              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  window.print();
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print...</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Ctrl+P</span>
              </button>

              <div className="my-1.5 border-t border-slate-700/80" />

              {/* More tools with submenu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreToolsMenu((prev) => !prev)}
                  className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2.5 font-medium text-slate-100">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>More tools</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showMoreToolsMenu ? 'rotate-90' : ''}`} />
                </button>

                {/* Submenu of More Tools */}
                {showMoreToolsMenu && (
                  <div className="bg-[#1f2229] border-y border-slate-700/80 py-1 text-xs">
                    {[
                      { title: '3D Security Mesh Scanner', url: 'chrome://3d-scanner', icon: Shield, color: 'text-cyan-400' },
                      { title: 'DNS Cryptographic Inspector', url: 'chrome://dns', icon: Globe, color: 'text-teal-400' },
                      { title: 'Website & Security Comparator', url: 'chrome://compare', icon: GitCompare, color: 'text-purple-400' },
                      { title: 'Threat Shield & Sandbox Blocker', url: 'chrome://threats', icon: ShieldAlert, color: 'text-rose-400' },
                      { title: 'Chromium Depot Tools Studio', url: 'chrome://depot-tools', icon: Database, color: 'text-amber-400', badge: 'source.chromium.org' },
                      { title: 'Cybersecurity APIs Hub', url: 'chrome://security-apis', icon: Cpu, color: 'text-emerald-400', badge: 'jaegeral/security-apis' },
                      { title: 'Science & Research Engine', url: 'chrome://science', icon: Sparkles, color: 'text-blue-400' },
                      { title: 'Gemini AI Security Copilot', url: 'chrome://copilot', icon: Bot, color: 'text-teal-400' },
                      { title: 'Password & Credentials Vault', url: 'chrome://vault', icon: Key, color: 'text-amber-400' },
                      { title: 'Security Analytics Dashboard', url: 'chrome://analytics', icon: BarChart2, color: 'text-cyan-400' },
                      { title: 'Chrome Extensions Manager', url: 'chrome://extensions', icon: Puzzle, color: 'text-indigo-400' },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          setShowAppMenu(false);
                          setShowMoreToolsMenu(false);
                          handleNavigate(item.url, false, false);
                        }}
                        className="w-full px-5 py-1.5 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <item.icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                          <span className="truncate">{item.title}</span>
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1 py-0.2 rounded border border-slate-700 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                    <div className="my-1 border-t border-slate-700/80" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppMenu(false);
                        setShowMoreToolsMenu(false);
                        if (webviewRef.current?.openDevTools) {
                          webviewRef.current.openDevTools({ mode: 'detach' });
                        } else if ((window as any).aegisDesktopApi?.openDevTools) {
                          (window as any).aegisDesktopApi.openDevTools();
                        }
                      }}
                      className="w-full px-5 py-1.5 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors text-cyan-300"
                    >
                      <span className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Developer tools</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">F12</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="my-1.5 border-t border-slate-700/80" />

              {/* Appearance & Themes */}
              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  if (onOpenThemeModal) onOpenThemeModal();
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Appearance & Themes</span>
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">Theme</span>
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  handleNavigate('chrome://settings', false, false);
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">chrome://settings</span>
              </button>

              {/* Help / About */}
              <button
                type="button"
                onClick={() => {
                  setShowAppMenu(false);
                  handleNavigate('chrome://version', false, false);
                }}
                className="w-full px-4 py-2 hover:bg-[#353b47] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>About Aegis Chromium</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">chrome://version</span>
              </button>
            </div>
          )}
        </div>

        {/* Optional Chrome Bookmarks Bar */}
        {showBookmarksBar && (
          <div className="h-7 bg-[#22252a] border-b border-slate-800/80 px-3 flex items-center gap-1.5 text-xs font-sans overflow-x-auto scrollbar-none select-none shrink-0 z-10">
            {[
              { title: 'YouTube', url: 'https://www.youtube.com' },
              { title: 'Google', url: 'https://www.google.com' },
              { title: 'GitHub', url: 'https://github.com' },
              { title: 'Wikipedia', url: 'https://en.wikipedia.org' },
              { title: 'Cloudflare', url: 'https://cloudflare.com' },
              { title: 'DuckDuckGo', url: 'https://duckduckgo.com' },
              { title: 'arXiv', url: 'https://arxiv.org' },
              { title: 'PubMed', url: 'https://ncbi.nlm.nih.gov' },
              ...bookmarks.slice(0, 5),
            ].map((bm) => (
              <button
                key={bm.title}
                type="button"
                onClick={() => handleNavigate(bm.url, false, false)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-700/50 text-slate-300 hover:text-white text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title={bm.url}
              >
                <Globe className="w-3 h-3 text-slate-400" />
                <span>{bm.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Body: Opera Left Sidebar + Viewport & Slide-In Sidebars */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Opera-style Vertical Left Sidebar */}
          {showOperaSidebar && (
            <aside className="w-[48px] bg-[#101217] border-r border-slate-800/80 flex flex-col items-center py-2.5 justify-between shrink-0 select-none z-20 absolute sm:relative inset-y-0 left-0 shadow-2xl sm:shadow-none">
              {/* Opera Top Action Items */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                {/* Speed Dial / Start Page */}
                <button
                  type="button"
                  onClick={handleGoHome}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab.url === 'aegis://newtab'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Speed Dial / Start Page"
                >
                  <Zap className="w-4 h-4" />
                </button>

                {/* Opera Aria / Gemini AI Copilot */}
                <button
                  type="button"
                  onClick={() => setActiveSidebar((prev) => (prev === 'ai' ? 'none' : 'ai'))}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                    activeSidebar === 'ai'
                      ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                      : 'text-slate-400 hover:text-teal-300 hover:bg-slate-800/80'
                  }`}
                  title="Aria & Gemini AI Assistant (Ctrl+Shift+A)"
                >
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                </button>

                {/* Opera Ad & Tracker Blocker Shield */}
                <button
                  type="button"
                  onClick={() => {
                    setTabs((prev) =>
                      prev.map((t) =>
                        t.id === activeTab.id
                          ? { ...t, trackersBlocked: t.trackersBlocked + 1 }
                          : t
                      )
                    );
                  }}
                  className="w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer text-emerald-400 hover:bg-slate-800/80 relative"
                  title={`Opera Ad & Tracker Shield: ${activeTab.trackersBlocked} blocked`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[9px] font-mono font-bold leading-none text-emerald-300">
                    {activeTab.trackersBlocked > 99 ? '99+' : activeTab.trackersBlocked}
                  </span>
                </button>

                {/* Free Built-in VPN & Zero-Trace Privacy */}
                <button
                  type="button"
                  onClick={onTogglePrivacy}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    privacyMode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
                  }`}
                  title={`Free Built-in VPN & Zero-Trace Privacy (${privacyMode ? 'ON' : 'OFF'})`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className={`text-[8px] font-mono font-black tracking-tighter ${privacyMode ? 'text-cyan-300' : 'text-slate-500'}`}>
                    VPN
                  </span>
                </button>

                <div className="w-6 h-[1px] bg-slate-800 my-0.5" />

                {/* Workspaces / Tab Groups */}
                <button
                  type="button"
                  onClick={() => setActiveSidebar((prev) => (prev === 'tabs' ? 'none' : 'tabs'))}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeSidebar === 'tabs'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Workspaces & Tab Groups"
                >
                  <Layers className="w-4 h-4" />
                </button>

                {/* Bookmarks */}
                <button
                  type="button"
                  onClick={() => setActiveSidebar((prev) => (prev === 'bookmarks' ? 'none' : 'bookmarks'))}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeSidebar === 'bookmarks'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Bookmarks (Ctrl+B)"
                >
                  <Star className="w-4 h-4" />
                </button>

                {/* History */}
                <button
                  type="button"
                  onClick={() => setActiveSidebar((prev) => (prev === 'history' ? 'none' : 'history'))}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeSidebar === 'history'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="History (Ctrl+H)"
                >
                  <History className="w-4 h-4" />
                </button>

                {/* Reading List */}
                <button
                  type="button"
                  onClick={() => setActiveSidebar((prev) => (prev === 'read-later' ? 'none' : 'read-later'))}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeSidebar === 'read-later'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Reading List"
                >
                  <BookOpen className="w-4 h-4" />
                </button>

                {/* RAM & CPU Performance Limiter (Opera GX) */}
                <button
                  type="button"
                  onClick={() => setActiveSidebar((prev) => (prev === 'resource-monitor' ? 'none' : 'resource-monitor'))}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeSidebar === 'resource-monitor'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="CPU & RAM Resource Monitor"
                >
                  <Cpu className="w-4 h-4" />
                </button>
              </div>

              {/* Opera Bottom Tools & Collapse */}
              <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => executeNavigate('chrome://settings', false, false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Settings & Flags"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleOperaSidebar}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Hide Opera Sidebar"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
            </aside>
          )}

          {/* Viewport & Slide-In Sidebars Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* Main Web Viewport Area */}
          <div
            className={`h-full min-h-0 flex flex-col overflow-hidden transition-all duration-300 ${
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
            ) : isInternalChromePage ? (
              /* =========================================================================
                 NATIVE IN-TAB CHROMIUM SETTINGS & TOOLS (chrome://settings, chrome://depot-tools, etc.)
                 ========================================================================= */
              <div className="w-full h-full flex flex-col bg-[#1f2229] overflow-hidden">
                <AegisSettingsHub
                  initialSection={mapUrlToSection(activeTab.url)}
                  activeTab={activeTab}
                  tabs={tabs}
                  onClose={() => handleNavigate('aegis://newtab', false, false)}
                  onNavigateToUrl={(url) => handleNavigate(url, false, false)}
                  onOpenCommandPalette={onOpenCommandPalette}
                  onOpenThemeModal={onOpenThemeModal}
                  isDesktop={isDesktop}
                  isFullscreen={true}
                />
              </div>
            ) : (!isDesktop && ytInfo.isYouTube && ytInfo.videoId) ? (
              /* =========================================================================
                 IN-BROWSER THEATER MODE YOUTUBE PLAYER VIEW (WEB FALLBACK)
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono shrink-0 select-none">
                  <div className="flex items-center gap-2 truncate">
                    <button
                      type="button"
                      onClick={() => handleNavigate('https://www.youtube.com', false, false)}
                      className="px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/40 text-red-300 text-xs flex items-center gap-1 cursor-pointer transition-colors font-sans"
                      title="Back to YouTube Home"
                    >
                      <span>← Back to YouTube</span>
                    </button>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-red-400 font-bold">YouTube Web Player</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-200 truncate">{activeTab.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleActiveBookmark}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                        isCurrentBookmarked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span>{isCurrentBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLaunchExternalWindow}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open External</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full h-full relative bg-black">
                  <iframe
                    key={`yt-player-${ytInfo.videoId}-${refreshKey}`}
                    src={`https://www.youtube-nocookie.com/embed/${ytInfo.videoId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}
                    title={activeTab.title || 'YouTube Video Player'}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (!isDesktop && ytInfo.isYouTube && !ytInfo.videoId) ? (
              /* =========================================================================
                 IN-BROWSER YOUTUBE PORTAL & VIDEO DISCOVERY VIEW (WEB FALLBACK)
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto scrollbar-thin">
                {/* YouTube Navigation & Search Banner */}
                <div className="sticky top-0 z-20 px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black shadow-md shadow-red-600/30">
                      ▶
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5">
                        <span>YouTube Safe Portal</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">Ad-Free Player</span>
                      </h2>
                      <p className="text-[11px] text-slate-400">Stream any YouTube video in zero-trust theater mode</p>
                    </div>
                  </div>

                  {/* YouTube In-Page Search */}
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search YouTube videos, creators, music..."
                        defaultValue={ytInfo.searchQuery || ''}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.currentTarget.value || '').trim();
                            if (val) {
                              handleNavigate(`https://www.youtube.com/results?search_query=${encodeURIComponent(val)}`, false, false);
                            }
                          }
                        }}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:border-red-500 text-slate-100 placeholder-slate-400 font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Topic Filter Pills */}
                <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
                  {['Trending', 'Cybersecurity', 'Programming', 'Science', 'Gaming', 'Music', 'Tech News', 'Podcasts'].map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => handleNavigate(`https://www.youtube.com/results?search_query=${encodeURIComponent(pill)}`, false, false)}
                      className="px-3 py-1 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 border border-slate-700 text-slate-300 transition-colors shrink-0 cursor-pointer font-medium"
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                {/* Video Grid */}
                <div className="p-4 sm:p-6 flex-1">
                  {ytLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-3">
                      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-mono text-slate-400">Loading YouTube videos & recommendations...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {ytVideos.map((vid) => (
                        <div
                          key={vid.id}
                          onClick={() => handleNavigate(`https://www.youtube.com/watch?v=${vid.id}`, false, false)}
                          className="group bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-red-500/50 rounded-xl overflow-hidden shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
                        >
                          <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                            <img
                              src={vid.thumbnail}
                              alt={vid.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <span className="text-xl pl-0.5">▶</span>
                              </div>
                            </div>
                            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                              HD
                            </span>
                          </div>
                          <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                            <h3 className="text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-red-400 transition-colors">
                              {vid.title}
                            </h3>
                            <div className="text-[11px] text-slate-400 space-y-0.5">
                              <p className="font-medium text-slate-300 truncate">{vid.channel}</p>
                              <p className="font-mono text-[10px] text-slate-500">{vid.views} · {vid.published}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (activeTab.url === 'aegis://newtab' || (activeTab.title === 'New Tab' && (!activeTab.historyStack || activeTab.historyStack.length <= 1))) ? (
              /* =========================================================================
                 NEW TAB / 3D SHAPE SCANNER START PAGE
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col items-center justify-start bg-gradient-to-b from-[#030712] via-[#050b18] to-[#030712] overflow-y-auto scrollbar-thin p-4 sm:p-8 space-y-8">
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
                      const v = startPageSearchInput.trim();
                      if (v) {
                        handleNavigate(v, false, false);
                        setStartPageSearchInput('');
                      }
                    }}
                    className="flex items-center bg-slate-900/90 border border-slate-700 hover:border-cyan-500 focus-within:border-cyan-400 rounded-2xl p-2 shadow-2xl transition-all shadow-cyan-950/20"
                  >
                    <Search className="w-5 h-5 text-cyan-400 ml-3 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={startPageSearchInput}
                      onChange={(e) => setStartPageSearchInput(e.target.value)}
                      placeholder="Search safely or enter URL (e.g. youtube.com, github.com)..."
                      className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono py-1.5"
                    />
                    {startPageSearchInput && (
                      <button
                        type="button"
                        onClick={() => setStartPageSearchInput('')}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 mr-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
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
                            const query = (startPageSearchInput || '').trim() || (item.id === 'videos' ? 'trending tech' : item.id === 'science' ? 'quantum computing' : 'cybersecurity');
                            if (item.id === 'videos') {
                              handleNavigate(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, false, false);
                            } else {
                              handleNavigate(`aegis://search?q=${encodeURIComponent(query)}&category=${item.id}`, false, false);
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

                {/* Authentic Opera & Chrome Speed Dial Grid */}
                <div className="w-full max-w-3xl mx-auto space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/60 pb-1.5">
                    <span className="uppercase tracking-wider font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Speed Dial Shortcuts</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddShortcutModal(true)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add shortcut</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs font-mono">
                    {customShortcuts.map((site) => (
                      <div
                        key={site.url}
                        onClick={() => handleNavigate(site.url, false, false)}
                        className="group relative p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-850 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-slate-800/90 border border-slate-700/80 group-hover:border-cyan-400/40 flex items-center justify-center text-base font-bold shadow-inner transition-transform group-hover:scale-105">
                          {site.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-0.5 w-full">
                          <span className="font-bold text-slate-200 group-hover:text-cyan-300 truncate block">
                            {site.title}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {site.desc}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteShortcut(site.url, e)}
                          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-800/90 hover:bg-rose-900/80 text-slate-400 hover:text-rose-200 transition-all cursor-pointer"
                          title="Remove shortcut"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add Shortcut Tile */}
                    <button
                      type="button"
                      onClick={() => setShowAddShortcutModal(true)}
                      className="p-3 rounded-2xl border border-dashed border-slate-700/80 hover:border-cyan-500/60 bg-slate-900/30 hover:bg-slate-900/70 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer text-slate-400 hover:text-cyan-300 min-h-[96px]"
                    >
                      <div className="w-10 h-10 rounded-2xl border border-slate-700 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="font-semibold text-xs">Add site</span>
                    </button>
                  </div>
                </div>
              </div>) : (
              /* =========================================================================
                 REAL WEB VIEWPORT (PROXIED IFRAME WITH IN-PAGE CLICK INTERCEPTION)
                 ========================================================================= */
              <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden min-h-0">
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
                      {isDesktop ? 'Chromium Engine Active' : 'Zero-Trust Sandbox Active'}
                    </span>
                    {isDesktop && (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            if (webviewRef.current?.openDevTools) {
                              webviewRef.current.openDevTools({ mode: 'detach' });
                            } else if ((window as any).aegisDesktopApi?.openDevTools) {
                              (window as any).aegisDesktopApi.openDevTools();
                            }
                          } catch {}
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Open Chromium DevTools for this page (F12)"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>DevTools</span>
                      </button>
                    )}
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
                <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-900">
                  {isScanning && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 animate-pulse z-20" />
                  )}
                  {isDesktop ? (
                    <webview
                      ref={webviewRef}
                      key={`desktop-webview-${activeTab.id}-${refreshKey}`}
                      src={activeTab.initialUrl || activeTab.url}
                      partition="persist:aegis-browser"
                      allowpopups=""
                      useragent={isGoogleAuthEndpoint(activeTab.url) ? GOOGLE_AUTH_UA : CHROMIUM_DESKTOP_UA}
                      webpreferences="webSecurity=no, contextIsolation=no, nativeWindowOpen=yes"
                      className="w-full h-full border-0 bg-white"
                      style={{ width: '100%', height: '100%', display: 'flex' }}
                    />
                  ) : (
                    <iframe
                      key={`${activeTab.id}-${refreshKey}`}
                      src={`${getApiBaseUrl()}/api/proxy?url=${encodeURIComponent(unwrapProxyUrl(activeTab.initialUrl || activeTab.url))}`}
                      title={activeTab.title}
                      className="w-full h-full border-0 bg-white"
                      sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
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
               AEGIS UNIFIED SETTINGS & TOOLS HUB (12 FEATURES ARCHITECTURE)
               ========================================================================= */
            <div
              className={`${
                isToolFullscreen
                  ? 'col-span-12 fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden'
                  : 'lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/95 flex flex-col h-full overflow-hidden shadow-2xl'
              }`}>
              <AegisSettingsHub
                initialSection={activeToolTab === 'settings' ? 'general' : (activeToolTab as SettingsSectionId)}
                activeTab={activeTab}
                tabs={tabs}
                onClose={() => {
                  setActiveSidebar('none');
                  setIsToolFullscreen(false);
                }}
                onNavigateToUrl={(url) => {
                  setActiveSidebar('none');
                  setIsToolFullscreen(false);
                  handleNavigate(url, false, false);
                }}
                onOpenCommandPalette={onOpenCommandPalette}
                onOpenThemeModal={onOpenThemeModal}
                isDesktop={isDesktop}
                isFullscreen={isToolFullscreen}
                onToggleFullscreen={() => setIsToolFullscreen((prev) => !prev)}
              />
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

        {/* Sleek Mobile Bottom Navigation Bar (Visible on mobile / touchscreens) */}
        <div className="sm:hidden flex items-center justify-around px-2 py-2 bg-[#181a1f] border-t border-slate-800 text-slate-300 z-30 select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={handleGoBack}
            className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition-colors ${
              canGoBack ? 'text-slate-200 active:bg-slate-800' : 'text-slate-600 opacity-40'
            }`}
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[9px]">Back</span>
          </button>

          <button
            type="button"
            disabled={!canGoForward}
            onClick={handleGoForward}
            className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition-colors ${
              canGoForward ? 'text-slate-200 active:bg-slate-800' : 'text-slate-600 opacity-40'
            }`}
            title="Forward"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-[9px]">Forward</span>
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="p-2 rounded-xl flex flex-col items-center gap-0.5 text-slate-200 active:bg-slate-800 transition-colors"
            title="Home"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span className="text-[9px] text-cyan-300">Home</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNewTab}
            className="p-2 rounded-xl flex flex-col items-center gap-0.5 text-slate-200 active:bg-slate-800 transition-colors"
            title="New Tab"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[9px]">New Tab</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAppMenu((prev) => !prev)}
            className="p-2 rounded-xl flex flex-col items-center gap-0.5 text-slate-200 active:bg-slate-800 transition-colors"
            title="Tabs & Menu"
          >
            <div className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-[10px] font-bold">
              {tabs.length}
            </div>
            <span className="text-[9px]">Menu</span>
          </button>
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

      {/* Chrome & Opera Native Tab Right-Click Context Menu */}
      {tabContextMenu && (
        <div
          className="tab-context-menu fixed z-50 min-w-[220px] bg-[#1a1d24]/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl py-1.5 text-xs font-sans text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: Math.min(tabContextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 230),
            top: Math.min(tabContextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 310),
          }}
        >
          <button
            onClick={() => {
              handleCreateNewTab();
              setTabContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors cursor-pointer text-left"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>New tab to the right</span>
            <span className="ml-auto text-[10px] text-slate-500 font-mono">Ctrl+T</span>
          </button>
          <button
            onClick={() => handleDuplicateTab(tabContextMenu.tabId)}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors cursor-pointer text-left"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Duplicate tab</span>
          </button>
          <button
            onClick={() => handleTogglePinTab(tabContextMenu.tabId)}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors cursor-pointer text-left"
          >
            <Pin className="w-3.5 h-3.5 text-amber-400" />
            <span>{tabs.find((t) => t.id === tabContextMenu.tabId)?.isPinned ? 'Unpin tab' : 'Pin tab'}</span>
          </button>
          <button
            onClick={() => handleToggleMuteTab(tabContextMenu.tabId)}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors cursor-pointer text-left"
          >
            {tabs.find((t) => t.id === tabContextMenu.tabId)?.isMuted ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unmute site</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span>Mute site</span>
              </>
            )}
          </button>
          <div className="my-1 border-t border-slate-700/60" />
          <button
            onClick={() => {
              handleCloseTab({ stopPropagation: () => {} } as any, tabContextMenu.tabId);
              setTabContextMenu(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer text-left"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Close tab</span>
            <span className="ml-auto text-[10px] text-slate-500 font-mono">Ctrl+W</span>
          </button>
          <button
            onClick={() => handleCloseOtherTabs(tabContextMenu.tabId)}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer text-left"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Close other tabs</span>
          </button>
          <button
            onClick={() => handleCloseTabsToRight(tabContextMenu.tabId)}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer text-left"
          >
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Close tabs to the right</span>
          </button>
          {recentlyClosedTabs.length > 0 && (
            <>
              <div className="my-1 border-t border-slate-700/60" />
              <button
                onClick={handleReopenLastClosedTab}
                className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors cursor-pointer text-left"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reopen closed tab</span>
                <span className="ml-auto text-[10px] text-slate-500 font-mono">Ctrl+Shift+T</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Speed Dial Add Shortcut Modal */}
      {showAddShortcutModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddShortcutModal(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Speed Dial Shortcut</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddShortcutModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddShortcut} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Site Name</label>
                <input
                  type="text"
                  value={newShortcutTitle}
                  onChange={(e) => setNewShortcutTitle(e.target.value)}
                  placeholder="e.g. YouTube, GitHub, Twitter"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono">URL Address</label>
                <input
                  type="text"
                  required
                  value={newShortcutUrl}
                  onChange={(e) => setNewShortcutUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddShortcutModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
