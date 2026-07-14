import { AuthLayout } from '../components/AuthLayout';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { Link } from 'react-router-dom';
import { Text, Stack } from '@shared/ui';

export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Recuperar Acceso"
      subtitle="Ingresa tu correo para recibir instrucciones"
      logoSize={72}
      footerLinks={
        <Stack gap="xs" align="center" style={{ textAlign: 'center' }}>
          <Text variant="caption" color="muted" as="span">
            <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
              ➔ Volver al Login
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
      <ForgotPasswordForm onSuccess={() => {}} />
    </AuthLayout>
  );
}