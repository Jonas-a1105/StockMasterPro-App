export interface CurrencyConfig {
  symbol: string;
  position: 'before' | 'after';
  decimals: number;
  displayCurrency: 'local' | 'usd' | 'both';
}

const STORAGE_KEYS = {
  symbol: 'stockmaster-currency-symbol',
  position: 'stockmaster-currency-position',
  decimals: 'stockmaster-decimal-places',
  displayCurrency: 'stockmaster-display-currency',
};

const DEFAULTS: CurrencyConfig = {
  symbol: 'Bs',
  position: 'before',
  decimals: 2,
  displayCurrency: 'both',
};

export function loadConfig(): CurrencyConfig {
  return {
    symbol: localStorage.getItem(STORAGE_KEYS.symbol) || DEFAULTS.symbol,
    position: (localStorage.getItem(STORAGE_KEYS.position) as CurrencyConfig['position']) || DEFAULTS.position,
    decimals: Number(localStorage.getItem(STORAGE_KEYS.decimals)) || DEFAULTS.decimals,
    displayCurrency: (localStorage.getItem(STORAGE_KEYS.displayCurrency) as CurrencyConfig['displayCurrency']) || DEFAULTS.displayCurrency,
  };
}

export function saveConfig(config: Partial<CurrencyConfig>) {
  if (config.symbol !== undefined) localStorage.setItem(STORAGE_KEYS.symbol, config.symbol);
  if (config.position !== undefined) localStorage.setItem(STORAGE_KEYS.position, config.position);
  if (config.decimals !== undefined) localStorage.setItem(STORAGE_KEYS.decimals, String(config.decimals));
  if (config.displayCurrency !== undefined) localStorage.setItem(STORAGE_KEYS.displayCurrency, config.displayCurrency);
}

export interface FormatPriceOptions {
  showUsd?: boolean;
  showLocal?: boolean;
  showBoth?: boolean;
}

/**
 * Formats a price amount. The `amount` parameter is always in USD.
 * - If showBoth or config.displayCurrency === 'both': shows "$X.XX | Bs Y.YY"
 * - If showUsd or config.displayCurrency === 'usd': shows "$X.XX"
 * - If showLocal or config.displayCurrency === 'local': shows "Bs Y.YY"
 */
export function formatPrice(
  amount: number | null | undefined,
  rate: number,
  config: CurrencyConfig,
  options?: FormatPriceOptions,
): string {
  if (amount === null || amount === undefined) return '—';

  const fmt = (n: number, symbol: string, pos: 'before' | 'after', dec: number) => {
    const formatted = n.toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return pos === 'before' ? `${symbol} ${formatted}` : `${formatted} ${symbol}`;
  };

  const dec = config.decimals;
  const usdStr = fmt(amount, '$', 'before', 2);
  const bsAmount = amount * rate;
  const bsStr = fmt(bsAmount, config.symbol, config.position, dec);

  if (options?.showBoth || (!options?.showUsd && !options?.showLocal && config.displayCurrency === 'both')) {
    return `${usdStr}  ·  ${bsStr}`;
  }

  if (options?.showUsd || config.displayCurrency === 'usd') {
    return usdStr;
  }

  return bsStr;
}

/**
 * Formats only the Bs portion for a given USD amount
 */
export function formatBs(amount: number | null | undefined, rate: number, decimals: number = 2): string {
  if (amount === null || amount === undefined) return '—';
  const bsAmount = amount * rate;
  const formatted = bsAmount.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `Bs ${formatted}`;
}

/**
 * Formats only the USD portion
 */
export function formatUsd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$ ${formatted}`;
}
