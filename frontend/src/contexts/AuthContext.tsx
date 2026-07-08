import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@shared/lib/http/client';
import type { User } from '@types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { tenantName: string; email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  licenseBlocked: boolean;
  activateLicense: (code: string) => Promise<void>;
  dismissLicenseBlock: () => void;
  licenseStatus: { tier: string; status: string; expiresAt: string; activatedAt: string; isBlocked: boolean } | null;
  licenseUsage: any;
  refreshLicense: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [licenseBlocked, setLicenseBlocked] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [licenseUsage, setLicenseUsage] = useState<any>(null);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setLicenseStatus(null);
    setLicenseUsage(null);
    api.setToken(null);
    api.setRefreshToken(null);
    localStorage.removeItem('stockmaster-token');
    localStorage.removeItem('stockmaster-refresh-token');
    localStorage.removeItem('stockmaster-user');
  }, []);

  const refreshLicense = useCallback(async () => {
    try {
      const [status, usage] = await Promise.all([
        api.getLicenseStatus(),
        api.getLicenseUsage(),
      ]);
      if (status) setLicenseStatus(status);
      if (usage) setLicenseUsage(usage);
    } catch {
      // Un fallo de red puntual no debe cerrar sesión
      console.warn('[Auth] Error al refrescar estado de licencia');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('stockmaster-token');
      const savedUser = localStorage.getItem('stockmaster-user');
      const savedRefreshToken = localStorage.getItem('stockmaster-refresh-token');

      if (savedToken && savedUser && savedUser !== 'undefined') {
        api.setToken(savedToken);
        api.setRefreshToken(savedRefreshToken);
        let parsedUser: User | null = null;
        try { parsedUser = JSON.parse(savedUser); } catch { /* corrupt localStorage */ }
        if (!parsedUser) {
          clearSession();
          setIsLoading(false);
          return;
        }
        setUser(parsedUser);

        try {
          // Si el access token expiró (15min TTL), refrescar proactivamente
          // para evitar 401s visibles en la consola
          if (api.isTokenExpired() && savedRefreshToken) {
            const freshToken = await api.tryRefresh();
            if (!freshToken) {
              clearSession();
              setIsLoading(false);
              return;
            }
          } else if (api.isTokenExpired()) {
            // Token expirado sin refresh token → sesión irrecuperable
            clearSession();
            setIsLoading(false);
            return;
          }

          // Ahora el token es válido (original o refrescado)
          const [status, usage] = await Promise.all([
            api.getLicenseStatus(),
            api.getLicenseUsage(),
          ]);

          if (status) {
            setToken(api.getToken() || savedToken);
            setLicenseStatus(status);
          } else {
            clearSession();
          }
          if (usage) setLicenseUsage(usage);
        } catch {
          clearSession();
        }
      }
      setIsLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    const accessToken = res.accessToken;
    setToken(accessToken);
    setUser(res.user);
    api.setToken(accessToken);
    api.setRefreshToken(res.refreshToken);
    localStorage.setItem('stockmaster-token', accessToken);
    localStorage.setItem('stockmaster-refresh-token', res.refreshToken);
    localStorage.setItem('stockmaster-user', JSON.stringify(res.user));
    const [status, usage] = await Promise.all([
      api.getLicenseStatus().catch(() => null),
      api.getLicenseUsage().catch(() => null),
    ]);
    if (status) setLicenseStatus(status);
    if (usage) setLicenseUsage(usage);
  };

  const register = async (data: { tenantName: string; email: string; password: string; name: string }) => {
    const res = await api.register(data);
    const accessToken = res.accessToken;
    setToken(accessToken);
    setUser(res.user);
    api.setToken(accessToken);
    api.setRefreshToken(res.refreshToken);
    localStorage.setItem('stockmaster-token', accessToken);
    localStorage.setItem('stockmaster-refresh-token', res.refreshToken);
    localStorage.setItem('stockmaster-user', JSON.stringify(res.user));
    const [status, usage] = await Promise.all([
      api.getLicenseStatus().catch(() => null),
      api.getLicenseUsage().catch(() => null),
    ]);
    if (status) setLicenseStatus(status);
    if (usage) setLicenseUsage(usage);
  };

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const handleLicenseBlocked = () => setLicenseBlocked(true);
    const handleLicenseActivated = () => setLicenseBlocked(false);
    const handleAuthExpired = () => logout();
    
    window.addEventListener('license-blocked', handleLicenseBlocked);
    window.addEventListener('license-activated', handleLicenseActivated);
    window.addEventListener('auth-expired', handleAuthExpired);
    
    return () => {
      window.removeEventListener('license-blocked', handleLicenseBlocked);
      window.removeEventListener('license-activated', handleLicenseActivated);
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [logout]);

  const activateLicense = useCallback(async (code: string) => {
    await api.activateLicense(code);
    setLicenseBlocked(false);
    window.dispatchEvent(new Event('license-activated'));
    refreshLicense();
  }, [refreshLicense]);

  const dismissLicenseBlock = useCallback(() => {
    window.dispatchEvent(new Event('license-activated'));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, login, register, logout,
      isAuthenticated: !!token,
      licenseBlocked,
      activateLicense,
      dismissLicenseBlock,
      licenseStatus,
      licenseUsage,
      refreshLicense,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
