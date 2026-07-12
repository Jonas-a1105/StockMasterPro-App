import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ThemeConfig {
  darkMode: boolean;
  oledMode: boolean;
  primaryColor: string;
  secondaryColor?: string;
  bgMain?: string;
  bgCard?: string;
  sidebarBg?: string;
  borderColor?: string;
  density: 'compact' | 'comfortable' | 'spacious';
  fontSizeBase: number;
  // Visual overrides (connected to semantic tokens)
  cardBorders: boolean;
  shadows: boolean;
  cardRadius: number;
  borderWidth?: number;
  cardBorderEnabled?: boolean;
  letterSpacing?: number;
  uppercaseEnabled?: boolean;
  fontWeightEnabled?: boolean;
  listHeaderFontSize?: number;
  listBodyFontSize?: number;
  listCellPadding?: number;
  listHeaderFontWeight?: string;
  listBodyFontWeight?: string;
  listHeaderUppercase?: boolean;
  listStripeEnabled?: boolean;
  listHeaderBg?: string;
  listRowHoverColor?: string;
  listBorderColor?: string;
  listAccentColor?: string;
  productViewMode?: 'table' | 'cards';
  skeletonEnabled: boolean;
  btnBorderRadius?: number;
  btnBorderWidth?: number;
  btnFontWeight?: string;
  inputBorderRadius?: number;
  inputBorderWidth?: number;
  animationEnabled: boolean;
  transitionDuration?: number;
  notificationSpeed?: number;
  shadowEnabled?: boolean;
}

interface SavedPreset {
  name: string;
  config: ThemeConfig;
}

interface ThemeContextType {
  config: ThemeConfig;
  updateConfig: (partial: Partial<ThemeConfig>) => void;
  toggleDarkMode: () => void;
  toggleOledMode: () => void;
  resetTheme: () => void;
  applyPreset: (config: ThemeConfig) => void;
  savedPresets: SavedPreset[];
  savePreset: (name: string) => void;
  deletePreset: (name: string) => void;
}

const defaultConfig: ThemeConfig = {
  darkMode: false,
  oledMode: false,
  primaryColor: '#ea580c',
  secondaryColor: '#64748b',
  bgMain: '#f8fafc',
  bgCard: '#ffffff',
  sidebarBg: '#1e293b',
  borderColor: '#e2e8f0',
  density: 'comfortable',
  fontSizeBase: 15,
  cardBorders: true,
  shadows: true,
  cardRadius: 12,
  borderWidth: 1,
  cardBorderEnabled: true,
  letterSpacing: 0,
  uppercaseEnabled: false,
  fontWeightEnabled: true,
  listHeaderFontSize: 12,
  listBodyFontSize: 13,
  listCellPadding: 12,
  listHeaderFontWeight: '600',
  listBodyFontWeight: '600',
  listHeaderUppercase: true,
  listStripeEnabled: false,
  listHeaderBg: '#f8fafc',
  listRowHoverColor: '#f1f5f9',
  listBorderColor: '#e2e8f0',
  listAccentColor: '#ea580c',
  productViewMode: 'table',
  skeletonEnabled: true,
  btnBorderRadius: 8,
  btnBorderWidth: 1,
  btnFontWeight: '600',
  inputBorderRadius: 8,
  inputBorderWidth: 1,
  animationEnabled: true,
  transitionDuration: 150,
  notificationSpeed: 300,
  shadowEnabled: true,
};

export const palettes = [
  { name: 'Anaranjado', primary: '#ea580c' },
  { name: 'Azul', primary: '#3b82f6' },
  { name: 'Púrpura', primary: '#8b5cf6' },
  { name: 'Rosa', primary: '#ec4899' },
  { name: 'Verde', primary: '#10b981' },
  { name: 'Oro', primary: '#f59e0b' },
  { name: 'Carbón', primary: '#6b7280' },
  { name: 'Esmeralda', primary: '#14b8a6' },
  { name: 'Threads', primary: '#1d9bf0' },
];

// FONT_OPTIONS removed to lock typography to Segoe UI

const ThemeContext = createContext<ThemeContextType | null>(null);

const DENSITY_MAP = {
  compact: 0.8,
  comfortable: 1,
  spacious: 1.2,
};

