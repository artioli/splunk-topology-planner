import { resolveIndexerCount } from './clusterEstimation';
import {
  clampIndexerCount,
  clampReplicationAndSearchFactors,
  defaultFactorsForIndexers,
  isClusteredDeployment,
} from './clusterFactors';
import { SIZING } from './constants';
import { msg } from './clusterFactors';
import type { ClusterEstimation, PlannerInputs, ResiliencyFamily } from './types';
import type { I18nMessage } from './types';

export interface ResolvedTopologySettings {
  singleServer: boolean;
  prefix: ResiliencyFamily;
  prefixLabel: string;
  baseSuffix: number;
  isClustered: boolean;
  hasShc: boolean;
  operationalSearchHeadCount: number;
  indexerCount: number;
  replicationFactor: number;
  searchFactor: number;
  clusterEstimation: ClusterEstimation;
  topologyWarnings: I18nMessage[];
}

export function inferIndexingPrefix(
  singleServer: boolean,
  indexerCount: number,
  isClustered: boolean,
): { prefix: ResiliencyFamily; label: string } {
  if (singleServer) {
    return { prefix: 'S', label: 'S — Single server (S1)' };
  }
  if (isClustered) {
    return { prefix: 'C', label: 'C — Single-site indexer cluster (auto)' };
  }
  if (indexerCount >= 2) {
    return { prefix: 'D', label: 'D — Distributed non-clustered (auto)' };
  }
  return { prefix: 'D', label: 'D — Distributed, single indexer (auto)' };
}

export function inferSearchSuffix(
  operationalSearchHeadCount: number,
  searchHeadCluster: boolean,
): number {
  if (searchHeadCluster) return 3;
  if (operationalSearchHeadCount >= 2) return 2;
  return 1;
}

export function resolveOperationalSearchHeadCount(
  searchHeadCount: number,
  searchHeadCluster: boolean,
): number {
  if (searchHeadCluster) return Math.max(SIZING.MIN_SHC_MEMBERS, searchHeadCount);
  return Math.max(1, searchHeadCount);
}

export function resolveTopologySettings(inputs: PlannerInputs): ResolvedTopologySettings {
  const topologyWarnings: I18nMessage[] = [];
  const singleServer = inputs.singleServerDeployment;

  const clusterEst = resolveIndexerCount(inputs, inputs.dailyIngestGb, false);
  const indexerCount = singleServer ? 1 : clampIndexerCount(clusterEst.appliedIndexerCount);
  const isClustered = isClusteredDeployment(
    singleServer,
    inputs.autoClusterEstimation,
    inputs.clusterReplication,
    indexerCount,
  );
  const { prefix, label: prefixLabel } = inferIndexingPrefix(
    singleServer,
    indexerCount,
    isClustered,
  );

  const hasShc = !singleServer && inputs.searchHeadCluster;
  let operationalSearchHeadCount = singleServer
    ? 0
    : resolveOperationalSearchHeadCount(inputs.searchHeadCount, inputs.searchHeadCluster);

  if (hasShc && inputs.searchHeadCount < SIZING.MIN_SHC_MEMBERS) {
    topologyWarnings.push(msg('advisory.shcMinMembers', { min: SIZING.MIN_SHC_MEMBERS }));
    operationalSearchHeadCount = SIZING.MIN_SHC_MEMBERS;
  }

  let replicationFactor = inputs.replicationFactor;
  let searchFactor = inputs.searchFactor;

  if (!isClustered) {
    replicationFactor = 1;
    searchFactor = 1;
  } else if (inputs.autoClusterEstimation) {
    // Auto mode derives RF/SF from the indexer count: 2 peers -> RF2/SF2,
    // 3+ peers -> RF3/SF2 (see defaultFactorsForIndexers).
    const auto = defaultFactorsForIndexers(indexerCount, true);
    replicationFactor = auto.replicationFactor;
    searchFactor = auto.searchFactor;
  } else {
    const clamped = clampReplicationAndSearchFactors(
      replicationFactor,
      searchFactor,
      indexerCount,
    );
    replicationFactor = clamped.replicationFactor;
    searchFactor = clamped.searchFactor;
    topologyWarnings.push(...clamped.warnings);
  }

  const baseSuffix = singleServer ? 1 : inferSearchSuffix(operationalSearchHeadCount, hasShc);

  return {
    singleServer,
    prefix,
    prefixLabel,
    baseSuffix,
    isClustered,
    hasShc,
    operationalSearchHeadCount,
    indexerCount,
    replicationFactor,
    searchFactor,
    clusterEstimation: {
      ...clusterEst,
      appliedIndexerCount: indexerCount,
    },
    topologyWarnings,
  };
}
