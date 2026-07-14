import { Stack, Text, Heading, Logo, Button } from '@shared/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  logoSize?: number;
  showFooter?: boolean;
  footerLinks?: React.ReactNode;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  logoSize = 84,
  showFooter = true,
  footerLinks,
}: AuthLayoutProps) {
  const navigate = useNavigate();

  const goToRegister = () => navigate('/register');
  const goToLanding = () => navigate('/');

  return (
    <Stack
      className={styles.authContainer}
      gap="xl"
      align="center"
      justify="center"
      style={{ minHeight: '100vh', width: '100%', padding: 'var(--space-4)' }}
    >
      <Stack gap="sm" align="center" style={{ textAlign: 'center' }}>
        <Logo size={logoSize} className={styles.logo} />
        <Heading variant="h1" className={styles.headerTitle}>{title}</Heading>
        {subtitle && <Text variant="body" color="muted" className={styles.headerSubtitle}>{subtitle}</Text>}
      </Stack>

      <Stack gap="lg" style={{ width: '100%', maxWidth: '400px' }}>{children}</Stack>

      {showFooter && (
        <Stack gap="xs" align="center" style={{ textAlign: 'center' }} className={styles.footerLinks}>
          {footerLinks || (
            <>
              <Text variant="caption" color="muted" as="span">
                ¿No tienes una cuenta?{' '}
                <Button variant="ghost" size="sm" onClick={goToRegister} className={styles.footerLinkBtn}>
                  Regístrate
                </Button>
              </Text>
              <Text variant="caption" color="muted" as="span">
                <Button variant="ghost" size="sm" onClick={goToLanding} className={styles.footerLinkBtn}>
                  <ArrowLeft size={12} /> Volver al Inicio (Landing)
                </Button>
              </Text>
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}