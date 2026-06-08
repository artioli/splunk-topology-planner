import { SIZING } from './constants';
import {
  getOsDiskGb,
  getSplunkDiskGb,
  resolveHardwareSpec,
} from './hardwareCatalog';
import type {
  HardwareOverrideRole,
  HardwareOverrideValues,
  IndexerHardwareTier,
  PlannerInputs,
  RoleHardwareOverride,
  ServerRole,
} from './types';
import { HARDWARE_OVERRIDE_ROLES } from './types';

export function inferAutoIndexerTier(inputs: {
  enterpriseSecurity: boolean;
  itsi: boolean;
  dailyIngestGb: number;
}): Exclude<IndexerHardwareTier, 'custom'> {
  if (inputs.enterpriseSecurity || inputs.itsi) return 'high';
  if (inputs.dailyIngestGb >= 500) return 'mid';
  return 'min';
}

export function defaultHardwareOverrideValues(role: ServerRole): HardwareOverrideValues {
  const spec = resolveHardwareSpec(role, { enterpriseSecurity: false, itsi: false });
  return {
    physicalCores: spec.physicalCores,
    vcpu: spec.vcpu,
    ramGb: spec.ramGb,
    osDiskGb: getOsDiskGb(role),
    splunkDiskGb: getSplunkDiskGb(role),
  };
}

export const DEFAULT_INDEXER_CUSTOM_SPEC: HardwareOverrideValues = {
  physicalCores: 12,
  vcpu: 24,
  ramGb: 12,
  osDiskGb: SIZING.OS_DISK_GB,
  splunkDiskGb: SIZING.SPLUNK_INSTALL_DISK_GB,
};

export function createDefaultRoleHardwareOverrides(): Partial<
  Record<HardwareOverrideRole, RoleHardwareOverride>
> {
  const overrides: Partial<Record<HardwareOverrideRole, RoleHardwareOverride>> = {};
  for (const role of HARDWARE_OVERRIDE_ROLES) {
    overrides[role] = {
      enabled: false,
      values: defaultHardwareOverrideValues(role),
    };
  }
  return overrides;
}

export function mergeRoleHardwareOverrides(
  stored?: Partial<Record<HardwareOverrideRole, RoleHardwareOverride>>,
): Partial<Record<HardwareOverrideRole, RoleHardwareOverride>> {
  const defaults = createDefaultRoleHardwareOverrides();
  if (!stored) return defaults;
  const merged = { ...defaults };
  for (const role of HARDWARE_OVERRIDE_ROLES) {
    const entry = stored[role];
    if (!entry) continue;
    merged[role] = {
      enabled: entry.enabled === true,
      values: { ...defaults[role]!.values, ...entry.values },
    };
  }
  return merged;
}

export function mergeIndexerCustomSpec(
  stored?: HardwareOverrideValues,
): HardwareOverrideValues {
  return { ...DEFAULT_INDEXER_CUSTOM_SPEC, ...stored };
}

export function withHardwareDefaults(inputs: PlannerInputs): PlannerInputs {
  return {
    ...inputs,
    manualHardwareSpec: inputs.manualHardwareSpec ?? false,
    indexerHardwareTier: inputs.indexerHardwareTier ?? 'min',
    indexerCustomSpec: mergeIndexerCustomSpec(inputs.indexerCustomSpec),
    roleHardwareOverrides: mergeRoleHardwareOverrides(inputs.roleHardwareOverrides),
  };
}
