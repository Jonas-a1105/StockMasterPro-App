import { AuthLayout } from '../components/AuthLayout';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Text, Stack } from '@shared/ui';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  return (
    <AuthLayout
      title="Restablecer Contraseña"
      subtitle="Establece tu nueva contraseña segura"
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
      <ResetPasswordForm token={token} onSuccess={() => {}} />
    </AuthLayout>
  );
}