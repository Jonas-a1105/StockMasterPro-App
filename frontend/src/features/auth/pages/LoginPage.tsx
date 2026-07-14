import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { FormField } from '@shared/ui/FormField';
import { Card, CardTitle } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';
import { Heading } from '@shared/ui/Heading';
import { AppLogo } from '@shared/ui/AppLogo';
import { Eye, EyeOff, User } from 'lucide-react';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('stockmaster-remember', email);
      } else {
        localStorage.removeItem('stockmaster-remember');
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authHeader}>
        <AppLogo size={84} className={styles.logo} />
        <Heading variant="h1" className={styles.headerTitle}>¡Bienvenido!</Heading>
      </div>

      <Card className={styles.authCard} padding="lg">
        <CardTitle className={styles.title}>Acceso al Sistema Central</CardTitle>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.flexColumnGap16}>
          <FormField label="Identificador de Usuario">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="usuario@empresa.com"
              leftIcon={<User size={14} />}
            />
          </FormField>

          <FormField label="Clave Criptográfica">
            <div className={styles.inputWrap}>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeBtn}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
            </div>
          </FormField>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className={styles.checkbox}
            />
            <div className={styles.checkboxCustom}>
              {rememberMe && (
                <svg
                  className={styles.checkboxCheckIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className={styles.checkboxText}>
              Mantener estación autenticada en esta terminal
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className={styles.submitBtn}
          >
            Autenticar Estación
          </Button>
        </form>
      </Card>

      <div className={styles.footerLinks}>
        <Text variant="caption" color="muted">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className={`${styles.footerLinkAccent} ${styles.footerLinkAccentRegister}`}>
            Regístrate
          </Link>
        </Text>
        <Text variant="caption" className={styles.mt12}>
          <Link to="/" className={`${styles.textDecorationNone} ${styles.colorMuted}`}>
            ➔ Volver al Inicio (Landing)
          </Link>
        </Text>
      </div>
    </div>
  );
}