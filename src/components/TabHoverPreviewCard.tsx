import React from 'react';
import { BrowserTab, TabGroupColor } from '../types';
import { TabSnapshotThumbnail } from './TabSnapshotThumbnail';
import {
  Lock,
  Globe,
  Shield,
  ShieldAlert,
  Moon,
  Sun,
  X,
  Pin,
  PinOff,
  CopyPlus,
  ExternalLink,
  Cpu,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface TabHoverPreviewCardProps {
  tab: BrowserTab;
  isActive: boolean;
  position: { left: number; top: number; width?: number };
  onSelectTab: (tabId: string) => void;
  onCloseTab: (e: React.MouseEvent, tabId: string) => void;
  onToggleSuspend?: (tabId: string) => void;
  onTogglePin?: (tabId: string) => void;
  onDuplicate?: (tab: BrowserTab) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const TabHoverPreviewCard: React.FC<TabHoverPreviewCardProps> = ({
  tab,
  isActive,
  position,
  onSelectTab,
  onCloseTab,
  onToggleSuspend,
  onTogglePin,
  onDuplicate,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Clamping left position to prevent overflowing viewport (320px width card)
  const cardWidth = 320;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  // Center roughly beneath the tab, but keep within viewport bounds (minimum 12px margin)
  let calculatedLeft = position.left + (position.width ? position.width / 2 : 70) - cardWidth / 2;
  if (calculatedLeft < 12) calculatedLeft = 12;
  if (calculatedLeft + cardWidth > viewportWidth - 12) {
    calculatedLeft = Math.max(12, viewportWidth - cardWidth - 12);
  }

  const memory = tab.memoryMb ? `${Math.round(tab.memoryMb)} MB` : '48 MB';
  const cpu = tab.cpuPercent ? `${tab.cpuPercent.toFixed(1)}%` : '2.4%';
  const ttfb = tab.pageMetrics?.ttfbMs ? `${Math.round(tab.pageMetrics.ttfbMs)}ms` : '24ms';

  return (
    <div
      style={{
        position: 'fixed',
        left: `${calculatedLeft}px`,
        top: `${position.top + 6}px`,
        width: `${cardWidth}px`,
      }}
      className="z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-150 select-none"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Outer Card with Glassmorphic Container & Cyan Glow */}
      <div className="relative rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.2)] text-slate-100 font-sans space-y-3">
        {/* Top Header Row: Favicon, Title, Close Button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center shrink-0">
              {tab.isSuspended ? (
                <Moon className="w-3.5 h-3.5 text-amber-400" />
              ) : tab.isQuarantined ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : tab.isHttps ? (
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4
                  className="text-xs font-bold text-slate-100 truncate font-mono"
                  title={tab.title}
                >
                  {tab.title}
                </h4>
                {isActive && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 shrink-0">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {tab.domain}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(tab.id)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  tab.isPinned
                    ? 'text-amber-400 bg-amber-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={tab.isPinned ? 'Unpin tab' : 'Pin tab'}
              >
                {tab.isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => onCloseTab(e, tab.id)}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close tab"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Snapshot Thumbnail Rendering */}
        <div
          onClick={() => onSelectTab(tab.id)}
          className="cursor-pointer group relative transition-transform hover:scale-[1.01]"
        >
          <TabSnapshotThumbnail tab={tab} />

          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-cyan-950/0 group-hover:bg-cyan-950/20 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-[10px] flex items-center gap-1 shadow-lg">
              <span>Switch to this tab</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Tab Group Chip if assigned */}
        {tab.groupTitle && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">Tab Group:</span>
            <span
              className={`font-semibold ${
                tab.groupColor === 'purple'
                  ? 'text-purple-300'
                  : tab.groupColor === 'emerald'
                  ? 'text-emerald-300'
                  : tab.groupColor === 'amber'
                  ? 'text-amber-300'
                  : tab.groupColor === 'rose'
                  ? 'text-rose-300'
                  : tab.groupColor === 'blue'
                  ? 'text-blue-300'
                  : 'text-cyan-300'
              }`}
            >
              {tab.groupTitle}
            </span>
          </div>
        )}

        {/* Live Performance & Security Stats */}
        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
          <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400">
              <Zap className="w-2.5 h-2.5 text-cyan-400" />
              <span>RAM</span>
            </div>
            <div className="text-[11px] font-bold text-slate-200">{memory}</div>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400">
              <Cpu className="w-2.5 h-2.5 text-teal-400" />
              <span>CPU</span>
            </div>
            <div className="text-[11px] font-bold text-slate-200">{cpu}</div>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400">
              <Activity className="w-2.5 h-2.5 text-emerald-400" />
              <span>TTFB</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-400">{ttfb}</div>
          </div>
        </div>

        {/* Quick Action Footer Buttons */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Switch to Tab</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {onToggleSuspend && (
            <button
              type="button"
              onClick={() => onToggleSuspend(tab.id)}
              className={`p-1.5 rounded-lg border text-[11px] font-mono transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                tab.isSuspended
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title={tab.isSuspended ? 'Wake tab to full memory' : 'Suspend tab to save RAM'}
            >
              {tab.isSuspended ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Wake</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Sleep</span>
                </>
              )}
            </button>
          )}

          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(tab)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 text-[11px] font-mono transition-colors cursor-pointer"
              title="Duplicate this tab"
            >
              <CopyPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
