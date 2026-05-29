import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../constants';
import { getDefaultMaxVolumeGb, resolveIndexerCount } from '../clusterEstimation';

describe('clusterEstimation', () => {
  it('ES uses 100 GB/day default max', () => {
    expect(getDefaultMaxVolumeGb({ ...DEFAULT_INPUTS, enterpriseSecurity: true })).toBe(100);
  });

  it('ITSI uses 200 GB/day default max', () => {
    expect(getDefaultMaxVolumeGb({ ...DEFAULT_INPUTS, itsi: true })).toBe(200);
  });

  it('manual indexer count respected', () => {
    const r = resolveIndexerCount(
      { ...DEFAULT_INPUTS, autoClusterEstimation: false, manualIndexerCount: 9 },
      500,
      true,
    );
    expect(r.appliedIndexerCount).toBe(9);
  });
});
