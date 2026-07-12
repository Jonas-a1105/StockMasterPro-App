import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@shared/lib/http/client';
import { useAuth } from '@contexts/AuthContext';
import {
  loadConfig,
  saveConfig,
  formatPrice as fp,
  formatBs,
  formatUsd,
  type CurrencyConfig,
  type FormatPriceOptions,
} from '@shared/lib/format/currency';

interface ExchangeRateContextValue {
  rate: number;
  updatedAt: string;
  source: string;
  loading: boolean;
  error: string | null;
  config: CurrencyConfig;
  updateConfig: (partial: Partial<CurrencyConfig>) => Promise<void>;
  /** Manual exchange rate override (0 = disabled) */
  manualRate: number;
  setManualRate: (rate: number) => Promise<void>;
  /** Format price showing both USD and Bs (or per config) */
  formatPrice: (amount: number | null | undefined, options?: FormatPriceOptions) => string;
  /** Format price as Bs only */
  formatBs: (amount: number | null | undefined) => string;
  /** Format price as USD only */
  formatUsd: (amount: number | null | undefined) => string;
  /** Convert USD amount to Bs */
  toBs: (amount: number) => number;
  /** Convert Bs amount to USD */
  toUsd: (amount: number) => number;
}

const ExchangeRateContext = createContext<ExchangeRateContextValue | null>(null);

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [rate, setRate] = useState<number>(1);
  const [updatedAt, setUpdatedAt] = useState<string>(new Date().toISOString());
  const [source, setSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<CurrencyConfig>(loadConfig);
  const [configLoading, setConfigLoading] = useState(true);
  const [manualRate, setManualRateState] = useState<number>(0);

  const fetchRate = useCallback(async () => {
    try {
      const data = await api.get('/exchange-rate/dolar');
      setRate(data.rate);
      setUpdatedAt(data.updatedAt);
      setSource(data.source || '');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al obtener tipo de cambio');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTenantConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const settings = await api.getTenantSettings();
      const serverConfig: CurrencyConfig = {
        symbol: settings.currencySymbol ?? 'Bs',
        position: settings.currencyPosition ?? 'before',
        decimals: settings.decimalPlaces ?? 2,
        displayCurrency: settings.displayCurrency ?? 'both',
      };
      setConfig(serverConfig);
      if (settings.manualExchangeRate) {
        setManualRateState(Number(settings.manualExchangeRate));
      }
    } catch {
      // fallback to localStorage
      setConfig(loadConfig);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchRate();
      loadTenantConfig();
    } else {
      setLoading(false);
      setConfigLoading(false);
    }
    const interval = setInterval(fetchRate, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRate, loadTenantConfig, isAuthenticated, authLoading]);

  const updateConfig = async (partial: Partial<CurrencyConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    saveConfig(partial);
    try {
      await api.updateTenantSettings({
        currencySymbol: next.symbol,
        currencyPosition: next.position,
        decimalPlaces: next.decimals,
        displayCurrency: next.displayCurrency,
      });
    } catch {
      // ignore sync errors, local state is updated
    }
  };

  const setManualRate = async (rate: number) => {
    setManualRateState(rate);
    try {
      await api.updateTenantSettings({
        manualExchangeRate: rate,
      });
    } catch {
      // ignore sync errors
    }
  };

  const formatPriceFn = useCallback(
    (amount: number | null | undefined, options?: FormatPriceOptions) =>
      fp(amount, rate, config, options),
    [rate, config]
  );

  const formatBsFn = useCallback(
    (amount: number | null | undefined) => formatBs(amount, rate, config.decimals),
    [rate, config.decimals]
  );

  const formatUsdFn = useCallback((amount: number | null | undefined) => formatUsd(amount), []);

  const toBs = useCallback((amount: number) => amount * rate, [rate]);
  const toUsd = useCallback((amount: number) => amount / rate, [rate]);

  return (
    <ExchangeRateContext.Provider
      value={{
        rate,
        updatedAt,
        source,
        loading: loading || configLoading,
        error,
        config,
        updateConfig,
        manualRate,
        setManualRate,
        formatPrice: formatPriceFn,
        formatBs: formatBsFn,
        formatUsd: formatUsdFn,
        toBs,
        toUsd,
      }}
    >
      {children}
    </ExchangeRateContext.Provider>
  );
}

export function useExchangeRate() {
  const ctx = useContext(ExchangeRateContext);
  if (!ctx) throw new Error('useExchangeRate must be used within ExchangeRateProvider');
  return ctx;
}
