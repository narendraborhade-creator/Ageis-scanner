import React, { useState, useEffect } from 'react';
import { SAMPLE_THREAT_SIMULATIONS, analyzeUrlThreats } from '../services/threatEngine';
import { incrementThreatBlocked } from '../services/authStorage';
import { getStoredHeatmapData, recordLiveThreatBlocked } from '../services/threatHeatmapService';
import { ThreatHeatmapD3 } from './ThreatHeatmapD3';
import { AISecuritySummaryPanel } from './AISecuritySummaryPanel';
import { BackgroundVulnerabilityScanner } from './BackgroundVulnerabilityScanner';
import { ThreatItem, DailyThreatData } from '../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bug,
  Play,
  Terminal,
  Zap,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Cpu,
  Radio,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface ThreatBlockerViewProps {
  onNavigateToBrowser?: (url: string) => void;
  currentBrowserUrl?: string;
}

interface SandboxDiagnostic {
  url: string;
  isBlocked: boolean;
  category: 'Clean' | 'Suspicious' | 'Dangerous' | 'Malicious';
  riskScore: number;
  threats: ThreatItem[];
  protocol: string;
  heuristicVerdict: string;
  mitigationApplied: string;
  timestamp: string;
}

export const ThreatBlockerView: React.FC<ThreatBlockerViewProps> = ({
  onNavigateToBrowser,
  currentBrowserUrl,
}) => {
  const [shieldSettings, setShieldSettings] = useState({
    blockTrackers: true,
    disarmXss: true,
    forceHttps: true,
    blockCryptominers: true,
    preventClickjacking: true,
    antiPhishingSandbox: true,
  });

  const [heatmapData, setHeatmapData] = useState<DailyThreatData[]>(() => getStoredHeatmapData());
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<DailyThreatData | null>(null);
  const [selectedSimIndex, setSelectedSimIndex] = useState<number>(0);
  const [activeTestUrl, setActiveTestUrl] = useState<string>(SAMPLE_THREAT_SIMULATIONS[0].url);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState<string>('idle');
  const [diagnosticResult, setDiagnosticResult] = useState<SandboxDiagnostic | null>(null);

  const [threatLog, setThreatLog] = useState<ThreatItem[]>([
    {
      id: 'log-1',
      url: 'http://paypal-security-login-verification.xyz/account/signin',
      type: 'phishing',
      severity: 'critical',
      timestamp: '10:42:15 PM',
      blocked: true,
      description: 'Credential harvester imitating corporate banking gateway on unencrypted HTTP.',
      mitigation: 'Quarantined in Aegis Virtual Sandbox; DNS route nullified.',
    },
    {
      id: 'log-2',
      url: 'https://cdn-telemetry-tracker.io/v2/fingerprint.js',
      type: 'tracker',
      severity: 'medium',
      timestamp: '10:39:04 PM',
      blocked: true,
      description: 'Canvas fingerprinting & persistent audio context hardware prober.',
      mitigation: 'Script disarmed with spoofed zero-entropy canvas noise.',
    },
    {
      id: 'log-3',
      url: 'https://insecure-portal.com/view?data=<script>alert("session_hijack")</script>',
      type: 'xss',
      severity: 'critical',
      timestamp: '10:31:22 PM',
      blocked: true,
      description: 'DOM XSS reflection vector attempting session hijacking.',
      mitigation: 'Script payload neutralized by Aegis Content Security Guard.',
    },
  ]);

  const toggleSetting = (key: keyof typeof shieldSettings) => {
    setShieldSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const executeSimulation = (url: string, index?: number) => {
    if (typeof index === 'number') {
      setSelectedSimIndex(index);
    }
    setActiveTestUrl(url);
    setSimulationRunning(true);
    setSimulationStep('Initializing Aegis Virtual Container...');

    // Multi-phase diagnostic steps for responsive visual feedback
    setTimeout(() => {
      setSimulationStep('Dissecting Protocol, Headers & Punycode...');
    }, 150);

    setTimeout(() => {
      setSimulationStep('Running Heuristic Pattern Matcher & Signature Scanner...');
    }, 300);

    setTimeout(() => {
      const analysis = analyzeUrlThreats(url);
      const isHttps = url.toLowerCase().startsWith('https://');

      let verdict = '';
      let mitigation = '';

      if (analysis.isBlocked) {
        verdict = `Critical Threat Intercepted: ${analysis.threats.map((t) => t.type.toUpperCase()).join(' & ')} detected. Connection terminated immediately.`;
        mitigation = analysis.threats[0]?.mitigation || 'Isolated in Aegis Virtual Sandbox.';
        // Add to log if not duplicate
        setThreatLog((prev) => {
          const exists = prev.some((p) => p.url === url);
          if (!exists && analysis.threats.length > 0) {
            return [...analysis.threats, ...prev];
          }
          return prev;
        });
        incrementThreatBlocked();
        const updatedHeatmap = recordLiveThreatBlocked(analysis.threats[0]?.type || 'phishing');
        setHeatmapData(updatedHeatmap);
      } else {
        verdict = 'Clean & Resilient: Valid TLS encryption, clean domain syntax, zero malicious heuristics found.';
        mitigation = 'Granted verified clearance. HSTS & anti-tracking headers applied.';
      }

      setDiagnosticResult({
        url,
        isBlocked: analysis.isBlocked,
        category: analysis.category,
        riskScore: analysis.riskScore,
        threats: analysis.threats,
        protocol: isHttps ? 'HTTPS (TLS 1.3)' : 'Plaintext HTTP (Insecure)',
        heuristicVerdict: verdict,
        mitigationApplied: mitigation,
        timestamp: new Date().toLocaleTimeString(),
      });

      setSimulationRunning(false);
      setSimulationStep('Diagnostic complete');
    }, 450);
  };

  // Run initial simulation on mount so user immediately sees working state
  useEffect(() => {
    executeSimulation(SAMPLE_THREAT_SIMULATIONS[0].url, 0);
  }, []);

  const handleCustomAttackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTestUrl.trim()) return;
    executeSimulation(activeTestUrl.trim(), -1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Zero-Day Threat, Bug & Vulnerability Shield
            </h2>
            <p className="text-xs text-slate-400">
              Active heuristic defense engine blocking credential-harvesting phishing, reflected/stored XSS, cross-site trackers, clickjacking frames, and insecure protocol leaks.
            </p>
          </div>
        </div>

        {/* Protection Toggles Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {[
            { key: 'blockTrackers', label: 'Block Adware & Tracking Beacons', desc: 'Stops fingerprinting, pixels, and telemetry' },
            { key: 'disarmXss', label: 'Disarm DOM & URL Script Injections', desc: 'Neutralizes XSS payloads and javascript: schemes' },
            { key: 'forceHttps', label: 'Enforce Automatic HTTPS Upgrade', desc: 'Prevents plaintext MitM wire-tapping' },
            { key: 'blockCryptominers', label: 'Block In-Browser Cryptominers', desc: 'Throttles rogue WebAssembly CPU miners' },
            { key: 'preventClickjacking', label: 'Anti-Clickjacking Framing Guard', desc: 'Enforces strict X-Frame-Options isolation' },
            { key: 'antiPhishingSandbox', label: 'Typosquatting & Phishing Sandbox', desc: 'Catches punycode and deceptive login URLs' },
          ].map((item) => {
            const isEnabled = shieldSettings[item.key as keyof typeof shieldSettings];
            return (
              <div
                key={item.key}
                onClick={() => toggleSetting(item.key as keyof typeof shieldSettings)}
                className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                  isEnabled
                    ? 'glass-panel-glow border-cyan-500/40'
                    : 'glass-panel border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-100">{item.label}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                      isEnabled ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isEnabled ? '✓' : ''}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automated Background Vulnerability Scanner & Deep Health Audit */}
      <BackgroundVulnerabilityScanner
        currentUrl={currentBrowserUrl}
        onNavigateToBrowser={onNavigateToBrowser}
      />

      {/* 30-Day Blocked Ingress Vector Heatmap (Powered by D3.js) */}
      <ThreatHeatmapD3
        data={heatmapData}
        onSelectDay={(day) => setSelectedHeatmapDay(day)}
        selectedDate={selectedHeatmapDay?.date}
      />

      {/* Neural AI Security Summary (Powered by Gemini) */}
      <AISecuritySummaryPanel heatmapData={heatmapData} />

      {/* Interactive Cyber Sandbox Simulator with Working Tabs */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              Interactive Threat Sandbox & Attack Simulator
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
            Click any tab below to test live
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Select any of the 4 pre-configured synthetic threat scenarios below or enter a custom payload to observe how Aegis 3D intercepts and isolates risks.
        </p>

        {/* 4 Interactive Simulation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_THREAT_SIMULATIONS.map((sim, i) => {
            const isSelected = selectedSimIndex === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => executeSimulation(sim.url, i)}
                className={`p-3.5 rounded-xl text-left transition-all relative overflow-hidden group cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850'
                }`}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />
                )}

                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-slate-200'}>
                    {sim.name}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 group-hover:text-cyan-300'
                    }`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {sim.description}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>
                    {isSelected ? '● ACTIVE TAB' : 'Click to run'}
                  </span>
                  <span className="text-slate-600 truncate max-w-[110px]">
                    {sim.url.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom attack input */}
        <form onSubmit={handleCustomAttackSubmit} className="flex gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={activeTestUrl}
              onChange={(e) => setActiveTestUrl(e.target.value)}
              placeholder="Test custom URL or payload (e.g., http://insecure-test.org, <script>alert(1)</script>)..."
              className="w-full glass-input rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={simulationRunning}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {simulationRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>{simulationRunning ? 'Scanning...' : 'Simulate Attack'}</span>
          </button>
        </form>

        {/* LIVE SIMULATION DIAGNOSTIC VERDICT SCREEN */}
        {diagnosticResult && (
          <div
            className={`rounded-2xl p-5 border transition-all ${
              diagnosticResult.isBlocked
                ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]'
                : 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    diagnosticResult.isBlocked
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  {diagnosticResult.isBlocked ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        diagnosticResult.isBlocked
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {diagnosticResult.isBlocked ? 'THREAT INTERCEPTED' : 'CLEARANCE VERIFIED'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {diagnosticResult.timestamp}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mt-1 font-mono break-all">
                    {diagnosticResult.url}
                  </h4>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {onNavigateToBrowser && (
                  <button
                    onClick={() => onNavigateToBrowser(diagnosticResult.url)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 font-medium transition-colors cursor-pointer"
                  >
                    <span>View in 3D Browser</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => executeSimulation(diagnosticResult.url)}
                  disabled={simulationRunning}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Rerun analysis"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${simulationRunning ? 'animate-spin' : ''}`} />
                  <span>Re-test</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-slate-500 block text-[10px]">Transmission Security</span>
                <span
                  className={`font-semibold mt-0.5 block ${
                    diagnosticResult.protocol.includes('Insecure') ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {diagnosticResult.protocol}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-slate-500 block text-[10px]">Risk Severity Score</span>
                <span
                  className={`font-semibold mt-0.5 block ${
                    diagnosticResult.riskScore > 50
                      ? 'text-rose-400'
                      : diagnosticResult.riskScore > 20
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {diagnosticResult.riskScore}/100 ({diagnosticResult.category})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-slate-500 block text-[10px]">Aegis Sandbox Action</span>
                <span
                  className={`font-semibold mt-0.5 block ${
                    diagnosticResult.isBlocked ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {diagnosticResult.isBlocked ? 'Quarantined & Disarmed' : 'Clear & Filtered'}
                </span>
              </div>
            </div>

            {/* Detailed Verdict Explanation */}
            <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-850 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Heuristic Verdict:</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans pl-5">
                {diagnosticResult.heuristicVerdict}
              </p>
              <div className="text-[11px] font-mono text-emerald-400 pl-5 pt-1">
                Active Mitigation: {diagnosticResult.mitigationApplied}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Blocked Threats Log */}
      <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              Intercepted Threat Quarantine Stream ({threatLog.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Aegis Firewall Active</span>
          </span>
        </div>

        <div className="divide-y divide-slate-850 p-4 space-y-3">
          {threatLog.map((threat) => (
            <div
              key={threat.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      threat.severity === 'critical'
                        ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                        : threat.severity === 'high'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                        : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40'
                    }`}
                  >
                    {threat.type} · {threat.severity}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{threat.timestamp}</span>
                </div>
                <div className="text-xs font-mono text-slate-200 break-all">{threat.url}</div>
                <p className="text-xs text-slate-400">{threat.description}</p>
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mitigation: {threat.mitigation}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-mono rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  BLOCKED
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
