import { Stack, Text, Card, CardTitle, FormField, Input, Button } from '@shared/ui';
import { useAuthForm } from '../../hooks';
import { type ResetPasswordData } from '../../types/auth.types';
import styles from './ResetPasswordForm.module.css';

export function ResetPasswordForm({ token }: { token: string; onSuccess: () => void }) {
  const { values, errors, handleChange, handleBlur, handleSubmit, isSubmitting, serverError } =
    useAuthForm<ResetPasswordData>({
      initialValues: { token, password: '', confirmPassword: '' },
      validate: (vals) => {
        const errs: Partial<Record<keyof ResetPasswordData, string>> = {};
        if (!vals.password) errs.password = 'La contraseña es obligatoria';
        else if (vals.password.length < 8) errs.password = 'Mínimo 8 caracteres';
        else if (!/[A-Z]/.test(vals.password)) errs.password = 'Al menos una mayúscula';
        else if (!/[0-9]/.test(vals.password)) errs.password = 'Al menos un número';
        if (vals.password !== vals.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
        return errs;
      },
      onSubmit: async (_data) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onSuccess();
      },
    });

  return (
    <Card className={styles.authCard} padding="lg">
      <CardTitle className={styles.title}>Restablecer Contraseña</CardTitle>

      <Text variant="body" color="muted" className={styles.description}>
        Establece tu nueva clave maestra de acceso.
      </Text>

      {serverError && <Text variant="caption" color="danger" className={styles.error}>{serverError}</Text>}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <FormField label="Nueva Contraseña" error={errors.password}>
            <Input
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirmar Contraseña" error={errors.confirmPassword}>
            <Input
              name="confirmPassword"
              type="password"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} width="full">
            Actualizar Contraseña
          </Button>
        </Stack>
      </form>
    </Card>
  );
}