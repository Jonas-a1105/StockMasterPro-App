import { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { type ColumnMapping, downloadTemplate, parseExcelFile } from '@shared/lib/excelHelper';
import styles from './ImportModal.module.css';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: ColumnMapping[];
  templateFilename: string;
  onImport: (
    data: any[],
    onProgress: (current: number, total: number) => void
  ) => Promise<{ successCount: number; errorCount: number; details: string[] }>;
}

export function ImportModal({
  open,
  onClose,
  title,
  columns,
  templateFilename,
  onImport,
}: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'summary'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summaryResult, setSummaryResult] = useState<{
    successCount: number;
    errorCount: number;
    details: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrors([]);

    const result = await parseExcelFile(selectedFile, columns);
    if (result.success) {
      setParsedData(result.data);
      setStep('preview');
    } else {
      setErrors(result.errors);
      setFile(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleStartImport = async () => {
    setStep('importing');
    setProgress({ current: 0, total: parsedData.length });

    try {
      const result = await onImport(parsedData, (current, total) => {
        setProgress({ current, total });
      });
      setSummaryResult(result);
      setStep('summary');
    } catch (err: any) {
      setErrors([`Error inesperado en la importación: ${err.message}`]);
      setStep('upload');
    }
  };

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setSummaryResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>Importar {title}</h3>
          <button className={styles.closeBtn} onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {step === 'upload' && (
            <div className={styles.uploadStep}>
              <p className={styles.description}>
                Carga un archivo de Excel (.xlsx) o de valores separados por comas (.csv) para
                realizar una importación masiva de {title.toLowerCase()}.
              </p>

              {/* Template Download */}
              <div className={styles.templateSection}>
                <span>
                  Descarga la plantilla de ejemplo para estructurar correctamente tus datos:
                </span>
                <div className={styles.templateButtons}>
                  <button
                    className={styles.textBtn}
                    onClick={() => downloadTemplate(columns, templateFilename, 'xlsx')}
                  >
                    <Download size={14} /> Plantilla Excel (.xlsx)
                  </button>
                  <button
                    className={styles.textBtn}
                    onClick={() => downloadTemplate(columns, templateFilename, 'csv')}
                  >
                    <Download size={14} /> Plantilla CSV (.csv)
                  </button>
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div className={styles.dropzone} onClick={triggerFileSelect}>
                <Upload size={32} className={styles.uploadIcon} />
                <span className={styles.dropTitle}>Selecciona o arrastra tu archivo aquí</span>
                <span className={styles.dropSub}>Formatos soportados: .xlsx, .csv</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className={styles.hiddenInput}
                />
              </div>

              {errors.length > 0 && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={16} />
                  <div>
                    {errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className={styles.previewStep}>
              <div className={styles.previewHeader}>
                <FileSpreadsheet className={styles.excelIcon} size={24} />
                <div>
                  <div className={styles.filename}>{file?.name}</div>
                  <div className={styles.filesize}>
                    {parsedData.length} filas listas para importar.
                  </div>
                </div>
              </div>

              {/* Table Preview */}
              <div className={styles.tablePreviewContainer}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key}>{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 3).map((row, rIndex) => (
                      <tr key={rIndex}>
                        {columns.map((col) => (
                          <td key={col.key}>
                            {row[col.key] !== undefined && row[col.key] !== null
                              ? String(row[col.key])
                              : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 3 && (
                  <div className={styles.moreRows}>... y {parsedData.length - 3} filas más.</div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className={styles.footerActions}>
                <button className={styles.cancelBtn} onClick={resetState}>
                  Elegir otro archivo
                </button>
                <button className={styles.confirmBtn} onClick={handleStartImport}>
                  Iniciar Importación
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className={styles.progressStep}>
              <Loader2 size={32} className={styles.spinner} />
              <div className={styles.progressTitle}>Procesando importación...</div>
              <div className={styles.progressText}>
                Importando fila {progress.current} de {progress.total}
              </div>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={
                    {
                      '--import-progress': `${(progress.current / progress.total) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          )}

          {step === 'summary' && summaryResult && (
            <div className={styles.summaryStep}>
              <CheckCircle2 size={40} className={styles.successIcon} />
              <div className={styles.summaryTitle}>Importación Completada</div>

              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Creados/Actualizados</div>
                  <div className={styles.summaryValSuccess}>{summaryResult.successCount}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Errores</div>
                  <div className={styles.summaryValDanger}>{summaryResult.errorCount}</div>
                </div>
              </div>

              {summaryResult.details.length > 0 && (
                <div className={styles.detailsSection}>
                  <div className={styles.detailsTitle}>Detalles de procesamiento:</div>
                  <div className={styles.detailsList}>
                    {summaryResult.details.map((detail, index) => (
                      <div
                        key={index}
                        className={
                          detail.includes('Error') ? styles.detailError : styles.detailInfo
                        }
                      >
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className={styles.finishBtn} onClick={handleClose}>
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
