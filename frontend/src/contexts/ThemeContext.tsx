import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ThemeConfig {
  cardRadius: number;
  primaryColor: string;
  secondaryColor: string;
  sidebarBg: string;
  darkMode: boolean;
  oledMode: boolean;
  bgMain: string;
  bgCard: string;
  borderColor: string;
  cardBorderEnabled: boolean;
  headerBorderEnabled: boolean;
  footerBorderEnabled: boolean;
  shadowEnabled: boolean;
  borderWidth: number;
  inputBorderEnabled: boolean;
  fontFamily: string;
  fontSizeBase: number;
  letterSpacing: number;
  transitionDuration: number;
  animationEnabled: boolean;
  btnBorderRadius: number;
  btnBorderWidth: number;
  btnFontWeight: string;
  inputBorderRadius: number;
  inputBorderWidth: number;
  sidebarWidth: number;
  uppercaseEnabled: boolean;
  fontWeightEnabled: boolean;
  productViewMode: 'table' | 'cards';
  skeletonEnabled: boolean;
  listHeaderFontSize: number;
  listBodyFontSize: number;
  listHeaderUppercase: boolean;
  listHeaderBg: string;
  listRowHoverColor: string;
  listBorderColor: string;
  listStripeEnabled: boolean;
  listHeaderFontWeight: string;
  listBodyFontWeight: string;
  listCellPadding: number;
  listAccentColor: string;
  listFontFamily: string;
  listNumberFontFamily: string;
  notificationSpeed: number;
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
  cardRadius: 10,
  primaryColor: '#ea580c',
  secondaryColor: '#f97316',
  sidebarBg: '#1e1b1c',
  darkMode: false,
  oledMode: false,
  bgMain: '#f8fafc',
  bgCard: '#ffffff',
  borderColor: '#e2e8f0',
  cardBorderEnabled: true,
  headerBorderEnabled: true,
  footerBorderEnabled: true,
  shadowEnabled: true,
  borderWidth: 1,
  inputBorderEnabled: true,
  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
  fontSizeBase: 14,
  letterSpacing: 0,
  transitionDuration: 0.2,
  animationEnabled: true,
  btnBorderRadius: 6,
  btnBorderWidth: 0,
  btnFontWeight: '600',
  inputBorderRadius: 6,
  inputBorderWidth: 1,
  sidebarWidth: 240,
  uppercaseEnabled: false,
  fontWeightEnabled: true,
  productViewMode: 'table',
  skeletonEnabled: true,
  listHeaderFontSize: 13,
  listBodyFontSize: 13,
  listHeaderUppercase: false,
  listHeaderBg: '#f8fafc',
  listRowHoverColor: '#f8fafc',
  listBorderColor: '#e2e8f0',
  listStripeEnabled: false,
  listHeaderFontWeight: '600',
  listBodyFontWeight: '400',
  listCellPadding: 12,
  listAccentColor: '#ea580c',
  listFontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
  listNumberFontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
  notificationSpeed: 300,
};

export const palettes = [
  { name: 'Anaranjado', primary: '#f05a28', secondary: '#eb8c00', sidebar: '#3d3535' },
  { name: 'Azul', primary: '#3b82f6', secondary: '#1d4ed8', sidebar: '#1e293b' },
  { name: 'Púrpura', primary: '#8b5cf6', secondary: '#6d28d9', sidebar: '#2e1065' },
  { name: 'Rosa', primary: '#ec4899', secondary: '#db2777', sidebar: '#831843' },
  { name: 'Verde', primary: '#10b981', secondary: '#059669', sidebar: '#064e3b' },
  { name: 'Oro', primary: '#f59e0b', secondary: '#d97706', sidebar: '#78350f' },
  { name: 'Carbón', primary: '#6b7280', secondary: '#4b5563', sidebar: '#111827' },
  { name: 'Esmeralda', primary: '#14b8a6', secondary: '#0d9488', sidebar: '#134e4a' },
  { name: 'Threads', primary: '#1d9bf0', secondary: '#1d9bf0', sidebar: '#0a0a0a' },
];

