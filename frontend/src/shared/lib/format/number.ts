export function formatNumber(n: number | null | undefined, decimals: number = 0): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPercent(n: number | null | undefined, decimals: number = 1): string {
  if (n === null || n === undefined) return '—';
  return `${n.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

export function formatQuantity(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
