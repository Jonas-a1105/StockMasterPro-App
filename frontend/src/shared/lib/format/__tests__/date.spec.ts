import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatTimeAgo, formatShortDate } from '../date';

describe('formatDate', () => {
  it('should format a valid date string', () => {
    const result = formatDate('2025-06-15');
    expect(result).not.toBe('—');
    expect(typeof result).toBe('string');
  });

  it('should return em dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('should return em dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('should format a Date object', () => {
    const result = formatDate(new Date(2025, 0, 1));
    expect(result).not.toBe('—');
  });
});

describe('formatDateTime', () => {
  it('should include time in output', () => {
    const result = formatDateTime('2025-06-15T14:30:00');
    expect(result).not.toBe('—');
    expect(typeof result).toBe('string');
  });

  it('should return em dash for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });
});

describe('formatTimeAgo', () => {
  it('should return string for recent date', () => {
    const recent = new Date();
    recent.setMinutes(recent.getMinutes() - 5);
    const result = formatTimeAgo(recent);
    expect(result).toContain('Hace');
  });

  it('should return em dash for null', () => {
    expect(formatTimeAgo(null)).toBe('—');
  });
});

describe('formatShortDate', () => {
  it('should return short date string', () => {
    const result = formatShortDate('2025-06-15');
    expect(result).not.toBe('—');
    expect(typeof result).toBe('string');
  });

  it('should return em dash for null', () => {
    expect(formatShortDate(null)).toBe('—');
  });
});
