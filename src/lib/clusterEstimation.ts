import { clampIndexerCount } from './clusterFactors';
import { SIZING } from './constants';
import type { PlannerInputs } from './types';

export const MAX_VOLUME_DEFAULTS = {
  enterprise: 300,
  es: 100,
  itsi: 200,
} as const;

export function getDefaultMaxVolumeGb(inputs: PlannerInputs): number {
  if (inputs.enterpriseSecurity && inputs.itsi) return MAX_VOLUME_DEFAULTS.es;
  if (inputs.enterpriseSecurity) return MAX_VOLUME_DEFAULTS.es;
  if (inputs.itsi) return MAX_VOLUME_DEFAULTS.itsi;
  return MAX_VOLUME_DEFAULTS.enterprise;
}

export function estimateIndexerCountFromIngest(
  ingestGb: number,
  maxVolumePerIndexGb: number,
  isClustered: boolean,
): number {
  const maxVol = Math.max(1, maxVolumePerIndexGb);
  const n = Math.ceil(ingestGb / maxVol);
  if (isClustered) return Math.max(n, SIZING.MIN_CLUSTER_INDEXERS);
  if (ingestGb <= 5) return 1;
  return Math.max(n, 1);
}

export function resolveIndexerCount(
  inputs: PlannerInputs,
  ingestGb: number,
  isClustered: boolean,
): {
  maxVolumePerIndexGb: number;
  suggestedIndexerCount: number;
  appliedIndexerCount: number;
  autoEnabled: boolean;
} {
  const autoEnabled = inputs.autoClusterEstimation;
  const maxVolumePerIndexGb = autoEnabled
    ? getDefaultMaxVolumeGb(inputs)
    : inputs.maxVolumePerIndexGb;

  const suggestedIndexerCount = estimateIndexerCountFromIngest(
    ingestGb,
    maxVolumePerIndexGb,
    isClustered,
  );

  const appliedIndexerCount = autoEnabled
    ? suggestedIndexerCount
    : clampIndexerCount(inputs.manualIndexerCount);

  return {
    maxVolumePerIndexGb,
    suggestedIndexerCount,
    appliedIndexerCount,
    autoEnabled,
  };
}
