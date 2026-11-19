import React, { useState, useEffect } from 'react';
import { auditWebsiteSecurity } from '../services/threatEngine';
import { WebsiteAudit } from '../types';
import { GitCompare, Shield, Lock, Activity, CheckCircle, XCircle, RefreshCw, Trophy, ArrowRight } from 'lucide-react';

interface WebsiteComparatorViewProps {
  initialSiteA?: string;
  initialSiteB?: string;
}

export const WebsiteComparatorView: React.FC<WebsiteComparatorViewProps> = ({
  initialSiteA = 'cloudflare.com',
  initialSiteB = 'wikipedia.org',
}) => {
  const [siteA, setSiteA] = useState(initialSiteA);
  const [siteB, setSiteB] = useState(initialSiteB);
  const [loading, setLoading] = useState(false);
  const [auditA, setAuditA] = useState<WebsiteAudit | null>(null);
  const [auditB, setAuditB] = useState<WebsiteAudit | null>(null);

  const runComparison = async (urlA: string, urlB: string) => {
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        auditWebsiteSecurity(urlA),
        auditWebsiteSecurity(urlB),
      ]);
      setAuditA(resA);
      setAuditB(resB);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison(siteA, siteB);
  }, []);

  const handleCompareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteA.trim() || !siteB.trim()) return;
    runComparison(siteA.trim(), siteB.trim());
  };

  return (
    <div className="space-y-6">
      {/* Comparator Header & Inputs */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Side-by-Side Website Security & Vulnerability Comparator
            </h2>
            <p className="text-xs text-slate-400">
              Audit and compare HTTPS cryptographic ciphers, latency, CSP/HSTS header policies, tracker footprints, and vulnerability exposure between any two domains.
            </p>
          </div>
        </div>

        <form onSubmit={handleCompareSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-6">
          <div className="md:col-span-5">
            <label className="block text-[11px] font-mono text-cyan-400 mb-1">Target Website 1</label>
            <input
              type="text"
              value={siteA}
              onChange={(e) => setSiteA(e.target.value)}
              placeholder="e.g., cloudflare.com"
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-[11px] font-mono text-teal-400 mb-1">Target Website 2</label>
            <input
              type="text"
              value={siteB}
              onChange={(e) => setSiteB(e.target.value)}
              placeholder="e.g., github.com or google.com"
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{loading ? 'Auditing...' : 'Compare'}</span>
            </button>
          </div>
        </form>

        {/* Quick pairs */}
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500">Preset Comparisons:</span>
          {[
            { a: 'cloudflare.com', b: 'wikipedia.org', label: 'Cloudflare vs Wikipedia' },
            { a: 'github.com', b: 'gitlab.com', label: 'GitHub vs GitLab' },
            { a: 'google.com', b: 'duckduckgo.com', label: 'Google vs DuckDuckGo' },
          ].map((pair) => (
            <button
              key={pair.label}
              onClick={() => {
                setSiteA(pair.a);
                setSiteB(pair.b);
                runComparison(pair.a, pair.b);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Matrix Cards */}
      {auditA && auditB && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A */}
          <div
            className={`glass-panel rounded-2xl p-6 border transition-all ${
              auditA.securityScore >= auditB.securityScore
                ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase">Domain A</span>
                <h3 className="text-lg font-bold text-slate-100 font-mono truncate">{auditA.domain}</h3>
              </div>
              {auditA.securityScore >= auditB.securityScore && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                  <Trophy className="w-3 h-3 text-cyan-400" /> Winner: Superior Security
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-center mb-6">
              <div>
                <span className="text-[10px] text-slate-500">Security Score</span>
                <div className="text-xl font-extrabold text-cyan-400">{auditA.securityScore}/100</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">SSL Grade</span>
                <div className="text-xl font-extrabold text-emerald-400">{auditA.sslGrade}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Latency</span>
                <div className="text-xl font-extrabold text-slate-200 tabular-nums">{auditA.responseTimeMs}ms</div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Defensive Header Matrix
              </h4>

              <div className="space-y-2 font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-850">
                  <span className="text-slate-400">Strict HSTS</span>
                  {auditA.headers.hsts ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" /> Enforced
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-850">
                  <span className="text-slate-400">Content Security Policy (CSP)</span>
                  {auditA.headers.csp ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-850">
                  <span className="text-slate-400">X-Frame-Options (Clickjacking)</span>
                  {auditA.headers.xFrameOptions ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" /> {auditA.headers.xFrameOptions}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> Vulnerable
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-850">
                  <span className="text-slate-400">Trackers Injected</span>
                  <span className="text-cyan-300 tabular-nums">{auditA.trackersCount} Trackers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B */}
          <div
            className={`glass-panel rounded-2xl p-6 border transition-all ${
              auditB.securityScore > auditA.securityScore
                ? 'border-teal-500/40 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-mono text-teal-400 uppercase">Domain B</span>
                <h3 className="text-lg font-bold text-slate-100 font-mono truncate">{auditB.domain}</h3>
              </div>
              {auditB.securityScore > auditA.securityScore && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-teal-300 bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 rounded-md">
                  <Trophy className="w-3 h-3 text-teal-400" /> Winner: Superior Security
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-center mb-6">
              <div>
                <span className="text-[10px] text-slate-500">Security Score</span>
                <div className="text-xl font-extrabold text-teal-400">{auditB.securityScore}/100</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">SSL Grade</span>
                <div className="text-xl font-extrabold text-emerald-400">{auditB.sslGrade}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Latency</span>
                <div className="text-xl font-extrabold text-slate-200 tabular-nums">{auditB.responseTimeMs}ms</div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Defensive Header Matrix
              </h4>

              <div className="space-y-2 font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-850">
                  <span className="text-slate-400">Strict HSTS</span>
                  {auditB.headers.hsts ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" /> Enforced
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-850">
                  <span className="text-slate-400">Content Security Policy (CSP)</span>
                  {auditB.headers.csp ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-850">
                  <span className="text-slate-400">X-Frame-Options (Clickjacking)</span>
                  {auditB.headers.xFrameOptions ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" /> {auditB.headers.xFrameOptions}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                      <XCircle className="w-3.5 h-3.5" /> Vulnerable
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-850">
                  <span className="text-slate-400">Trackers Injected</span>
                  <span className="text-teal-300 tabular-nums">{auditB.trackersCount} Trackers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
