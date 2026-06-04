import { SIZING } from './constants';

export const MAX_INDEXERS = 100;
export const MAX_RF_SF = 100;

export interface ClampedClusterFactors {
  indexerCount: number;
  replicationFactor: number;
  searchFactor: number;
  warnings: I18nMessage[];
}

export function clampIndexerCount(count: number): number {
  return Math.min(MAX_INDEXERS, Math.max(1, Math.floor(count)));
}

/** SF ≤ RF ≤ indexer count */
import type { I18nMessage } from './types';

export function msg(key: string, params?: Record<string, string | number>): I18nMessage {
  return params ? { key, params } : { key };
}

export function clampReplicationAndSearchFactors(
  replicationFactor: number,
  searchFactor: number,
  indexerCount: number,
): { replicationFactor: number; searchFactor: number; warnings: I18nMessage[] } {
  const warnings: I18nMessage[] = [];
  let rf = Math.min(MAX_RF_SF, Math.max(1, Math.floor(replicationFactor)));
  let sf = Math.min(MAX_RF_SF, Math.max(1, Math.floor(searchFactor)));
  const peers = clampIndexerCount(indexerCount);

  if (rf > peers) {
    warnings.push(msg('advisory.rfLowered', { from: rf, to: peers }));
    rf = peers;
  }
  if (sf > rf) {
    warnings.push(msg('advisory.sfLowered', { from: sf, to: rf }));
    sf = rf;
  }

  if (!warnings.length && (rf !== replicationFactor || sf !== searchFactor)) {
    /* silent clamp within bounds */
  }

  return { replicationFactor: rf, searchFactor: sf, warnings };
}

/**
 * Centralized clustering decision shared by input normalization and the
 * topology resolver. Auto mode clusters at >= 2 indexers; manual mode only
 * clusters when the user opts in via the Cluster Replication toggle.
 */
export function isClusteredDeployment(
  singleServer: boolean,
  autoClusterEstimation: boolean,
  clusterReplication: boolean,
  indexerCount: number,
): boolean {
  if (singleServer) return false;
  if (indexerCount < 2) return false;
  return autoClusterEstimation || clusterReplication;
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
