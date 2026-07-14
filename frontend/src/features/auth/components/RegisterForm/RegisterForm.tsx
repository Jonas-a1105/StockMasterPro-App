import { Stack, Text, Card, CardTitle, FormField, Input, Button } from '@shared/ui';
import { Check, X } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useState, useMemo } from 'react';
import { useAuthForm } from '../../hooks';
import { type RegisterData } from '../../types/auth.types';
import styles from './RegisterForm.module.css';

export function RegisterForm() {
  const { register } = useAuth();

  const { values, errors, handleChange, handleBlur, handleSubmit, isSubmitting, serverError } =
    useAuthForm<RegisterData>({
      initialValues: { tenantName: '', name: '', email: '', password: '' },
      validate: (vals) => {
        const errs: Partial<Record<keyof RegisterData, string>> = {};
        if (!vals.tenantName.trim()) errs.tenantName = 'El nombre de la empresa es obligatorio';
        if (!vals.name.trim()) errs.name = 'El nombre del operador es obligatorio';
        if (!vals.email) errs.email = 'El correo es obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Formato de email inválido';
        if (!vals.password) errs.password = 'La contraseña es obligatoria';
        else if (vals.password.length < 8) errs.password = 'Mínimo 8 caracteres';
        else if (!/[A-Z]/.test(vals.password)) errs.password = 'Al menos una mayúscula';
        else if (!/[0-9]/.test(vals.password)) errs.password = 'Al menos un número';
        return errs;
      },
      onSubmit: async (data) => {
        await register({ tenantName: data.tenantName, email: data.email, password: data.password, name: data.name });
      },
    });

  const [showPassword, setShowPassword] = useState(false);

  const checks = useMemo(
    () => ({
      length: values.password.length >= 8,
      upper: /[A-Z]/.test(values.password),
      number: /[0-9]/.test(values.password),
    }),
    [values.password]
  );

  const passedCount = useMemo(
    () => (values.password.length === 0 ? 0 : Object.values(checks).filter(Boolean).length),
    [checks, values.password.length]
  );

  const strengthBarClass = useMemo(() => {
    if (values.password.length === 0) return styles.strengthBarEmpty;
    if (passedCount === 1) return styles.strengthBarWeak;
    if (passedCount === 2) return styles.strengthBarMedium;
    return styles.strengthBarStrong;
  }, [passedCount, values.password.length]);

  const strengthLabel = useMemo(() => {
    if (values.password.length === 0) return 'Sin_Datos';
    if (passedCount === 1) return 'Clave_Insegura';
    if (passedCount === 2) return 'Riesgo_Moderado';
    return 'Criptografía_Fuerte';
  }, [passedCount, values.password.length]);

  return (
    <Card className={`${styles.authCard} ${styles.borderColor222}`} padding="lg">
      <CardTitle className={styles.title}>Alta de Nodo Operativo</CardTitle>

      {serverError && <Text variant="caption" color="danger" className={styles.error}>{serverError}</Text>}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <FormField label="Nombre de la Empresa" error={errors.tenantName}>
            <Input
              name="tenantName"
              type="text"
              value={values.tenantName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Mi Tienda"
              autoComplete="organization"
            />
          </FormField>

          <FormField label="Nombre del Operador" error={errors.name}>
            <Input
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Ej. Jonás Mendoza"
              autoComplete="name"
            />
          </FormField>

          <FormField label="Correo Institucional" error={errors.email}>
            <Input
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="operador@empresa.com"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Establecer Contraseña Maestra" error={errors.password}>
            <div className={styles.inputWrap}>
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="••••••••"
                rightIcon={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                }
                autoComplete="new-password"
              />
            </div>
          </FormField>

          <div className={`${styles.field} ${styles.mb8}`}>
            <div className={styles.strengthHeader}>
              <span>Seguridad de Clave</span>
              <span className={`${styles.fontWeightBold} ${styles.colorSuccess}`}>{strengthLabel}</span>
            </div>
            <div className={styles.strengthBarContainer}>
              <div className={`${styles.strengthBarFill} ${strengthBarClass}`} />
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
            loading={isSubmitting}
            className={`${styles.submitBtn} ${styles.submitBtnRegister}`}
            width="full"
          >
            Dar de Alta Operador
          </Button>
        </Stack>
      </form>
    </Card>
  );
}