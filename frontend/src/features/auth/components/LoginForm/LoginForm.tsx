import { useState } from 'react';
import { Stack, Text, Card, CardTitle, FormField, Input, Button, Checkbox } from '@shared/ui';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAuthForm } from '../../hooks';
import { type LoginCredentials } from '../../types/auth.types';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, isSubmitting, serverError } =
    useAuthForm<LoginCredentials>({
      initialValues: { email: '', password: '', rememberMe: false },
      validate: (vals) => {
        const errs: Partial<Record<keyof LoginCredentials, string>> = {};
        if (!vals.email) errs.email = 'El email es obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Formato de email inválido';
        if (!vals.password) errs.password = 'La contraseña es obligatoria';
        return errs;
      },
      onSubmit: async (data) => {
        await login(data.email, data.password);
        if (data.rememberMe) {
          localStorage.setItem('stockmaster-remember', data.email);
        } else {
          localStorage.removeItem('stockmaster-remember');
        }
        navigate('/dashboard');
      },
    });

  return (
    <Card className={styles.authCard} padding="lg">
      <CardTitle className={styles.title}>Acceso al Sistema Central</CardTitle>

      {serverError && <Text variant="caption" color="danger" className={styles.error}>{serverError}</Text>}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <FormField label="Identificador de Usuario" error={errors.email}>
            <Input
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="usuario@empresa.com"
              leftIcon={<User size={14} />}
              autoComplete="email"
            />
          </FormField>

          <FormField label="Clave Criptográfica" error={errors.password}>
            <div className={styles.inputWrap}>
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeBtn}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                autoComplete="current-password"
              />
            </div>
          </FormField>

          <Checkbox
            name="rememberMe"
            checked={values.rememberMe}
            onChange={(e) => handleChange({ target: { name: 'rememberMe', checked: e.target.checked } } as any)}
            label="Mantener estación autenticada en esta terminal"
            className={styles.rememberWrap}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className={styles.submitBtn}
            width="full"
          >
            Autenticar Estación
          </Button>
        </Stack>
      </form>
    </Card>
  );
}