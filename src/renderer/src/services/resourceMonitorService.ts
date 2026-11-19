import { BrowserTab, TabGroup, TabGroupColor, TabResourceMetrics, SystemResourceSummary } from '../types';

/**
 * Deterministic pseudo-random fluctuation based on seed & string hash
 */
function getDeterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Calculates live CPU and Memory resource metrics for a single tab
 */
export function computeTabResourceMetrics(
  tab: BrowserTab,
  isActive: boolean,
  tick: number = 0
): TabResourceMetrics {
  const isSuspended = Boolean(tab.isSuspended);

  if (isSuspended) {
    return {
      tabId: tab.id,
      title: tab.title,
      url: tab.url,
      domain: tab.domain,
      cpuPercent: 0.1,
      memoryMb: 14.2,
      isSuspended: true,
      status: 'suspended',
      threads: 1,
      networkKbps: 0.0,
      energyImpact: 'Low',
    };
  }

  const hash = getDeterministicHash(tab.id + tab.domain);
  // Periodic micro-fluctuation based on tick
  const sinFactor = Math.sin((tick + hash % 10) * 0.4);
  const cosFactor = Math.cos((tick + hash % 7) * 0.5);

  let baseMemory = 48 + (hash % 45); // 48MB - 93MB
  let baseCpu = isActive ? 3.5 + ((hash % 30) / 10) : 0.4 + ((hash % 12) / 10); // Active: 3.5 - 6.5%, Inactive: 0.4 - 1.6%

  // Threat impact: quarantined or warning sites load extra sandboxing layers
  if (tab.threatStatus === 'blocked' || tab.isQuarantined) {
    baseMemory += 45;
    baseCpu += 4.2;
  } else if (tab.threatStatus === 'warning') {
    baseMemory += 22;
    baseCpu += 2.0;
  }

  // Active tab gets interactive work cycles
  if (isActive) {
    baseMemory += 26;
    baseCpu += (sinFactor * 1.8);
  } else {
    baseCpu += (cosFactor * 0.2);
  }

  // Add micro jitter
  const memoryMb = Math.max(18, Math.round((baseMemory + sinFactor * 4) * 10) / 10);
  const cpuPercent = Math.max(0.2, Math.round(Math.abs(baseCpu) * 10) / 10);

  let status: 'normal' | 'heavy' | 'critical' | 'suspended' = 'normal';
  if (memoryMb > 130 || cpuPercent > 12) {
    status = 'critical';
  } else if (memoryMb > 85 || cpuPercent > 6.5) {
    status = 'heavy';
  }

  const threads = isActive ? (tab.threatStatus !== 'clean' ? 6 : 4) : 2;
  const networkKbps = isActive ? Math.round((hash % 15 + sinFactor * 3) * 10) / 10 : 0.2;
  const energyImpact: 'Low' | 'Moderate' | 'High' =
    cpuPercent > 8 ? 'High' : cpuPercent > 3 ? 'Moderate' : 'Low';

  return {
    tabId: tab.id,
    title: tab.title,
    url: tab.url,
    domain: tab.domain,
    cpuPercent,
    memoryMb,
    isSuspended: false,
    status,
    threads,
    networkKbps: Math.max(0, networkKbps),
    energyImpact,
  };
}

/**
 * Calculates browser-wide resource overview across all open tabs
 */
export function computeSystemResourceSummary(
  tabs: BrowserTab[],
  activeTabId: string,
  tick: number = 0
): SystemResourceSummary {
  let totalCpu = 0;
  let totalMemory = 0;
  let suspendedCount = 0;
  let activeCount = 0;
  let estimatedSavedMb = 0;

  tabs.forEach((tab) => {
    const isActive = tab.id === activeTabId;
    const metrics = computeTabResourceMetrics(tab, isActive, tick);
    totalCpu += metrics.cpuPercent;
    totalMemory += metrics.memoryMb;

    if (tab.isSuspended) {
      suspendedCount++;
      estimatedSavedMb += 55.0; // average memory saved vs awake tab
    } else {
      activeCount++;
    }
  });

  const roundedCpu = Math.round(totalCpu * 10) / 10;
  const roundedMemory = Math.round(totalMemory * 10) / 10;

  let systemHealth: 'optimal' | 'moderate' | 'high_load' = 'optimal';
  if (roundedCpu > 35 || roundedMemory > 600) {
    systemHealth = 'high_load';
  } else if (roundedCpu > 18 || roundedMemory > 350) {
    systemHealth = 'moderate';
  }

  return {
    totalCpuPercent: roundedCpu,
    totalMemoryMb: roundedMemory,
    totalTabsCount: tabs.length,
    activeTabsCount: activeCount,
    suspendedTabsCount: suspendedCount,
    estimatedMemorySavedMb: Math.round(estimatedSavedMb),
    systemHealth,
  };
}

/**
 * Puts a background tab to sleep (frees RAM & drops CPU to near 0)
 */
export function suspendTab(tabs: BrowserTab[], tabId: string): BrowserTab[] {
  return tabs.map((tab) => {
    if (tab.id === tabId) {
      return {
        ...tab,
        isSuspended: true,
        cpuPercent: 0.1,
        memoryMb: 14.2,
      };
    }
    return tab;
  });
}

/**
 * Wakes up a suspended tab
 */
export function wakeTab(tabs: BrowserTab[], tabId: string): BrowserTab[] {
  return tabs.map((tab) => {
    if (tab.id === tabId) {
      return {
        ...tab,
        isSuspended: false,
        cpuPercent: 3.2,
        memoryMb: 52.0,
        lastActiveAt: Date.now(),
      };
    }
    return tab;
  });
}

