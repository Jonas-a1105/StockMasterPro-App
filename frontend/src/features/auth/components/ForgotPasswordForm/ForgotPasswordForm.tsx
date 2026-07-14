import { Stack, Text, Card, CardTitle, FormField, Input, Button } from '@shared/ui';
import { useAuthForm } from '../../hooks';
import { type ForgotPasswordData } from '../../types/auth.types';
import styles from './ForgotPasswordForm.module.css';

export function ForgotPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const { values, errors, handleChange, handleBlur, handleSubmit, isSubmitting, serverError } =
    useAuthForm<ForgotPasswordData>({
      initialValues: { email: '' },
      validate: (vals) => {
        const errs: Partial<Record<keyof ForgotPasswordData, string>> = {};
        if (!vals.email) errs.email = 'El email es obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Formato de email inválido';
        return errs;
      },
      onSubmit: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onSuccess();
      },
    });

  return (
    <Card className={styles.authCard} padding="lg">
      <CardTitle className={styles.title}>Recuperar Acceso</CardTitle>

      <Text variant="body" color="muted" className={styles.description}>
        Ingresa tu correo institucional para recibir instrucciones de restablecimiento.
      </Text>

      {serverError && <Text variant="caption" color="danger" className={styles.error}>{serverError}</Text>}

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
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

          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} width="full">
            Enviar Instrucciones
          </Button>
        </Stack>
      </form>
    </Card>
  );
}