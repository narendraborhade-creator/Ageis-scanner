import React from 'react';
import { AVAILABLE_THEMES, AppThemeId, getStoredTheme, setStoredTheme } from '../services/themeService';
import { Palette, Check, Sparkles, X, Shield, Eye } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppThemeId;
  onThemeSelect: (theme: AppThemeId) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeSelect,
}) => {
  if (!isOpen) return null;

  const handleSelect = (id: AppThemeId) => {
    setStoredTheme(id);
    onThemeSelect(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl glass-panel-glow rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                <span>Custom Visual Themes</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-sans">
                  {AVAILABLE_THEMES.length} Themes
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Personalize Aegis safe browser interface with hardware-accelerated color themes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close theme selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {AVAILABLE_THEMES.map((theme) => {
              const isActive = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelect(theme.id)}
                  className={`group relative p-4 rounded-xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isActive
                      ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                      : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                  style={{
                    borderLeftColor: isActive ? theme.primaryColor : undefined,
                    borderLeftWidth: isActive ? '4px' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${theme.previewGradient} flex items-center justify-center text-slate-950 shadow-md shrink-0`}
                      >
                        <Shield className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-100 font-mono group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                          {theme.name}
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          {theme.badge}
                        </span>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                        <Check className="w-3 h-3 text-cyan-400" />
                        ACTIVE
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(theme.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[11px] font-mono text-slate-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-slate-800 transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {theme.tagline}
                  </p>

                  {/* Swatches strip */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-700 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                      title={`Primary: ${theme.primaryColor}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-slate-700 shrink-0"
                      style={{ backgroundColor: theme.secondaryColor }}
                      title={`Secondary: ${theme.secondaryColor}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-slate-700 shrink-0"
                      style={{ backgroundColor: theme.bgHex }}
                      title={`Background: ${theme.bgHex}`}
                    />
                    <span className="ml-auto text-[10px] text-slate-500">
                      {theme.bgHex}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Theme persists automatically in local storage across browser restarts</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
