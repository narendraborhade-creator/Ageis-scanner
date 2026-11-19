import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Zap,
  Flame,
  Radio,
  Sparkles,
  Download,
  RotateCcw,
  Play,
  Pause,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  ChevronRight,
  Terminal,
  Cpu,
  Mail,
  User,
} from 'lucide-react';
import {
  AttackVectorTelemetry,
  RealtimeTrendPoint,
  LiveAttackEvent,
} from '../types';
import {
  getStoredTrends,
  getStoredAttackVectors,
  getStoredLiveEvents,
  recordAttackEvent,
  resetAnalyticsTelemetry,
  SIMULATION_PRESETS,
  EVENT_ANALYTICS_UPDATE,
  AttackSimulationPreset,
} from '../services/securityAnalyticsService';
import { fetchAiSecuritySummary } from '../services/threatHeatmapService';
import { D3RealtimeTrendChart } from './D3RealtimeTrendChart';
import { D3AttackVectorDonut } from './D3AttackVectorDonut';
import { D3SeverityVelocityChart } from './D3SeverityVelocityChart';

interface SecurityAnalyticsViewProps {
  onNavigateToBrowserUrl?: (url: string) => void;
  onOpenCommandPalette?: () => void;
}

export const SecurityAnalyticsView: React.FC<SecurityAnalyticsViewProps> = ({
  onNavigateToBrowserUrl,
  onOpenCommandPalette,
}) => {
  // Telemetry state
  const [trends, setTrends] = useState<RealtimeTrendPoint[]>(() => getStoredTrends());
  const [vectors, setVectors] = useState<AttackVectorTelemetry[]>(() => getStoredAttackVectors());
  const [events, setEvents] = useState<LiveAttackEvent[]>(() => getStoredLiveEvents());

  // Interactive controls
  const [selectedVector, setSelectedVector] = useState<AttackVectorTelemetry | null>(null);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [eventSearch, setEventSearch] = useState<string>('');
  const [actionToast, setActionToast] = useState<string | null>(null);

  // AI Security Synthesis state
  const [aiReport, setAiReport] = useState<{
    headline: string;
    threatLevel: string;
    primaryVector: string;
    insights: string[];
    recommendations: string[];
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Sync state on custom event
  useEffect(() => {
    const handleUpdate = () => {
      setTrends(getStoredTrends());
      setVectors(getStoredAttackVectors());
      setEvents(getStoredLiveEvents());
    };
    window.addEventListener(EVENT_ANALYTICS_UPDATE, handleUpdate);
    return () => window.removeEventListener(EVENT_ANALYTICS_UPDATE, handleUpdate);
  }, []);

  // Live real-time simulation interval (when active, ticks every 7 seconds)
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const timer = setInterval(() => {
      // Pick random simulation preset
      const randomPreset = SIMULATION_PRESETS[Math.floor(Math.random() * SIMULATION_PRESETS.length)];
      recordAttackEvent({
        vector: randomPreset.vector,
        severity: randomPreset.severity,
        domain: randomPreset.domain,
        payloadSnippet: randomPreset.payload,
        mitigation: randomPreset.mitigation,
        heuristicRule: randomPreset.heuristicRule,
        quarantined: true,
        latencyMs: Number((Math.random() * 1.5 + 0.4).toFixed(2)),
      });
    }, 7000);

    return () => clearInterval(timer);
  }, [isLiveStreamActive]);

  // Aggregate stats
  const totalBlocked = useMemo(() => {
    return vectors.reduce((sum, v) => sum + v.count, 0);
  }, [vectors]);

  const topVector = useMemo(() => {
    return [...vectors].sort((a, b) => b.count - a.count)[0];
  }, [vectors]);

  // Filtered live events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesVector = eventFilter === 'all' || evt.vector === eventFilter;
      const matchesSearch =
        !eventSearch ||
        evt.domain.toLowerCase().includes(eventSearch.toLowerCase()) ||
        evt.heuristicRule.toLowerCase().includes(eventSearch.toLowerCase()) ||
        evt.payloadSnippet.toLowerCase().includes(eventSearch.toLowerCase());
      return matchesVector && matchesSearch;
    });
  }, [events, eventFilter, eventSearch]);

  // Trigger manual simulation
  const handleTriggerSimulation = (preset: AttackSimulationPreset) => {
    const res = recordAttackEvent({
      vector: preset.vector,
      severity: preset.severity,
      domain: preset.domain,
      payloadSnippet: preset.payload,
      mitigation: preset.mitigation,
      heuristicRule: preset.heuristicRule,
      quarantined: true,
      latencyMs: Number((Math.random() * 1.2 + 0.5).toFixed(2)),
    });

    setActionToast(`Neutralized: ${preset.title} on ${preset.domain}`);
    setTimeout(() => setActionToast(null), 3500);
  };

  // Trigger burst of 4 attacks
  const handleTriggerBurst = () => {
    SIMULATION_PRESETS.slice(0, 4).forEach((preset, i) => {
      setTimeout(() => {
        recordAttackEvent({
          vector: preset.vector,
          severity: preset.severity,
          domain: preset.domain,
          payloadSnippet: preset.payload,
          mitigation: preset.mitigation,
          heuristicRule: preset.heuristicRule,
          quarantined: true,
          latencyMs: Number((Math.random() * 1.4 + 0.4).toFixed(2)),
        });
      }, i * 300);
    });

    setActionToast('Wave Burst: Intercepted 4 concurrent hostile attack vectors.');
    setTimeout(() => setActionToast(null), 3500);
  };

  // Reset telemetry
  const handleReset = () => {
    const { vectors: v, trends: t, events: e } = resetAnalyticsTelemetry();
    setVectors(v);
    setTrends(t);
    setEvents(e);
    setActionToast('Security telemetry metrics reset to baseline state.');
    setTimeout(() => setActionToast(null), 3500);
  };

  // Export Telemetry as JSON
  const handleExportJson = () => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      engine: 'Aegis Zero-Trust Threat Analytics (D3.js)',
      contributors: [
        { name: 'Narendra Borhade', role: 'Creator & Architect', email: 'narendra.via.mail@gmail.com' },
        { name: 'Aditya Gaikwad', role: 'Frontend Developer', email: 'gaikwadaditya0309@gmail.com' },
        { name: 'Ghanshyam Jadhav', role: 'Core Security & Systems Contributor', email: 'ghanshamjadhav8210@gmail.com' },
      ],
      totalBlockedVectors: totalBlocked,
      attackVectorsDistribution: vectors,
      realtimeTrendTelemetry: trends,
      liveNeutralizationLog: events,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-security-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setActionToast('Telemetry JSON report exported successfully.');
    setTimeout(() => setActionToast(null), 3500);
  };

  // Export Telemetry as CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Vector', 'Severity', 'Domain', 'HeuristicRule', 'LatencyMs'];
    const rows = events.map((e) => [
      e.id,
      `"${e.timestamp}"`,
      e.vector,
      e.severity,
      `"${e.domain}"`,
      `"${e.heuristicRule}"`,
      e.latencyMs,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-attack-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setActionToast('Attack events CSV exported successfully.');
    setTimeout(() => setActionToast(null), 3500);
  };

  // Generate AI Threat Synthesis
  const handleGenerateAiReport = async () => {
    setIsAiLoading(true);
    try {
      const summary = await fetchAiSecuritySummary(
        trends.map((t) => ({
          date: new Date(t.timestamp).toISOString().split('T')[0],
          displayDate: t.timeLabel,
          dayOfWeek: 'Day',
          dayIndex: 1,
          totalBlocked: t.total,
          breakdown: {
            phishing: t.phishing,
            xss: t.xss,
            malware: t.malware,
            tracker: t.tracker,
            insecure_http: t.insecureHttp,
          },
          intensity: Math.min(1, t.total / 60),
          peakSeverity: 'critical',
        }))
      );
      setAiReport(summary);
    } catch (err) {
      console.warn('AI report error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-slate-900 border border-cyan-500/50 shadow-2xl flex items-center gap-2.5 text-xs font-mono text-cyan-200 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Main SOC Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aegis Cyber SOC · Real-time Analytics</span>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>DEFCON 1 Protected</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            Security Analytics & Attack Vectors
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Real-time interactive D3.js telemetry visualizing threat detection trends, quarantined attack vectors, and automated mitigations identified by the Aegis zero-trust engine.
          </p>

          {/* Contributors Acknowledgement Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 mt-2">
            <span className="text-slate-500">Architecture Team:</span>
            <span>Narendra Borhade</span>
            <span>·</span>
            <span>Aditya Gaikwad <a href="mailto:gaikwadaditya0309@gmail.com" className="text-cyan-400 hover:underline">(gaikwadaditya0309@gmail.com)</a></span>
            <span>·</span>
            <span>Ghanshyam Jadhav <a href="mailto:ghanshamjadhav8210@gmail.com" className="text-teal-400 hover:underline">(ghanshamjadhav8210@gmail.com)</a></span>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-colors ${
              isLiveStreamActive
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle automatic background attack packet simulation"
          >
            {isLiveStreamActive ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Stream: Active</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-400" />
                <span>Live Stream: Paused</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Download JSON Telemetry Log"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Download CSV Incident Log"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
            title="Reset telemetry metrics to baseline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top SOC Metrics KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Total Blocked Vectors
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-300 tracking-tight">
            {totalBlocked.toLocaleString()}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Neutralized by Aegis heuristics
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Primary Threat Vector
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-sans text-amber-300 truncate">
            {topVector ? topVector.name.split(' ')[0] : 'Phishing'}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            {topVector ? `${topVector.percentage}% of blocked volume` : 'Highest volume'}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Quarantine Latency
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300 tracking-tight">
            0.82 ms
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Average in-memory payload disarm
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Zero-Trust Intercept
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300 tracking-tight">
            100.0%
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Isolated before browser memory render
          </p>
        </div>
      </div>

      {/* Primary D3.js Real-time Threat Trends Visualizer */}
      <D3RealtimeTrendChart
        data={trends}
        onSelectPoint={(point) => {
          setActionToast(`Inspecting trend timestamp: ${point.timeLabel} (${point.total} threats blocked)`);
          setTimeout(() => setActionToast(null), 3000);
        }}
      />

      {/* Secondary D3 Visualizations: Donut Attack Vectors & Severity Spectrum */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* D3 Donut Radial Chart (7 columns) */}
        <div className="lg:col-span-7">
          <D3AttackVectorDonut
            vectors={vectors}
            selectedVectorKey={selectedVector?.key}
            onSelectVector={(vec) => setSelectedVector(vec)}
          />
        </div>

        {/* Severity Spectrum & Quick Attack Burst (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <D3SeverityVelocityChart vectors={vectors} />

          {/* Fast Attack Wave Burst Trigger */}
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Live Vector Burst Injector
                </h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">SOC Stress Test</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inject a simulated rapid barrage of 4 concurrent attack vectors through the Aegis heuristics engine to verify real-time D3 graph transitions.
            </p>
            <button
              type="button"
              onClick={handleTriggerBurst}
              className="w-full py-2.5 px-4 rounded-xl font-bold font-mono text-xs bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Trigger Hostile Attack Wave Burst</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Aegis Attack Vector Simulator Card Deck */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Aegis Attack Vector Simulation & Sandbox Injector</span>
            </h3>
            <p className="text-xs text-slate-400">
              Manually deploy simulated malicious payloads to test Aegis mitigation subsystems in real time
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            6 Preconfigured Heuristic Scenarios
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SIMULATION_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold ${
                      preset.severity === 'critical'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                        : preset.severity === 'high'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {preset.vector}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {preset.severity}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 font-sans">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {preset.description}
                </p>

                <div className="p-2 rounded bg-slate-950/70 border border-slate-900 font-mono text-[10px] text-slate-400 space-y-0.5">
                  <div className="truncate text-cyan-300">Target: {preset.domain}</div>
                  <div className="truncate text-slate-500">Payload: {preset.payload}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerSimulation(preset)}
                className="mt-3 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-mono transition-colors flex items-center justify-center gap-1.5 font-semibold"
              >
                <Play className="w-3 h-3" />
                <span>Simulate & Block</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Aegis Threat Detection Stream & Event Log */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Live Neutralized Threat Stream</span>
            </h3>
            <p className="text-xs text-slate-400">
              Chronological log of payloads quarantined and disarmed by Aegis engine heuristics
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search domain or rule..."
                className="glass-input pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg w-44 text-slate-200"
              />
            </div>

            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="glass-input px-3 py-1.5 text-xs font-mono rounded-lg text-slate-200"
            >
              <option value="all">All Vectors ({events.length})</option>
              <option value="phishing">Phishing</option>
              <option value="xss">DOM/URL XSS</option>
              <option value="malware">Cryptominers</option>
              <option value="tracker">Trackers</option>
              <option value="insecure_http">Insecure HTTP</option>
              <option value="dns_spoof">DNS Spoof</option>
            </select>
          </div>
        </div>

        {/* Event List */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching events found in the current telemetry window.
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/90 transition-all text-xs font-mono space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        evt.severity === 'critical'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : evt.severity === 'high'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {evt.vector}
                    </span>
                    <span className="text-slate-200 font-bold font-sans text-xs">
                      {evt.domain}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="text-emerald-400">Quarantined ({evt.latencyMs}ms)</span>
                    <span>·</span>
                    <span>{evt.timestamp}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-sans truncate">
                  <span className="text-slate-500 font-mono">Payload: </span>
                  <span className="text-slate-300 font-mono text-[10px]">{evt.payloadSnippet}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span className="text-cyan-400 truncate">
                    Rule: {evt.heuristicRule}
                  </span>
                  <span className="text-emerald-400/90 truncate">
                    Mitigation: {evt.mitigation}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gemini AI Cyber Threat Synthesis Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Gemini 3.8 Flash Threat Intelligence Synthesis</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  AI SOC Analyst
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Synthesize real-time D3 telemetry to extract root-cause insights and tactical hardening steps
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateAiReport}
            disabled={isAiLoading}
            className="px-4 py-2.5 rounded-xl font-bold font-mono text-xs bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiLoading ? 'Synthesizing Telemetry...' : 'Generate AI Threat Report'}</span>
          </button>
        </div>

        {aiReport && (
          <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-4 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                  Executive Threat Assessment
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">
                  {aiReport.headline}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Threat Level:</span>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-500/40">
                  {aiReport.threatLevel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Telemetry Insights */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1 font-bold">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Key Telemetry Anomalies
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {aiReport.insights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-cyan-400 mt-0.5">›</span>
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hardening Recommendations */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Aegis Hardening Protocol
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {aiReport.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-400 mt-0.5">›</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
