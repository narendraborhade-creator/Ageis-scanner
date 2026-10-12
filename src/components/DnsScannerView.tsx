import React, { useState, useEffect } from 'react';
import { scanDomainDNS } from '../services/dnsService';
import { DnsScanResult } from '../types';
import { Globe, ShieldCheck, AlertCircle, RefreshCw, Server, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

interface DnsScannerViewProps {
  initialDomain?: string;
}

export const DnsScannerView: React.FC<DnsScannerViewProps> = ({ initialDomain = 'cloudflare.com' }) => {
  const [domainInput, setDomainInput] = useState(initialDomain);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<DnsScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecordType, setSelectedRecordType] = useState<'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'CAA'>('A');

  const executeScan = async (target: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await scanDomainDNS(target);
      setScanResult(res);
    } catch (err: any) {
      setError(err.message || 'DNS Resolution Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDomain) {
      setDomainInput(initialDomain);
      executeScan(initialDomain);
    }
  }, [initialDomain]);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    executeScan(domainInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header and Scanner Form */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">
                Quantum DNS Scanner & Health Inspector
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live DNS-over-HTTPS (DoH) resolver analyzing records, DNSSEC cryptographic validation, and cache poisoning vulnerabilities.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-cyan-500/30">
              Resolver: Cloudflare DoH & Google DNS
            </span>
          </div>
        </div>

        <form onSubmit={handleScanSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="Enter domain (e.g., google.com, cloudflare.com, github.com)..."
              className="w-full glass-input rounded-xl px-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>{loading ? 'Resolving...' : 'Scan DNS'}</span>
          </button>
        </form>

        {/* Quick try chips */}
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500">Popular:</span>
          {['cloudflare.com', 'google.com', 'nih.gov', 'github.com', 'wikipedia.org'].map((d) => (
            <button
              key={d}
              onClick={() => {
                setDomainInput(d);
                executeScan(d);
              }}
              className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[11px] transition-colors"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>DNS Resolution Error: {error}</span>
        </div>
      )}

      {/* Results View */}
      {scanResult && (
        <div className="space-y-6">
          {/* Health Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-xl border border-cyan-500/20">
              <span className="text-xs text-slate-400 font-mono">Overall Health Grade</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono">
                  {scanResult.securityCheck.overallHealthGrade}
                </span>
                <span className="text-xs text-slate-400">DNS Hardening</span>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-cyan-500/20">
              <span className="text-xs text-slate-400 font-mono">DNSSEC Validation</span>
              <div className="flex items-center gap-2 mt-2">
                {scanResult.securityCheck.dnssecValidated ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold font-mono">
                    <ShieldCheck className="w-4 h-4" /> Cryptographically Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold font-mono">
                    <AlertCircle className="w-4 h-4" /> Unsigned / Missing
                  </span>
                )}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-cyan-500/20">
              <span className="text-xs text-slate-400 font-mono">Cache Poisoning Risk</span>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-sm font-semibold font-mono ${
                    scanResult.securityCheck.cachePoisoningRisk === 'Low'
                      ? 'text-emerald-400'
                      : scanResult.securityCheck.cachePoisoningRisk === 'Moderate'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {scanResult.securityCheck.cachePoisoningRisk} Risk
                </span>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-cyan-500/20">
              <span className="text-xs text-slate-400 font-mono">DoH Query Latency</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">
                  {scanResult.latencyMs} ms
                </span>
                <span className="text-xs text-slate-400">Response Time</span>
              </div>
            </div>
          </div>

          {/* Assessment Summary */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-100">Aegis Heuristic Verdict: </span>
              {scanResult.securityCheck.summary}
            </div>
          </div>

          {/* Record Types Inspector */}
          <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="flex items-center gap-1 p-2 bg-slate-900/80 border-b border-slate-800 overflow-x-auto">
              {(['A', 'AAAA', 'MX', 'TXT', 'NS', 'CAA'] as const).map((type) => {
                const count = scanResult.records[type]?.length || 0;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedRecordType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
                      selectedRecordType === type
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {type} Records ({count})
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {scanResult.records[selectedRecordType]?.length > 0 ? (
                <div className="space-y-2">
                  {scanResult.records[selectedRecordType].map((record, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-xs flex items-start justify-between gap-4"
                    >
                      <div className="text-slate-200 break-all">{record}</div>
                      <span className="text-[10px] text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0">
                        {selectedRecordType}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  No {selectedRecordType} records found for {scanResult.domain}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
