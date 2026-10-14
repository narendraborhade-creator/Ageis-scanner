import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  EyeOff,
  ArrowRight,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface LinkAuthPromptModalProps {
  isOpen: boolean;
  targetUrl: string;
  onClose: () => void;
  onContinueAsGuest: (rememberForSession: boolean) => void;
  onLoginWithGmail: (email: string, rememberForSession: boolean) => void;
}

export const LinkAuthPromptModal: React.FC<LinkAuthPromptModalProps> = ({
  isOpen,
  targetUrl,
  onClose,
  onContinueAsGuest,
  onLoginWithGmail,
}) => {
  const [gmailInput, setGmailInput] = useState('');
  const [rememberSession, setRememberSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGuestSubmit = () => {
    setErrorMsg(null);
    onContinueAsGuest(rememberSession);
  };

  const handleGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = gmailInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your Gmail address.');
      return;
    }
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMsg('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }
    try {
      onLoginWithGmail(trimmed, rememberSession);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  const formatDomain = (url: string) => {
    try {
      return url.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0];
    } catch {
      return url;
    }
  };

  const domain = formatDomain(targetUrl);
  const isHttps = targetUrl.startsWith('https://');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Link Security Verification"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg bg-[#050914] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col ring-1 ring-cyan-500/20">
        {/* Modal Header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                Aegis Zero-Trust Security Gate
              </h3>
              <p className="text-[11px] text-slate-400">
                Security verification required before accessing external links
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cancel Navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Destination Preview Pill */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Destination Endpoint:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {isHttps ? 'TLS Encrypted' : 'Standard Web'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate flex-1 font-semibold text-slate-200">{targetUrl}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 shrink-0">
              {domain}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            To prevent automatic unauthorized session leakage and keep your browsing secure, choose whether you want to navigate as a <strong className="text-slate-200">Guest</strong> or <strong className="text-cyan-300">Log in with your Gmail</strong>.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs font-mono text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Option 1: Continue as Guest */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 transition-all space-y-2.5 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 font-mono">
                    Use as a Guest
                  </h4>
                  <span className="text-[10px] text-teal-400 font-medium">Zero-Trace Sandboxed Session</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-500/30">
                Ephemeral
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Browse without saving history, cookies, or credentials. All telemetry is quarantined inside an isolated container.
            </p>
            <button
              type="button"
              onClick={handleGuestSubmit}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 border border-slate-700/80 hover:border-teal-500/50 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <EyeOff className="w-3.5 h-3.5 text-teal-400" />
              <span>Continue as Guest & Open Link</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>

          {/* Option 2: Log in with Gmail */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/30 hover:border-cyan-400/60 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 font-mono">
                    Log in with Gmail
                  </h4>
                  <span className="text-[10px] text-cyan-400 font-medium">Sync Encrypted Vault & Telemetry</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                Verified Vault
              </span>
            </div>

            <form onSubmit={handleGmailSubmit} className="space-y-2.5">
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  placeholder="Enter your email (e.g. yourname@gmail.com)"
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Log In with Gmail & Open Link</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberSession}
              onChange={(e) => setRememberSession(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Remember choice for this session</span>
          </label>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-1 px-2.5 rounded hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
