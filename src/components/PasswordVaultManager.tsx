import React, { useState, useEffect } from 'react';
import { VaultCredential } from '../types';
import {
  ensureVaultInitialized,
  unlockVault,
  lockVault,
  isVaultUnlocked,
  getActiveSessionCredentials,
  saveCredentialToVault,
  deleteCredentialFromVault,
  calculatePasswordEntropy,
  generateSecurePassword,
  exportEncryptedVaultFile,
  importEncryptedVaultFile,
  DEFAULT_DEMO_PASSPHRASE,
} from '../services/cryptoVaultService';
import {
  KeyRound,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  RefreshCw,
  FileCode,
  Download,
  Upload,
  AlertTriangle,
  Globe,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface PasswordVaultManagerProps {
  onNavigateToBrowserUrl?: (url: string) => void;
}

export const PasswordVaultManager: React.FC<PasswordVaultManagerProps> = ({
  onNavigateToBrowserUrl,
}) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => isVaultUnlocked());
  const [passphrase, setPassphrase] = useState<string>('');
  const [credentials, setCredentials] = useState<VaultCredential[]>(() => getActiveSessionCredentials() || []);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Password visibility map { [id]: boolean }
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCategory, setFormCategory] = useState<VaultCredential['category']>('Logins');
  const [formNotes, setFormNotes] = useState('');

  // Built-in Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(18);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Initial check
  useEffect(() => {
    ensureVaultInitialized();
    const active = getActiveSessionCredentials();
    if (active) {
      setCredentials(active);
      setUnlocked(true);
    }
  }, []);

  // Update generated password whenever generator params change
  useEffect(() => {
    if (showGenerator) {
      handleGenerate();
    }
  }, [genLength, genUpper, genLower, genNumbers, genSymbols, showGenerator]);

  const handleGenerate = () => {
    const pw = generateSecurePassword({
      length: genLength,
      useUpper: genUpper,
      useLower: genLower,
      useNumbers: genNumbers,
      useSymbols: genSymbols,
    });
    setGeneratedPassword(pw);
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passphrase.trim()) {
      setErrorMsg('Please enter your master vault passphrase.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await unlockVault(passphrase);
      setCredentials(list);
      setUnlocked(true);
      setPassphrase('');
      setSuccessMsg('Vault unlocked. Web Crypto AES-GCM session active.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to unlock vault.');
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    lockVault();
    setUnlocked(false);
    setCredentials([]);
    setRevealedPasswords({});
    setSuccessMsg('Vault locked. Ephemeral cryptographic keys wiped from memory.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormUrl('https://');
    setFormUsername('');
    setFormPassword('');
    setFormCategory('Logins');
    setFormNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (cred: VaultCredential) => {
    setEditingId(cred.id);
    setFormTitle(cred.title);
    setFormUrl(cred.url);
    setFormUsername(cred.username);
    setFormPassword(cred.password);
    setFormCategory(cred.category);
    setFormNotes(cred.notes || '');
    setShowModal(true);
  };

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formPassword) {
      setErrorMsg('Title and password are required.');
      return;
    }

    let domain = 'local';
    try {
      const parsed = new URL(formUrl);
      domain = parsed.hostname;
    } catch {
      domain = formUrl.replace(/https?:\/\//, '').split('/')[0] || 'local';
    }

    try {
      const updated = await saveCredentialToVault({
        id: editingId || undefined,
        title: formTitle,
        url: formUrl,
        domain: domain || 'localhost',
        username: formUsername,
        password: formPassword,
        category: formCategory,
        notes: formNotes,
      });
      setCredentials([...updated]);
      setShowModal(false);
      setSuccessMsg(editingId ? 'Credential updated securely.' : 'New credential encrypted and stored.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save credential.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete encrypted credential for "${title}"?`)) return;
    try {
      const updated = await deleteCredentialFromVault(id);
      setCredentials([...updated]);
      setSuccessMsg(`Deleted "${title}" from encrypted vault.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Delete operation failed.');
    }
  };

  const handleExport = () => {
    try {
      const data = exportEncryptedVaultFile();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aegis-encrypted-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('Encrypted vault exported (Zero-knowledge: ciphertext only).');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export failed.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        importEncryptedVaultFile(text);
        setUnlocked(false);
        setSuccessMsg('Encrypted vault package imported! Please enter your master passphrase to unlock.');
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: any) {
        setErrorMsg('Import error: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Stats
  const totalCount = credentials.length;
  const strongCount = credentials.filter((c) => c.strength === 'strong' || c.strength === 'military').length;
  const weakCount = credentials.filter((c) => c.strength === 'weak').length;

  // Filtered List
  const filteredCredentials = credentials.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesQuery =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  Web Crypto Encrypted Password Vault
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Client-side zero-knowledge password and credentials vault. Native Web Crypto API hardware acceleration with PBKDF2 key derivation (100k rounds).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unlocked ? (
              <button
                type="button"
                onClick={handleLock}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono hover:bg-rose-900/50 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Vault Locked</span>
              </div>
            )}
          </div>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* State A: Locked Screen */}
      {!unlocked && (
        <div className="glass-panel rounded-2xl p-6 sm:p-10 border border-cyan-500/20 max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-100">Unlock Credentials Vault</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Your credentials are encrypted using your master passphrase with AES-GCM 256-bit. Enter your master passphrase to derive the decryption key via Web Crypto PBKDF2.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 max-w-md mx-auto text-left">
            <div>
              <label className="block text-xs font-mono text-cyan-400 mb-1">Master Vault Passphrase</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter master passphrase"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono text-slate-100"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deriving PBKDF2 Key (100k rounds)...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Vault with Web Crypto</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill */}
          <div className="pt-2 border-t border-slate-850">
            <button
              type="button"
              onClick={() => {
                setPassphrase(DEFAULT_DEMO_PASSPHRASE);
              }}
              className="text-xs text-cyan-400 hover:underline font-mono inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fill Default Demo Passphrase (<code>{DEFAULT_DEMO_PASSPHRASE}</code>)</span>
            </button>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 text-left text-[11px] text-slate-400 space-y-1.5 font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Cryptographic Guarantees</span>
            </div>
            <p>· Passwords and tokens never leave your browser device unencrypted.</p>
            <p>· Encrypted records in local storage contain only IVs and ciphertexts.</p>
            <p>· Keys are derived in-memory and destroyed automatically upon locking.</p>
          </div>
        </div>
      )}

      {/* State B: Unlocked Vault */}
      {unlocked && (
        <div className="space-y-6">
          {/* Top Quick Stats & Action Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Stored Credentials</span>
              <div className="text-xl font-bold text-cyan-400 mt-1">{totalCount}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Strong & Military Grade</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{strongCount}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Weak Warnings</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{weakCount}</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Hardware Cipher</span>
              <div className="text-sm font-bold text-slate-200 mt-2 font-mono">AES-GCM 256</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md hover:from-cyan-400 hover:to-teal-400 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Credential</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                  showGenerator
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Password Generator</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors"
                title="Export encrypted JSON backup (ciphertext only)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Vault</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Built-in Password Generator Panel */}
          {showGenerator && (
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 bg-slate-950/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold font-mono text-slate-200">
                    High-Entropy Password Generator
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>

              {/* Generated Result Box */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-cyan-500/30">
                <span className="font-mono text-sm text-cyan-300 tracking-wider break-all select-all">
                  {generatedPassword}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedPassword, 'gen-pw')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors"
                    title="Copy generated password"
                  >
                    {copiedId === 'gen-pw' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormPassword(generatedPassword);
                      setShowModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono hover:bg-cyan-500/30 transition-colors"
                  >
                    Use in New Credential
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Length</span>
                    <span className="text-cyan-400 font-bold">{genLength} chars</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    value={genLength}
                    onChange={(e) => setGenLength(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-4">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genUpper}
                      onChange={(e) => setGenUpper(e.target.checked)}
                      className="accent-cyan-400"
                    />
                    <span>A-Z</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genLower}
                      onChange={(e) => setGenLower(e.target.checked)}
                      className="accent-cyan-400"
                    />
                    <span>a-z</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genNumbers}
                      onChange={(e) => setGenNumbers(e.target.checked)}
                      className="accent-cyan-400"
                    />
                    <span>0-9</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genSymbols}
                      onChange={(e) => setGenSymbols(e.target.checked)}
                      className="accent-cyan-400"
                    />
                    <span>Symbols</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search credentials..."
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Logins', 'Developer', 'Cloud', 'Finance', 'Identity'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Credentials List */}
          <div className="space-y-2.5">
            {filteredCredentials.length === 0 ? (
              <div className="p-10 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No encrypted credentials match your search criteria.
              </div>
            ) : (
              filteredCredentials.map((cred) => {
                const isRevealed = revealedPasswords[cred.id] || false;
                const entropyInfo = calculatePasswordEntropy(cred.password);

                return (
                  <div
                    key={cred.id}
                    className="glass-panel rounded-xl p-4 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Column 1: Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                        <Globe className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-100 truncate">
                            {cred.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {cred.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5 truncate">
                          <span>{cred.domain}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-300">{cred.username}</span>
                        </div>
                        {cred.notes && (
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {cred.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Password & Actions */}
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      {/* Password Field */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
                        <span className="text-slate-200 select-all max-w-[140px] truncate">
                          {isRevealed ? cred.password : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(cred.id)}
                          className="text-slate-400 hover:text-cyan-300 ml-1 transition-colors"
                          title={isRevealed ? 'Hide password' : 'Show decrypted password'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(cred.password, cred.id)}
                          className="text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Copy password"
                        >
                          {copiedId === cred.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Entropy Badge */}
                      <span
                        className={`text-[10px] font-mono px-2 py-1 rounded border ${
                          entropyInfo.strength === 'military'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : entropyInfo.strength === 'strong'
                            ? 'bg-teal-950/60 border-teal-500/40 text-teal-300'
                            : entropyInfo.strength === 'fair'
                            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                            : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                        }`}
                        title={`${entropyInfo.entropy} bits entropy`}
                      >
                        {entropyInfo.strength.toUpperCase()}
                      </span>

                      {/* Open in Browser */}
                      {onNavigateToBrowserUrl && cred.url && (
                        <button
                          type="button"
                          onClick={() => onNavigateToBrowserUrl(cred.url)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
                          title="Open URL in Aegis Browser"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cred)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
                      >
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(cred.id, cred.title)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                        title="Delete credential"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Credential Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span>{editingId ? 'Edit Encrypted Credential' : 'Add New Encrypted Credential'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-100 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCredential} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Service / Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. GitHub Enterprise, Cloudflare Dashboard"
                  className="w-full glass-input rounded-lg px-3 py-2 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">URL / Login Page</label>
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://github.com/login"
                    className="w-full glass-input rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full glass-input rounded-lg px-3 py-2 text-slate-100"
                  >
                    <option value="Logins">Logins</option>
                    <option value="Developer">Developer</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Finance">Finance</option>
                    <option value="Identity">Identity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Username / Email</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full glass-input rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        const pw = generateSecurePassword({
                          length: 20,
                          useUpper: true,
                          useLower: true,
                          useNumbers: true,
                          useSymbols: true,
                        });
                        setFormPassword(pw);
                      }}
                      className="text-[10px] text-cyan-400 hover:underline font-mono"
                    >
                      Generate Strong
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full glass-input rounded-lg px-3 py-2 font-mono text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Encrypted Notes (Optional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Recovery keys, 2FA backup codes, PIN..."
                  rows={2}
                  className="w-full glass-input rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-lg shadow-md transition-all"
                >
                  Encrypt & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
