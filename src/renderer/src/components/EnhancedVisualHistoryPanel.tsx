import React, { useState, useMemo } from 'react';
import { BrowserHistoryItem } from '../types';
import {
  History,
  TrendingUp,
  Search,
  Trash2,
  Plus,
  X,
  ExternalLink,
  Shield,
  ShieldAlert,
  Lock,
  Globe,
  Clock,
  Calendar,
  BarChart2,
  Download,
  BookOpen,
  Star,
  Check,
  AlertTriangle,
  Radio,
  Filter,
} from 'lucide-react';
import { addReadLaterItem } from '../services/readLaterStorage';
import { toggleBookmark, getStoredBookmarks } from '../services/bookmarkStorage';

interface EnhancedVisualHistoryPanelProps {
  history: BrowserHistoryItem[];
  onNavigate: (url: string, newTab?: boolean) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onBookmarkChanged?: () => void;
}

export const EnhancedVisualHistoryPanel: React.FC<EnhancedVisualHistoryPanelProps> = ({
  history,
  onNavigate,
  onDeleteItem,
  onClearAll,
  onBookmarkChanged,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'trends'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<'all' | 'clean' | 'blocked' | 'insecure'>('all');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string | null>(null);
  const [savedToReadLaterId, setSavedToReadLaterId] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Group history by date buckets
  const groupedHistory = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    const groups: { [key: string]: BrowserHistoryItem[] } = {
      Today: [],
      Yesterday: [],
      'Earlier This Week': [],
      Older: [],
    };

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;

    const filtered = history.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q);

      // Threat filter
      const matchesThreat =
        threatFilter === 'all'
          ? true
          : threatFilter === 'clean'
          ? item.threatStatus === 'clean'
          : threatFilter === 'blocked'
          ? item.threatStatus === 'blocked'
          : !item.isHttps;

      // Domain filter
      const matchesDomain = !selectedDomainFilter || item.domain === selectedDomainFilter;

      return matchesSearch && matchesThreat && matchesDomain;
    });

    filtered.forEach((item) => {
      if (item.date === today) {
        groups['Today'].push(item);
      } else if (item.date === yesterday) {
        groups['Yesterday'].push(item);
      } else {
        const itemTime = new Date(`${item.date} ${item.timestamp}`).getTime();
        if (itemTime >= sevenDaysAgo) {
          groups['Earlier This Week'].push(item);
        } else {
          groups['Older'].push(item);
        }
      }
    });

    return groups;
  }, [history, searchQuery, threatFilter, selectedDomainFilter]);

  // Visual Trends Computations
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
  const domainStats = useMemo(() => {
    const counts: Record<string, { count: number; clean: number; avgScore: number }> = {};
    history.forEach((h) => {
      if (!counts[h.domain]) {
        counts[h.domain] = { count: 0, clean: 0, avgScore: 0 };
      }
      counts[h.domain].count += 1;
      if (h.threatStatus !== 'blocked') counts[h.domain].clean += 1;
      counts[h.domain].avgScore += h.securityScore || 85;
    });

    return Object.entries(counts)
      .map(([domain, data]) => ({
        domain,
        count: data.count,
        safeRatio: Math.round((data.clean / data.count) * 100),
        avgScore: Math.round(data.avgScore / data.count),
      }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  // Hourly Activity Distribution (Morning, Afternoon, Evening, Night)
  const timeBuckets = useMemo(() => {
    let morning = 0; // 06 - 12
    let afternoon = 0; // 12 - 18
    let evening = 0; // 18 - 24
    let night = 0; // 00 - 06

    history.forEach((h) => {
      const match = h.timestamp.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
      if (match) {
        let hour = parseInt(match[1], 10);
        const meridiem = match[3]?.toUpperCase();
        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;

        if (hour >= 6 && hour < 12) morning++;
        else if (hour >= 12 && hour < 18) afternoon++;
        else if (hour >= 18 && hour < 24) evening++;
        else night++;
      } else {
        afternoon++;
      }
    });

    const max = Math.max(morning, afternoon, evening, night, 1);
    return [
      { label: 'Morning (06-12)', count: morning, pct: Math.round((morning / max) * 100) },
      { label: 'Afternoon (12-18)', count: afternoon, pct: Math.round((afternoon / max) * 100) },
      { label: 'Evening (18-24)', count: evening, pct: Math.round((evening / max) * 100) },
      { label: 'Night (00-06)', count: night, pct: Math.round((night / max) * 100) },
    ];
  }, [history]);

  const handleSaveToReadLater = (item: BrowserHistoryItem) => {
    addReadLaterItem({
      title: item.title,
      url: item.url,
      domain: item.domain,
      excerpt: `Saved from browsing history (${item.date}). Security Score: ${item.securityScore}/100.`,
      category: item.domain.includes('ncbi') || item.domain.includes('arxiv')
        ? 'Research'
        : item.domain.includes('cloudflare') || item.domain.includes('security')
        ? 'Security'
        : 'General',
      threatStatus: item.threatStatus,
      readTimeMinutes: 5,
    });
    setSavedToReadLaterId(item.id);
    setTimeout(() => setSavedToReadLaterId(null), 2000);
  };

  const handleToggleBookmarkItem = (item: BrowserHistoryItem) => {
    toggleBookmark({
      title: item.title,
      url: item.url,
      domain: item.domain,
      category: 'General',
    });
    onBookmarkChanged?.();
  };

  const handleExportHistory = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-browser-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3 font-mono text-xs">
      {/* Top Header Mode Toggle & Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-100 font-bold">
            <History className="w-4 h-4 text-cyan-400" />
            <span className="text-xs uppercase tracking-wider">Enhanced Visual History</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportHistory}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
              title="Export History (JSON)"
            >
              {exportSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                title="Clear All History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* View Switcher: Enhanced Timeline vs Visual Analytics */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`flex-1 py-1 rounded-md text-center transition-colors flex items-center justify-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Interactive Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('trends')}
            className={`flex-1 py-1 rounded-md text-center transition-colors flex items-center justify-center gap-1.5 ${
              viewMode === 'trends'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Deep Visual Trends</span>
          </button>
        </div>

        {/* Search & Threat Filters (in timeline mode) */}
        {viewMode === 'timeline' && (
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visits, domains, or titles..."
                className="w-full glass-input rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-100"
              />
            </div>

            {/* Threat Filters */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {[
                { id: 'all', label: 'All Visits' },
                { id: 'clean', label: 'Clean Only' },
                { id: 'blocked', label: 'Quarantined' },
                { id: 'insecure', label: 'HTTP Only' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setThreatFilter(f.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors ${
                    threatFilter === f.id
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Active Domain Filter Notice */}
            {selectedDomainFilter && (
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px]">
                <span>Filtering domain: <strong>{selectedDomainFilter}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedDomainFilter(null)}
                  className="text-cyan-400 hover:text-cyan-100 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main View Area */}
      {viewMode === 'timeline' ? (
        /* 1. ENHANCED VISUAL TIMELINE */
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {Object.entries(groupedHistory).some(([_, items]) => items.length > 0) ? (
            Object.entries(groupedHistory).map(([bucket, bucketItems]) => {
              if (bucketItems.length === 0) return null;
              return (
                <div key={bucket} className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-[#030712]/90 backdrop-blur-sm py-1 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{bucket}</span>
                    <span className="text-slate-600 font-normal">({bucketItems.length})</span>
                  </div>

                  <div className="space-y-2">
                    {bucketItems.map((item) => (
                      <div
                        key={item.id}
                        className="group p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all text-xs font-mono space-y-1.5 relative shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Title with navigation link */}
                          <div className="flex-1 min-w-0">
                            <span
                              onClick={() => onNavigate(item.url, false)}
                              className="font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer line-clamp-1 block leading-tight font-sans"
                            >
                              {item.title}
                            </span>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.url}
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSaveToReadLater(item)}
                              className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-200"
                              title="Save to Read Later Queue"
                            >
                              {savedToReadLaterId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <BookOpen className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleBookmarkItem(item)}
                              className="p-1 rounded hover:bg-slate-800 text-amber-400 hover:text-amber-300"
                              title="Toggle Bookmark"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigate(item.url, true)}
                              className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-200"
                              title="Open in new tab"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                              title="Delete from history"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Footer Badges Strip */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => setSelectedDomainFilter(item.domain)}
                              className="hover:text-cyan-300 cursor-pointer underline decoration-dotted"
                              title="Filter only this domain"
                            >
                              {item.domain}
                            </span>
                            <span>·</span>
                            <span>{item.timestamp}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Security Score Badge */}
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold ${
                                (item.securityScore || 85) >= 90
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                  : (item.securityScore || 85) >= 70
                                  ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {item.securityScore || 90} Score
                            </span>

                            {/* Threat Status Badge */}
                            <span
                              className={`px-1.5 py-0.2 rounded ${
                                item.threatStatus === 'blocked'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {item.threatStatus === 'blocked' ? 'Quarantined' : 'Clean'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs font-mono space-y-2">
              <History className="w-8 h-8 mx-auto opacity-30 text-cyan-400" />
              <p>No history visits match your criteria.</p>
            </div>
          )}
        </div>
      ) : (
        /* 2. DEEP VISUAL TRENDS & ANALYTICS */
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin text-xs font-mono">
          {/* KPI Cards Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500">Total Visits</span>
              <div className="text-lg font-bold text-cyan-300 mt-0.5">{totalVisits}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500">Avg Security</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{avgSecurityScore}/100</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500">Clean Ratio</span>
              <div className="text-lg font-bold text-teal-300 mt-0.5">{safePercentage}%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500">TLS 1.3 Strict</span>
              <div className="text-lg font-bold text-amber-300 mt-0.5">{httpsPercentage}%</div>
            </div>
          </div>

          {/* 1. Safe vs Threat Ratio Progress Bar */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Browsing Safety Ratio</span>
              <span className="text-emerald-400 font-bold">{safePercentage}% Clean</span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                style={{ width: `${safePercentage}%` }}
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                title={`Clean: ${cleanVisits}`}
              />
              <div
                style={{ width: `${100 - safePercentage}%` }}
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500"
                title={`Threats Blocked: ${blockedVisits}`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Clean Safe: {cleanVisits}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                Threats Blocked: {blockedVisits}
              </span>
            </div>
          </div>

          {/* 2. Hourly Browsing Activity Intensity Matrix */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Browsing Intensity by Time of Day</span>
              </span>
              <span className="text-[10px] text-slate-500">Distribution</span>
            </div>

            <div className="space-y-2">
              {timeBuckets.map((bucket) => (
                <div key={bucket.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">{bucket.label}</span>
                    <span className="text-cyan-400 font-bold">{bucket.count} visits</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${bucket.pct}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Top Visited Domains Ranking & Security Score */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Top Visited Domains & Integrity Score</span>
              </span>
              <span className="text-[10px] text-slate-500">Click to filter</span>
            </div>

            <div className="space-y-2">
              {domainStats.slice(0, 6).map((item) => {
                const max = domainStats[0]?.count || 1;
                const pct = Math.round((item.count / max) * 100);
                return (
                  <div
                    key={item.domain}
                    onClick={() => {
                      setSelectedDomainFilter(item.domain);
                      setViewMode('timeline');
                    }}
                    className="p-2 rounded-lg bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-850 hover:border-cyan-500/30 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-200 hover:text-cyan-300 font-medium truncate max-w-[170px]">
                        {item.domain}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-mono text-[10px]">
                          {item.avgScore} score
                        </span>
                        <span className="text-cyan-400 font-bold">{item.count} visits</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
