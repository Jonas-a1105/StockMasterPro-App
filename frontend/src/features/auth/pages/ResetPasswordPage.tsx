import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@shared/lib/http/client';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { FormField } from '@shared/ui/FormField';
import { Card, CardTitle } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';
import { Heading } from '@shared/ui/Heading';
import styles from './AuthPage.module.css';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authHeader}>
          <Heading variant="h1" className={styles.headerTitle}>StockMaster Pro</Heading>
        </div>
        <Card className={styles.authCard} padding="lg">
          <CardTitle className={styles.title}>Enlace inválido</CardTitle>
          <Text variant="body" color="muted" className={styles.mb8}>
            El enlace de restablecimiento no es válido o ha expirado.
          </Text>
          <Link to="/forgot-password" className={styles.footerLinkAccent}>
            Solicitar nuevo enlace
          </Link>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authHeader}>
          <Heading variant="h1" className={styles.headerTitle}>StockMaster Pro</Heading>
        </div>
        <Card className={styles.authCard} padding="lg">
          <CardTitle className={styles.title}>Contraseña actualizada</CardTitle>
          <Text variant="body" color="muted" className={styles.mb8}>
            Tu contraseña se ha restablecido correctamente.
          </Text>
          <Link to="/login" className={styles.footerLinkAccent}>
            Iniciar sesión
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authHeader}>
        <Heading variant="h1" className={styles.headerTitle}>StockMaster Pro</Heading>
      </div>
      <Card className={styles.authCard} padding="lg">
        <CardTitle className={styles.title}>Restablecer contraseña</CardTitle>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <FormField label="Nueva contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </FormField>
          <FormField label="Confirmar contraseña">
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
            />
          </FormField>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!password || !confirm}
            className={styles.submitBtn}
          >
            {loading ? 'Guardando...' : 'Restablecer contraseña'}
          </Button>
          <Link
            to="/login"
            className={`${styles.footerLinkAccent} ${styles.textCenter} ${styles.block} ${styles.mt16}`}
          >
            Volver al inicio de sesión
          </Link>
        </form>
      </Card>
    </div>
  );
}