const FONT_OPTIONS = [
  { label: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { label: 'Inter', value: '"Inter", system-ui, sans-serif' },
  { label: 'Poppins', value: '"Poppins", system-ui, sans-serif' },
  { label: 'Roboto', value: '"Roboto", system-ui, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", system-ui, sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", system-ui, sans-serif' },
  { label: 'Lato', value: '"Lato", system-ui, sans-serif' },
];

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyConfigToDOM(config: ThemeConfig) {
  const transitionSmooth = `all ${config.transitionDuration}s cubic-bezier(0.4, 0, 0.2, 1)`;
  const isDarkMode = config.darkMode || config.oledMode;
  const shadowSm = isDarkMode
    ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
    : '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)';
  const shadowMd = isDarkMode
    ? '0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
    : '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)';
  const shadowLg = isDarkMode
    ? '0 10px 25px rgba(0,0,0,0.4)'
    : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
  const root = document.documentElement;
  const d = config.transitionDuration;
  const anim = config.animationEnabled ? 1 : 0;

  root.style.setProperty('--card-radius', `${config.cardRadius}px`);
  root.style.setProperty('--color-primary', config.primaryColor);
  root.style.setProperty('--color-orange-red', config.primaryColor);
  root.style.setProperty('--color-secondary', config.secondaryColor);
  root.style.setProperty('--color-orange', config.secondaryColor);
  root.style.setProperty('--bg-sidebar', config.sidebarBg);
  root.style.setProperty('--sidebar-bg', config.sidebarBg);
  root.style.setProperty('--sidebar-text', '#ffffff');
  root.style.setProperty('--sidebar-text-muted', '#ffffff');
  root.style.setProperty('--sidebar-icon', '#ffffff');
  root.style.setProperty('--sidebar-icon-hover', '#ffffff');
  root.style.setProperty('--sidebar-section', '#57534e');
  root.style.setProperty('--card-border-width', config.cardBorderEnabled ? `${config.borderWidth}px` : '0px');
  root.style.setProperty('--header-border-width', config.headerBorderEnabled ? `${config.borderWidth}px` : '0px');
  root.style.setProperty('--footer-border-width', config.footerBorderEnabled ? `${config.borderWidth}px` : '0px');
  root.style.setProperty('--shadow-sm', config.shadowEnabled ? shadowSm : 'none');
  root.style.setProperty('--shadow-md', config.shadowEnabled ? shadowMd : 'none');
  root.style.setProperty('--shadow-lg', config.shadowEnabled ? shadowLg : 'none');
  root.style.setProperty('--border-color', config.borderColor);
  root.style.setProperty('--header-bg', config.bgCard);
  root.style.setProperty('--font-family', config.fontFamily);
  root.style.setProperty('--font-size-md', `${config.fontSizeBase}px`);
  root.style.setProperty('--font-size-sm', `${Math.max(11, config.fontSizeBase - 1)}px`);
  root.style.setProperty('--font-size-xs', `${Math.max(10, config.fontSizeBase - 3)}px`);
  root.style.setProperty('--font-size-lg', `${Math.round(config.fontSizeBase * 1.3)}px`);
  root.style.setProperty('--font-size-xl', `${Math.round(config.fontSizeBase * 1.7)}px`);
  root.style.setProperty('--letter-spacing', `${config.letterSpacing}px`);
  root.style.setProperty('--transition-duration', `${d}s`);
  root.style.setProperty('--animation-enabled', String(anim));
  root.style.setProperty('--btn-radius', `${config.btnBorderRadius}px`);
  root.style.setProperty('--btn-border-width', config.inputBorderEnabled ? `${config.btnBorderWidth}px` : '0px');
  root.style.setProperty('--btn-font-weight', config.btnFontWeight);
  root.style.setProperty('--input-radius', `${config.inputBorderRadius}px`);
  root.style.setProperty('--input-border-width', config.inputBorderEnabled ? `${config.inputBorderWidth}px` : '0px');
  root.style.setProperty('--sidebar-width', `${config.sidebarWidth}px`);
  root.style.setProperty('--border-radius-sm', `${config.cardRadius * 0.5}px`);
  root.style.setProperty('--border-radius-md', `${config.cardRadius}px`);
  root.style.setProperty('--border-radius-lg', `${config.cardRadius * 2}px`);

  root.style.setProperty('--bg-main', config.bgMain);
  root.style.setProperty('--bg-app', config.bgMain);
  root.style.setProperty('--bg-card', config.bgCard);
  root.style.setProperty('--bg-input', config.bgCard);

  if (config.oledMode) {
    root.style.setProperty('--text-main', '#f0f0f0');
    root.style.setProperty('--text-dark', '#f0f0f0');
    root.style.setProperty('--text-muted', '#666666');
    root.style.setProperty('--text-light', '#555555');
    root.style.setProperty('--bg-hover', '#111111');
    root.style.setProperty('--bg-success', '#0a1a0a');
    root.style.setProperty('--bg-danger', '#1a0a0a');
    root.style.setProperty('--input-border', '#2a2a2a');
    root.style.setProperty('--brand-orange-light', 'rgba(234, 88, 12, 0.12)');
    root.style.setProperty('--text-on-primary', '#ffffff');
    root.style.setProperty('--sticky-bar-bg', 'rgba(0, 0, 0, 0.9)');
    root.style.setProperty('--ig-mobile-nav-bg', 'var(--sidebar-bg)');
  } else if (config.darkMode) {
    root.style.setProperty('--text-main', '#f0f0f0');
    root.style.setProperty('--text-dark', '#f0f0f0');
    root.style.setProperty('--text-muted', '#8a8a8a');
    root.style.setProperty('--text-light', '#666666');
    root.style.setProperty('--bg-hover', '#222222');
    root.style.setProperty('--bg-success', '#0f2a0f');
    root.style.setProperty('--bg-danger', '#2a0f0f');
    root.style.setProperty('--input-border', '#3a3a3a');
    root.style.setProperty('--brand-orange-light', 'rgba(234, 88, 12, 0.15)');
    root.style.setProperty('--text-on-primary', '#ffffff');
    root.style.setProperty('--sticky-bar-bg', 'rgba(24, 24, 24, 0.85)');
    root.style.setProperty('--ig-mobile-nav-bg', 'var(--sidebar-bg)');
  } else {
    root.style.setProperty('--text-main', '#0f172a');
    root.style.setProperty('--text-dark', '#0f172a');
    root.style.setProperty('--text-muted', '#475569');
    root.style.setProperty('--text-light', '#64748b');
    root.style.setProperty('--bg-hover', '#f1f5f9');
    root.style.setProperty('--bg-success', '#f0fdf4');
    root.style.setProperty('--bg-danger', '#fef2f2');
    root.style.setProperty('--input-border', '#cbd5e1');
    root.style.setProperty('--brand-orange-light', 'rgba(234, 88, 12, 0.08)');
    root.style.setProperty('--text-on-primary', '#ffffff');
    root.style.setProperty('--sticky-bar-bg', 'rgba(255, 255, 255, 0.85)');
    root.style.setProperty('--ig-mobile-nav-bg', '#000000');
  }

  root.style.setProperty('--list-header-font-size', `${config.listHeaderFontSize}px`);
  root.style.setProperty('--list-body-font-size', `${config.listBodyFontSize}px`);
  root.style.setProperty('--list-header-uppercase', config.listHeaderUppercase ? 'uppercase' : 'none');
  root.style.setProperty('--list-header-bg', config.listHeaderBg);
  root.style.setProperty('--list-row-hover', config.listRowHoverColor);
  root.style.setProperty('--list-border-color', config.listBorderColor);
  root.style.setProperty('--list-stripe', config.listStripeEnabled ? 'inherit' : 'transparent');
  root.style.setProperty('--list-header-font-weight', config.listHeaderFontWeight);
  root.style.setProperty('--list-body-font-weight', config.listBodyFontWeight);
  root.style.setProperty('--list-cell-padding', `${config.listCellPadding}px`);
  root.style.setProperty('--list-accent-color', config.listAccentColor);
  root.style.setProperty('--list-font-family', config.listFontFamily);
  root.style.setProperty('--list-number-font-family', config.listNumberFontFamily);

  root.style.setProperty('--shadow-sm', shadowSm);
  root.style.setProperty('--shadow-md', shadowMd);
  root.style.setProperty('--shadow-lg', shadowLg);
  root.style.setProperty('--transition-smooth', transitionSmooth);

  root.style.setProperty('--color-success', '#22c55e');
  root.style.setProperty('--color-green', '#22c55e');
  root.style.setProperty('--color-danger', '#ef4444');
  root.style.setProperty('--color-red', '#ef4444');
  root.style.setProperty('--color-warning', '#f59e0b');
  root.style.setProperty('--color-blue', '#3b82f6');
  root.style.setProperty('--color-info', '#3b82f6');
  root.style.setProperty('--color-teal', '#14b8a6');
  root.style.setProperty('--color-purple', '#8b5cf6');
  root.style.setProperty('--color-pink', '#ec4899');
  root.style.setProperty('--color-yellow', '#facc15');
  root.style.setProperty('--color-cyan', '#06b6d4');
  root.style.setProperty('--color-button', '#f1a938');
  root.style.setProperty('--sileo-duration', `${config.notificationSpeed}ms`);

  const sidebarHover = adjustColor(config.sidebarBg, 40);
  root.style.setProperty('--bg-sidebar-hover', sidebarHover);
  root.style.setProperty('--sidebar-item-hover', sidebarHover);

  if (config.oledMode) {
    root.setAttribute('data-theme', 'oled');
  } else if (config.darkMode) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  if (config.uppercaseEnabled) {
    root.removeAttribute('data-uppercase-disabled');
  } else {
    root.setAttribute('data-uppercase-disabled', 'true');
  }

  if (config.fontWeightEnabled) {
    root.removeAttribute('data-font-weight-disabled');
  } else {
    root.setAttribute('data-font-weight-disabled', 'true');
  }
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

const lightLayout = {
  bgMain: '#f8fafc',
  bgCard: '#ffffff',
  borderColor: '#e2e8f0',
  sidebarBg: '#1e1b1c',
  listHeaderBg: '#f8fafc',
  listRowHoverColor: '#f8fafc',
  listBorderColor: '#e2e8f0',
  listAccentColor: '#ea580c',
};

const darkLayout = {
  bgMain: '#101010',
  bgCard: '#181818',
  borderColor: '#2f2f2f',
  sidebarBg: '#0a0a0a',
  listHeaderBg: '#101010',
  listRowHoverColor: '#222222',
  listBorderColor: '#2f2f2f',
  listAccentColor: '#f97316',
};

const oledLayout = {
  bgMain: '#000000',
  bgCard: '#0a0a0a',
  borderColor: '#1a1a1a',
  sidebarBg: '#000000',
  listHeaderBg: '#000000',
  listRowHoverColor: '#111111',
  listBorderColor: '#1a1a1a',
  listAccentColor: '#f97316',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('stockmaster-theme-v3');
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  });

  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(() => {
    const saved = localStorage.getItem('stockmaster-presets-v2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('stockmaster-theme-v3', JSON.stringify(config));
    applyConfigToDOM(config);
  }, [config]);

  useEffect(() => {
    localStorage.setItem('stockmaster-presets-v2', JSON.stringify(savedPresets));
  }, [savedPresets]);

  const updateConfig = useCallback((partial: Partial<ThemeConfig>) => {
    setConfig(p => ({ ...p, ...partial }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setConfig(p => {
      const nextDarkMode = !p.darkMode;
      const currentDefaults = p.darkMode ? darkLayout : lightLayout;
      const nextDefaults = nextDarkMode ? darkLayout : lightLayout;

      return {
        ...p,
        darkMode: nextDarkMode,
        bgMain: p.bgMain === currentDefaults.bgMain ? nextDefaults.bgMain : p.bgMain,
        bgCard: p.bgCard === currentDefaults.bgCard ? nextDefaults.bgCard : p.bgCard,
        borderColor: p.borderColor === currentDefaults.borderColor ? nextDefaults.borderColor : p.borderColor,
        sidebarBg: p.sidebarBg === currentDefaults.sidebarBg ? nextDefaults.sidebarBg : p.sidebarBg,
        listHeaderBg: (p as any).listHeaderBg === currentDefaults.listHeaderBg ? nextDefaults.listHeaderBg : (p as any).listHeaderBg,
        listRowHoverColor: (p as any).listRowHoverColor === currentDefaults.listRowHoverColor ? nextDefaults.listRowHoverColor : (p as any).listRowHoverColor,
        listBorderColor: (p as any).listBorderColor === currentDefaults.listBorderColor ? nextDefaults.listBorderColor : (p as any).listBorderColor,
        listAccentColor: (p as any).listAccentColor === currentDefaults.listAccentColor ? nextDefaults.listAccentColor : (p as any).listAccentColor,
      };
    });
  }, []);

  const toggleOledMode = useCallback(() => {
    setConfig(p => {
      if (p.oledMode) {
        const nextDefaults = p.darkMode ? darkLayout : lightLayout;
        return {
          ...p,
          oledMode: false,
          bgMain: nextDefaults.bgMain,
          bgCard: nextDefaults.bgCard,
          borderColor: nextDefaults.borderColor,
          sidebarBg: nextDefaults.sidebarBg,
          listHeaderBg: nextDefaults.listHeaderBg,
          listRowHoverColor: nextDefaults.listRowHoverColor,
          listBorderColor: nextDefaults.listBorderColor,
          listAccentColor: nextDefaults.listAccentColor,
        };
      } else {
        return {
          ...p,
          oledMode: true,
          ...oledLayout,
        };
      }
    });
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
      config, updateConfig, toggleDarkMode, toggleOledMode, resetTheme,
      applyPreset, savedPresets, savePreset, deletePreset,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { FONT_OPTIONS };
