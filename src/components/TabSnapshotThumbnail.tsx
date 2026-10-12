import React from 'react';
import { BrowserTab } from '../types';
import {
  Shield,
  ShieldAlert,
  Lock,
  Globe,
  Moon,
  CheckCircle2,
  ExternalLink,
  Flame,
  FileText,
  Code2,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TabSnapshotThumbnailProps {
  tab: BrowserTab;
  className?: string;
  showChromeBar?: boolean;
}

export const TabSnapshotThumbnail: React.FC<TabSnapshotThumbnailProps> = ({
  tab,
  className = '',
  showChromeBar = true,
}) => {
  const domain = tab.domain.toLowerCase();
  const isCloudflare = domain.includes('cloudflare');
  const isGithub = domain.includes('github');
  const isArxiv = domain.includes('arxiv');
  const isGoogle = domain.includes('google');
  const isWikipedia = domain.includes('wikipedia') || domain.includes('wiki');

  return (
    <div
      className={`relative w-full h-36 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 flex flex-col shadow-inner select-none ${className}`}
    >
      {/* Mini Browser Chrome Bar */}
      {showChromeBar && (
        <div className="h-6 bg-slate-900/90 border-b border-slate-800/90 px-2 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500/70" />
            <span className="w-2 h-2 rounded-full bg-amber-500/70" />
            <span className="w-2 h-2 rounded-full bg-emerald-500/70" />
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[9px] max-w-[170px] truncate text-slate-300">
            {tab.isHttps ? (
              <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            ) : (
              <Globe className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{tab.domain}</span>
          </div>

          <div className="flex items-center gap-1 text-[9px] text-cyan-400">
            {tab.isSuspended ? (
              <span className="flex items-center gap-0.5 text-amber-400 text-[8px] px-1 rounded bg-amber-950/60 border border-amber-500/30">
                <Moon className="w-2 h-2" /> Sleeping
              </span>
            ) : tab.isQuarantined ? (
              <span className="flex items-center gap-0.5 text-rose-400 text-[8px] px-1 rounded bg-rose-950/60 border border-rose-500/30">
                <ShieldAlert className="w-2 h-2" /> Blocked
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-emerald-400 text-[8px]">
                <CheckCircle2 className="w-2.5 h-2.5" /> Secure
              </span>
            )}
          </div>
        </div>
      )}

      {/* Snapshot Body */}
      <div className="flex-1 relative overflow-hidden bg-slate-950 text-slate-200">
        {/* Suspended Sleeping Overlay */}
        {tab.isSuspended ? (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs z-10 flex flex-col items-center justify-center p-3 text-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Moon className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-200 font-mono">Tab Suspended</div>
            <p className="text-[10px] text-slate-400 leading-tight max-w-[200px]">
              Sleeping to conserve system memory ({Math.round(tab.memoryMb || 50)} MB freed)
            </p>
          </div>
        ) : tab.isQuarantined ? (
          /* Quarantined / Threat Blocked Snapshot */
          <div className="absolute inset-0 bg-gradient-to-b from-rose-950/70 to-slate-950 flex flex-col items-center justify-center p-3 text-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-rose-300 font-mono">Threat Intercepted</div>
            <p className="text-[10px] text-slate-300 leading-tight max-w-[210px]">
              Malicious scripts & trackers quarantined by Aegis Threat Engine.
            </p>
          </div>
        ) : isCloudflare ? (
          /* Cloudflare Snapshot Mockup */
          <div className="p-2.5 h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/30">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-orange-500/20 flex items-center justify-center text-orange-400">
                  <Flame className="w-3 h-3 fill-orange-400" />
                </div>
                <span className="text-[11px] font-bold tracking-tight text-white font-sans">
                  CLOUDFLARE
                </span>
              </div>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                1.1.1.1 DNS OK
              </span>
            </div>

            <div className="my-auto space-y-1">
              <div className="text-[11px] font-bold text-slate-100 font-sans leading-tight">
                Connectivity Cloud & Zero Trust Security
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <div className="bg-slate-900/90 border border-slate-800 rounded p-1 text-center">
                  <div className="text-[8px] text-slate-400 font-mono">DDoS Defense</div>
                  <div className="text-[10px] text-orange-400 font-bold font-mono">321 Tbps</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded p-1 text-center">
                  <div className="text-[8px] text-slate-400 font-mono">Edge PoPs</div>
                  <div className="text-[10px] text-cyan-400 font-bold font-mono">330+ Cities</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded p-1 text-center">
                  <div className="text-[8px] text-slate-400 font-mono">Latency</div>
                  <div className="text-[10px] text-emerald-400 font-bold font-mono">24 ms</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono pt-1 border-t border-slate-850">
              <span>Zero-Trust Gateway</span>
              <span className="text-cyan-400">Live Telemetry</span>
            </div>
          </div>
        ) : isGithub ? (
          /* GitHub Snapshot Mockup */
          <div className="p-2.5 h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-slate-200">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                </div>
                <span className="text-[11px] font-bold text-white font-sans">GitHub</span>
              </div>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                Public Repo
              </span>
            </div>

            <div className="my-auto space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 font-semibold truncate">
                <span>aegis-security</span>
                <span className="text-slate-500">/</span>
                <span className="text-white">3d-safe-browser</span>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight line-clamp-2">
                Next-Gen threat blocking, DNS scanner, and sandboxed web browser built with React & Three.js.
              </p>
              <div className="flex items-center gap-2 pt-0.5 text-[8px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-amber-400">★ 1.8k stars</span>
                <span>TypeScript 94%</span>
                <span className="text-emerald-400">passing</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono pt-1 border-t border-slate-850">
              <span>main branch</span>
              <span className="text-slate-400">Updated 2h ago</span>
            </div>
          </div>
        ) : isArxiv ? (
          /* arXiv Science Snapshot Mockup */
          <div className="p-2.5 h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-cyan-300 font-mono">arXiv:2501.0942</span>
              </div>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                cs.CR Security
              </span>
            </div>

            <div className="my-auto space-y-1">
              <div className="text-[11px] font-bold text-slate-100 font-sans leading-tight line-clamp-1">
                Zero-Trust Sandboxing for High-Risk Web Surfing
              </div>
              <p className="text-[9px] text-slate-400 leading-tight line-clamp-2 font-serif italic">
                Abstract: We present an isolated browser architecture incorporating client-side threat blocking and automated DNS validation...
              </p>
              <div className="text-[8px] text-slate-500 font-mono">
                Authors: Narendra Borhade, Aegis Research Team
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono pt-1 border-t border-slate-850">
              <span className="text-cyan-400">PDF Download Available</span>
              <span>Peer Reviewed</span>
            </div>
          </div>
        ) : isGoogle ? (
          /* Google Snapshot Mockup */
          <div className="p-2.5 h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1">
              <div className="flex items-center gap-1 text-[11px] font-bold font-sans">
                <span className="text-blue-400">G</span>
                <span className="text-red-400">o</span>
                <span className="text-amber-400">o</span>
                <span className="text-blue-400">g</span>
                <span className="text-emerald-400">l</span>
                <span className="text-red-400">e</span>
              </div>
              <span className="text-[8px] text-slate-500 font-mono">Search Portal</span>
            </div>

            <div className="my-auto text-center space-y-1.5">
              <div className="w-full max-w-[200px] mx-auto py-1 px-2.5 rounded-full bg-slate-900 border border-slate-700/80 text-[9px] text-slate-400 flex items-center justify-between">
                <span className="truncate">aegis 3d safe browser</span>
                <Search className="w-2.5 h-2.5 text-cyan-400" />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[8px]">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">Google Search</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">I'm Feeling Lucky</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono pt-1 border-t border-slate-850">
              <span>SafeSearch: Active</span>
              <span className="text-emerald-400">Verified TLS</span>
            </div>
          </div>
        ) : isWikipedia ? (
          /* Wikipedia Snapshot Mockup */
          <div className="p-2.5 h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-[11px] font-serif font-bold text-slate-200">WIKIPEDIA</span>
              <span className="text-[8px] font-mono text-slate-400">The Free Encyclopedia</span>
            </div>

            <div className="my-auto space-y-1">
              <div className="text-[11px] font-serif font-semibold text-slate-100 leading-tight">
                Web Browser Sandboxing
              </div>
              <p className="text-[9px] text-slate-400 leading-tight line-clamp-2">
                In computer security, a sandbox is an isolated testing environment that enables users to run programs or execute files without affecting the application or operating system...
              </p>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono pt-1 border-t border-slate-850">
              <span>Articles: 6.8M</span>
              <span className="text-cyan-400">Encyclopedia Entry</span>
            </div>
          </div>
        ) : (
          /* Generic High-Fidelity Website Snapshot Layout */
          <div className="p-2.5 h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900/90 to-cyan-950/20">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Globe className="w-2.5 h-2.5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-200 truncate max-w-[130px]">
                  {tab.domain}
                </span>
              </div>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                SSL {tab.sslGrade}
              </span>
            </div>

            <div className="my-auto space-y-1.5">
              <div className="text-[11px] font-bold text-slate-100 font-mono leading-tight line-clamp-1">
                {tab.title}
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-4/5 rounded bg-slate-800/80" />
                <div className="h-1.5 w-3/5 rounded bg-slate-800/60" />
              </div>
              <div className="flex items-center gap-2 pt-0.5 text-[8px] font-mono text-slate-400">
                <span className="text-emerald-400">Score: {tab.securityScore}/100</span>
                <span>•</span>
                <span>{tab.trackersBlocked} Trackers Blocked</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono pt-1 border-t border-slate-850">
              <span className="truncate max-w-[130px]">{tab.url}</span>
              <span className="text-cyan-400 font-bold shrink-0">Aegis Verified</span>
            </div>
          </div>
        )}

        {/* Subtle Watermark Overlay */}
        <div className="absolute bottom-1 right-2 pointer-events-none opacity-20 text-[7px] font-mono text-cyan-400 tracking-wider">
          AEGIS SANDBOX SNAPSHOT
        </div>
      </div>
    </div>
  );
};