function applyConfigToDOM(config: ThemeConfig) {
  const root = document.documentElement;

  // 1. Theme mode (data-theme attribute) - drives all semantic tokens via CSS
  if (config.oledMode) {
    root.setAttribute('data-theme', 'oled');
  } else if (config.darkMode) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  // 2. User overrides - ONLY inject custom theme properties if they differ from the default system colors
  root.style.setProperty('--color-primary', config.primaryColor);
  
  // Only override background/surfaces/borders if they are custom-entered by the user and we are NOT in Dark/OLED mode
  const isDark = config.darkMode || config.oledMode;
  if (!isDark) {
    if (config.bgMain && config.bgMain !== '#f8fafc') root.style.setProperty('--color-bg', config.bgMain);
    if (config.bgCard && config.bgCard !== '#ffffff') root.style.setProperty('--color-surface', config.bgCard);
    if (config.borderColor && config.borderColor !== '#e2e8f0') {
      root.style.setProperty('--color-border', config.borderColor);
      root.style.setProperty('--color-surface-border', config.borderColor);
    }
  } else {
    // In dark/oled mode, clean up light theme styles so stylesheet takes absolute control
    root.style.removeProperty('--color-bg');
    root.style.removeProperty('--color-surface');
    root.style.removeProperty('--color-border');
    root.style.removeProperty('--color-surface-border');
  }

  // Programmatic override for sidebar bg only if explicitly custom
  if (config.sidebarBg && config.sidebarBg !== '#1e293b') {
    root.style.setProperty('--sidebar-bg', config.sidebarBg);
  } else {
    root.style.removeProperty('--sidebar-bg');
  }

  root.style.setProperty('--density-multiplier', String(DENSITY_MAP[config.density] || 1));
  root.style.setProperty('--font-size-base', `${config.fontSizeBase}px`);

  // 3. Visual overrides connected to semantic tokens
  const borderEnabled = config.cardBorderEnabled !== false && config.cardBorders !== false;
  const bWidth = config.borderWidth !== undefined ? config.borderWidth : 1;
  root.style.setProperty('--card-border-width', borderEnabled ? `${bWidth}px` : '0px');
  root.style.setProperty('--border-width', `${bWidth}px`);

  const shadowsActive = config.shadowEnabled !== false && config.shadows !== false;
  root.style.setProperty('--card-shadow', shadowsActive ? 'var(--shadow-sm)' : 'none');
  root.style.setProperty('--card-shadow-hover', shadowsActive ? 'var(--shadow-md)' : 'none');
  const currentRadius = borderEnabled ? (config.cardRadius !== undefined ? config.cardRadius : 12) : 0;
  root.style.setProperty('--card-radius', `${currentRadius}px`);
  root.style.setProperty('--btn-radius', `${Math.min(currentRadius, 8)}px`);
  root.style.setProperty('--input-radius', `${Math.min(currentRadius, 8)}px`);
  root.style.setProperty('--modal-radius', `${currentRadius * 1.2}px`);
  root.style.setProperty('--badge-radius', currentRadius === 0 ? '0px' : '9999px');
  root.style.setProperty('--kpi-border-radius', `${Math.min(currentRadius, 8)}px`);

  // Dynamically update primitive radius variables so components using primitives also respond!
  const scale = [
    { name: 'sm', val: 0.5, max: 4 },
    { name: 'md', val: 0.75, max: 8 },
    { name: 'lg', val: 1.0, max: 12 },
    { name: 'xl', val: 1.2, max: 16 },
    { name: '2xl', val: 1.5, max: 24 }
  ];
  scale.forEach(s => {
    const calculated = currentRadius === 0 ? 0 : Math.min(currentRadius * s.val, s.max);
    root.style.setProperty(`--radius-${s.name}`, `${calculated}px`);
    root.style.setProperty(`--border-radius-${s.name}`, `${calculated}px`);
  });
  
  // Font weight - lock to 600 as requested by the user, or let it respond
  if (config.fontWeightEnabled === false) {
    root.style.setProperty('--font-weight-normal', '400');
    root.style.setProperty('--font-weight-medium', '500');
    root.style.setProperty('--font-weight-semibold', '600');
    root.style.setProperty('--font-weight-bold', '700');
  } else {
    root.style.setProperty('--font-weight-normal', '600');
    root.style.setProperty('--font-weight-medium', '600');
    root.style.setProperty('--font-weight-semibold', '600');
    root.style.setProperty('--font-weight-bold', '600');
  }

  // Letter spacing and casing
  if (config.letterSpacing !== undefined) {
    root.style.setProperty('--tracking-normal', `${config.letterSpacing}em`);
  }
  root.style.setProperty('--text-transform-global', config.uppercaseEnabled ? 'uppercase' : 'none');

  // Lists/Tables
  if (config.listHeaderFontSize) root.style.setProperty('--list-header-font-size', `${config.listHeaderFontSize}px`);
  if (config.listBodyFontSize) root.style.setProperty('--list-body-font-size', `${config.listBodyFontSize}px`);
  if (config.listCellPadding) root.style.setProperty('--list-cell-padding', `${config.listCellPadding}px`);
  if (config.listHeaderFontWeight) root.style.setProperty('--list-header-font-weight', config.listHeaderFontWeight);
  if (config.listBodyFontWeight) root.style.setProperty('--list-body-font-weight', config.listBodyFontWeight);
  root.style.setProperty('--list-header-uppercase', config.listHeaderUppercase ? 'uppercase' : 'none');
  root.style.setProperty('--list-stripe', config.listStripeEnabled ? 'var(--color-bg-hover)' : 'transparent');
  if (config.listHeaderBg) root.style.setProperty('--list-header-bg', config.listHeaderBg);
  if (config.listRowHoverColor) root.style.setProperty('--list-row-hover', config.listRowHoverColor);
  if (config.listBorderColor) root.style.setProperty('--list-border-color', config.listBorderColor);
  if (config.listAccentColor) root.style.setProperty('--list-accent-color', config.listAccentColor);

  // Buttons
  if (!borderEnabled) {
    root.style.setProperty('--btn-radius', '0px');
  } else if (config.btnBorderRadius !== undefined) {
    root.style.setProperty('--btn-radius', `${config.btnBorderRadius}px`);
  }
  if (config.btnBorderWidth !== undefined) root.style.setProperty('--btn-border-width', `${config.btnBorderWidth}px`);
  if (config.btnFontWeight) root.style.setProperty('--btn-font-weight', config.btnFontWeight);

  // Inputs
  if (!borderEnabled) {
    root.style.setProperty('--input-radius', '0px');
  } else if (config.inputBorderRadius !== undefined) {
    root.style.setProperty('--input-radius', `${config.inputBorderRadius}px`);
  }
  if (config.inputBorderWidth !== undefined) root.style.setProperty('--input-border-width', `${config.inputBorderWidth}px`);

  // Animation control
  const duration = config.transitionDuration !== undefined ? config.transitionDuration : 150;
  root.style.setProperty('--transition-base', config.animationEnabled ? `${duration}ms cubic-bezier(0.4, 0, 0.2, 1)` : '0ms');

  // Skeleton control
  root.style.setProperty('--skeleton-enabled', config.skeletonEnabled ? '1' : '0');

  // Derived font sizes based on base
  const base = config.fontSizeBase;
  root.style.setProperty('--font-size-2xs', `${Math.max(9, base - 4)}px`);
  root.style.setProperty('--font-size-xs', `${Math.max(10, base - 3)}px`);
  root.style.setProperty('--font-size-sm', `${Math.max(11, base - 2)}px`);
  root.style.setProperty('--font-size-md', `${base}px`);
  root.style.setProperty('--font-size-lg', `${Math.round(base * 1.13)}px`);
  root.style.setProperty('--font-size-xl', `${Math.round(base * 1.33)}px`);
  root.style.setProperty('--font-size-2xl', `${Math.round(base * 1.6)}px`);
  root.style.setProperty('--font-size-3xl', `${Math.round(base * 2.0)}px`);
  root.style.setProperty('--font-size-4xl', `${Math.round(base * 2.4)}px`);
  root.style.setProperty('--font-size-5xl', `${Math.round(base * 2.93)}px`);
}

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('stockmaster-theme-v4');
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  });

  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(() => {
    const saved = localStorage.getItem('stockmaster-presets-v3');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('stockmaster-theme-v4', JSON.stringify(config));
    applyConfigToDOM(config);
  }, [config]);

  useEffect(() => {
    localStorage.setItem('stockmaster-presets-v3', JSON.stringify(savedPresets));
  }, [savedPresets]);

  const updateConfig = useCallback((partial: Partial<ThemeConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
      oledMode: false,
    }));
  }, []);

  const toggleOledMode = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      oledMode: !prev.oledMode,
      darkMode: prev.oledMode ? prev.darkMode : true,
    }));
  }, []);

  const resetTheme = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  const applyPreset = useCallback((preset: ThemeConfig) => {
    setConfig(preset);
  }, []);

  const savePreset = useCallback(
    (name: string) => {
      setSavedPresets((prev) => {
        const filtered = prev.filter((p) => p.name !== name);
        return [...filtered, { name, config }];
      });
    },
    [config]
  );

  const deletePreset = useCallback((name: string) => {
    setSavedPresets((prev) => prev.filter((p) => p.name !== name));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        config,
        updateConfig,
        toggleDarkMode,
        toggleOledMode,
        resetTheme,
        applyPreset,
        savedPresets,
        savePreset,
        deletePreset,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { ThemeProvider };
