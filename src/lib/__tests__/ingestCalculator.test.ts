import { describe, expect, it } from 'vitest';
import { epsToGbPerDay } from '../ingestCalculator';

describe('ingestCalculator', () => {
  it('converts EPS to GB/day with utilization', () => {
    const gb = epsToGbPerDay(1000, 512, 0.65);
    expect(gb).toBeGreaterThan(0);
    const raw = (1000 * 512 * 3600 * 24) / Math.pow(1024, 3);
    expect(gb).toBeCloseTo(raw * 0.65, 2);
  });
});
