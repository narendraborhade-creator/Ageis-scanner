import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Moon,
  Sun,
  X,
  Trash2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Lock,
  Globe,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  HardDrive,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BrowserTab } from '../types';
import { TabSnapshotThumbnail } from './TabSnapshotThumbnail';
import {
  computeTabResourceMetrics,
  computeSystemResourceSummary,
  suspendTab,
  wakeTab,
  optimizeAllBackgroundTabs,
} from '../services/resourceMonitorService';

interface ResourceMonitorSidebarProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onUpdateTabs: (updatedTabs: BrowserTab[]) => void;
  onCloseSidebar: () => void;
}

export const ResourceMonitorSidebar: React.FC<ResourceMonitorSidebarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onUpdateTabs,
  onCloseSidebar,
}) => {
  const [tick, setTick] = useState(0);
  const [sortBy, setSortBy] = useState<'memory' | 'cpu' | 'default'>('memory');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [expandedThumbnailTabId, setExpandedThumbnailTabId] = useState<string | null>(null);

  // Live telemetry pulse every 1.8 seconds to simulate real-time kernel tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const summary = computeSystemResourceSummary(tabs, activeTabId, tick);

  // Compute live metrics for all tabs
  const tabMetricsList = tabs.map((t) => ({
    tab: t,
    isActive: t.id === activeTabId,
    metrics: computeTabResourceMetrics(t, t.id === activeTabId, tick),
  }));

  // Sorting
  const sortedTabMetrics = [...tabMetricsList].sort((a, b) => {
    if (sortBy === 'memory') {
      return b.metrics.memoryMb - a.metrics.memoryMb;
    }
    if (sortBy === 'cpu') {
      return b.metrics.cpuPercent - a.metrics.cpuPercent;
    }
    return 0;
  });

  const handleToggleSuspend = (tabId: string, currentlySuspended: boolean) => {
    if (currentlySuspended) {
      const updated = wakeTab(tabs, tabId);
      onUpdateTabs(updated);
      showToast('Tab awakened: resources re-allocated');
    } else {
      if (tabId === activeTabId) {
        showToast('Active tab cannot be hibernated while in viewport');
        return;
      }
      const updated = suspendTab(tabs, tabId);
      onUpdateTabs(updated);
      showToast('Tab suspended: freed ~55 MB memory & reduced CPU to 0.1%');
    }
  };

  const handleOptimizeAll = () => {
    const { updatedTabs, savedMb, suspendedCount } = optimizeAllBackgroundTabs(tabs, activeTabId);
    if (suspendedCount === 0) {
      showToast('All background tabs are already hibernated or optimized');
      return;
    }
    onUpdateTabs(updatedTabs);
    showToast(`Memory Saved! Hibernated ${suspendedCount} inactive tabs, freed ~${savedMb} MB`);
  };

  const handlePurgeCache = () => {
    showToast('Virtual Memory Garbage Collector ran: reclaimed 38.4 MB cached memory');
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/95 text-slate-100 font-sans border-l border-slate-800">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="mx-3 mt-2 p-2.5 rounded-lg bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs font-mono shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-in fade-in flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="flex-1">{feedbackToast}</span>
        </div>
      )}

      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 font-mono tracking-tight">Resource Monitor</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Per-tab CPU, Memory & Sleep management</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* System Resources Overview Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {/* Total CPU */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                Total CPU
              </span>
              <span
                className={`font-bold ${
                  summary.totalCpuPercent > 20
                    ? 'text-rose-400'
                    : summary.totalCpuPercent > 10
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {summary.totalCpuPercent}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  summary.totalCpuPercent > 20
                    ? 'bg-rose-500'
                    : summary.totalCpuPercent > 10
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, summary.totalCpuPercent * 2.5)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500">
              {summary.activeTabsCount} active, {summary.suspendedTabsCount} sleeping
            </div>
          </div>

          {/* Total RAM */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-purple-400" />
                Tab Memory
              </span>
              <span
                className={`font-bold ${
                  summary.totalMemoryMb > 400
                    ? 'text-rose-400'
                    : summary.totalMemoryMb > 250
                    ? 'text-amber-400'
                    : 'text-purple-300'
                }`}
              >
                {summary.totalMemoryMb} MB
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (summary.totalMemoryMb / 600) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-emerald-400">
              ~{summary.estimatedMemorySavedMb} MB saved via sleep
            </div>
          </div>
        </div>

        {/* Global Performance Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOptimizeAll}
            className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-mono bg-gradient-to-r from-cyan-500/20 to-rose-500/20 hover:from-cyan-500/30 hover:to-rose-500/30 border border-rose-500/30 text-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.15)] group"
            title="Hibernate all inactive background tabs to save system memory"
          >
            <Moon className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span>Hibernate Idle Tabs</span>
          </button>

          <button
            type="button"
            onClick={handlePurgeCache}
            className="py-1.5 px-2 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
            title="Run Virtual Garbage Collector"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sorting Controls & Tab Count */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono text-[11px] text-slate-300">
          Open Tabs ({tabs.length})
        </span>

        <div className="flex items-center gap-1 font-mono text-[10px]">
          <span className="text-slate-500 mr-0.5">Sort:</span>
          <button
            type="button"
            onClick={() => setSortBy('memory')}
            className={`px-1.5 py-0.5 rounded cursor-pointer ${
              sortBy === 'memory'
                ? 'bg-purple-950 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RAM
          </button>
          <button
            type="button"
            onClick={() => setSortBy('cpu')}
            className={`px-1.5 py-0.5 rounded cursor-pointer ${
              sortBy === 'cpu'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CPU
          </button>
          <button
            type="button"
            onClick={() => setSortBy('default')}
            className={`px-1.5 py-0.5 rounded cursor-pointer ${
              sortBy === 'default'
                ? 'bg-slate-800 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Order
          </button>
        </div>
      </div>

      {/* Per-Tab Resource List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sortedTabMetrics.map(({ tab, isActive, metrics }) => {
          const isSuspended = tab.isSuspended;

          return (
            <div
              key={tab.id}
              className={`p-3 rounded-xl border transition-all ${
                isActive
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                  : isSuspended
                  ? 'bg-slate-900/30 border-slate-850 opacity-80'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Tab Header Row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  onClick={() => onSelectTab(tab.id)}
                  className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                >
                  {isSuspended ? (
                    <div className="p-1 rounded bg-slate-800 text-slate-400">
                      <Moon className="w-3.5 h-3.5" />
                    </div>
                  ) : tab.isQuarantined ? (
                    <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                  ) : tab.isHttps ? (
                    <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="p-1 rounded bg-slate-800 text-slate-400">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-100 truncate block">
                        {tab.title}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0">
                          ACTIVE
                        </span>
                      )}
                      {isSuspended && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                          SLEEPING
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate block">
                      {tab.domain}
                    </span>
                  </div>
                </div>

                {/* Group Badge (if grouped) */}
                {tab.groupTitle && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-cyan-500/30 truncate max-w-[90px]">
                    {tab.groupTitle}
                  </span>
                )}
              </div>

              {/* Resource Metrics Gauges */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-850 font-mono text-[11px] mb-2">
                {/* CPU gauge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>CPU</span>
                    <span
                      className={`font-bold tabular-nums ${
                        metrics.cpuPercent > 8
                          ? 'text-rose-400'
                          : metrics.cpuPercent > 3
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {metrics.cpuPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        metrics.cpuPercent > 8
                          ? 'bg-rose-500'
                          : metrics.cpuPercent > 3
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, metrics.cpuPercent * 8)}%` }}
                    />
                  </div>
                </div>

                {/* RAM gauge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>RAM</span>
                    <span
                      className={`font-bold tabular-nums ${
                        metrics.memoryMb > 120
                          ? 'text-rose-400'
                          : metrics.memoryMb > 70
                          ? 'text-purple-300'
                          : 'text-cyan-300'
                      }`}
                    >
                      {metrics.memoryMb} MB
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (metrics.memoryMb / 160) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-telemetry: Threads, Network, Energy Impact */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1 mb-2.5">
                <div className="flex items-center gap-2">
                  <span>{metrics.threads} threads</span>
                  <span>•</span>
                  <span>{metrics.networkKbps} KB/s</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Impact:</span>
                  <span
                    className={
                      metrics.energyImpact === 'High'
                        ? 'text-rose-400 font-bold'
                        : metrics.energyImpact === 'Moderate'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }
                  >
                    {metrics.energyImpact}
                  </span>
                </div>
              </div>

              {/* Snapshot Thumbnail Preview if expanded */}
              {expandedThumbnailTabId === tab.id && (
                <div className="my-2 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
                  <TabSnapshotThumbnail tab={tab} showChromeBar={false} className="!h-24" />
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-850">
                {/* Snapshot preview toggle button */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedThumbnailTabId((prev) => (prev === tab.id ? null : tab.id))
                  }
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                    expandedThumbnailTabId === tab.id
                      ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-750'
                  }`}
                  title={
                    expandedThumbnailTabId === tab.id
                      ? 'Hide tab snapshot thumbnail'
                      : 'Preview tab snapshot thumbnail'
                  }
                >
                  {expandedThumbnailTabId === tab.id ? (
                    <EyeOff className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                  <span>Snapshot</span>
                </button>

                {/* Switch to Tab */}
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className="px-2 py-1 rounded text-[11px] font-mono bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    Switch
                  </button>
                )}

                {/* Sleep / Wake toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleSuspend(tab.id, Boolean(isSuspended))}
                  disabled={isActive}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                    isActive
                      ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-500'
                      : isSuspended
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/80'
                      : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300 hover:text-amber-300'
                  }`}
                  title={
                    isActive
                      ? 'Active viewport tab cannot be slept'
                      : isSuspended
                      ? 'Wake tab and restore resources'
                      : 'Hibernate tab to save CPU & RAM'
                  }
                >
                  {isSuspended ? (
                    <>
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>Wake</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3 text-slate-400" />
                      <span>Sleep</span>
                    </>
                  )}
                </button>

                {/* Terminate / Close Tab */}
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onCloseTab(tab.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                    title="Terminate tab process"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Tip */}
      <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-400" />
          Aegis Memory Saver Active
        </span>
        <span className="text-emerald-400">Kernel: Clean</span>
      </div>
    </div>
  );
};
