import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, Shield, HardDrive } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { subscribeServiceWorkerStatus, ServiceWorkerStatus } from '../serviceWorkerRegistration';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus>({
    isRegistered: false,
    isOfflineReady: false,
    hasUpdate: false,
    registration: null,
  });
  const [checking, setChecking] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [restoredToast, setRestoredToast] = useState(false);

  useEffect(() => {
    const unsub = subscribeServiceWorkerStatus(setSwStatus);
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setRestoredToast(true);
      const timer = setTimeout(() => {
        setRestoredToast(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleCheckConnection = async () => {
    setChecking(true);
    try {
      await fetch('/api/health', { cache: 'no-store' });
      // If we reach here without throwing
    } catch {
      // Still offline
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  if (restoredToast) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm p-3 rounded-xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 text-xs font-mono shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-xl animate-in fade-in flex items-center gap-2.5">
        <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="flex-1">
          <p className="font-bold">Connection Restored</p>
          <p className="text-[11px] text-emerald-300/80">Online live DNS and cloud threat telemetry re-engaged.</p>
        </div>
      </div>
    );
  }

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md p-3.5 rounded-2xl bg-slate-900/95 border border-amber-500/50 text-amber-200 text-xs font-mono shadow-[0_0_25px_rgba(245,158,11,0.3)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              Offline Mode Active
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </h4>
            <p className="text-[11px] text-slate-400">
              {swStatus.isOfflineReady
                ? 'Core browser shell served from local service worker cache.'
                : 'Using local offline sandbox and state storage.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckConnection}
          disabled={checking}
          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Checking...' : 'Retry'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
        <span className="flex items-center gap-1 text-cyan-300">
          <HardDrive className="w-3 h-3 text-cyan-400" />
          Shell Cached
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <Shield className="w-3 h-3 text-emerald-400" />
          Zero-Trust Vaults Ready
        </span>
      </div>
    </div>
  );
};
