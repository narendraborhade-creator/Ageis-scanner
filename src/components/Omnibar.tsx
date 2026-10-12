import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Search,
  ArrowRight,
  Activity,
  Plus,
  ExternalLink,
  Zap,
  Gauge,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { PageLoadMetrics, calculatePageLoadMetrics } from '../services/performanceMetricsService';
import { PageLoadPerformanceModal } from './PageLoadPerformanceModal';

interface OmnibarProps {
  currentUrl: string;
  onNavigate: (url: string, inNewTab?: boolean, openExternal?: boolean) => void;
  onScanDns: (domain: string) => void;
  onNewTab?: () => void;
  latencyMs?: number;
  isHttps?: boolean;
  threatStatus?: 'clean' | 'warning' | 'blocked';
  metrics?: PageLoadMetrics;
  onInspectPerf?: () => void;
  onMetricsUpdate?: (newMetrics: PageLoadMetrics) => void;
}

export const Omnibar: React.FC<OmnibarProps> = ({
  currentUrl,
  onNavigate,
  onScanDns,
  onNewTab,
  latencyMs = 28,
  isHttps = true,
  threatStatus = 'clean',
  metrics: externalMetrics,
  onInspectPerf,
  onMetricsUpdate,
}) => {
  const [inputVal, setInputVal] = useState(currentUrl);
  const [openSeparatePage, setOpenSeparatePage] = useState(true);
  const [perfModalOpen, setPerfModalOpen] = useState(false);

  // Derive or use provided metrics
  const activeMetrics: PageLoadMetrics =
    externalMetrics || calculatePageLoadMetrics(currentUrl, threatStatus, latencyMs);

  useEffect(() => {
    setInputVal(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onNavigate(inputVal.trim(), false, openSeparatePage);
  };

  const handleOpenInNewTab = () => {
    if (!inputVal.trim()) return;
    onNavigate(inputVal.trim(), true, openSeparatePage);
  };

  const handleQuickDns = () => {
    if (!inputVal.trim()) return;
    onScanDns(inputVal.trim());
  };

  const handleOpenPerfInspector = () => {
    if (onInspectPerf) {
      onInspectPerf();
    } else {
      setPerfModalOpen(true);
    }
  };

  const isFast = activeMetrics.rating === 'fast';
  const isCompromised = activeMetrics.isCompromisedLatency;

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Glass Omnibar Input Container */}
        <div className="relative flex-1 flex items-center glass-panel-glow rounded-xl px-3 py-2 text-sm">
          {/* Protocol & Security Badge */}
          <div className="flex items-center gap-1.5 pr-2.5 mr-2 border-r border-slate-700/80 text-xs font-mono shrink-0">
            {isHttps ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">HTTPS</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400">
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">INSECURE</span>
              </span>
            )}

            {/* Status indicator */}
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                threatStatus === 'blocked'
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : threatStatus === 'warning'
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                  : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
              }`}
            />
          </div>

          <Search className="w-4 h-4 text-cyan-400/70 mr-2 shrink-0" />

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search safely or enter URL (e.g., github.com, cloudflare.com, nih.gov)..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none font-mono text-xs sm:text-sm min-w-0"
          />

          {/* Real-Time Page Load Performance Omnibar Widget (TTFB & FCP) */}
          <button
            type="button"
            onClick={handleOpenPerfInspector}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-mono transition-all ml-2 shrink-0 cursor-pointer ${
              isCompromised
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900/60 shadow-[0_0_10px_rgba(244,63,94,0.25)]'
                : isFast
                ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-400'
                : 'bg-slate-900/90 border-amber-500/30 text-amber-300 hover:bg-amber-950/40'
            }`}
            title="Click to inspect real-time TTFB, FCP and detect compromised/slow websites"
          >
            <Zap className={`w-3 h-3 ${isCompromised ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className="hidden xl:inline text-slate-400">TTFB</span>
            <span className="font-bold tabular-nums">{activeMetrics.ttfbMs}ms</span>
            <span className="text-slate-600 hidden xs:inline">|</span>
            <span className="hidden xl:inline text-slate-400">FCP</span>
            <span className="font-bold tabular-nums hidden xs:inline text-cyan-300">{activeMetrics.fcpMs}ms</span>
            {isCompromised && (
              <span className="bg-rose-900 text-rose-200 text-[9px] px-1 rounded uppercase font-bold border border-rose-500/60 hidden sm:inline">
                Risk
              </span>
            )}
          </button>

          {/* DNS Latency Telemetry */}
          <div className="hidden 2xl:flex items-center gap-1.5 pl-2.5 ml-2 border-l border-slate-700/80 text-[11px] font-mono text-slate-400 whitespace-nowrap">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="tabular-nums text-cyan-300">{latencyMs}ms DoH</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all whitespace-nowrap cursor-pointer"
            title="Navigate in current tab"
          >
            <span>Navigate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-medium text-xs rounded-xl transition-all whitespace-nowrap cursor-pointer hover:bg-slate-850"
            title="Open in a New Browser Tab"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New Tab</span>
          </button>

          <button
            type="button"
            onClick={handleQuickDns}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs rounded-xl transition-all whitespace-nowrap cursor-pointer"
            title="Audit DNS Records"
          >
            <span>DNS</span>
          </button>
        </div>
      </form>

      {/* Helper Bar: Open separate page option + Performance summary + Quick Destinations */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-0.5">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-cyan-300 font-mono hover:text-cyan-200 select-none">
            <input
              type="checkbox"
              checked={openSeparatePage}
              onChange={(e) => setOpenSeparatePage(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/50 w-3.5 h-3.5"
            />
            <ExternalLink className="w-3 h-3 text-cyan-400 inline" />
            <span>Also open in separate page / window (Chrome Tab)</span>
          </label>

          {/* Real-Time Performance summary chip */}
          <button
            type="button"
            onClick={handleOpenPerfInspector}
            className={`hidden md:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              isCompromised
                ? 'bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/50'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-cyan-300 hover:border-cyan-500/30'
            }`}
          >
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>
              Real-Time Perf:{' '}
              <strong className={isCompromised ? 'text-rose-400' : 'text-emerald-300'}>
                TTFB {activeMetrics.ttfbMs}ms
              </strong>{' '}
              ·{' '}
              <strong className="text-cyan-300">
                FCP {activeMetrics.fcpMs}ms
              </strong>
            </span>
          </button>
        </div>

        {/* Quick Destinations */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[11px] text-slate-500 whitespace-nowrap">Quick Try:</span>
          {[
            { label: 'GitHub', url: 'https://github.com' },
            { label: 'Cloudflare', url: 'https://cloudflare.com' },
            { label: 'NIH / PubMed', url: 'https://ncbi.nlm.nih.gov' },
            { label: 'Wikipedia', url: 'https://wikipedia.org' },
            { label: 'Phishing Test', url: 'http://paypal-security-login-verification.xyz/account/signin' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setInputVal(item.url);
                onNavigate(item.url, true, openSeparatePage);
              }}
              className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[11px] transition-colors whitespace-nowrap cursor-pointer"
            >
              +{item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Page Load Performance Inspector Modal */}
      <PageLoadPerformanceModal
        isOpen={perfModalOpen}
        onClose={() => setPerfModalOpen(false)}
        metrics={activeMetrics}
        onMetricsUpdate={(newM) => {
          if (onMetricsUpdate) {
            onMetricsUpdate(newM);
          }
        }}
      />
    </div>
  );
};
