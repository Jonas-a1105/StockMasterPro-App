import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@shared/lib/http/client';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { FormField } from '@shared/ui/FormField';
import { Card, CardBody, CardTitle } from '@shared/ui/Card';
import { Heading } from '@shared/ui/Heading';
import { Text } from '@shared/ui/Text';
import { AppLogo } from '@shared/ui/AppLogo';
import styles from './AuthPage.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authHeader}>
        <AppLogo size={84} className={styles.logo} />
        <Heading variant="h1" className={styles.headerTitle}>StockMaster Pro</Heading>
      </div>
      <Card className={styles.authCard} padding="lg">
        <CardTitle className={styles.title}>
          {sent ? 'Correo enviado' : 'Recuperar contraseña'}
        </CardTitle>

        {sent ? (
          <>
            <Text variant="body" color="muted" className={styles.mb8}>
              Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para
              restablecer tu contraseña.
            </Text>
            <Link to="/login" className={`${styles.footerLinkAccent} ${styles.textCenter} ${styles.mt12}`}>
              Volver al inicio de sesión
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <Text variant="body" color="muted" className={styles.mb8}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Text>
            {error && <div className={styles.error}>{error}</div>}
            <FormField label="Correo electrónico">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
              />
            </FormField>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!email}
              className={styles.submitBtn}
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
            <Link
              to="/login"
              className={`${styles.footerLinkAccent} ${styles.textCenter} ${styles.mt12}`}
            >
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </Card>
    </div>
  );
}