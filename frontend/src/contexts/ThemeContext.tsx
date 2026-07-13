import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ThemeConfig {
  darkMode: boolean;
  oledMode: boolean;
  primaryColor: string;
  density: 'compact' | 'comfortable' | 'spacious';
  fontSizeBase: number;
  fontFamily?: string;
  cardBorders: boolean;
  shadows: boolean;
  animationEnabled: boolean;
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
  fontFamily: "'Segoe UI', sans-serif",
  cardBorders: true,
  shadows: true,
  animationEnabled: true,
};

const DENSITY_MAP = {
  compact: 0.8,
  comfortable: 1,
  spacious: 1.2,
};

function applyConfigToDOM(config: ThemeConfig) {
  const root = document.documentElement;

  if (config.oledMode) {
    root.setAttribute('data-theme', 'oled');
  } else if (config.darkMode) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  root.style.setProperty('--color-primary', config.primaryColor);
  root.style.setProperty('--density-multiplier', String(DENSITY_MAP[config.density] || 1));
  root.style.setProperty('--font-size-base', `${config.fontSizeBase}px`);
  if (config.fontFamily) {
    root.style.setProperty('--font-family', config.fontFamily);
  }

  root.style.setProperty('--card-border-width', config.cardBorders ? '1px' : '0px');
  root.style.setProperty('--border-width', config.cardBorders ? '1px' : '0px');

  const shadowsActive = config.shadows;
  root.style.setProperty('--card-shadow', shadowsActive ? 'var(--shadow-sm)' : 'none');
  root.style.setProperty('--card-shadow-hover', shadowsActive ? 'var(--shadow-md)' : 'none');

  const duration = config.animationEnabled ? '150ms cubic-bezier(0.4, 0, 0.2, 1)' : '0ms';
  root.style.setProperty('--transition-base', duration);

  root.style.setProperty('--font-weight-normal', '600');
  root.style.setProperty('--font-weight-medium', '600');
  root.style.setProperty('--font-weight-semibold', '600');
  root.style.setProperty('--font-weight-bold', '600');
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('stockmaster-theme-v5');
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  });

  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(() => {
    const saved = localStorage.getItem('stockmaster-presets-v4');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('stockmaster-theme-v5', JSON.stringify(config));
    applyConfigToDOM(config);
  }, [config]);

  useEffect(() => {
    localStorage.setItem('stockmaster-presets-v4', JSON.stringify(savedPresets));
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