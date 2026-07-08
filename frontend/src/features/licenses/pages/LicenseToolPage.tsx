import { useState } from 'react';
import { Shield, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { api } from '@shared/lib/http/client';
import styles from './LicenseToolPage.module.css';

export function LicenseToolPage() {
  const { showToast } = useToast();
  const [days, setDays] = useState(365);
  const [tier, setTier] = useState('pro');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.generateLicense({ days, tier });
      setGeneratedCode(res.code);
      showToast('Código de licencia generado exitosamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al generar licencia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    showToast('Código copiado al portapapeles', 'success');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Shield size={24} />
          <h2>Generador de Licencias Offline</h2>
        </div>
        <p className={styles.description}>
          Genera códigos de licencia firmados criptográficamente.
          Estos códigos pueden ser verificados sin conexión a internet
          usando la clave pública incorporada en la aplicación.
        </p>
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Días de duración</label>
            <input
              type="number"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className={styles.field}>
            <label>Tier / Plan</label>
            <select value={tier} onChange={e => setTier(e.target.value)}>
              <option value="pro">PRO</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generando...' : 'Generar Código de Licencia'}
          </button>
        </div>
        {generatedCode && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <CheckCircle size={16} />
              <span>Código generado exitosamente</span>
              <button className={styles.copyBtn} onClick={copyToClipboard}>
                <Copy size={14} /> Copiar
              </button>
            </div>
            <textarea
              className={styles.codeArea}
              value={generatedCode}
              readOnly
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );
}
