/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Chromium Depot Tools & Engine Studio View
 * Grounded in https://chromium.googlesource.com/chromium/tools/depot_tools
 */

import React, { useState } from 'react';
import {
  Cpu,
  Terminal,
  Settings,
  Sliders,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
  Layers,
  Shield,
  Activity,
  Code2,
  Download,
  Play,
  Monitor,
} from 'lucide-react';
import {
  DEPOT_TOOLS_CATALOG,
  GN_BUILD_ARG_PRESETS,
  getStoredChromiumFlags,
  toggleChromiumFlag,
  generateDepotToolsSetupScript,
  DepotToolItem,
  GnBuildArgPreset,
  ChromiumRuntimeFlag,
} from '../services/chromiumDepotToolsService';

interface ChromiumDepotToolsViewProps {
  onRestartWithFlags?: (flags: ChromiumRuntimeFlag[]) => void;
}

export const ChromiumDepotToolsView: React.FC<ChromiumDepotToolsViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'depot-tools' | 'gn-args' | 'flags' | 'architecture'>('depot-tools');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Depot tools state
  const [selectedTool, setSelectedTool] = useState<DepotToolItem>(DEPOT_TOOLS_CATALOG[0]);
  const [customArgs, setCustomArgs] = useState(DEPOT_TOOLS_CATALOG[0].defaultArgs || '');
  const [setupPlatform, setSetupPlatform] = useState<'windows' | 'linux' | 'macos'>('windows');

  // GN args state
  const [selectedPreset, setSelectedPreset] = useState<GnBuildArgPreset>(GN_BUILD_ARG_PRESETS[0]);
  const [gnOutput, setGnOutput] = useState(GN_BUILD_ARG_PRESETS[0].argsContent);

  // Flags state
  const [runtimeFlags, setRuntimeFlags] = useState<ChromiumRuntimeFlag[]>(() => getStoredChromiumFlags());
  const [flagsUpdatedNotice, setFlagsUpdatedNotice] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFlag = (id: string) => {
    const updated = toggleChromiumFlag(id);
    setRuntimeFlags(updated);
    setFlagsUpdatedNotice(true);
    setTimeout(() => setFlagsUpdatedNotice(false), 3000);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/30 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Chromium Engine & Depot Tools Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  chromium/tools/depot_tools
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official Google Chromium developer toolchain, GN args build generator & runtime flags
              </p>
            </div>
          </div>

          <a
            href="https://chromium.googlesource.com/chromium/tools/depot_tools"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs border border-slate-750 transition-colors"
          >
            <span>Depot Tools Git</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Navigation Switchers */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 flex-wrap">
          {[
            { id: 'depot-tools', label: 'Depot Tools Suite', icon: Terminal },
            { id: 'gn-args', label: 'GN args.gn Generator', icon: Code2 },
            { id: 'flags', label: 'Chromium Runtime Flags', icon: Sliders },
            { id: 'architecture', label: 'Engine Architecture & V8', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
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

      {/* 1. DEPOT TOOLS SUITE VIEW */}
      {activeTab === 'depot-tools' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Tools Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-300 mb-2">Available Depot Tools:</div>
              <div className="space-y-1 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
                {DEPOT_TOOLS_CATALOG.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedTool(item);
                      setCustomArgs(item.defaultArgs || '');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between border ${
                      selectedTool.id === item.id
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                        : 'bg-slate-900/40 hover:bg-slate-800 text-slate-300 border-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{item.command}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{item.name}</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-slate-400 uppercase">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Tool Details & Interactive Terminal */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40 text-xs">
                      {selectedTool.command}
                    </span>
                    <span className="text-slate-200 font-bold">{selectedTool.name}</span>
                  </div>
                  <a
                    href={selectedTool.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Upstream Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {selectedTool.description}
                </p>

                {/* Custom Command Builder */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] text-slate-400 font-bold">Execution Arguments:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customArgs}
                      onChange={(e) => setCustomArgs(e.target.value)}
                      placeholder="e.g. sync -D --jobs=16"
                      className="flex-1 bg-black/60 border border-slate-700 text-slate-100 p-2 rounded-xl text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(`${selectedTool.command} ${customArgs}`.trim(), 'tool-cmd')}
                      className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                    >
                      {copiedId === 'tool-cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Command</span>
                    </button>
                  </div>
                </div>

                {/* Live Terminal Preview */}
                <div className="rounded-xl bg-black/80 border border-slate-800 p-3 space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800 pb-1 mb-1">
                    <span>PowerShell / Bash Terminal Simulator</span>
                    <span className="text-emerald-400">● Depot Tools Ready</span>
                  </div>
                  <div className="text-cyan-400 select-all font-mono">
                    $ {selectedTool.command} {customArgs}
                  </div>
                  <div className="text-slate-400 text-[11px] italic">
                    [Aegis Studio] Ready to execute in system terminal with DEPOT_TOOLS on PATH.
                  </div>
                </div>
              </div>

              {/* Setup Guide Accordion */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold text-[11px]">Install Depot Tools on Local Machine:</span>
                  <div className="flex gap-1 text-[10px]">
                    {(['windows', 'linux', 'macos'] as const).map((os) => (
                      <button
                        key={os}
                        type="button"
                        onClick={() => setSetupPlatform(os)}
                        className={`px-2 py-0.5 rounded capitalize ${
                          setupPlatform === os ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {os}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <pre className="p-2.5 rounded-lg bg-black/60 text-slate-300 text-[10px] overflow-x-auto select-all max-h-24">
                    {generateDepotToolsSetupScript(setupPlatform)}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy(generateDepotToolsSetupScript(setupPlatform), 'setup-script')}
                    className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                    title="Copy Setup Script"
                  >
                    {copiedId === 'setup-script' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GN ARGS.GN BUILD GENERATOR VIEW */}
      {activeTab === 'gn-args' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Chromium args.gn Profile Generator</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select a compilation profile for <code className="text-cyan-300 font-mono">gn gen out/Default --args="..."</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(gnOutput, 'gn-file')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedId === 'gn-file' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy args.gn</span>
              </button>
            </div>

            {/* Presets Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {GN_BUILD_ARG_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset);
                      setGnOutput(preset.argsContent);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer space-y-1.5 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-100">{preset.name}</div>
                      <div className="text-[10px] text-slate-400">{preset.targetEnv}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {preset.features.map((f, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-black/50 text-cyan-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live args.gn Code Editor Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold">Generated out/Default/args.gn Configuration:</span>
                <span>Editable GN Syntax</span>
              </div>
              <textarea
                value={gnOutput}
                onChange={(e) => setGnOutput(e.target.value)}
                rows={11}
                className="w-full p-3 rounded-xl bg-black/80 border border-slate-700 text-cyan-300 font-mono text-xs focus:border-cyan-400 focus:outline-none scrollbar-thin"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. CHROMIUM RUNTIME FLAGS VIEW */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Chromium Engine Runtime Flags (chrome://flags equivalent)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Toggle hardware acceleration, media codecs, and sandboxing directly in this session
                </p>
              </div>

              {flagsUpdatedNotice && (
                <div className="px-3 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Flags synced to session!</span>
                </div>
              )}
            </div>

            {/* Flags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {runtimeFlags.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-xs">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(item.id)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                          item.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            item.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <code className="text-[10px] text-cyan-400 block bg-black/40 px-1.5 py-0.5 rounded font-mono truncate">
                      {item.flag}
                    </code>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed pt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="uppercase">{item.category}</span>
                    {item.recommended && <span className="text-cyan-400 font-bold">Recommended</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. ENGINE ARCHITECTURE & V8 VIEW */}
      {activeTab === 'architecture' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Chromium WebEngine Multi-Process Architecture</span>
            </h4>

            {/* Architecture Pipeline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-center">
              {[
                { title: 'Browser Main Process', desc: 'UI, Tabs, Network, Omnibar & Security Policy', status: 'Running', color: 'text-cyan-400 border-cyan-500/40' },
                { title: 'Blink Renderer Engine', desc: 'HTML5, CSS3, DOM, WebGL 3D & Layout Tree', status: 'Hardware Accelerated', color: 'text-emerald-400 border-emerald-500/40' },
                { title: 'V8 JavaScript Engine', desc: 'TurboFan JIT Compiler & Garbage Collection', status: 'Active (4GB Heap)', color: 'text-amber-400 border-amber-500/40' },
                { title: 'Zero-Trust Sandbox', desc: 'OS Privilege Separation & Site Isolation', status: 'Enforced', color: 'text-indigo-400 border-indigo-500/40' },
              ].map((proc, i) => (
                <div key={i} className={`p-3 rounded-xl bg-slate-900/60 border ${proc.color} space-y-1`}>
                  <div className="font-bold text-xs text-slate-200">{proc.title}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{proc.desc}</div>
                  <div className="text-[10px] font-bold pt-1 text-emerald-400 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{proc.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Specifications */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-300">Active Engine Diagnostics:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500">ENGINE:</div>
                  <div className="text-cyan-300 font-bold">Chromium / Blink</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">JS ENGINE:</div>
                  <div className="text-amber-300 font-bold">Google V8 13.0+</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">GRAPHICS:</div>
                  <div className="text-emerald-300 font-bold">ANGLE / Direct3D11 / WebGL</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">AUDIO/VIDEO:</div>
                  <div className="text-indigo-300 font-bold">FFmpeg Chrome Branding</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
