import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../constants';
import { computeTopology } from '../topologyEngine';

describe('topologyEngine', () => {
  it('C3 without ES', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      searchHeadCluster: true,
      searchHeadCount: 3,
      enterpriseSecurity: false,
      dailyIngestGb: 1000,
      autoClusterEstimation: true,
    });
    expect(t.svaCode).toBe('C3');
    expect(t.isClustered).toBe(true);
    expect(t.hasShc).toBe(true);
    expect(t.indexerCount).toBeGreaterThanOrEqual(3);
  });

  it('C3 with ES becomes C13', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      dailyIngestGb: 1000,
      enterpriseSecurity: true,
      searchHeadCluster: true,
    });
    expect(t.svaCode).toBe('C13');
    expect(t.hasEsSh).toBe(true);
  });

  it('S11 with ES on single server', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      singleServerDeployment: true,
      enterpriseSecurity: true,
      dailyIngestGb: 5,
    });
    expect(t.svaCode).toBe('S11');
    expect(t.inventory.some((r) => r.role === 'combined')).toBe(true);
    expect(t.inventory.some((r) => r.role === 'search-head-es')).toBe(true);
  });

  it('adds ITSI search tier separate from ES', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      enterpriseSecurity: true,
      itsi: true,
      searchHeadCluster: true,
    });
    expect(t.hasEsSh).toBe(true);
    expect(t.hasItsiSh).toBe(true);
    expect(t.advisories.some((a) => a.key === 'advisory.esItsiSeparate')).toBe(true);
  });

  it('manual indexer count when auto off', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      autoClusterEstimation: false,
      manualIndexerCount: 7,
      dailyIngestGb: 100,
    });
    expect(t.indexerCount).toBe(7);
  });

  it('SHC enforces minimum 3 search heads', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      searchHeadCluster: true,
      searchHeadCount: 2,
    });
    expect(t.operationalSearchHeadCount).toBe(3);
  });
});
