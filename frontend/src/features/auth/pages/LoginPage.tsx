import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { Link } from 'react-router-dom';
import { Text, Stack } from '@shared/ui';

export function LoginPage() {
  return (
    <AuthLayout
      title="¡Bienvenido!"
      subtitle="Accede a tu cuenta para continuar"
      footerLinks={
        <Stack gap="xs" align="center" style={{ textAlign: 'center' }}>
          <Text variant="caption" color="muted" as="span">
            ¿No tienes una cuenta?{' '}
            <Link to="/register">
              <Text variant="caption" color="primary" weight="semibold">
                Regístrate
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
      <LoginForm />
    </AuthLayout>
  );
}