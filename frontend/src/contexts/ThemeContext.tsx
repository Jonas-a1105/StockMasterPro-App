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
  cardRadius?: number;
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
  primaryColor: '#f05a28',
  density: 'comfortable',
  fontSizeBase: 15,
  fontFamily: "'Segoe UI', sans-serif",
  cardBorders: true,
  shadows: true,
  animationEnabled: true,
  cardRadius: 12,
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
  root.style.setProperty('--shadow-card', shadowsActive ? 'var(--shadow-sm)' : 'none');
  root.style.setProperty('--shadow-card-hover', shadowsActive ? 'var(--shadow-md)' : 'none');

  if (config.animationEnabled) {
    root.removeAttribute('data-animation-disabled');
  } else {
    root.setAttribute('data-animation-disabled', 'true');
  }

  const duration = config.animationEnabled ? '150ms cubic-bezier(0.4, 0, 0.2, 1)' : '0ms';
  root.style.setProperty('--transition-base', duration);

  // Dynamic cardRadius and global border-radius scale logic
  const currentRadius = config.cardRadius !== undefined ? config.cardRadius : 12;
  root.style.setProperty('--card-radius', `${currentRadius}px`);
  root.style.setProperty('--btn-radius', `${Math.round(currentRadius * 0.75)}px`);
  root.style.setProperty('--input-radius', `${Math.round(currentRadius * 0.75)}px`);
  root.style.setProperty('--modal-radius', `${Math.round(currentRadius * 1.2)}px`);
  root.style.setProperty('--badge-radius', currentRadius === 0 ? '0px' : '9999px');
  root.style.setProperty('--kpi-border-radius', `${Math.round(currentRadius * 0.75)}px`);

  // Update primitive radius variables dynamically so all elements adapt
  const scale = [
    { name: 'sm', val: 0.33 },
    { name: 'md', val: 0.66 },
    { name: 'lg', val: 1.0 },
    { name: 'xl', val: 1.33 },
    { name: '2xl', val: 2.0 }
  ];
  scale.forEach(s => {
    const calculated = currentRadius === 0 ? 0 : Math.round(currentRadius * s.val);
    root.style.setProperty(`--radius-${s.name}`, `${calculated}px`);
    root.style.setProperty(`--border-radius-${s.name}`, `${calculated}px`);
  });
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('stockmaster-theme-v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.fontFamily && (parsed.fontFamily.startsWith('#') || parsed.fontFamily.length < 3)) {
          parsed.fontFamily = defaultConfig.fontFamily;
        }
        return { ...defaultConfig, ...parsed };
      } catch (e) {
        return defaultConfig;
      }
    }
    return defaultConfig;
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