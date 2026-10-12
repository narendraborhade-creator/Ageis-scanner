import React, { useState } from 'react';
import { Download, Sparkles, X, Smartphone, CheckCircle2, Shield } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed in standalone mode, suppress
  if (isInstalled) {
    return null;
  }

  // If on iOS Safari
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSModal(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          title="Install Aegis 3D Safe Browser on iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/40 p-5 shadow-2xl text-slate-100 font-sans space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono">Install on iOS / Safari</h3>
                    <p className="text-[11px] text-slate-400">Add Aegis to your Home Screen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold">1.</span>
                  <span>Tap the <strong>Share</strong> button (box with upward arrow) in the Safari toolbar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold">2.</span>
                  <span>Scroll down the action sheet and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold">3.</span>
                  <span>Launch Aegis directly from your home screen with offline caching enabled!</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // If install prompt event was captured (Chromium, Edge, Android)
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border bg-gradient-to-r from-cyan-950 to-slate-900 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]"
        title="Install Aegis 3D Safe Browser as Desktop / Mobile App"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
        <span className="hidden sm:inline">Install PWA</span>
        <span className="sm:hidden font-bold">Install</span>
      </button>
    );
  }

  return null;
};
