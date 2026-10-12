import React, { useState, useEffect } from 'react';
import { CloudflareVerificationResult } from '../types';
import {
  runCloudflareTurnstileChallenge,
  getStoredCloudflareVerification,
} from '../services/cloudflareVerificationService';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Lock,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  Zap,
} from 'lucide-react';

interface CloudflareVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (res: CloudflareVerificationResult) => void;
}

export const CloudflareVerificationModal: React.FC<CloudflareVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  const [verification, setVerification] = useState<CloudflareVerificationResult | null>(
    () => getStoredCloudflareVerification()
  );
  const [verifying, setVerifying] = useState(false);
  const [turnstileChecked, setTurnstileChecked] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (isOpen && !verification) {
      setTurnstileChecked(false);
    }
  }, [isOpen, verification]);

  if (!isOpen) return null;

  const handleStartVerification = async () => {
    setVerifying(true);
    setTurnstileChecked(false);
    try {
      const res = await runCloudflareTurnstileChallenge();
      setVerification(res);
      setTurnstileChecked(true);
      if (onVerified) onVerified(res);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] bg-slate-950/95 overflow-hidden font-sans">
        {/* Header Bar */}
        <div className="bg-[#121622] px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">Cloudflare Turnstile</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                  Managed Challenge
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">DDoS Protection & Zero-Trust Edge Verification</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-sm p-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Turnstile Interactive Box */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 shadow-inner flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Checkbox box */}
              <button
                type="button"
                onClick={handleStartVerification}
                disabled={verifying}
                className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all ${
                  verification?.verified || turnstileChecked
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : verifying
                    ? 'border-amber-400 bg-amber-500/10 text-amber-400'
                    : 'border-slate-500 bg-slate-800 hover:border-amber-400 text-transparent cursor-pointer'
                }`}
                title="Click to verify you are human"
              >
                {verifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : verification?.verified || turnstileChecked ? (
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                ) : null}
              </button>

              <div>
                <span className="font-medium text-slate-100 text-xs">
                  {verifying
                    ? 'Verifying browser environment...'
                    : verification?.verified
                    ? 'Verified: You are human'
                    : 'Verify you are human'}
                </span>
                <div className="text-[10px] text-slate-400 font-mono">
                  {verification?.verified ? 'Cryptographic handshake validated' : 'Click checkbox to run Turnstile check'}
                </div>
              </div>
            </div>

            {/* Cloudflare logo icon mark */}
            <div className="text-right">
              <div className="text-amber-400 font-bold text-xs tracking-tight flex items-center gap-1 justify-end">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                <span>CLOUDFLARE</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">Turnstile v3</span>
            </div>
          </div>

          {/* Verification Results Panel */}
          {verification && (
            <div className="space-y-3 font-mono">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ray ID:</span>
                  <span className="text-amber-300 font-bold">{verification.rayId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Edge PoP Data Center:</span>
                  <span className="text-teal-300 font-bold">{verification.edgePoP}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">IP Routing:</span>
                  <span className="text-slate-300">{verification.ipAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">TLS Cipher:</span>
                  <span className="text-emerald-400">{verification.tlsVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Threat / Bot Score:</span>
                  <span className="text-emerald-400 font-bold">0 / 100 (Clean Human)</span>
                </div>
              </div>

              {/* Turnstile Token */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Cryptographic Turnstile Token</span>
                  <button
                    type="button"
                    onClick={() => handleCopyToken(verification.turnstileToken)}
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                  </button>
                </div>
                <div className="text-[10px] text-cyan-300 break-all select-all font-mono">
                  {verification.turnstileToken}
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={handleStartVerification}
              disabled={verifying}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              <span>Re-run Challenge</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
            >
              Confirm & Return to App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
