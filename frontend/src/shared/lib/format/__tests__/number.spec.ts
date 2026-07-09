import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, formatQuantity } from '../number';

describe('formatNumber', () => {
  it('should format with es-VE locale', () => {
    const result = formatNumber(1234.56, 2);
    expect(result).toContain('1');
  });

  it('should format zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should format null as em dash', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('should format undefined as em dash', () => {
    expect(formatNumber(undefined)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('should append % symbol', () => {
    const result = formatPercent(15.5, 1);
    expect(result).toContain('%');
  });

  it('should format null as em dash', () => {
    expect(formatPercent(null)).toBe('—');
  });

  it('should format zero percent', () => {
    expect(formatPercent(0)).toContain('%');
  });
});

describe('formatQuantity', () => {
  it('should format integer without decimals', () => {
    expect(formatQuantity(100)).toBe('100');
  });

  it('should format null as em dash', () => {
    expect(formatQuantity(null)).toBe('—');
  });

  it('should format undefined as em dash', () => {
    expect(formatQuantity(undefined)).toBe('—');
  });
});
