import React, { useState } from 'react';
import {
  Download,
  Shield,
  ShieldAlert,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  Terminal,
  Activity,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  FileCode2,
  KeyRound,
  Play,
  RotateCw,
  Palette,
  Smartphone,
  Monitor,
  Share2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { BrowserView } from './BrowserView';
import { UserAccount } from '../types';

interface AegisBrowserLandingProps {
  initialUrl: string;
  currentUser: UserAccount | null;
  onUserChange: (user: UserAccount | null) => void;
  onOpenThemeModal: () => void;
  onOpenCommandPalette: () => void;
  onOpenCloudflareModal: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
}

export const AegisBrowserLanding: React.FC<AegisBrowserLandingProps> = (props) => {
  const pwa = usePWAInstall();
  const [isFullscreenDemo, setIsFullscreenDemo] = useState<boolean>(false);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [downloadType, setDownloadType] = useState<'setup' | 'portable' | 'apk' | 'mobile'>('setup');

  const isMobile =
    typeof window !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768);

  const [downloadPlatform, setDownloadPlatform] = useState<'windows' | 'mobile'>(() => {
    return isMobile ? 'mobile' : 'windows';
  });

  const GITHUB_REPO = 'https://github.com/narendraborhade-creator/Ageis-scanner';
  const RELEASE_TAG = 'v1.0.0';
  const SETUP_EXE_URL = `${GITHUB_REPO}/releases/download/${RELEASE_TAG}/Aegis-3D-Safe-Browser-Setup-1.0.0.exe`;
  const PORTABLE_EXE_URL = `${GITHUB_REPO}/releases/download/${RELEASE_TAG}/Aegis-3D-Safe-Browser-1.0.0.exe`;
  const ANDROID_APK_URL = `${GITHUB_REPO}/releases/download/${RELEASE_TAG}/Aegis-3D-Safe-Browser.apk`;

  const handleTriggerDownload = (type: 'setup' | 'portable' | 'apk') => {
    setDownloadType(type);
    setShowDownloadModal(true);

    let targetUrl = SETUP_EXE_URL;
    let fileName = 'Aegis-3D-Safe-Browser-Setup.exe';

    if (type === 'portable') {
      targetUrl = PORTABLE_EXE_URL;
      fileName = 'Aegis-3D-Safe-Browser.exe';
    } else if (type === 'apk') {
      targetUrl = ANDROID_APK_URL;
      fileName = 'Aegis-3D-Safe-Browser.apk';
    }

    // Trigger direct browser download
    const link = document.createElement('a');
    link.href = targetUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full theme-bg text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans relative overflow-x-hidden transition-colors duration-300">
      {/* Background Cyber Mesh & Glass Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[55vw] h-[55vw] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      {/* TOP SOC TELEMETRY & NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                AEGIS SAFE BROWSER
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                DEFCON 1 ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Zero-Trust Chromium Desktop Engine · Jaeger Security APIs · Depot Tools
            </p>
          </div>
        </div>

        {/* Action Controls & Download CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={props.onOpenThemeModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer"
            title="Change Visual Theme"
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Theme</span>
          </button>
          <a
            href="#live-demo"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Interactive Demo</span>
          </a>
          <a
            href="#bento-grid"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>SOC Architecture</span>
          </a>
          <button
            type="button"
            onClick={() => handleTriggerDownload('setup')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Download</span>
            <span>.exe</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION: SOC MISSION-CONTROL + BENTO GLASSMORPHISM */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-12 flex flex-col items-center text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Windows Desktop Release v1.0.0 is Live · Chromium 130 Engine</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-100 max-w-4xl leading-[1.15]">
          A Next-Gen Browser Engineered for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
            Total Web Sovereignty
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl font-normal leading-relaxed">
          Break free from web sandbox constraints. Download the native Windows Chromium browser featuring an authentic
          SOC telemetry HUD, real-time quantum DNS shielding, and high-performance WebGL threat topology.
        </p>

        {/* PLATFORM SELECTOR TABS (WINDOWS DESKTOP VS MOBILE VERSION) */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <button
            type="button"
            onClick={() => setDownloadPlatform('windows')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              downloadPlatform === 'windows'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Windows Desktop (.exe)</span>
          </button>
          <button
            type="button"
            onClick={() => setDownloadPlatform('mobile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              downloadPlatform === 'mobile'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Version (Android & iOS)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              PWA
            </span>
          </button>
        </div>

        {/* BENTO HERO DOWNLOAD CENTER */}
        {downloadPlatform === 'mobile' ? (
          <div className="w-full max-w-3xl p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Smartphone className="w-4 h-4" />
                <span>MOBILE BROWSER APP (ANDROID & iOS)</span>
              </div>
              <h3 className="text-lg font-bold text-white">Aegis Mobile Safe Browser</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Install directly to your Android or iPhone home screen. Enjoy zero-latency browsing, ad-free YouTube player, quantum DNS shield, and threat analytics on mobile.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Android (Chrome/Brave) & iOS (Safari)
                </span>
                <span>·</span>
                <span className="text-cyan-300">Offline PWA Cache</span>
                <span>·</span>
                <span className="text-emerald-300">Zero App Store Overhead</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => handleTriggerDownload('apk')}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Smartphone className="w-4 h-4 stroke-[2.5]" />
                <span>Download Android APK (.apk)</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (pwa.isInstallable) {
                    await pwa.promptInstall();
                  } else {
                    setDownloadType('mobile');
                    setShowDownloadModal(true);
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{pwa.isInstalled ? 'PWA Installed' : 'Install PWA'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreenDemo(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span>Launch Web Sandbox</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Cpu className="w-4 h-4" />
                <span>NATIVE CHROMIUM ENGINE (x64 WINDOWS)</span>
              </div>
              <h3 className="text-lg font-bold text-white">Get Aegis Safe Browser for Windows</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Standalone executable with built-in Chromium runtime. Enjoy unrestricted access to YouTube, Google,
                banking, and social platforms with zero CORS errors and zero latency.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 64-bit Windows 10/11
                </span>
                <span>·</span>
                <span>143 MB</span>
                <span>·</span>
                <span className="text-cyan-300">Self-Contained Installer</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => handleTriggerDownload('setup')}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Download .exe (Installer)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerDownload('portable')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <span>Portable .exe</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick PowerShell Command */}
        <div className="w-full max-w-xl flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-500">PowerShell:</span>
            <code className="text-cyan-300 select-all truncate">
              irm https://aegisscans.dev/downloads/Install-AegisBrowser.ps1 | iex
            </code>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText('irm https://aegisscans.dev/downloads/Install-AegisBrowser.ps1 | iex');
              alert('Copied PowerShell installer command to clipboard!');
            }}
            className="text-[10px] text-cyan-400 hover:text-cyan-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
          >
            Copy
          </button>
        </div>
      </section>

      {/* INTERACTIVE LIVE BROWSER DEMO SECTION */}
      <section id="live-demo" className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                Live Interactive Browser Sandbox Demo
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Test tabs, quantum DNS scanning, YouTube streaming, and 3D telemetry directly in your browser.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreenDemo((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {isFullscreenDemo ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Expand Fullscreen</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTriggerDownload('setup')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-md shadow-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Desktop .exe</span>
            </button>
          </div>
        </div>

        {/* BROWSER VIEWPORT FRAME (SOC GLASSMORPHISM CONTAINER) */}
        <div
          className={`w-full transition-all duration-300 rounded-3xl overflow-hidden border border-cyan-500/30 bg-slate-950/80 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col ${
            isFullscreenDemo ? 'fixed inset-0 z-50 rounded-none border-0' : 'h-[540px] sm:h-[720px] md:h-[820px]'
          }`}
        >
          {/* Simulated Window Title Bar */}
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono select-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-slate-500 ml-2">|</span>
              <span className="text-slate-300 font-bold">Aegis Safe Browser · Mission Control Web Sandbox</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                Interactive Web Demo Active
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreenDemo((prev) => !prev)}
                className="text-slate-400 hover:text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreenDemo ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Embedded Full Browser View */}
          <div className="flex-1 w-full h-full min-h-0 overflow-hidden relative">
            <BrowserView {...props} />
          </div>
        </div>
      </section>

      {/* BENTO GRID: SOC TELEMETRY + CLEAN SAAS ARCHITECTURE */}
      <section id="bento-grid" className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
            System Capabilities
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Engineered for High-Assurance Cyber Operations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Combining Chromium OS codesearch design principles with SOC defense telemetry and Bento glassmorphism.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Bento Card 1: SOC Mission Control */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">SOC Mission Control & DNS Shield</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous DNS origin reconnaissance. Detects exposed origin IPs behind Cloudflare/Fastly WAFs,
                evaluates DoH cryptographic encryption, and blocks AitM credential relay attacks.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-cyan-300">
              <span>RFC 8484 DoH Verified</span>
              <span>100% Zero-Trust</span>
            </div>
          </div>

          {/* Bento Card 2: True Chromium Desktop Process */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Process Desktop Chromium</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When downloaded as a Windows .exe, Aegis runs real Google Chromium processes with hardware GPU
                acceleration, full video codecs, and zero web iframe constraints.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-emerald-300">
              <span>Native Blink Engine</span>
              <span>Multi-Process Sandbox</span>
            </div>
          </div>

          {/* Bento Card 3: Jaeger Security APIs & Depot Tools */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <FileCode2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Chromium Depot Tools & Security APIs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct implementation of Google Chromium depot_tools parameters and Jaeger Security APIs specification.
                Customizable browser runtime flags, memory limits, and process isolation.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-indigo-300">
              <span>Depot Tools Build Flags</span>
              <span>Jaegeral Spec</span>
            </div>
          </div>

          {/* Bento Card 4: AES-256 Vault */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">AES-256-GCM Password Vault</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero-knowledge offline credentials vault. Securely stores passwords, API tokens, and private SSH keys
                using hardware-bound encryption keys and PBKDF2 derivation.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-amber-300">
              <span>Zero-Knowledge Vault</span>
              <span>AES-256 GCM</span>
            </div>
          </div>

          {/* Bento Card 5: 3D Cyber Core Topology */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">3D Cyber Core Topology Scanner</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time WebGL Three.js particle core visualizing incoming network packets, SSL cipher strength, and
                quantum threat vectors directly on your start page.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-teal-300">
              <span>60 FPS WebGL</span>
              <span>Interactive Shader Core</span>
            </div>
          </div>

          {/* Bento Card 6: Clean SaaS Productivity */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/40 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Clean SaaS Omnibar & Speed Dial</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Keyboard-first navigation (Ctrl+T, Ctrl+W, Ctrl+K), Opera-style collapsible utility sidebar, Chrome
                tab context menu, and ad-free in-browser YouTube streaming.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-rose-300">
              <span>Command Palette</span>
              <span>Opera Sidebar</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 z-10">
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-300">Aegis 3D Safe Browser</span>
          <span>·</span>
          <span>Developed by Narendra Borhade</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>·</span>
          <button
            type="button"
            onClick={() => handleTriggerDownload('setup')}
            className="text-cyan-400 hover:text-cyan-200 transition-colors"
          >
            Download .exe Installer
          </button>
        </div>
      </footer>

      {/* DOWNLOAD & MOBILE INSTALLATION INSTRUCTIONS MODAL */}
      {showDownloadModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDownloadModal(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  {downloadType === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {downloadType === 'mobile' ? 'Install Aegis Mobile Browser' : 'Downloading Aegis Safe Browser...'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {downloadType === 'mobile'
                      ? 'Progressive Web App (Android & iOS)'
                      : downloadType === 'portable'
                      ? 'Aegis-3D-Safe-Browser.exe (Portable)'
                      : 'Aegis-3D-Safe-Browser-Setup.exe'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {downloadType === 'mobile' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Instant Mobile Home Screen Installation</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Install Aegis Safe Browser directly to your phone. It runs in standalone fullscreen with offline caching, zero CORS errors, and built-in quantum DNS defense.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pwa.isInstallable && (
                      <button
                        type="button"
                        onClick={async () => {
                          await pwa.promptInstall();
                          setShowDownloadModal(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md"
                      >
                        Install App Now
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowDownloadModal(false);
                        setIsFullscreenDemo(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700"
                    >
                      Launch Fullscreen Web Browser
                    </button>
                  </div>
                </div>

                {/* Mobile Step-by-Step Guide */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    How to Install on Mobile:
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <span>Android (Chrome / Brave / Edge)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Tap the 3-dots menu <strong className="text-white">⋮</strong> at top right, then select{' '}
                        <strong className="text-cyan-300">"Install app"</strong> or{' '}
                        <strong className="text-cyan-300">"Add to Home screen"</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>iPhone & iPad (Safari)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Tap the Share button <strong className="text-white">⎋</strong> at the bottom of Safari, scroll down, and tap{' '}
                        <strong className="text-cyan-300">"Add to Home Screen"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Download should start automatically</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    If your browser blocked the download or it didn't start, click the direct link below:
                  </p>
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <a
                      href={downloadType === 'apk' ? ANDROID_APK_URL : downloadType === 'portable' ? PORTABLE_EXE_URL : SETUP_EXE_URL}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                    >
                      {downloadType === 'apk' ? 'Download .apk Directly' : 'Direct Download Link'}
                    </a>
                    <a
                      href={`${GITHUB_REPO}/releases`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
                    >
                      <span>All Releases</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Quick Setup Instructions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Next Steps:</h4>
                  {downloadType === 'apk' ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono flex items-center justify-center shrink-0 text-[10px]">
                          1
                        </span>
                        <span className="text-slate-300">
                          If Android prompts <strong className="text-white">"File might be harmful"</strong>, tap <strong className="text-white">"Download anyway"</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono flex items-center justify-center shrink-0 text-[10px]">
                          2
                        </span>
                        <span className="text-slate-300">
                          Open <strong className="text-white">Aegis-3D-Safe-Browser.apk</strong> from your notifications or Downloads.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono flex items-center justify-center shrink-0 text-[10px]">
                          3
                        </span>
                        <span className="text-slate-300">
                          Tap <strong className="text-white">"Install"</strong> (enable install unknown apps if prompted) to launch Aegis Safe Browser on your phone!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono flex items-center justify-center shrink-0 text-[10px]">
                          1
                        </span>
                        <span className="text-slate-300">
                          Open your browser downloads and run <strong className="text-white">Aegis-3D-Safe-Browser-Setup-1.0.0.exe</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono flex items-center justify-center shrink-0 text-[10px]">
                          2
                        </span>
                        <span className="text-slate-300">
                          If Windows Defender prompts, click <strong className="text-white">"More info"</strong> then{' '}
                          <strong className="text-white">"Run anyway"</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono flex items-center justify-center shrink-0 text-[10px]">
                          3
                        </span>
                        <span className="text-slate-300">
                          Aegis Browser launches instantly with native Chromium speed, 0 CORS errors, and full web compatibility!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowDownloadModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
