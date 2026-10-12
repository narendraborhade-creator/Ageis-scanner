import React, { useState } from 'react';
import { Mail, Shield, User, Globe, Send, CheckCircle2, Award, Terminal, Code2, Heart, Cpu, Sparkles, ExternalLink } from 'lucide-react';

interface Contributor {
  name: string;
  role: string;
  email?: string;
  avatarText: string;
  avatarGradient: string;
  bio: string;
  contributions: string[];
  badges: string[];
}

export const AboutUsView: React.FC = () => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const contributors: Contributor[] = [
    {
      name: 'Narendra Borhade',
      role: 'Creator & Lead Cybersecurity Architect',
      email: 'narendra.via.mail@gmail.com',
      avatarText: 'NB',
      avatarGradient: 'from-cyan-500 via-teal-400 to-emerald-400',
      bio: 'Founder and Principal Cybersecurity Architect of Aegis 3D Safe Browser. Pioneer of zero-trust web browsing heuristics, DoH cryptographic DNSSEC validation pipelines, and quantum-safe client sandbox design.',
      contributions: [
        'Aegis 3D Core Architectural Vision & Zero-Trust Threat Sandbox',
        'Cryptographic DNSSEC & DoH Query Resolution Engine',
        'Cloudflare Turnstile Verification & Threat Intelligence Integration',
        'Quantum-Resistant Heuristics & Local Sandbox Isolation',
      ],
      badges: ['Cybersecurity Architect', 'Zero-Trust Lead', 'Project Founder'],
    },
    {
      name: 'Aditya Gaikwad',
      role: 'Frontend Developer',
      email: 'gaikwadaditya0309@gmail.com',
      avatarText: 'AG',
      avatarGradient: 'from-blue-500 via-cyan-400 to-teal-300',
      bio: 'Lead Frontend Developer powering the Aegis user experience. Crafts hyper-responsive React architecture, the global Ctrl+K Command Palette, seamless mobile touch navigation, and glassmorphic cybernetic interfaces.',
      contributions: [
        'Global Ctrl+K / Cmd+K Command Palette & Quick Switcher Engine',
        'Mobile Responsive Adaptation & Dynamic Viewport Ergonomics',
        'Chrome Extension Browser Mode & Interactive Tab Manager UI',
        'Web Crypto AES-256 Vault Interface & Real-time State Persistence',
      ],
      badges: ['Frontend Developer', 'React / TypeScript', 'UI/UX Engineer'],
    },
    {
      name: 'Ghanshyam Jadhav',
      role: 'Core Security & Systems Contributor',
      email: 'ghanshamjadhav8210@gmail.com',
      avatarText: 'GJ',
      avatarGradient: 'from-emerald-500 via-teal-400 to-cyan-500',
      bio: 'Core Security & Systems Contributor advancing threat mitigation pipelines. Specializes in malicious payload taxonomy, automated vulnerability scanning heuristics, and resilient client-side security policies.',
      contributions: [
        'Automated Background Vulnerability Scanner Engine & CSP Audits',
        '30-Day D3.js Malicious Request Heatmap Data Aggregation',
        'Tracker Sanitization & Cross-Site Scripting (XSS) Defenses',
        'Zero-Trust Database Identity Providers & Threat Signatures',
      ],
      badges: ['Security Contributor', 'Threat Analytics', 'Systems Security'],
    },
  ];

  const [recipient, setRecipient] = useState<'all' | 'aditya' | 'ghanshyam' | 'narendra'>('all');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const recipientEmail =
      recipient === 'aditya'
        ? 'gaikwadaditya0309@gmail.com'
        : recipient === 'ghanshyam'
        ? 'ghanshamjadhav8210@gmail.com'
        : recipient === 'narendra'
        ? 'narendra.via.mail@gmail.com'
        : 'gaikwadaditya0309@gmail.com, ghanshamjadhav8210@gmail.com, narendra.via.mail@gmail.com';

    const recipientLabel =
      recipient === 'aditya'
        ? 'Aditya Gaikwad (Frontend Developer)'
        : recipient === 'ghanshyam'
        ? 'Ghanshyam Jadhav (Security Contributor)'
        : recipient === 'narendra'
        ? 'Narendra Borhade (Creator)'
        : 'Aegis Development Team';

    const subject = encodeURIComponent(`Aegis 3D Safe Browser Inquiry for ${recipientLabel}`);
    const body = encodeURIComponent(
      `From: ${senderName} (${senderEmail})\nRecipient: ${recipientLabel}\n\nMessage:\n${message}\n\nSent via Aegis 3D Safe Browser`
    );

    window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Core Engineering & Research Team</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Meet the Minds Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Aegis 3D</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Built with an uncompromising commitment to zero-trust security, cutting-edge frontend engineering, and private web navigation without corporate tracking.
        </p>
      </div>

      {/* Contributors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {contributors.map((member) => (
          <div
            key={member.name}
            className="glass-panel-glow rounded-3xl p-6 sm:p-7 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between relative group overflow-hidden"
          >
            {/* Top ambient highlight */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/5 group-hover:bg-cyan-500/15 rounded-full blur-2xl transition-all" />

            <div className="space-y-4 relative z-10">
              {/* Avatar & Role Header */}
              <div className="flex items-start justify-between gap-3">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${member.avatarGradient} p-0.5 shadow-lg`}>
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-slate-100 font-extrabold text-xl tracking-wider">
                    {member.avatarText}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                      title={`Email ${member.name}`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </a>
                  )}
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Contributor
                  </span>
                </div>
              </div>

              {/* Name & Title */}
              <div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">
                  {member.role}
                </p>
                {member.email && (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5 break-all">
                    {member.email}
                  </p>
                )}
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {member.bio}
              </p>

              {/* Key Contributions */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                  Key Architectural Contributions
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {member.contributions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-cyan-400 mt-0.5 shrink-0">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Contact / Direct Link */}
            <div className="pt-5 mt-5 border-t border-slate-800/80 relative z-10 flex items-center justify-between">
              {member.email ? (
                <a
                  href={`mailto:${member.email}`}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Contact {member.name.split(' ')[0]}</span>
                </a>
              ) : (
                <div className="w-full py-2 px-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-mono text-slate-400 text-center">
                  Core Security Architecture
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Globe className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Zero-Trust DNS & Web Shield</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Real-time DNS-over-HTTPS resolution with cryptographic DNSSEC origin verification to block malicious routing before packets reach memory.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Code2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Command Palette & Responsive UX</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Engineered by Aditya Gaikwad with global <kbd className="font-mono text-cyan-300">Ctrl+K</kbd> / <kbd className="font-mono text-cyan-300">Cmd+K</kbd> instant switcher, full mobile phone support, and keyboard ergonomics.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Threat Intelligence & Verification</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Integrated with automated vulnerability scanner, 30-day D3 threat volume heatmap, Cloudflare Turnstile, and peer-reviewed science discovery.
          </p>
        </div>
      </div>

      {/* Direct Contact Team Form */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-slate-100">
            Send an Inquiry to the Aegis Team
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Have security reports for Ghanshyam Jadhav, feature feedback for frontend engineer Aditya Gaikwad, or architecture questions for Narendra Borhade? Send a direct email to our team.
        </p>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 font-mono">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Thank you! Your email client has been prepared with your message to the selected team members.</span>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4 max-w-xl">
            {/* Recipient Selector */}
            <div>
              <label className="block text-xs font-mono text-cyan-400 mb-1.5">Recipient</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipient('all')}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    recipient === 'all'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200 truncate">Entire Team</div>
                  <div className="text-[10px] text-slate-400 font-mono">All 3 Members</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipient('aditya')}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    recipient === 'aditya'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200 truncate">Aditya Gaikwad</div>
                  <div className="text-[10px] text-cyan-400 font-mono truncate">Frontend Dev</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipient('ghanshyam')}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    recipient === 'ghanshyam'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200 truncate">Ghanshyam Jadhav</div>
                  <div className="text-[10px] text-teal-400 font-mono truncate">Security Contributor</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipient('narendra')}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    recipient === 'narendra'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200 truncate">Narendra Borhade</div>
                  <div className="text-[10px] text-emerald-400 font-mono truncate">Lead Architect</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-cyan-400 mb-1">Your Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your name or organization"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-cyan-400 mb-1">Your Email</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs sm:text-sm font-mono text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-cyan-400 mb-1">Inquiry / Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe your security vulnerability report, frontend feedback, or collaboration proposal..."
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs sm:text-sm font-sans text-slate-100 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {recipient === 'aditya'
                  ? 'Send Direct Email to Aditya Gaikwad'
                  : recipient === 'ghanshyam'
                  ? 'Send Direct Email to Ghanshyam Jadhav'
                  : recipient === 'narendra'
                  ? 'Send Direct Email to Narendra Borhade'
                  : 'Send Direct Email to Aegis Team'}
              </span>
            </button>
          </form>
        )}
      </div>

      {/* Footer Acknowledgement */}
      <div className="text-center text-xs text-slate-500 font-mono py-2 flex flex-wrap items-center justify-center gap-2">
        <span>Aegis 3D Safe Browser</span>
        <span>·</span>
        <span>Created by Narendra Borhade (narendra.via.mail@gmail.com)</span>
        <span>·</span>
        <span>Frontend by Aditya Gaikwad (gaikwadaditya0309@gmail.com)</span>
        <span>·</span>
        <span>Security by Ghanshyam Jadhav (ghanshamjadhav8210@gmail.com)</span>
      </div>
    </div>
  );
};
