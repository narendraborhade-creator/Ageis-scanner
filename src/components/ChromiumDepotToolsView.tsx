/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Chromium Depot Tools & Engine Studio View
 * Grounded in https://source.chromium.org/chromium/chromium/tools/depot_tools/+/main:
 * and https://chromium.googlesource.com/chromium/tools/depot_tools
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
  Search,
  FileCode,
  FolderTree,
  FileText,
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
  SOURCE_CHROMIUM_DEPOT_TOOLS_FILES,
  SourceChromiumTreeFile,
  DEPOT_TOOLS_MAIN_URL,
} from '../services/chromiumDepotToolsService';

interface ChromiumDepotToolsViewProps {
  onRestartWithFlags?: (flags: ChromiumRuntimeFlag[]) => void;
  onNavigateToBrowserUrl?: (url: string) => void;
}

export const ChromiumDepotToolsView: React.FC<ChromiumDepotToolsViewProps> = ({
  onRestartWithFlags,
  onNavigateToBrowserUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'depot-tools' | 'source-search' | 'gn-args' | 'flags' | 'architecture'>('source-search');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Depot tools state
  const [selectedTool, setSelectedTool] = useState<DepotToolItem>(DEPOT_TOOLS_CATALOG[0]);
  const [customArgs, setCustomArgs] = useState(DEPOT_TOOLS_CATALOG[0].defaultArgs || '');
  const [setupPlatform, setSetupPlatform] = useState<'windows' | 'linux' | 'macos'>('windows');

  // source.chromium.org Tree Explorer State
  const [selectedSourceFile, setSelectedSourceFile] = useState<SourceChromiumTreeFile>(SOURCE_CHROMIUM_DEPOT_TOOLS_FILES[0]);
  const [sourceSearchFilter, setSourceSearchFilter] = useState('');

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

  const filteredSourceFiles = SOURCE_CHROMIUM_DEPOT_TOOLS_FILES.filter((f) =>
    f.name.toLowerCase().includes(sourceSearchFilter.toLowerCase()) ||
    f.description.toLowerCase().includes(sourceSearchFilter.toLowerCase())
  );

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                <span>Chromium Depot Tools & Source Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  source.chromium.org
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct source explorer, build recipes & toolchain from <code className="text-cyan-300">chromium/tools/depot_tools/+/main:</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToBrowserUrl && (
              <button
                type="button"
                onClick={() => onNavigateToBrowserUrl(DEPOT_TOOLS_MAIN_URL)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs border border-cyan-500/40 transition-colors cursor-pointer"
                title="Open live source.chromium.org in Aegis Browser Tab"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open In Browser</span>
              </button>
            )}
            <a
              href={DEPOT_TOOLS_MAIN_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors"
            >
              <span>source.chromium.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Navigation Switchers */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 flex-wrap">
          {[
            { id: 'source-search', label: 'Source Code Explorer', icon: FolderTree },
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

      {/* 1. SOURCE CODE EXPLORER & TREE VIEW (source.chromium.org) */}
      {activeTab === 'source-search' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200 text-xs">
                  source.chromium.org/chromium/chromium/tools/depot_tools/+/main:
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={sourceSearchFilter}
                  onChange={(e) => setSourceSearchFilter(e.target.value)}
                  placeholder="Filter depot_tools files..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              {/* File List Tree */}
              <div className="md:col-span-4 space-y-1.5 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                {filteredSourceFiles.map((file) => {
                  const isSelected = selectedSourceFile.name === file.name;
                  return (
                    <button
                      key={file.name}
                      type="button"
                      onClick={() => setSelectedSourceFile(file)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold'
                          : 'bg-slate-900/40 hover:bg-slate-850 text-slate-300 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{file.size}</span>
                    </button>
                  );
                })}
              </div>

              {/* Code Preview & Upstream Inspector */}
              <div className="md:col-span-8 p-3.5 rounded-xl bg-black/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-slate-100 text-xs">{selectedSourceFile.name}</span>
                      <span className="text-[10px] text-slate-400 font-sans">({selectedSourceFile.description})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedSourceFile.codeSnippet, `src-${selectedSourceFile.name}`)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        {copiedId === `src-${selectedSourceFile.name}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                      <a
                        href={selectedSourceFile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-[11px] flex items-center gap-1 border border-cyan-500/40"
                      >
                        <span>View Upstream</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Upstream URL:{' '}
                    <a
                      href={selectedSourceFile.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline break-all"
                    >
                      {selectedSourceFile.url}
                    </a>
                  </div>

                  <pre className="p-3 rounded-lg bg-[#040813] border border-slate-850 text-cyan-300/90 font-mono text-[11px] overflow-x-auto max-h-[300px] scrollbar-thin whitespace-pre leading-relaxed select-all">
                    {selectedSourceFile.codeSnippet}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>File Size: {selectedSourceFile.size}</span>
                  {onNavigateToBrowserUrl && (
                    <button
                      type="button"
                      onClick={() => onNavigateToBrowserUrl(selectedSourceFile.url)}
                      className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Open in Browser Viewport</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DEPOT TOOLS SUITE VIEW */}
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
                        : 'bg-slate-900/40 hover:bg-slate-850 text-slate-300 border-slate-800/80'
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40 text-xs">
                      {selectedTool.command}
                    </span>
                    <span className="text-slate-400 text-[11px] font-sans">({selectedTool.filename})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedTool.sourceChromiumUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] hover:underline"
                    >
                      <span>source.chromium.org</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <p className="text-slate-300 text-xs font-sans leading-relaxed">
                  {selectedTool.description}
                </p>

                {/* Interactive CLI Command Preview */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Configure CLI Arguments:</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-black/60 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200">
                      <span className="text-cyan-400 mr-2 shrink-0">{selectedTool.command}</span>
                      <input
                        type="text"
                        value={customArgs}
                        onChange={(e) => setCustomArgs(e.target.value)}
                        placeholder="arguments..."
                        className="w-full bg-transparent text-slate-200 focus:outline-none font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${selectedTool.command} ${customArgs}`.trim(), selectedTool.id)}
                      className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedId === selectedTool.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Command</span>
                    </button>
                  </div>
                </div>

                {/* Upstream Python Source Preview */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Upstream Implementation Preview:</span>
                    <a
                      href={selectedTool.sourceChromiumUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline"
                    >
                      Inspect full {selectedTool.filename} on source.chromium.org
                    </a>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/80 border border-slate-800 text-cyan-300/90 font-mono text-[11px] overflow-x-auto max-h-[160px] scrollbar-thin select-all">
                    {selectedTool.sourcePreview}
                  </pre>
                </div>
              </div>

              {/* Quick Platform Setup Guide */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] font-bold text-slate-300">Depot Tools Automated Setup Pipeline:</div>
                  <div className="flex items-center gap-1">
                    {(['windows', 'linux', 'macos'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSetupPlatform(p)}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold cursor-pointer transition-colors ${
                          setupPlatform === p ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto select-all leading-relaxed max-h-28 scrollbar-thin">
                    {generateDepotToolsSetupScript(setupPlatform)}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy(generateDepotToolsSetupScript(setupPlatform), 'setup-script')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Copy setup script"
                  >
                    {copiedId === 'setup-script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GN ARGS BUILD GENERATOR VIEW */}
      {activeTab === 'gn-args' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Presets List */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-300 mb-2">args.gn Presets:</div>
              <div className="space-y-1.5">
                {GN_BUILD_ARG_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset);
                      setGnOutput(preset.argsContent);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border ${
                      selectedPreset.id === preset.id
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold'
                        : 'bg-slate-900/40 hover:bg-slate-850 text-slate-300 border-slate-800/80'
                    }`}
                  >
                    <div className="text-xs">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 pt-0.5">{preset.targetEnv}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated args.gn Editor */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{selectedPreset.name}</h4>
                    <p className="text-[11px] text-slate-400 font-sans">{selectedPreset.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(gnOutput, 'gn-output')}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedId === 'gn-output' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy args.gn</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {selectedPreset.features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[10px]"
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>

                <div className="relative pt-1">
                  <textarea
                    value={gnOutput}
                    onChange={(e) => setGnOutput(e.target.value)}
                    rows={9}
                    className="w-full p-3 rounded-xl bg-black/80 border border-slate-800 text-cyan-300 font-mono text-xs focus:border-cyan-400 focus:outline-none scrollbar-thin select-all"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <div>
                  Compile command: <code className="text-cyan-300">autoninja -C out/Default chrome</code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('autoninja -C out/Default chrome', 'ninja-cmd')}
                  className="hover:text-cyan-300 cursor-pointer ml-2"
                >
                  {copiedId === 'ninja-cmd' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CHROMIUM RUNTIME FLAGS VIEW (chrome://flags) */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Chromium Runtime Hardware & Security Flags</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Toggle browser engine switches equivalent to chrome://flags for 60FPS rasterization, AV1 decoding & V8 heap.
                </p>
              </div>

              {flagsUpdatedNotice && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Flags persisted to browser state</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {runtimeFlags.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-2 transition-colors"
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

      {/* 5. ENGINE ARCHITECTURE & V8 VIEW */}
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
