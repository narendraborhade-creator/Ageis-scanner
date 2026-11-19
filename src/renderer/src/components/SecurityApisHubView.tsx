/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Aegis Security APIs & Threat Intelligence Hub
 * Grounded in https://github.com/jaegeral/security-apis (awesome-security-apis)
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  ExternalLink,
  RefreshCw,
  Bug,
  Globe,
  Radio,
  Lock,
  Terminal,
  Cpu,
  Key,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import {
  SECURITY_APIS_CATALOG,
  lookupCveRecord,
  querySecurityIntel,
  filterSecurityApis,
  getStoredSecurityApiKeys,
  saveSecurityApiKey,
  queryUrlhausDatabase,
  CveRecord,
  ThreatIntelligenceReport,
  SecurityApiEntry,
  UserSecurityApiKey,
} from '../services/securityApisService';

interface SecurityApisHubViewProps {
  onNavigateToBrowserUrl?: (url: string) => void;
  currentBrowserDomain?: string;
}

export const SecurityApisHubView: React.FC<SecurityApisHubViewProps> = ({
  onNavigateToBrowserUrl,
  currentBrowserDomain = 'cloudflare.com',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'apis-catalog' | 'cve-lookup' | 'threat-intel' | 'api-keys'>('apis-catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // CVE Lookup State
  const [cveInput, setCveInput] = useState('CVE-2024-3094');
  const [cveLoading, setCveLoading] = useState(false);
  const [cveResult, setCveResult] = useState<CveRecord | null>(null);

  // Live Threat Intel State
  const [intelTarget, setIntelTarget] = useState(currentBrowserDomain !== 'aegis.local' ? currentBrowserDomain : 'cloudflare.com');
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelResult, setIntelResult] = useState<ThreatIntelligenceReport | null>(null);

  // API Key Vault State
  const [apiKeys, setApiKeys] = useState<UserSecurityApiKey[]>(() => getStoredSecurityApiKeys());
  const [selectedService, setSelectedService] = useState('virustotal');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySavedNotice, setKeySavedNotice] = useState(false);

  // Initialize initial lookups on mount
  useEffect(() => {
    handleLookupCve('CVE-2024-3094');
    handleRunIntel(intelTarget);
  }, []);

  const handleLookupCve = async (id: string) => {
    if (!id.trim()) return;
    setCveLoading(true);
    try {
      const res = await lookupCveRecord(id.trim());
      setCveResult(res);
    } finally {
      setCveLoading(false);
    }
  };

  const handleRunIntel = async (target: string) => {
    if (!target.trim()) return;
    setIntelLoading(true);
    try {
      const res = await querySecurityIntel(target.trim());
      setIntelResult(res);
    } finally {
      setIntelLoading(false);
    }
  };

  const filteredApis = filterSecurityApis(searchQuery, selectedCategory);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Cybersecurity APIs Intelligence Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  jaegeral/security-apis
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Public JSON APIs, CIRCL CVE database, URLhaus malware feeds & threat intelligence
              </p>
            </div>
          </div>

          <a
            href="https://github.com/jaegeral/security-apis"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs border border-slate-750 transition-colors"
          >
            <span>View Source Repo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Navigation Switchers */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 flex-wrap">
          {[
            { id: 'apis-catalog', label: `Public Security APIs (${SECURITY_APIS_CATALOG.length})`, icon: Database },
            { id: 'cve-lookup', label: 'Live CVE & Vuln Search (CIRCL)', icon: Bug },
            { id: 'threat-intel', label: 'Threat Intel & URLhaus Sandbox', icon: Radio },
            { id: 'api-keys', label: 'API Keys Vault', icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-bold'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. PUBLIC APIS CATALOG VIEW */}
      {activeSubTab === 'apis-catalog' && (
        <div className="space-y-3">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 80+ security APIs (e.g. CIRCL, URLhaus, Shodan, VirusTotal, Censys)..."
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-xs text-cyan-300 bg-slate-900 border border-slate-800"
            >
              <option value="all">All Categories</option>
              <option value="vuln-cve">Vulnerabilities & CVE</option>
              <option value="threat-intel">Threat Intelligence</option>
              <option value="malware-analysis">Malware Analysis</option>
              <option value="network-dns">Network & Cryptographic DNS</option>
              <option value="siem-soc">SIEM & SOC</option>
              <option value="tools">Security Tools</option>
            </select>
          </div>

          {/* APIs Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredApis.map((api) => (
              <div
                key={api.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {api.name}
                      </h4>
                      {api.featured && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-semibold">
                          Featured
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wider">
                      {api.category.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        api.isFree
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {api.auth === 'none' ? 'Free / No Auth' : api.auth === 'apiKey' ? 'Free API Key' : 'Commercial'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {api.description}
                </p>

                {api.endpointExample && (
                  <div className="p-1.5 rounded bg-black/60 border border-slate-850 text-[10px] text-cyan-300 truncate select-all">
                    <code>{api.endpointExample}</code>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-500">Public JSON REST</span>
                  <a
                    href={api.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline"
                  >
                    <span>API Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LIVE CVE & VULNERABILITY INSPECTOR (CIRCL) */}
      {activeSubTab === 'cve-lookup' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupCve(cveInput);
            }}
            className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-cyan-500"
          >
            <Bug className="w-4 h-4 text-rose-400 ml-3 mr-1 shrink-0" />
            <input
              type="text"
              value={cveInput}
              onChange={(e) => setCveInput(e.target.value)}
              placeholder="Enter CVE ID (e.g. CVE-2024-3094, CVE-2021-44228)..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-xs py-1.5"
            />
            <button
              type="submit"
              disabled={cveLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer transition-all shadow-md"
            >
              {cveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Inspect CVE'}
            </button>
          </form>

          {/* Quick Notable CVE Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-500">Popular Advisories:</span>
            {['CVE-2024-3094 (XZ Utils)', 'CVE-2021-44228 (Log4Shell)', 'CVE-2023-38606 (Triangulation)', 'CVE-2024-21413 (Moniker)'].map(
              (item) => {
                const id = item.split(' ')[0];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setCveInput(id);
                      handleLookupCve(id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                );
              }
            )}
          </div>

          {/* CVE Result Card */}
          {cveResult && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 space-y-3 shadow-xl">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-rose-300 font-mono">{cveResult.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                      CVSS {cveResult.cvss.toFixed(1)} / 10.0 ({cveResult.cvss >= 9 ? 'CRITICAL' : 'HIGH'})
                    </span>
                  </div>
                  {cveResult.cwe && (
                    <div className="text-[11px] text-amber-400 font-mono mt-0.5">{cveResult.cwe}</div>
                  )}
                </div>

                <div className="text-right text-[10px] text-slate-500 font-mono">
                  <div>Published: {cveResult.published}</div>
                  <div>Modified: {cveResult.modified}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-slate-800 font-sans text-xs text-slate-200 leading-relaxed">
                {cveResult.summary}
              </div>

              {cveResult.references && cveResult.references.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold">Official MITRE & NVD References:</div>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                    {cveResult.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 truncate hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{ref}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. THREAT INTEL & URLHAUS SCANNER */}
      {activeSubTab === 'threat-intel' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunIntel(intelTarget);
            }}
            className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-cyan-500"
          >
            <Radio className="w-4 h-4 text-cyan-400 ml-3 mr-1 shrink-0 animate-pulse" />
            <input
              type="text"
              value={intelTarget}
              onChange={(e) => setIntelTarget(e.target.value)}
              placeholder="Enter domain or URL to scan across URLhaus, OTX & Quad9..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-xs py-1.5"
            />
            <button
              type="submit"
              disabled={intelLoading}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-all shadow-md"
            >
              {intelLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Run Threat Intel'}
            </button>
          </form>

          {intelResult && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-slate-100">{intelResult.target}</span>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    intelResult.threatLevel === 'clean'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-950 text-rose-300 border-rose-500/40'
                  }`}
                >
                  Threat Score: {intelResult.threatScore}/100 ({intelResult.threatLevel.toUpperCase()})
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-slate-400 font-bold">Threat Intelligence Findings:</div>
                <div className="space-y-1">
                  {intelResult.matchedSignatures.map((sig, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-black/50 border border-slate-800 text-[11px] flex items-center gap-2"
                    >
                      {intelResult.threatLevel === 'clean' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className={intelResult.threatLevel === 'clean' ? 'text-slate-300' : 'text-rose-300'}>
                        {sig}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                <span>Sources: {intelResult.sourcesChecked.join(', ')}</span>
                <span>Active DoH: Cloudflare & Quad9</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. API KEYS VAULT VIEW */}
      {activeSubTab === 'api-keys' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-slate-100">Cybersecurity API Credentials Vault</h4>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                Local Zero-Knowledge Storage
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Store your free API keys for services listed in <strong className="text-cyan-300">jaegeral/security-apis</strong>.
              Keys are strictly saved locally in your browser and used to power deep threat lookups.
            </p>

            {/* Key Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="bg-black/60 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:border-cyan-400 focus:outline-none"
              >
                <option value="virustotal">VirusTotal v3 API</option>
                <option value="alienvault-otx">AlienVault OTX Key</option>
                <option value="shodan">Shodan API Key</option>
                <option value="abuseipdb">AbuseIPDB Key</option>
                <option value="vulners">Vulners Database Key</option>
                <option value="greynoise">GreyNoise API Key</option>
              </select>

              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter API Key / Token..."
                className="bg-black/60 border border-slate-700 text-slate-100 text-xs rounded-xl p-2.5 focus:border-cyan-400 focus:outline-none font-mono"
              />

              <button
                type="button"
                onClick={() => {
                  if (apiKeyInput.trim()) {
                    const updated = saveSecurityApiKey(selectedService, selectedService.toUpperCase(), apiKeyInput);
                    setApiKeys(updated);
                    setApiKeyInput('');
                    setKeySavedNotice(true);
                    setTimeout(() => setKeySavedNotice(false), 2500);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Save Key to Vault</span>
              </button>
            </div>

            {keySavedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>API Key securely saved to local browser vault!</span>
              </div>
            )}
          </div>

          {/* Stored Keys List */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-300">Configured API Services ({apiKeys.length})</h5>
            {apiKeys.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
                No custom API keys added yet. The browser automatically uses free public endpoints for CIRCL, Defend.network, and Quad9.
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((k) => (
                  <div key={k.serviceId} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-cyan-300">{k.serviceName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Key: ••••••••••••••••{k.apiKey.slice(-4)} · Updated: {new Date(k.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = saveSecurityApiKey(k.serviceId, k.serviceName, '');
                        setApiKeys(updated);
                      }}
                      className="px-2.5 py-1 text-[11px] rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
