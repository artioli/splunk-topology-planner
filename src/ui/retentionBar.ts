import { buildRetentionBreakdown } from '../lib/retentionUtils';
import type { RetentionPeriod } from '../lib/types';

export function renderRetentionBar(hotWarm: RetentionPeriod, cold: RetentionPeriod, frozen: RetentionPeriod): string {
  const b = buildRetentionBreakdown(hotWarm, cold, frozen);
  const segments = b.segments
    .filter((s) => s.days > 0)
    .map(
      (s) =>
        `<div class="retention-segment retention-segment--${s.key}" style="width:${Math.max(s.percent, 2)}%" title="${s.label}: ${s.days} days">${s.percent >= 8 ? s.label.split(' ')[0] : ''}</div>`,
    )
    .join('');

  const legend = b.segments
    .map(
      (s) =>
        `<span class="retention-legend-item"><span class="retention-dot retention-dot--${s.key}"></span>${s.label} (${s.days}d)</span>`,
    )
    .join('');

  return `
    <div class="retention-viz" aria-label="Retention timeline">
      <div class="retention-bar">${segments || '<div class="retention-segment retention-segment--empty">No retention configured</div>'}</div>
      <div class="retention-legend">${legend}</div>
      <p class="field-hint">Total searchable + archive span: ${b.totalDays} days</p>
    </div>`;
}

export function updateRetentionBarElement(hotWarm: RetentionPeriod, cold: RetentionPeriod, frozen: RetentionPeriod): void {
  const el = document.getElementById('retention-bar-container');
  if (el) el.innerHTML = renderRetentionBar(hotWarm, cold, frozen);
}
