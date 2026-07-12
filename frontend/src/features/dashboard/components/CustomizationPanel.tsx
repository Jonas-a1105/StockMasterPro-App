import { useState } from 'react';
import { useTheme, palettes, FONT_OPTIONS } from '@contexts/ThemeContext';
import { X, Save, Trash2, Palette, Type, Square, Sparkles, Layers, Eye, List, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './CustomizationPanel.module.css';

interface PanelProps {
  open: boolean;
  onClose: () => void;
}

export function CustomizationPanel({ open, onClose }: PanelProps) {
  const { config, updateConfig, toggleDarkMode, toggleOledMode, resetTheme, applyPreset, savedPresets, savePreset, deletePreset } = useTheme();
  const [presetName, setPresetName] = useState('');
  const [sections, setSections] = useState({
    colores: true,
    bordes: true,
    tipografia: true,
    lista: true,
    visualizacion: true,
    botones: true,
    inputs: true,
    animaciones: true,
    paletas: true,
    ajustes: true,
  });

  const toggleSection = (key: keyof typeof sections) =>
    setSections(s => ({ ...s, [key]: !s[key] }));

  const SectionHeader = ({ icon, title, sectionKey }: { icon: React.ReactNode; title: string; sectionKey: keyof typeof sections }) => (
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
              <ColorRow label="Principal" value={config.primaryColor} onChange={v => updateConfig({ primaryColor: v })} />
              <ColorRow label="Secundario" value={config.secondaryColor} onChange={v => updateConfig({ secondaryColor: v })} />
              <ColorRow label="Fondo general" value={config.bgMain} onChange={v => updateConfig({ bgMain: v })} />
              <ColorRow label="Fondo tarjetas" value={config.bgCard} onChange={v => updateConfig({ bgCard: v })} />
              <ColorRow label="Sidebar" value={config.sidebarBg} onChange={v => updateConfig({ sidebarBg: v })} />
              <ColorRow label="Borde" value={config.borderColor} onChange={v => updateConfig({ borderColor: v })} />
            </div>
          )}

          {/* === BORDES === */}
          <SectionHeader icon={<Square size={14} />} title="Bordes" sectionKey="bordes" />
          {sections.bordes && (
            <div className={styles.section}>
              <SliderRow label="Radio global" value={config.cardRadius} min={0} max={24} step={1} suffix="px" onChange={v => updateConfig({ cardRadius: v })} />
              <SliderRow label="Grosor borde" value={config.borderWidth} min={0} max={4} step={1} suffix="px" onChange={v => updateConfig({ borderWidth: v })} />
              <ToggleRow label="Bordes activados" value={config.cardBorderEnabled} onChange={v => updateConfig({ cardBorderEnabled: v })} />
            </div>
          )}

          {/* === TIPOGRAFÍA === */}
          <SectionHeader icon={<Type size={14} />} title="Tipografía" sectionKey="tipografia" />
          {sections.tipografia && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Familia tipográfica</label>
                <select
                  className={styles.select}
                  value={config.fontFamily}
                  onChange={e => updateConfig({ fontFamily: e.target.value })}
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <SliderRow label="Tamaño base" value={config.fontSizeBase} min={12} max={20} step={1} suffix="px" onChange={v => updateConfig({ fontSizeBase: v })} />
              <SliderRow label="Espaciado letras" value={config.letterSpacing} min={-1} max={4} step={0.5} suffix="px" onChange={v => updateConfig({ letterSpacing: v })} />
              <ToggleRow label="Mayúsculas Automáticas" value={config.uppercaseEnabled} onChange={v => updateConfig({ uppercaseEnabled: v })} />
              <ToggleRow label="Pesos de Fuente (Negritas)" value={config.fontWeightEnabled} onChange={v => updateConfig({ fontWeightEnabled: v })} />
            </div>
          )}

          {/* === LISTA === */}
          <SectionHeader icon={<List size={14} />} title="Lista (Tablas)" sectionKey="lista" />
          {sections.lista && (
            <div className={styles.section}>
              <SliderRow label="Tamaño encabezados" value={config.listHeaderFontSize} min={8} max={16} step={1} suffix="px" onChange={v => updateConfig({ listHeaderFontSize: v })} />
              <SliderRow label="Tamaño contenido" value={config.listBodyFontSize} min={10} max={18} step={1} suffix="px" onChange={v => updateConfig({ listBodyFontSize: v })} />
              <SliderRow label="Padding celdas" value={config.listCellPadding} min={6} max={24} step={2} suffix="px" onChange={v => updateConfig({ listCellPadding: v })} />
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Tipografía texto</label>
                <select
                  className={styles.select}
                  value={config.listFontFamily}
                  onChange={e => updateConfig({ listFontFamily: e.target.value })}
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Tipografía números</label>
                <select
                  className={styles.select}
                  value={config.listNumberFontFamily}
                  onChange={e => updateConfig({ listNumberFontFamily: e.target.value })}
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                  <option value="'Courier New', Courier, monospace">Courier New</option>
                  <option value="'Consolas', monospace">Consolas</option>
                  <option value="'Fira Code', monospace">Fira Code</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                  <option value="'Source Code Pro', monospace">Source Code Pro</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Peso encabezados</label>
                <select className={styles.select} value={config.listHeaderFontWeight} onChange={e => updateConfig({ listHeaderFontWeight: e.target.value })}>
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semi Bold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra Bold</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Peso contenido</label>
                <select className={styles.select} value={config.listBodyFontWeight} onChange={e => updateConfig({ listBodyFontWeight: e.target.value })}>
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semi Bold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra Bold</option>
                </select>
              </div>
              <ToggleRow label="Mayúsculas en encabezados" value={config.listHeaderUppercase} onChange={v => updateConfig({ listHeaderUppercase: v })} />
              <ToggleRow label="Filas alternadas" value={config.listStripeEnabled} onChange={v => updateConfig({ listStripeEnabled: v })} />
              <ColorRow label="Fondo encabezados" value={config.listHeaderBg} onChange={v => updateConfig({ listHeaderBg: v })} />
              <ColorRow label="Color hover filas" value={config.listRowHoverColor} onChange={v => updateConfig({ listRowHoverColor: v })} />
              <ColorRow label="Color borde lista" value={config.listBorderColor} onChange={v => updateConfig({ listBorderColor: v })} />
              <ColorRow label="Color acento lista" value={config.listAccentColor} onChange={v => updateConfig({ listAccentColor: v })} />
            </div>
          )}

          {/* === VISUALIZACIÓN === */}
          <SectionHeader icon={<Eye size={14} />} title="Visualización" sectionKey="visualizacion" />
          {sections.visualizacion && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Vista de Inventario</label>
                <select
                  className={styles.select}
                  value={config.productViewMode}
                  onChange={e => updateConfig({ productViewMode: e.target.value as 'table' | 'cards' })}
                >
                  <option value="table">Lista (Tabla)</option>
                  <option value="cards">Tarjetas</option>
                </select>
              </div>
              <ToggleRow label="Skeleton Screen (Carga)" value={config.skeletonEnabled} onChange={v => updateConfig({ skeletonEnabled: v })} />
            </div>
          )}

          {/* === BOTONES === */}
          <SectionHeader icon={<Sparkles size={14} />} title="Botones" sectionKey="botones" />
          {sections.botones && (
            <div className={styles.section}>
              <SliderRow label="Radio bordes" value={config.btnBorderRadius} min={0} max={24} step={1} suffix="px" onChange={v => updateConfig({ btnBorderRadius: v })} />
              <SliderRow label="Grosor borde" value={config.btnBorderWidth} min={0} max={4} step={1} suffix="px" onChange={v => updateConfig({ btnBorderWidth: v })} />
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Peso de fuente</label>
                <select className={styles.select} value={config.btnFontWeight} onChange={e => updateConfig({ btnFontWeight: e.target.value })}>
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semi Bold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra Bold</option>
                  <option value="900">Black</option>
                </select>
              </div>
            </div>
          )}

          {/* === INPUTS === */}
          <SectionHeader icon={<Layers size={14} />} title="Campos de texto" sectionKey="inputs" />
          {sections.inputs && (
            <div className={styles.section}>
              <SliderRow label="Radio bordes" value={config.inputBorderRadius} min={0} max={24} step={1} suffix="px" onChange={v => updateConfig({ inputBorderRadius: v })} />
              <SliderRow label="Grosor borde" value={config.inputBorderWidth} min={0} max={4} step={1} suffix="px" onChange={v => updateConfig({ inputBorderWidth: v })} />
            </div>
          )}

          {/* === ANIMACIONES === */}
          <SectionHeader icon={<Sparkles size={14} />} title="Animaciones" sectionKey="animaciones" />
          {sections.animaciones && (
            <div className={styles.section}>
              <ToggleRow label="Animaciones activadas" value={config.animationEnabled} onChange={v => updateConfig({ animationEnabled: v })} />
              <SliderRow label="Duración transición" value={config.transitionDuration} min={0} max={1.5} step={0.1} suffix="s" onChange={v => updateConfig({ transitionDuration: v })} />
              <SliderRow label="Velocidad notificación" value={config.notificationSpeed} min={100} max={1000} step={50} suffix="ms" onChange={v => updateConfig({ notificationSpeed: v })} />
              <ToggleRow label="Sombras globales" value={config.shadowEnabled} onChange={v => updateConfig({ shadowEnabled: v })} />
            </div>
          )}

          {/* === PALETAS === */}
          <SectionHeader icon={<Eye size={14} />} title="Paletas predefinidas" sectionKey="paletas" />
          {sections.paletas && (
            <div className={styles.section}>
              <div className={styles.paletteGrid}>
                {palettes.map(p => (
                  <button
                    key={p.name}
                    className={styles.paletteCard}
                    onClick={() => applyPreset({ ...config, primaryColor: p.primary, secondaryColor: p.secondary, sidebarBg: p.sidebar })}
                  >
                    <div className={styles.paletteSwatches}>
                      <span className={styles.swatch} style={{ '--swatch-color': p.primary }} />
                      <span className={styles.swatch} style={{ '--swatch-color': p.secondary }} />
                      <span className={styles.swatch} style={{ '--swatch-color': p.sidebar }} />
                    </div>
                    <span className={styles.paletteName}>{p.name}</span>
                  </button>
                ))}
              </div>
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
                  onChange={e => setPresetName(e.target.value)}
                />
                <button
                  className={styles.saveBtn}
                  disabled={!presetName.trim()}
                  onClick={() => { savePreset(presetName.trim()); setPresetName(''); }}
                >
                  <Save size={14} />
                  Guardar
                </button>
              </div>
              {savedPresets.length === 0 && (
                <p className={styles.empty}>No hay ajustes guardados</p>
              )}
              <div className={styles.presetList}>
                {savedPresets.map(p => (
                  <div key={p.name} className={styles.presetItem}>
                    <button className={styles.presetApply} onClick={() => applyPreset(p.config)}>
                      {p.name}
                    </button>
                    <button className={styles.presetDelete} onClick={() => deletePreset(p.name)} title="Eliminar">
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
            <button className={`${styles.oledToggle} ${config.oledMode ? styles.oledToggleOn : ''}`} onClick={toggleOledMode}>
              <OledIcon />
              Modo OLED
            </button>
            <button className={`${styles.oledToggle} ${config.shadowEnabled ? styles.oledToggleOn : ''}`} onClick={() => updateConfig({ shadowEnabled: !config.shadowEnabled })}>
              <span className={`${styles.w16} ${styles.h16} ${styles.bgRadial} ${styles.roundedCard}`} />
              Sombras globales
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
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.colorRow}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.colorInputGroup}>
        <input
          type="color"
          className={styles.colorPicker}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <input
          type="text"
          className={styles.colorText}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void;
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
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        <span className={styles.sliderValue}>{value}{suffix}</span>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
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
