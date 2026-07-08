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

  const refreshLicense = useCallback(async () => {
    try {
      const status = await api.getLicenseStatus();
      setLicenseStatus(status);
      const usage = await api.getLicenseUsage();
      setLicenseUsage(usage);
    } catch (err) {
      console.error('Error fetching license stats:', err);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('stockmaster-token');
    const savedUser = localStorage.getItem('stockmaster-user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      api.setToken(savedToken);
      api.getLicenseStatus().then(setLicenseStatus).catch(() => {});
      api.getLicenseUsage().then(setLicenseUsage).catch(() => {});
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    const accessToken = res.accessToken;
    setToken(accessToken);
    setUser(res.user);
    api.setToken(accessToken);
    localStorage.setItem('stockmaster-token', accessToken);
    localStorage.setItem('stockmaster-user', JSON.stringify(res.user));
    api.getLicenseStatus().then(setLicenseStatus).catch(() => {});
    api.getLicenseUsage().then(setLicenseUsage).catch(() => {});
  };

  const register = async (data: { tenantName: string; email: string; password: string; name: string }) => {
    const res = await api.register(data);
    const accessToken = res.accessToken;
    setToken(accessToken);
    setUser(res.user);
    api.setToken(accessToken);
    localStorage.setItem('stockmaster-token', accessToken);
    localStorage.setItem('stockmaster-user', JSON.stringify(res.user));
    api.getLicenseStatus().then(setLicenseStatus).catch(() => {});
    api.getLicenseUsage().then(setLicenseUsage).catch(() => {});
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    api.setToken(null);
    setLicenseStatus(null);
    setLicenseUsage(null);
    localStorage.removeItem('stockmaster-token');
    localStorage.removeItem('stockmaster-user');
  }, []);

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
