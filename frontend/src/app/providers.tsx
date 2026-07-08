import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@contexts/ThemeContext';
import { AuthProvider } from '@contexts/AuthContext';
import { ToastProvider } from '@contexts/ToastContext';
import { ExchangeRateProvider } from '@contexts/ExchangeRateContext';
import { Toaster } from 'sileo';
import 'sileo/styles.css';
import { SplashScreen } from '@shared/ui/SplashScreen';
import { useState, useCallback } from 'react';
import { AppRouter } from './router';
import { QueryProvider } from '@shared/lib/query/QueryProvider';

function ThemedToaster() {
  const { config } = useTheme();
  return <Toaster position="top-center" theme={config.darkMode || config.oledMode ? 'dark' : 'light'} offset={{ top: 15 }} />;
}

function AppWithSplash() {
  const [splashDone, setSplashDone] = useState(() => sessionStorage.getItem('splashDone') === 'true');

  const handleSplashFinish = useCallback(() => {
    sessionStorage.setItem('splashDone', 'true');
    setSplashDone(true);
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <BrowserRouter>
        <QueryProvider>
          <ThemeProvider>
            <ThemedToaster />
            <ToastProvider>
              <AuthProvider>
                <ExchangeRateProvider>
                  <AppRouter />
                </ExchangeRateProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </BrowserRouter>
    </>
  );
}

export function AppProviders() {
  return <AppWithSplash />;
}
