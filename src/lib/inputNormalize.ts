import { clampIndexerCount, clampReplicationAndSearchFactors } from './clusterFactors';
import { getDefaultMaxVolumeGb } from './clusterEstimation';
import type { PlannerInputs } from './types';

export function normalizePlannerInputs(raw: PlannerInputs): PlannerInputs {
  const inputs = { ...raw };

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
  const isClustered = peers >= 3;

  if (isClustered) {
    const clamped = clampReplicationAndSearchFactors(
      inputs.replicationFactor,
      inputs.searchFactor,
      peers,
    );
    inputs.replicationFactor = clamped.replicationFactor;
    inputs.searchFactor = clamped.searchFactor;
  } else {
    inputs.replicationFactor = 1;
    inputs.searchFactor = 1;
  }

  if (inputs.searchHeadCluster) {
    inputs.searchHeadCount = Math.max(3, Math.min(100, Math.floor(inputs.searchHeadCount)));
  } else {
    inputs.searchHeadCount = Math.max(1, Math.min(100, Math.floor(inputs.searchHeadCount)));
  }

  return inputs;
}
