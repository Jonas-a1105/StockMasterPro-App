import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { FormField } from '@shared/ui/FormField';
import { Card, CardTitle } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';
import { Heading } from '@shared/ui/Heading';
import { AppLogo } from '@shared/ui/AppLogo';
import styles from './AuthPage.module.css';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isPassValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    if (!isPassValid) {
      setError('La contraseña debe cumplir con todos los requisitos de criptografía.');
      return;
    }

    setLoading(true);
    try {
      await register({ tenantName, email, password, name });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passedCount = password.length === 0 ? 0 : Object.values(checks).filter(Boolean).length;

  let strengthLabel = 'Sin_Datos';
  let strengthBarColor = '#141414';

  if (password.length > 0) {
    if (passedCount === 1) {
      strengthLabel = 'Clave_Insegura';
      strengthBarColor = '#dc2626';
    } else if (passedCount === 2) {
      strengthLabel = 'Riesgo_Moderado';
      strengthBarColor = '#f97316';
    } else if (passedCount === 3) {
      strengthLabel = 'Criptografía_Fuerte';
      strengthBarColor = '#9ee63c';
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={`${styles.authHeader} ${styles.flexInline} ${styles.mb8}`}>
        <AppLogo size={84} className={styles.logoRegister} />
      </div>
      <Heading variant="h1" className={styles.headerTitle}>¡Bienvenido!</Heading>

      <Card className={`${styles.authCard} ${styles.borderColor222}`} padding="lg">
        <CardTitle className={styles.title}>Alta de Nodo Operativo</CardTitle>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.flexColumnGap16}>
          <FormField label="Nombre de la Empresa">
            <Input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
              placeholder="Mi Tienda"
            />
          </FormField>

          <FormField label="Nombre del Operador">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Jonás Mendoza"
            />
          </FormField>

          <FormField label="Correo Institucional">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="operador@empresa.com"
            />
          </FormField>

          <FormField label="Establecer Contraseña Maestra">
            <div className={styles.inputWrap}>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormField>

          <div className={`${styles.field} ${styles.mb8}`}>
            <div className={styles.strengthHeader}>
              <span>Seguridad de Clave</span>
              <span className={`${styles.fontWeightBold} ${styles.colorSuccess}`}>
                {strengthLabel}
              </span>
            </div>
            <div className={styles.strengthBarContainer}>
              <div
                className={styles.strengthBarFill}
                style={{ '--strength-width': passedCount === 0 ? '0%' : passedCount === 1 ? '33%' : passedCount === 2 ? '66%' : '100%', '--strength-color': strengthBarColor }}
              />
            </div>
          </div>

          <div className={styles.requirementsList}>
            <div className={`${styles.requirementRow} ${checks.length ? styles.requirementRowActive : ''}`}>
              <div className={styles.reqIcon}>
                {checks.length ? <Check size={12} className={styles.colorSuccess} /> : <X size={12} className={styles.colorDanger} />}
              </div>
              <span>Mínimo 8 caracteres obligatorios</span>
            </div>

            <div className={`${styles.requirementRow} ${checks.upper ? styles.requirementRowActive : ''}`}>
              <div className={styles.reqIcon}>
                {checks.upper ? <Check size={12} className={styles.colorSuccess} /> : <X size={12} className={styles.colorDanger} />}
              </div>
              <span>Incluir al menos una letra mayúscula</span>
            </div>

            <div className={`${styles.requirementRow} ${checks.number ? styles.requirementRowActive : ''}`}>
              <div className={styles.reqIcon}>
                {checks.number ? <Check size={12} className={styles.colorSuccess} /> : <X size={12} className={styles.colorDanger} />}
              </div>
              <span>Incluir al menos un dígito numérico</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className={`${styles.submitBtn} ${styles.submitBtnRegister}`}
          >
            Dar de Alta Operador
          </Button>
        </form>
      </Card>

      <div className={styles.footerLinks}>
        <Text variant="caption" color="muted">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className={`${styles.footerLinkAccent} ${styles.footerLinkAccentLogin}`}>
            Inicia Sesión
          </Link>
        </Text>
        <Text variant="caption" className={styles.mt12}>
          <Link to="/" className={`${styles.colorMuted} ${styles.textDecorationNone}`}>
            ➔ Volver al Inicio (Landing)
          </Link>
        </Text>
      </div>
    </div>
  );
}