import { useState } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import {
  X,
  Save,
  Trash2,
  Palette,
  Type,
  Square,
  Sparkles,
  Layers,
  Eye,
  List,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import styles from './CustomizationPanel.module.css';

interface PanelProps {
  open: boolean;
  onClose: () => void;
}

export function CustomizationPanel({ open, onClose }: PanelProps) {
  const {
    config,
    updateConfig,
    toggleDarkMode,
    toggleOledMode,
    resetTheme,
    applyPreset,
    savedPresets,
    savePreset,
    deletePreset,
  } = useTheme();
  const [presetName, setPresetName] = useState('');
  const [sections, setSections] = useState({
    colores: true,
    bordes: true,
    tipografia: true,
    animaciones: true,
    paletas: true,
    ajustes: true,
  });

  const toggleSection = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const SectionHeader = ({
    icon,
    title,
    sectionKey,
  }: {
    icon: React.ReactNode;
    title: string;
    sectionKey: keyof typeof sections;
  }) => (
    <button className={styles.sectionHeader} onClick={() => toggleSection(sectionKey)}>
      <span className={styles.sectionTitle}>
        {icon}
        {title}
      </span>
      {sections[sectionKey] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );

  return (
    <>
      <div className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`} onClick={onClose} />
      <aside className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Palette size={18} />
            Personalización
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* === COLORES === */}
          <SectionHeader icon={<Layers size={14} />} title="Colores" sectionKey="colores" />
          {sections.colores && (
            <div className={styles.section}>
              <ColorRow
                label="Color principal"
                value={config.primaryColor}
                onChange={(v) => updateConfig({ primaryColor: v })}
              />
              <ColorRow
                label="Familia tipográfica"
                value={config.fontFamily || "'Segoe UI', sans-serif"}
                onChange={(v) => updateConfig({ fontFamily: v })}
              />
            </div>
          )}

          {/* === BORDES === */}
          <SectionHeader icon={<Square size={14} />} title="Bordes" sectionKey="bordes" />
          {sections.bordes && (
            <div className={styles.section}>
              <ToggleRow
                label="Bordes en tarjetas"
                value={config.cardBorders}
                onChange={(v) => updateConfig({ cardBorders: v })}
              />
              <ToggleRow
                label="Sombras en tarjetas"
                value={config.shadows}
                onChange={(v) => updateConfig({ shadows: v })}
              />
            </div>
          )}

          {/* === TIPOGRAFÍA === */}
          <SectionHeader icon={<Type size={14} />} title="Tipografía" sectionKey="tipografia" />
          {sections.tipografia && (
            <div className={styles.section}>
              <SliderRow
                label="Tamaño base"
                value={config.fontSizeBase}
                min={12}
                max={20}
                step={1}
                suffix="px"
                onChange={(v) => updateConfig({ fontSizeBase: v })}
              />
            </div>
          )}

          {/* === ANIMACIONES === */}
          <SectionHeader
            icon={<Sparkles size={14} />}
            title="Animaciones"
            sectionKey="animaciones"
          />
          {sections.animaciones && (
            <div className={styles.section}>
              <ToggleRow
                label="Animaciones activadas"
                value={config.animationEnabled}
                onChange={(v) => updateConfig({ animationEnabled: v })}
              />
            </div>
          )}

          {/* === DENSIDAD === */}
          <SectionHeader icon={<List size={14} />} title="Densidad" sectionKey="densidad" />
          {sections.densidad && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Espaciado</label>
                <select
                  className={styles.select}
                  value={config.density}
                  onChange={(e) => updateConfig({ density: e.target.value as 'compact' | 'comfortable' | 'spacious' })}
                >
                  <option value="compact">Compacta</option>
                  <option value="comfortable">Confortable</option>
                  <option value="spacious">Espaciosa</option>
                </select>
              </div>
            </div>
          )}

          {/* === PALETAS === */}
          <SectionHeader
            icon={<Eye size={14} />}
            title="Paletas predefinidas"
            sectionKey="paletas"
          />
          {sections.paletas && (
            <div className={styles.section}>
              <p className={styles.paletteNote}>Cambia el color principal desde la sección Colores</p>
            </div>
          )}

          {/* === AJUSTES GUARDADOS === */}
          <SectionHeader icon={<Save size={14} />} title="Ajustes guardados" sectionKey="ajustes" />
          {sections.ajustes && (
            <div className={styles.section}>
              <div className={styles.saveRow}>
                <input
                  className={styles.textInput}
                  placeholder="Nombre del ajuste..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <button
                  className={styles.saveBtn}
                  disabled={!presetName.trim()}
                  onClick={() => {
                    savePreset(presetName.trim());
                    setPresetName('');
                  }}
                >
                  <Save size={14} />
                  Guardar
                </button>
              </div>
              {savedPresets.length === 0 && (
                <p className={styles.empty}>No hay ajustes guardados</p>
              )}
              <div className={styles.presetList}>
                {savedPresets.map((p) => (
                  <div key={p.name} className={styles.presetItem}>
                    <button className={styles.presetApply} onClick={() => applyPreset(p.config)}>
                      {p.name}
                    </button>
                    <button
                      className={styles.presetDelete}
                      onClick={() => deletePreset(p.name)}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.globalActions}>
            <button className={styles.darkToggle} onClick={toggleDarkMode}>
              {config.darkMode ? <SunIcon /> : <MoonIcon />}
              {config.darkMode ? 'Modo claro' : 'Modo oscuro'}
            </button>
            <button
              className={`${styles.oledToggle} ${config.oledMode ? styles.oledToggleOn : ''}`}
              onClick={toggleOledMode}
            >
              <OledIcon />
              Modo OLED
            </button>
            <button className={styles.resetBtn} onClick={resetTheme}>
              <RotateCcw size={14} />
              Restaurar valores
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function OledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
      <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.colorRow}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.colorInputGroup}>
        <input
          type="color"
          className={styles.colorPicker}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className={styles.colorText}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.sliderRow}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.sliderGroup}>
        <input
          type="range"
          className={styles.slider}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <span className={styles.sliderValue}>
          {value}
          {suffix}
        </span>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <button
        className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className={styles.toggleKnob} />
      </button>
    </div>
  );
}