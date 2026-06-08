import {
  clampIndexerCount,
  clampReplicationAndSearchFactors,
  defaultFactorsForIndexers,
  isClusteredDeployment,
} from './clusterFactors';
import { getDefaultMaxVolumeGb } from './clusterEstimation';
import { withHardwareDefaults } from './hardwareDefaults';
import type {
  HardwareOverrideValues,
  IndexerHardwareTier,
  PlannerInputs,
  RoleHardwareOverride,
} from './types';
import { HARDWARE_OVERRIDE_ROLES } from './types';

const INDEXER_TIERS: IndexerHardwareTier[] = ['min', 'mid', 'high', 'custom'];

function clampHardwareOverrideValues(values: HardwareOverrideValues): HardwareOverrideValues {
  return {
    physicalCores: Math.max(1, Math.floor(values.physicalCores)),
    vcpu: Math.max(1, Math.floor(values.vcpu)),
    ramGb: Math.max(4, Math.floor(values.ramGb)),
    osDiskGb: Math.max(50, Math.floor(values.osDiskGb)),
    splunkDiskGb: Math.max(50, Math.floor(values.splunkDiskGb)),
  };
}

function normalizeHardwareInputs(inputs: PlannerInputs): PlannerInputs {
  const normalized = withHardwareDefaults(inputs);
  const tier = INDEXER_TIERS.includes(normalized.indexerHardwareTier)
    ? normalized.indexerHardwareTier
    : 'min';
  normalized.indexerHardwareTier = tier;
  normalized.indexerCustomSpec = clampHardwareOverrideValues(normalized.indexerCustomSpec);

  const overrides = { ...normalized.roleHardwareOverrides };
  for (const role of HARDWARE_OVERRIDE_ROLES) {
    const entry = overrides[role];
    if (!entry) continue;
    overrides[role] = {
      enabled: entry.enabled === true,
      values: clampHardwareOverrideValues(entry.values),
    } satisfies RoleHardwareOverride;
  }
  normalized.roleHardwareOverrides = overrides;
  return normalized;
}

export function normalizePlannerInputs(raw: PlannerInputs): PlannerInputs {
  const inputs = normalizeHardwareInputs({ ...raw });

  inputs.virtualizationOverheadPct = Math.max(
    0,
    Math.min(100, Math.round(inputs.virtualizationOverheadPct ?? 0)),
  );

  if (inputs.singleServerDeployment) {
    inputs.searchHeadCount = 1;
    inputs.searchHeadCluster = false;
    inputs.manualIndexerCount = 1;
    inputs.replicationFactor = 1;
    inputs.searchFactor = 1;
    return inputs;
  }

  inputs.manualIndexerCount = clampIndexerCount(inputs.manualIndexerCount);
  if (!inputs.autoClusterEstimation) {
    inputs.maxVolumePerIndexGb = Math.max(10, inputs.maxVolumePerIndexGb);
  } else {
    inputs.maxVolumePerIndexGb = getDefaultMaxVolumeGb(inputs);
  }

  const peerEstimate = inputs.autoClusterEstimation
    ? Math.ceil(inputs.dailyIngestGb / Math.max(1, inputs.maxVolumePerIndexGb))
    : inputs.manualIndexerCount;

  const peers = clampIndexerCount(peerEstimate);
  const isClustered = isClusteredDeployment(
    false,
    inputs.autoClusterEstimation,
    inputs.clusterReplication,
    peers,
  );

  if (!isClustered) {
    inputs.replicationFactor = 1;
    inputs.searchFactor = 1;
  } else if (inputs.autoClusterEstimation) {
    const auto = defaultFactorsForIndexers(peers, true);
    inputs.replicationFactor = auto.replicationFactor;
    inputs.searchFactor = auto.searchFactor;
  } else {
    const clamped = clampReplicationAndSearchFactors(
      inputs.replicationFactor,
      inputs.searchFactor,
      peers,
    );
    inputs.replicationFactor = clamped.replicationFactor;
    inputs.searchFactor = clamped.searchFactor;
  }

  if (inputs.searchHeadCluster) {
    inputs.searchHeadCount = Math.max(3, Math.min(100, Math.floor(inputs.searchHeadCount)));
  } else {
    inputs.searchHeadCount = Math.max(1, Math.min(100, Math.floor(inputs.searchHeadCount)));
  }

  return inputs;
}
