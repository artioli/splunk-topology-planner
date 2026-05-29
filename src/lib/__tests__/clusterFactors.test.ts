import { describe, expect, it } from 'vitest';
import { clampReplicationAndSearchFactors } from '../clusterFactors';

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
});
