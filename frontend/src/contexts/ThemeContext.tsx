import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ThemeConfig {
  darkMode: boolean;
  oledMode: boolean;
  primaryColor: string;
  density: 'compact' | 'comfortable' | 'spacious';
  fontSizeBase: number;
  // Visual overrides (connected to semantic tokens)
  cardBorders: boolean;
  shadows: boolean;
  cardRadius: number;
  animationEnabled: boolean;
  skeletonEnabled: boolean;
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
  density: 'comfortable',
  fontSizeBase: 15,
  // Visual overrides defaults
  cardBorders: true,
  shadows: true,
  cardRadius: 12,
  animationEnabled: true,
  skeletonEnabled: true,
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

  // 2. User overrides (minimal set)
  root.style.setProperty('--color-primary', config.primaryColor);
  root.style.setProperty('--density-multiplier', String(DENSITY_MAP[config.density]));
  root.style.setProperty('--font-size-base', `${config.fontSizeBase}px`);

  // 3. Visual overrides connected to semantic tokens
  root.style.setProperty('--card-border-width', config.cardBorders ? 'var(--border-width)' : '0px');
  root.style.setProperty('--card-shadow', config.shadows ? 'var(--shadow-sm)' : 'none');
  root.style.setProperty('--card-shadow-hover', config.shadows ? 'var(--shadow-md)' : 'none');
  root.style.setProperty('--card-radius', `${config.cardRadius}px`);
  
  // Animation control
  root.style.setProperty('--transition-base', config.animationEnabled ? '150ms cubic-bezier(0.4, 0, 0.2, 1)' : '0ms');

  // Skeleton control
  root.style.setProperty('--skeleton-enabled', config.skeletonEnabled ? '1' : '0');

  // Derived font sizes based on base
  const base = config.fontSizeBase;
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
