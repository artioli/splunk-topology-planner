import type { Course, Credential, RangeValue } from './types';

export function formatHours(range: RangeValue): string {
  if (range.min === range.max) return `${range.min} h`;
  return `${range.min}–${range.max} h`;
}

export function formatCost(range: RangeValue): string {
  if (range.min === 0 && range.max === 0) return 'Free';
  if (range.min === range.max) return `$${range.min.toLocaleString()} USD`;
  return `$${range.min.toLocaleString()}–$${range.max.toLocaleString()} USD`;
}

export function formatCostShort(usd: number): string {
  if (usd === 0) return 'Free';
  return `$${usd.toLocaleString()}`;
}

export function addRanges(a: RangeValue, b: RangeValue): RangeValue {
  return { min: a.min + b.min, max: a.max + b.max };
}

export function sumRanges(items: RangeValue[]): RangeValue {
  return items.reduce((acc, r) => addRanges(acc, r), { min: 0, max: 0 });
}

export function credentialSearchText(c: Credential): string {
  return `${c.name} ${c.objective ?? ''}`.toLowerCase();
}

export function courseSearchText(c: Course): string {
  return c.name.toLowerCase();
}

export function kindLabelKey(kind: Credential['kind']): string {
  return `enablement.kind.${kind}`;
}

export function trackLabelKey(track: Credential['track']): string {
  return `enablement.track.${track}`;
}
