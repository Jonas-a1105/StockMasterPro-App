import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { type ColumnMapping, downloadTemplate, parseExcelFile } from '@shared/lib/excelHelper';
import { Modal } from '@shared/ui/Modal';
import { Button, Stack, Flex, Text, Card } from '@shared/ui';
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
    <Modal open={open} onClose={handleClose} title={`Importar ${title}`} noPadding>
      <div className={styles.body}>
        {step === 'upload' && (
          <div className={styles.uploadStep}>
            <Text variant="body" color="muted" className={styles.description}>
              Carga un archivo de Excel (.xlsx) o de valores separados por comas (.csv) para
              realizar una importación masiva de {title.toLowerCase()}.
            </Text>

            <Card className={styles.templateSection}>
              <Stack gap="sm">
                <Text variant="caption" color="muted">
                  Descarga la plantilla de ejemplo para estructurar correctamente tus datos:
                </Text>
                <Flex gap="sm" className={styles.templateButtons}>
                  <Button variant="ghost" size="sm" onClick={() => downloadTemplate(columns, templateFilename, 'xlsx')} leftIcon={<Download size={14} />}>
                    Plantilla Excel (.xlsx)
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadTemplate(columns, templateFilename, 'csv')} leftIcon={<Download size={14} />}>
                    Plantilla CSV (.csv)
                  </Button>
                </Flex>
              </Stack>
            </Card>

            <div className={styles.dropzone} onClick={triggerFileSelect}>
              <Upload size={32} className={styles.uploadIcon} />
              <Text variant="body" weight="semibold" className={styles.dropTitle}>Selecciona o arrastra tu archivo aquí</Text>
              <Text variant="caption" color="muted" className={styles.dropSub}>Formatos soportados: .xlsx, .csv</Text>
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
            <Card className={styles.previewHeader}>
              <Flex align="center" gap="sm">
                <FileSpreadsheet className={styles.excelIcon} size={24} />
                <Stack gap="xs">
                  <Text variant="body" weight="semibold" className={styles.filename}>{file?.name}</Text>
                  <Text variant="caption" color="muted" className={styles.filesize}>
                    {parsedData.length} filas listas para importar.
                  </Text>
                </Stack>
              </Flex>
            </Card>

            <Card className={styles.tablePreviewContainer}>
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
                          {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 3 && (
                <Text variant="caption" color="muted" className={styles.moreRows}>... y {parsedData.length - 3} filas más.</Text>
              )}
            </Card>

            <Flex justify="end" gap="sm" className={styles.footerActions}>
              <Button variant="secondary" size="sm" onClick={resetState}>Elegir otro archivo</Button>
              <Button size="sm" onClick={handleStartImport}>Iniciar Importación</Button>
            </Flex>
          </div>
        )}

        {step === 'importing' && (
          <div className={styles.progressStep}>
            <Loader2 size={32} className={styles.spinner} />
            <Text variant="h5" weight="bold" className={styles.progressTitle}>Procesando importación...</Text>
            <Text variant="caption" color="muted" className={styles.progressText}>Importando fila {progress.current} de {progress.total}</Text>
            <div className={styles.progressBarBg}>
              <div className={styles.progressBarFill} style={{ '--import-progress': `${(progress.current / progress.total) * 100}%` }} />
            </div>
          </div>
        )}

        {step === 'summary' && summaryResult && (
          <div className={styles.summaryStep}>
            <CheckCircle2 size={40} className={styles.successIcon} />
            <Text variant="h5" weight="bold" className={styles.summaryTitle}>Importación Completada</Text>

            <div className={styles.summaryGrid}>
              <Card className={styles.summaryCard} padding="sm" textAlign="center">
                <Text variant="caption" weight="semibold" color="muted" className={styles.summaryLabel}>Creados/Actualizados</Text>
                <Text variant="h2" weight="bold" color="success" className={styles.summaryValSuccess}>{summaryResult.successCount}</Text>
              </Card>
              <Card className={styles.summaryCard} padding="sm" textAlign="center">
                <Text variant="caption" weight="semibold" color="muted" className={styles.summaryLabel}>Errores</Text>
                <Text variant="h2" weight="bold" color="danger" className={styles.summaryValDanger}>{summaryResult.errorCount}</Text>
              </Card>
            </div>

            {summaryResult.details.length > 0 && (
              <Card className={styles.detailsSection}>
                <Text variant="caption" weight="semibold" className={styles.detailsTitle}>Detalles de procesamiento:</Text>
                <div className={styles.detailsList}>
                  {summaryResult.details.map((detail, index) => (
                    <Text key={index} variant="caption" className={detail.includes('Error') ? styles.detailError : styles.detailInfo}>
                      {detail}
                    </Text>
                  ))}
                </div>
              </Card>
            )}

            <Button className={styles.finishBtn} onClick={handleClose}>Finalizar</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}