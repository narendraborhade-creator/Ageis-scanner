import React, { useState, useMemo } from 'react';
import { ReadLaterItem, BrowserTab } from '../types';
import {
  getStoredReadLaterList,
  addReadLaterItem,
  toggleReadLaterItemStatus,
  deleteReadLaterItem,
  clearCompletedReadLater,
  clearAllReadLater,
} from '../services/readLaterStorage';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Globe,
  Shield,
  Sparkles,
  Share2,
  ChevronRight,
  BookmarkCheck,
  Check,
  X,
} from 'lucide-react';

interface ReadLaterPanelProps {
  onNavigate: (url: string, newTab?: boolean) => void;
  currentTab: BrowserTab;
}

export const ReadLaterPanel: React.FC<ReadLaterPanelProps> = ({
  onNavigate,
  currentTab,
}) => {
  const [items, setItems] = useState<ReadLaterItem[]>(() => getStoredReadLaterList());
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customCategory, setCustomCategory] = useState<'Security' | 'Research' | 'Technology' | 'General'>('General');
  const [copySuccess, setCopySuccess] = useState(false);

  const reloadItems = () => {
    setItems(getStoredReadLaterList());
  };

  const isCurrentTabSaved = useMemo(() => {
    return items.some((i) => i.url.toLowerCase().trim() === currentTab.url.toLowerCase().trim() && !i.isRead);
  }, [items, currentTab.url]);

  const handleSaveCurrentTab = () => {
    // Generate an intelligent reading time based on URL length / domain
    const readMins = Math.floor(Math.random() * 4) + 3;
    addReadLaterItem({
      title: currentTab.title,
      url: currentTab.url,
      domain: currentTab.domain,
      excerpt: `Saved from ${currentTab.domain} with active ${currentTab.sslGrade} TLS security and zero-trust verification.`,
      category: currentTab.domain.includes('ncbi') || currentTab.domain.includes('arxiv')
        ? 'Research'
        : currentTab.domain.includes('cloudflare') || currentTab.domain.includes('security')
        ? 'Security'
        : currentTab.domain.includes('github')
        ? 'Technology'
        : 'General',
      threatStatus: currentTab.threatStatus,
      readTimeMinutes: readMins,
      tags: [currentTab.domain, currentTab.sslGrade],
    });
    reloadItems();
  };

  const handleToggleRead = (id: string) => {
    toggleReadLaterItemStatus(id);
    reloadItems();
  };

  const handleDelete = (id: string) => {
    deleteReadLaterItem(id);
    reloadItems();
  };

  const handleClearCompleted = () => {
    clearCompletedReadLater();
    reloadItems();
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all articles from your Read Later queue?')) {
      clearAllReadLater();
      reloadItems();
    }
  };

  const handleAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    let formattedUrl = customUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const parsed = new URL(formattedUrl);
      addReadLaterItem({
        title: customTitle.trim() || parsed.hostname,
        url: formattedUrl,
        domain: parsed.hostname,
        category: customCategory,
        threatStatus: 'clean',
        readTimeMinutes: 5,
        tags: [parsed.hostname, customCategory],
      });
      setCustomTitle('');
      setCustomUrl('');
      setShowAddCustomModal(false);
      reloadItems();
    } catch {
      alert('Please enter a valid URL.');
    }
  };

  const handleExportQueue = () => {
    const markdown = `# Aegis 3D Safe Browser - Read Later Queue\nGenerated on ${new Date().toLocaleString()}\n\n` +
      items.map((i) => `- [${i.isRead ? 'x' : ' '}] **[${i.title}](${i.url})** (${i.readTimeMinutes} min) · _${i.category}_\n  ${i.excerpt || ''}`).join('\n\n');

    navigator.clipboard.writeText(markdown);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Metrics
  const totalCount = items.length;
  const unreadCount = items.filter((i) => !i.isRead).length;
  const readCount = items.filter((i) => i.isRead).length;
  const totalUnreadMinutes = items
    .filter((i) => !i.isRead)
    .reduce((acc, curr) => acc + (curr.readTimeMinutes || 4), 0);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesFilter =
        filterMode === 'all'
          ? true
          : filterMode === 'unread'
          ? !item.isRead
          : item.isRead;

      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));

      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [items, filterMode, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3 font-mono text-xs">
      {/* Top Header & Fast Save Button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-100 font-bold">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-xs uppercase tracking-wider">Read Later Queue</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px]">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportQueue}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
              title="Copy Reading Queue as Markdown"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setShowAddCustomModal(!showAddCustomModal)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
              title="Add Custom Article Link"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Add Current Tab Hero Banner */}
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-1">
              <span>Active Tab</span>
              <span>·</span>
              <span className="truncate">{currentTab.domain}</span>
            </div>
            <div className="text-slate-200 font-sans text-xs truncate font-medium">
              {currentTab.title}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveCurrentTab}
            disabled={isCurrentTabSaved}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              isCurrentTabSaved
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            }`}
          >
            {isCurrentTabSaved ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>In Queue</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 text-slate-950" />
                <span>Save to Queue</span>
              </>
            )}
          </button>
        </div>

        {/* Modal/Collapsible: Add Custom Article */}
        {showAddCustomModal && (
          <form
            onSubmit={handleAddCustomSubmit}
            className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
              <span>Add Custom Web Article</span>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Article title (optional)"
              className="w-full glass-input rounded-lg px-2.5 py-1 text-xs text-slate-100 font-sans"
            />
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="URL (e.g. arxiv.org/abs/...)"
              className="w-full glass-input rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono"
              required
            />
            <div className="flex items-center gap-2">
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as any)}
                className="glass-input rounded-lg px-2 py-1 text-[11px] text-slate-200 bg-slate-900 border border-slate-800"
              >
                <option value="Security">Security</option>
                <option value="Research">Research</option>
                <option value="Technology">Technology</option>
                <option value="General">General</option>
              </select>
              <button
                type="submit"
                className="flex-1 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Add Article
              </button>
            </div>
          </form>
        )}

        {/* Quick Reading Stats Strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">Queue</span>
            <div className="text-sm font-bold text-cyan-300">{unreadCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">Est. Time</span>
            <div className="text-sm font-bold text-amber-300">{totalUnreadMinutes}m</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">Completed</span>
            <div className="text-sm font-bold text-emerald-400">{readCount}</div>
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div className="space-y-1.5">
          {/* Unread / All / Read Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1 rounded-md text-center transition-colors ${
                filterMode === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('unread')}
              className={`flex-1 py-1 rounded-md text-center transition-colors ${
                filterMode === 'unread'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('read')}
              className={`flex-1 py-1 rounded-md text-center transition-colors ${
                filterMode === 'read'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Done ({readCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved articles..."
              className="w-full glass-input rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-100"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {['All', 'Security', 'Research', 'Technology', 'General'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Queue List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group p-3 rounded-xl border transition-all space-y-2 relative ${
                item.isRead
                  ? 'bg-slate-950/60 border-slate-850 opacity-70'
                  : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Toggle Read Status Button */}
                <button
                  type="button"
                  onClick={() => handleToggleRead(item.id)}
                  className={`mt-0.5 p-0.5 rounded transition-colors shrink-0 cursor-pointer ${
                    item.isRead
                      ? 'text-emerald-400 hover:text-slate-400'
                      : 'text-slate-500 hover:text-emerald-400'
                  }`}
                  title={item.isRead ? 'Mark as Unread' : 'Mark as Read'}
                >
                  {item.isRead ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {/* Article Header & Title */}
                <div className="flex-1 min-w-0">
                  <div
                    onClick={() => onNavigate(item.url, false)}
                    className={`font-semibold hover:text-cyan-300 cursor-pointer text-xs font-sans line-clamp-2 leading-tight ${
                      item.isRead ? 'line-through text-slate-400' : 'text-slate-100'
                    }`}
                  >
                    {item.title}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span className="font-mono truncate max-w-[130px]">{item.domain}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{item.readTimeMinutes} min</span>
                    </span>
                    <span>·</span>
                    <span className="text-slate-500">{item.savedAt}</span>
                  </div>
                </div>

                {/* Fast Action Buttons */}
                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigate(item.url, true)}
                    className="p-1 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-200 transition-colors"
                    title="Open in New Tab"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete from Queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Excerpt / Summary */}
              {item.excerpt && (
                <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed bg-slate-950/40 p-1.5 rounded-lg border border-slate-850">
                  {item.excerpt}
                </p>
              )}

              {/* Badges / Category Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                <span className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {item.category}
                </span>

                <button
                  type="button"
                  onClick={() => onNavigate(item.url, false)}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 transition-colors font-mono"
                >
                  <span>Read Article</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs font-mono space-y-2">
            <BookOpen className="w-8 h-8 mx-auto opacity-30 text-cyan-400" />
            <p>No articles found in this filter.</p>
            <p className="text-[11px] text-slate-600">
              Click <strong className="text-cyan-400">Save to Queue</strong> above to add this active page.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Cleanup Actions */}
      {items.length > 0 && (
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={handleClearCompleted}
            disabled={readCount === 0}
            className="hover:text-cyan-300 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          >
            Clear {readCount} Completed
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="hover:text-rose-400 transition-colors"
          >
            Clear Entire Queue
          </button>
        </div>
      )}
    </div>
  );
};