/**
 * Optimizes memory across all inactive tabs by hibernating them
 */
export function optimizeAllBackgroundTabs(
  tabs: BrowserTab[],
  activeTabId: string
): { updatedTabs: BrowserTab[]; savedMb: number; suspendedCount: number } {
  let count = 0;
  const updatedTabs = tabs.map((tab) => {
    if (tab.id !== activeTabId && !tab.isSuspended && !tab.isPinned) {
      count++;
      return {
        ...tab,
        isSuspended: true,
        cpuPercent: 0.1,
        memoryMb: 14.2,
      };
    }
    return tab;
  });

  return {
    updatedTabs,
    savedMb: count * 55,
    suspendedCount: count,
  };
}

// ==========================================
// SMART TAB GROUPING HEURISTICS & HELPERS
// ==========================================

export const TAB_GROUP_PRESETS: Array<{
  name: string;
  color: TabGroupColor;
  keywords: string[];
}> = [
  {
    name: 'Security & Zero-Trust',
    color: 'cyan',
    keywords: ['cloudflare', 'virustotal', 'shodan', 'threat', 'security', 'cve', 'mitre', 'aegis', 'cert', 'dns'],
  },
  {
    name: 'Developer & Tools',
    color: 'purple',
    keywords: ['github', 'gitlab', 'stackoverflow', 'stackexchange', 'npmjs', 'dev.to', 'code', 'repo', 'api'],
  },
  {
    name: 'Research & Science',
    color: 'emerald',
    keywords: ['ncbi', 'pubmed', 'arxiv', 'nature', 'biorxiv', 'science', 'nih.gov', 'springer', 'cell', 'paper'],
  },
  {
    name: 'Docs & Reference',
    color: 'amber',
    keywords: ['wikipedia', 'wikimedia', 'docs', 'documentation', 'w3schools', 'mdn', 'archive', 'reference'],
  },
  {
    name: 'Search & Portals',
    color: 'blue',
    keywords: ['google', 'duckduckgo', 'bing', 'brave', 'search', 'portal'],
  },
  {
    name: 'Media & Social',
    color: 'rose',
    keywords: ['youtube', 'twitter', 'x.com', 'reddit', 'news', 'media', 'linkedin'],
  },
];

/**
 * Classifies a tab into a smart group based on its URL, title, and domain
 */
export function classifyTabGroup(tab: BrowserTab): { name: string; color: TabGroupColor } {
  const combined = (tab.url + ' ' + tab.title + ' ' + tab.domain).toLowerCase();

  for (const preset of TAB_GROUP_PRESETS) {
    if (preset.keywords.some((kw) => combined.includes(kw))) {
      return { name: preset.name, color: preset.color };
    }
  }

  // Fallback: group by main second-level domain name if possible
  const domainParts = tab.domain.split('.');
  if (domainParts.length >= 2) {
    const brand = domainParts[domainParts.length - 2];
    const capitalized = brand.charAt(0).toUpperCase() + brand.slice(1);
    return { name: `${capitalized} Hub`, color: 'slate' };
  }

  return { name: 'General Browsing', color: 'slate' };
}

/**
 * Smart Auto-Group algorithm: groups all open tabs into contextual clusters
 */
export function autoGroupTabs(tabs: BrowserTab[]): {
  groupedTabs: BrowserTab[];
  groups: TabGroup[];
} {
  const groupsMap = new Map<string, TabGroup>();

  const updatedTabs = tabs.map((tab) => {
    const classification = classifyTabGroup(tab);
    const groupId = `grp-${classification.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        id: groupId,
        name: classification.name,
        color: classification.color,
        collapsed: false,
        createdAt: Date.now(),
      });
    }

    return {
      ...tab,
      groupId,
      groupTitle: classification.name,
      groupColor: classification.color,
    };
  });

  return {
    groupedTabs: updatedTabs,
    groups: Array.from(groupsMap.values()),
  };
}

/**
 * Create a new custom tab group
 */
export function createTabGroup(name: string, color: TabGroupColor): TabGroup {
  return {
    id: `grp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name,
    color,
    collapsed: false,
    createdAt: Date.now(),
  };
}

/**
 * Assign a tab to a specific group
 */
export function assignTabToGroup(
  tabs: BrowserTab[],
  tabId: string,
  group: TabGroup
): BrowserTab[] {
  return tabs.map((tab) => {
    if (tab.id === tabId) {
      return {
        ...tab,
        groupId: group.id,
        groupTitle: group.name,
        groupColor: group.color,
      };
    }
    return tab;
  });
}

/**
 * Remove a tab from its group
 */
export function removeTabFromGroup(tabs: BrowserTab[], tabId: string): BrowserTab[] {
  return tabs.map((tab) => {
    if (tab.id === tabId) {
      const copy = { ...tab };
      delete copy.groupId;
      delete copy.groupTitle;
      delete copy.groupColor;
      return copy;
    }
    return tab;
  });
}

/**
 * Dissolve all groups
 */
export function ungroupAll(tabs: BrowserTab[]): BrowserTab[] {
  return tabs.map((tab) => {
    const copy = { ...tab };
    delete copy.groupId;
    delete copy.groupTitle;
    delete copy.groupColor;
    return copy;
  });
}

/**
 * Closes all tabs belonging to a group
 */
export function closeTabsInGroup(
  tabs: BrowserTab[],
  groupId: string
): BrowserTab[] {
  return tabs.filter((t) => t.groupId !== groupId);
}
