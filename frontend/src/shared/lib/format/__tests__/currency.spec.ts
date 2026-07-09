import { describe, it, expect } from 'vitest';
import { formatUsd, formatBs, formatPrice } from '../currency';
import type { CurrencyConfig } from '../currency';

const defaultConfig: CurrencyConfig = {
  symbol: 'Bs',
  position: 'before',
  decimals: 2,
  displayCurrency: 'both',
};

describe('formatUsd', () => {
  it('should format positive amount with $ symbol', () => {
    expect(formatUsd(1234.56)).toBe('$ 1,234.56');
  });

  it('should format zero', () => {
    expect(formatUsd(0)).toBe('$ 0.00');
  });

  it('should format null as em dash', () => {
    expect(formatUsd(null)).toBe('—');
  });

  it('should format undefined as em dash', () => {
    expect(formatUsd(undefined)).toBe('—');
  });

  it('should round to 2 decimal places', () => {
    expect(formatUsd(10.999)).toBe('$ 11.00');
  });

  it('should format large numbers with commas', () => {
    expect(formatUsd(1000000)).toBe('$ 1,000,000.00');
  });
});

describe('formatBs', () => {
  it('should format with Bs symbol and rate conversion', () => {
    const result = formatBs(100, 65.5, 2);
    expect(result).toContain('Bs');
    // es-VE uses comma as decimal separator
    expect(result).toContain('6.550,00');
  });

  it('should format null as em dash', () => {
    expect(formatBs(null, 65.5)).toBe('—');
  });

  it('should use specified decimal places', () => {
    const result = formatBs(10, 65.5, 0);
    expect(result).toBe('Bs 655');
  });

  it('should format zero amount', () => {
    expect(formatBs(0, 65.5)).toBe('Bs 0,00');
  });
});

describe('formatPrice', () => {
  it('should show both currencies by default', () => {
    const result = formatPrice(100, 65.5, defaultConfig);
    expect(result).toContain('$');
    expect(result).toContain('Bs');
  });

  it('should show only USD when showUsd is true', () => {
    const result = formatPrice(100, 65.5, defaultConfig, { showUsd: true });
    expect(result).toContain('$');
    expect(result).not.toContain('Bs');
  });

  it('should show only local when showLocal is true', () => {
    const result = formatPrice(100, 65.5, defaultConfig, { showLocal: true });
    expect(result).toContain('Bs');
    expect(result).not.toContain('$');
  });

  it('should return em dash for null amount', () => {
    expect(formatPrice(null, 65.5, defaultConfig)).toBe('—');
  });
});
