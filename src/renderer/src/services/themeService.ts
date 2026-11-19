export type AppThemeId =
  | 'cyberpunk'
  | 'oled-dark'
  | 'matrix'
  | 'solar-amber'
  | 'deep-violet'
  | 'titanium-slate'
  | 'crimson-red';

export interface AppTheme {
  id: AppThemeId;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  bgHex: string;
  borderHex: string;
  badge: string;
  previewGradient: string;
}

export const AVAILABLE_THEMES: AppTheme[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Cyan',
    tagline: 'Aegis default neon cyan & deep charcoal slate',
    primaryColor: '#06b6d4',
    secondaryColor: '#10b981',
    bgHex: '#030712',
    borderHex: 'rgba(6,182,212,0.3)',
    badge: 'DEFAULT',
    previewGradient: 'from-cyan-500 to-teal-400',
  },
  {
    id: 'oled-dark',
    name: 'Midnight OLED',
    tagline: 'True black #000000 with ultra-high contrast ice blue',
    primaryColor: '#38bdf8',
    secondaryColor: '#f8fafc',
    bgHex: '#000000',
    borderHex: 'rgba(56,189,248,0.25)',
    badge: 'HIGH CONTRAST',
    previewGradient: 'from-sky-400 to-slate-100',
  },
  {
    id: 'matrix',
    name: 'Hacker Matrix',
    tagline: 'Phosphor terminal green & dark obsidian grid',
    primaryColor: '#22c55e',
    secondaryColor: '#10b981',
    bgHex: '#020b05',
    borderHex: 'rgba(34,197,94,0.35)',
    badge: 'TERMINAL',
    previewGradient: 'from-emerald-500 to-green-400',
  },
  {
    id: 'solar-amber',
    name: 'Solarized Amber',
    tagline: 'Warm golden amber & dark bronze SOC telemetry',
    primaryColor: '#f59e0b',
    secondaryColor: '#fb923c',
    bgHex: '#0c0a07',
    borderHex: 'rgba(245,158,11,0.35)',
    badge: 'WARM SOC',
    previewGradient: 'from-amber-500 to-orange-400',
  },
  {
    id: 'deep-violet',
    name: 'Quantum Violet',
    tagline: 'Cosmic amethyst neon & deep nebula purple',
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    bgHex: '#090314',
    borderHex: 'rgba(168,85,247,0.35)',
    badge: 'NEBULA',
    previewGradient: 'from-purple-500 to-fuchsia-400',
  },
  {
    id: 'titanium-slate',
    name: 'Titanium Stealth',
    tagline: 'Minimalist tactical gunmetal & crisp azure accents',
    primaryColor: '#60a5fa',
    secondaryColor: '#94a3b8',
    bgHex: '#0b1120',
    borderHex: 'rgba(96,165,250,0.25)',
    badge: 'STEALTH',
    previewGradient: 'from-blue-400 to-slate-400',
  },
  {
    id: 'crimson-red',
    name: 'Crimson Protocol',
    tagline: 'High-alert security red & carbon fiber obsidian',
    primaryColor: '#ef4444',
    secondaryColor: '#f43f5e',
    bgHex: '#0d0507',
    borderHex: 'rgba(239,68,68,0.35)',
    badge: 'DEFCON 1',
    previewGradient: 'from-rose-500 to-red-400',
  },
];

const THEME_STORAGE_KEY = 'aegis_custom_theme_v1';
export const EVENT_THEME_CHANGE = 'aegis-theme-change';

export function getStoredTheme(): AppThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppThemeId | null;
    if (saved && AVAILABLE_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
    return 'cyberpunk';
  } catch {
    return 'cyberpunk';
  }
}

export function setStoredTheme(themeId: AppThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    applyThemeToDOM(themeId);
    window.dispatchEvent(
      new CustomEvent(EVENT_THEME_CHANGE, {
        detail: { theme: themeId },
      })
    );
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

// Global helper alias for changing theme from any component or modal
export const changeTheme = setStoredTheme;

if (typeof window !== 'undefined') {
  (window as any).changeTheme = changeTheme;
  (window as any).changetheme = changeTheme;
  (window as any).setStoredTheme = setStoredTheme;
}

export function applyThemeToDOM(themeId: AppThemeId): void {
  if (typeof document === 'undefined') return;

  const targetTheme = AVAILABLE_THEMES.find((t) => t.id === themeId) || AVAILABLE_THEMES[0];
  const root = document.documentElement;

  // 1. Set data attribute and theme classes on html and body
  root.setAttribute('data-theme', targetTheme.id);
  const themeClasses = AVAILABLE_THEMES.map((t) => `theme-${t.id}`);
  document.body.classList.remove(...themeClasses);
  document.body.classList.add(`theme-${targetTheme.id}`);

  // 2. Dynamically set CSS variables on root & body for instant global repaints
  root.style.setProperty('--theme-primary', targetTheme.primaryColor);
  root.style.setProperty('--theme-secondary', targetTheme.secondaryColor);
  root.style.setProperty('--theme-bg', targetTheme.bgHex);
  root.style.setProperty('--theme-border', targetTheme.borderHex);

  document.body.style.backgroundColor = targetTheme.bgHex;

  // Also apply to #root container if present
  const appRoot = document.getElementById('root');
  if (appRoot) {
    appRoot.setAttribute('data-theme', targetTheme.id);
    appRoot.style.backgroundColor = targetTheme.bgHex;
  }

  // 3. Update the meta theme-color tag for mobile status bar!
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', targetTheme.bgHex);
  }
}
