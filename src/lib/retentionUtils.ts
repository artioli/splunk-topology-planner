import type { RetentionPeriod, TimeUnit } from './types';

const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

export function periodToDays(period: RetentionPeriod): number {
  const v = Math.max(0, period.value);
  switch (period.unit) {
    case 'days':
      return v;
    case 'months':
      return v * DAYS_PER_MONTH;
    case 'years':
      return v * DAYS_PER_YEAR;
    default:
      return v;
  }
}

export function formatPeriodLabel(period: RetentionPeriod): string {
  return `${period.value} ${period.unit}`;
}

export interface RetentionBreakdown {
  hotWarmDays: number;
  coldDays: number;
  frozenDays: number;
  totalDays: number;
  segments: { key: string; label: string; days: number; percent: number }[];
}

export function buildRetentionBreakdown(
  hotWarm: RetentionPeriod,
  cold: RetentionPeriod,
  frozen: RetentionPeriod,
): RetentionBreakdown {
  const hotWarmDays = periodToDays(hotWarm);
  const coldDays = periodToDays(cold);
  const frozenDays = periodToDays(frozen);
  const totalDays = hotWarmDays + coldDays + frozenDays || 1;

  const segments = [
    { key: 'hotWarm', label: `Hot/Warm (${formatPeriodLabel(hotWarm)})`, days: hotWarmDays },
    { key: 'cold', label: `Cold (${formatPeriodLabel(cold)})`, days: coldDays },
    { key: 'frozen', label: `Frozen (${formatPeriodLabel(frozen)})`, days: frozenDays },
  ].map((s) => ({
    ...s,
    percent: (s.days / totalDays) * 100,
  }));

  return { hotWarmDays, coldDays, frozenDays, totalDays, segments };
}

export function defaultPeriod(value: number, unit: TimeUnit = 'days'): RetentionPeriod {
  return { value, unit };
}
