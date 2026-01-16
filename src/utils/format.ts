const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const nfHours = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const cf0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const cf2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatNumber0(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return nf0.format(value);
}

export function formatHours(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return nfHours.format(value);
}

export function formatCurrency0(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return cf0.format(value);
}

export function formatCurrency2(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return cf2.format(value);
}

export function clampNumber(value: number, opts: { min?: number; max?: number } = {}): number {
  const min = opts.min ?? -Infinity;
  const max = opts.max ?? Infinity;
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
