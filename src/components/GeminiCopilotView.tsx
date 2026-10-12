import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Cpu, Send, Bot, User, RefreshCw, Trash2, Shield, Copy, Check } from 'lucide-react';

const SYSTEM_ROLES = [
  {
    id: 'cyber-sentinel',
    name: 'Aegis Cyber Sentinel',
    instruction: 'You are the Aegis Cyber Sentinel, an elite cybersecurity and threat analysis AI. Your specialty is analyzing suspicious domains, malware vectors, phishing scams, and network penetration. Provide concise, high-assurance security assessments.',
  },
  {
    id: 'dns-auditor',
    name: 'DNS & Privacy Auditor',
    instruction: 'You are the Aegis DNS & Privacy Auditor. You analyze DNS-over-HTTPS (DoH), DNSSEC cryptographic integrity, BGP routing, HSTS headers, CSP policies, and anti-fingerprinting defenses.',
  },
  {
    id: 'science-copilot',
    name: 'Science Research Assistant',
    instruction: 'You are the Aegis Science Research Assistant. You assist researchers with scientific computing, bioinformatics, PubMed queries, AlphaFold protein analysis, and scholarly literature synthesis.',
  },
  {
    id: 'bug-remediator',
    name: 'Bug & Vulnerability Remediation',
    instruction: 'You are the Aegis Vulnerability & Bug Specialist. You diagnose code-level web vulnerabilities including DOM XSS, CORS misconfigurations, clickjacking, and provide secure code fixes.',
  },
];

const AVAILABLE_MODELS = [
  { id: 'models/gemini-3.8-flash', label: 'gemini-3.8-flash (Default Flagship)', desc: 'Balanced intelligence & low latency' },
  { id: 'gemini-3.5-flash', label: 'gemini-3.5-flash (General Tasks)', desc: 'Reliable general purpose processing' },
  { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite (Ultra Fast)', desc: 'Near instantaneous answers' },
  { id: 'gemini-3.1-pro-preview', label: 'gemini-3.1-pro-preview (Complex Tasks)', desc: 'Deep mathematical & security reasoning' },
];

export const GeminiCopilotView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I am Aegis Cyber AI, your multi-turn security and scientific intelligence copilot. 

I can assist you with:
- Scanning and auditing DNS records and DNSSEC validation
- Analyzing phishing patterns, typosquatting, and homograph attacks
- Evaluating website Content Security Policies (CSP) and HSTS headers
- Synthesizing scientific papers from PubMed, Europe PMC, and arXiv

How can I safeguard your browsing today?`,
      timestamp: new Date().toLocaleTimeString(),
      model: 'models/gemini-3.8-flash',
      persona: 'Aegis Cyber Sentinel',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(SYSTEM_ROLES[0]);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          systemInstruction: selectedRole.instruction,
          model: selectedModel,
        }),
      });

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No intelligence data received.',
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel,
        persona: selectedRole.name,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `[Aegis Neural Alert]: ${err.message || 'Unable to connect to Gemini API endpoint.'}`,
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
        content: `Session cleared. Active role: ${selectedRole.name}. Ready for your cyber or scientific inquiries.`,
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel,
        persona: selectedRole.name,
      },
    ]);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Strip */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Role Persona Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 uppercase whitespace-nowrap">
            Cyber AI Role:
          </span>
          <select
            value={selectedRole.id}
            onChange={(e) => {
              const role = SYSTEM_ROLES.find((r) => r.id === e.target.value);
              if (role) setSelectedRole(role);
            }}
            className="glass-input rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 bg-slate-900 border border-slate-750 focus:outline-none"
          >
            {SYSTEM_ROLES.map((r) => (
              <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-mono text-amber-400 uppercase whitespace-nowrap">
            Gemini Model:
          </span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="glass-input rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 bg-slate-900 border border-slate-750 focus:outline-none"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                {m.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors ml-auto sm:ml-2"
            title="Clear Chat Thread"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
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
                  <span>
                    {msg.role === 'assistant' ? msg.persona || 'Aegis Cyber AI' : 'Security Auditor'}
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

                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                  {msg.content}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-cyan-400 font-mono">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
              <span>Aegis Neural Cluster processing intelligence response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Quick Prompt Chips */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 space-y-3">
          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-500 whitespace-nowrap">Suggested:</span>
            {[
              'How does DNSSEC prevent cache poisoning?',
              'Audit Content Security Policy (CSP) headers',
              'Check for homograph typosquatting risks',
              'Summarize AlphaFold 3 capabilities in science',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 whitespace-nowrap transition-colors"
              >
                {chip}
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
              placeholder="Ask Aegis Cyber AI about DNS security, vulnerabilities, or science..."
              className="w-full glass-input rounded-xl px-4 py-3 text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
