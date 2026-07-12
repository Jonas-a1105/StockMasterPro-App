import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ThemeConfig {
  darkMode: boolean;
  oledMode: boolean;
  primaryColor: string;
  density: 'compact' | 'comfortable' | 'spacious';
  fontFamily: string;
  fontSizeBase: number;
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
  fontFamily: "'Outfit', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
  fontSizeBase: 15,
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

const FONT_OPTIONS = [
  { label: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { label: 'Inter', value: '"Inter", system-ui, sans-serif' },
  { label: 'Poppins', value: '"Poppins", system-ui, sans-serif' },
  { label: 'Roboto', value: '"Roboto", system-ui, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", system-ui, sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", system-ui, sans-serif' },
  { label: 'Lato', value: '"Lato", system-ui, sans-serif' },
  { label: 'Outfit (Default)', value: "'Outfit', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif" },
];

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
  root.style.setProperty('--font-family', config.fontFamily);
  root.style.setProperty('--font-size-base', `${config.fontSizeBase}px`);

  // Derived font sizes based on base
  const base = config.fontSizeBase;
  root.style.setProperty('--font-size-xs', `${Math.max(10, base - 3)}px`);
  root.style.setProperty('--font-size-sm', `${Math.max(11, base - 2)}px`);
  root.style.setProperty('--font-size-md', `${base}px`);
  root.style.setProperty('--font-size-lg', `${Math.round(base * 1.2)}px`);
  root.style.setProperty('--font-size-xl', `${Math.round(base * 1.5)}px`);
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
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      darkMode: !prev.darkMode,
      oledMode: false,
    }));
  }, []);

  const toggleOledMode = useCallback(() => {
    setConfig(prev => ({
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

  const savePreset = useCallback((name: string) => {
    setSavedPresets(prev => {
      const filtered = prev.filter(p => p.name !== name);
      return [...filtered, { name, config }];
    });
  }, [config]);

  const deletePreset = useCallback((name: string) => {
    setSavedPresets(prev => prev.filter(p => p.name !== name));
  }, []);

  return (
    <ThemeContext.Provider value={{
      config,
      updateConfig,
      toggleDarkMode,
      toggleOledMode,
      resetTheme,
      applyPreset,
      savedPresets,
      savePreset,
      deletePreset,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { ThemeProvider, FONT_OPTIONS };