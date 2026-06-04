import { describe, expect, it } from 'vitest';
import {
  clampReplicationAndSearchFactors,
  defaultFactorsForIndexers,
  isClusteredDeployment,
} from '../clusterFactors';

describe('clusterFactors', () => {
  it('SF cannot exceed RF', () => {
    const r = clampReplicationAndSearchFactors(3, 5, 10);
    expect(r.searchFactor).toBe(3);
    expect(r.replicationFactor).toBe(3);
  });

  it('RF cannot exceed indexer count', () => {
    const r = clampReplicationAndSearchFactors(10, 2, 5);
    expect(r.replicationFactor).toBe(5);
    expect(r.searchFactor).toBe(2);
  });

  it('auto defaults: 2 indexers -> RF2/SF2, 3+ -> RF3/SF2', () => {
    expect(defaultFactorsForIndexers(2, true)).toEqual({ replicationFactor: 2, searchFactor: 2 });
    expect(defaultFactorsForIndexers(3, true)).toEqual({ replicationFactor: 3, searchFactor: 2 });
    expect(defaultFactorsForIndexers(8, true)).toEqual({ replicationFactor: 3, searchFactor: 2 });
  });

  it('non-clustered defaults to RF1/SF1', () => {
    expect(defaultFactorsForIndexers(5, false)).toEqual({ replicationFactor: 1, searchFactor: 1 });
  });

  it('isClusteredDeployment: single server never clusters', () => {
    expect(isClusteredDeployment(true, true, true, 10)).toBe(false);
  });

  it('isClusteredDeployment: auto clusters at >= 2 indexers', () => {
    expect(isClusteredDeployment(false, true, false, 1)).toBe(false);
    expect(isClusteredDeployment(false, true, false, 2)).toBe(true);
  });

  it('isClusteredDeployment: manual clusters only when replication toggle on', () => {
    expect(isClusteredDeployment(false, false, false, 5)).toBe(false);
    expect(isClusteredDeployment(false, false, true, 5)).toBe(true);
    expect(isClusteredDeployment(false, false, true, 1)).toBe(false);
  });
});
