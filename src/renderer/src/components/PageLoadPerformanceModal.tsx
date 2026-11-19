import React, { useState } from 'react';
import { PageLoadMetrics, benchmarkLivePageMetrics } from '../services/performanceMetricsService';
import {
  Activity,
  Zap,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  X,
  Gauge,
  Wifi,
  Lock,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface PageLoadPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: PageLoadMetrics;
  onMetricsUpdate?: (newMetrics: PageLoadMetrics) => void;
}

export const PageLoadPerformanceModal: React.FC<PageLoadPerformanceModalProps> = ({
  isOpen,
  onClose,
  metrics: initialMetrics,
  onMetricsUpdate,
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<PageLoadMetrics>(initialMetrics);
  const [isRemeasuring, setIsRemeasuring] = useState(false);

  // Sync if initialMetrics changes
  React.useEffect(() => {
    setCurrentMetrics(initialMetrics);
  }, [initialMetrics]);

  if (!isOpen) return null;

  const handleRemeasure = async () => {
    setIsRemeasuring(true);
    try {
      const refreshed = await benchmarkLivePageMetrics(
        currentMetrics.url,
        currentMetrics.isCompromisedLatency ? 'blocked' : 'clean'
      );
      setCurrentMetrics(refreshed);
      if (onMetricsUpdate) {
        onMetricsUpdate(refreshed);
      }
    } finally {
      setIsRemeasuring(false);
    }
  };

  const isFast = currentMetrics.rating === 'fast';
  const isCompromised = currentMetrics.isCompromisedLatency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl glass-panel-glow rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isCompromised
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : isFast
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              }`}
            >
              {isCompromised ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <Activity className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                <span>Real-Time Page Load Performance Inspector</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border ${
                    isCompromised
                      ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 animate-pulse'
                      : isFast
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isCompromised ? 'COMPROMISE ALERT' : currentMetrics.rating.toUpperCase()}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-md">
                Host: <span className="text-cyan-300">{currentMetrics.domain}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRemeasure}
              disabled={isRemeasuring}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Re-measure live performance"
            >
              <RefreshCw className={`w-4 h-4 ${isRemeasuring ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {/* Main Key Metrics Hero (TTFB & FCP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* TTFB Card */}
            <div
              className={`p-4 rounded-xl border text-left flex flex-col justify-between ${
                currentMetrics.ttfbMs > 250
                  ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Time to First Byte (TTFB)
                </span>
                <span className="text-[10px] text-slate-500">Threshold: &lt;100ms</span>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold font-mono tracking-tight tabular-nums ${
                    currentMetrics.ttfbMs > 250
                      ? 'text-rose-400'
                      : currentMetrics.ttfbMs > 100
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentMetrics.ttfbMs}
                </span>
                <span className="text-xs text-slate-400 font-mono">ms</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Measures network responsiveness and time taken by the server to return the first byte of response data.
              </p>
            </div>

            {/* FCP Card */}
            <div
              className={`p-4 rounded-xl border text-left flex flex-col justify-between ${
                currentMetrics.fcpMs > 800
                  ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                <span className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Gauge className="w-4 h-4 text-teal-400" />
                  First Contentful Paint (FCP)
                </span>
                <span className="text-[10px] text-slate-500">Threshold: &lt;300ms</span>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold font-mono tracking-tight tabular-nums ${
                    currentMetrics.fcpMs > 800
                      ? 'text-rose-400'
                      : currentMetrics.fcpMs > 350
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {currentMetrics.fcpMs}
                </span>
                <span className="text-xs text-slate-400 font-mono">ms</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Measures when the browser renders the first piece of DOM content (text, image, SVG) to verify rendering speed.
              </p>
            </div>
          </div>

          {/* Security & Compromise Assessment Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isCompromised
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : isFast
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            {isCompromised ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : isFast ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm">{currentMetrics.statusHeadline}</div>
              <p className="text-slate-300 leading-relaxed">
                {currentMetrics.threatAssessment}
              </p>
              {currentMetrics.anomalyIndicators.length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 pt-1 text-[11px] text-slate-400">
                  {currentMetrics.anomalyIndicators.map((ind, idx) => (
                    <li key={idx}>{ind}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Navigation Lifecycle Waterfall */}
          <div className="space-y-2.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
              <span>Network & Navigation Waterfall</span>
              <span className="text-[11px] text-slate-500">Total: {currentMetrics.totalLoadMs}ms</span>
            </h4>

            {/* Stages Breakdown Bars */}
            <div className="space-y-2 text-xs font-mono">
              {/* DNS Lookup */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-cyan-400" /> DNS Lookup (DoH)
                  </span>
                  <span className="text-cyan-300">{currentMetrics.dnsLookupMs}ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, Math.min(100, (currentMetrics.dnsLookupMs / currentMetrics.totalLoadMs) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* TLS Handshake */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> TLS Handshake (TLS 1.3)
                  </span>
                  <span className="text-emerald-300">{currentMetrics.tlsHandshakeMs}ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(8, Math.min(100, (currentMetrics.tlsHandshakeMs / currentMetrics.totalLoadMs) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* TTFB */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Time to First Byte (TTFB)
                  </span>
                  <span className={currentMetrics.ttfbMs > 250 ? 'text-rose-400 font-bold' : 'text-amber-300'}>
                    {currentMetrics.ttfbMs}ms
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentMetrics.ttfbMs > 250 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${Math.max(12, Math.min(100, (currentMetrics.ttfbMs / currentMetrics.totalLoadMs) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* FCP */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-teal-400" /> First Contentful Paint (FCP)
                  </span>
                  <span className={currentMetrics.fcpMs > 800 ? 'text-rose-400 font-bold' : 'text-teal-300'}>
                    {currentMetrics.fcpMs}ms
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentMetrics.fcpMs > 800 ? 'bg-rose-500' : 'bg-teal-500'
                    }`}
                    style={{
                      width: `${Math.max(25, Math.min(100, (currentMetrics.fcpMs / currentMetrics.totalLoadMs) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* DOM Content Loaded */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" /> DOM Content Loaded
                  </span>
                  <span className="text-indigo-300">{currentMetrics.domLoadMs}ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(40, Math.min(100, (currentMetrics.domLoadMs / currentMetrics.totalLoadMs) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between text-xs font-mono">
          <button
            type="button"
            onClick={handleRemeasure}
            disabled={isRemeasuring}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRemeasuring ? 'animate-spin' : ''}`} />
            <span>{isRemeasuring ? 'Benchmarking...' : 'Re-test Latency'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
