import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../constants';
import { calculateStorage, getDailyMultiplier } from '../storageEngine';
import type { PlannerInputs } from '../types';

const base: PlannerInputs = {
  ...DEFAULT_INPUTS,
  dailyIngestGb: 100,
  archivingMode: 'clustered-optimized',
  autoClusterEstimation: true,
};

describe('storageEngine', () => {
  it('non-clustered daily multiplier is 0.50', () => {
    expect(getDailyMultiplier(false, 3, 2)).toBeCloseTo(0.5);
  });

  it('clustered daily multiplier is 1.15 with RF=3 SF=2', () => {
    expect(getDailyMultiplier(true, 3, 2)).toBeCloseTo(1.15);
  });

  it('calculates 100 GB/day clustered retention', () => {
    const r = calculateStorage(base, 3, true);
    expect(r.dailyMultiplier).toBeCloseTo(1.15);
    expect(r.hotWarmDays).toBe(30);
    expect(r.searchableTb).toBeGreaterThan(0);
    expect(r.totalTb).toBeCloseTo(r.searchableTb + r.frozenTb, 2);
  });

  it('per-indexer splits by peer count', () => {
    const r = calculateStorage({ ...base, dailyIngestGb: 500 }, 5, true);
    expect(r.perIndexerTotalTb).toBeCloseTo(r.totalTb / 5, 1);
  });
});
