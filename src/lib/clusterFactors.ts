import { SIZING } from './constants';

export const MAX_INDEXERS = 100;
export const MAX_RF_SF = 100;

export interface ClampedClusterFactors {
  indexerCount: number;
  replicationFactor: number;
  searchFactor: number;
  warnings: string[];
}

export function clampIndexerCount(count: number): number {
  return Math.min(MAX_INDEXERS, Math.max(1, Math.floor(count)));
}

/** SF ≤ RF ≤ indexer count */
export function clampReplicationAndSearchFactors(
  replicationFactor: number,
  searchFactor: number,
  indexerCount: number,
): { replicationFactor: number; searchFactor: number; warnings: string[] } {
  const warnings: string[] = [];
  let rf = Math.min(MAX_RF_SF, Math.max(1, Math.floor(replicationFactor)));
  let sf = Math.min(MAX_RF_SF, Math.max(1, Math.floor(searchFactor)));
  const peers = clampIndexerCount(indexerCount);

  if (rf > peers) {
    warnings.push(`Replication factor lowered from ${rf} to ${peers} (cannot exceed indexer count).`);
    rf = peers;
  }
  if (sf > rf) {
    warnings.push(`Search factor lowered from ${sf} to ${rf} (cannot exceed replication factor).`);
    sf = rf;
  }

  if (!warnings.length && (rf !== replicationFactor || sf !== searchFactor)) {
    /* silent clamp within bounds */
  }

  return { replicationFactor: rf, searchFactor: sf, warnings };
}

export function defaultFactorsForIndexers(indexerCount: number, isClustered: boolean): {
  replicationFactor: number;
  searchFactor: number;
} {
  const peers = clampIndexerCount(indexerCount);
  if (!isClustered) {
    return { replicationFactor: 1, searchFactor: 1 };
  }
  const rf = Math.min(peers, SIZING.DEFAULT_RF);
  const sf = Math.min(rf, SIZING.DEFAULT_SF);
  return { replicationFactor: rf, searchFactor: sf };
}
