import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import { Link } from 'react-router-dom';
import { Text, Stack } from '@shared/ui';

export function RegisterPage() {
  return (
    <AuthLayout
      title="¡Bienvenido!"
      subtitle="Crea tu cuenta para comenzar"
      footerLinks={
        <Stack gap="xs" align="center" style={{ textAlign: 'center' }}>
          <Text variant="caption" color="muted" as="span">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login">
              <Text variant="caption" color="primary" weight="semibold">
                Inicia Sesión
              </Text>
            </Link>
          </Text>
          <Text variant="caption" color="muted" as="span">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              ➔ Volver al Inicio (Landing)
            </Link>
          </Text>
        </Stack>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}