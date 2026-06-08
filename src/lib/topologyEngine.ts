import { msg } from './clusterFactors';
import { SIZING, SVA_NAMES } from './constants';
import {
  getOsDiskGb,
  getSplunkDiskGb,
  resolveHardwareSpec,
  type HardwareOptions,
} from './hardwareCatalog';
import {
  buildManagementPlan,
  managementHostsToInventoryLabels,
} from './managementPlanner';
import { getPerformanceRecommendation } from './performanceRecommendations';
import { resolveTopologySettings } from './topologyResolver';
import type {
  HardwareOverrideValues,
  HardwareSpec,
  I18nMessage,
  PlannerInputs,
  ResiliencyFamily,
  ServerInventoryRow,
  ServerRole,
  TopologyResult,
} from './types';

function buildSvaCode(prefix: ResiliencyFamily, suffix: number, es: boolean): string {
  const code = `${prefix}${suffix}`;
  if (!es) return code;
  return `${prefix}${suffix + 10}`;
}

/** Scale indexer compute to compensate for virtualization overhead. */
function applyVirtualizationOverhead(spec: HardwareSpec, pct: number): HardwareSpec {
  if (pct <= 0) return spec;
  const factor = 1 + pct / 100;
  const scale = (v: number | undefined): number | undefined =>
    v == null ? undefined : Math.ceil(v * factor);
  return {
    ...spec,
    physicalCores: Math.ceil(spec.physicalCores * factor),
    physicalCoresRecommended: scale(spec.physicalCoresRecommended),
    vcpu: Math.ceil(spec.vcpu * factor),
    vcpuRecommended: scale(spec.vcpuRecommended),
    ramGb: Math.ceil(spec.ramGb * factor),
    ramGbRecommended: scale(spec.ramGbRecommended),
    sources: [...new Set([...spec.sources, 'VIRT' as const])],
  };
}

function esSearchHeadCount(inputs: PlannerInputs, settings: ReturnType<typeof resolveTopologySettings>): number {
  if (!inputs.enterpriseSecurity) return 0;
  if (!inputs.autoClusterEstimation && !settings.singleServer) {
    return inputs.esShc ? Math.max(SIZING.MIN_SHC_MEMBERS, inputs.esShcMembers) : 1;
  }
  if (settings.hasShc || settings.isClustered) return SIZING.MIN_SHC_MEMBERS;
  return 1;
}

function itsiSearchHeadCount(inputs: PlannerInputs, settings: ReturnType<typeof resolveTopologySettings>): number {
  if (!inputs.itsi) return 0;
  if (!inputs.autoClusterEstimation && !settings.singleServer) {
    return inputs.itsiShc ? Math.max(SIZING.MIN_SHC_MEMBERS, inputs.itsiShcMembers) : 1;
  }
  if (settings.hasShc) return Math.max(SIZING.MIN_SHC_MEMBERS, settings.operationalSearchHeadCount);
  return 1;
}

function applyHardwareOverride(
  spec: HardwareSpec,
  values: HardwareOverrideValues,
  tierLabel = 'Custom',
): HardwareSpec {
  return {
    ...spec,
    physicalCores: values.physicalCores,
    vcpu: values.vcpu,
    ramGb: values.ramGb,
    physicalCoresRecommended: undefined,
    vcpuRecommended: undefined,
    ramGbRecommended: undefined,
    tierLabel,
    sources: [...new Set([...spec.sources, 'CUSTOM' as const])],
  };
}

function resolveRowHardwareOptions(
  role: ServerRole,
  hwOptions: HardwareOptions,
  inputs: PlannerInputs,
): HardwareOptions {
  if (!inputs.manualHardwareSpec) return hwOptions;
  const isIndexerRole = role === 'indexer' || role === 'combined';
  if (!isIndexerRole || inputs.indexerHardwareTier === 'custom') return hwOptions;
  return {
    ...hwOptions,
    indexerTier: inputs.indexerHardwareTier,
  };
}

function addRow(
  inventory: ServerInventoryRow[],
  role: ServerRole,
  label: string,
  count: number,
  hwOptions: HardwareOptions,
  inputs: PlannerInputs,
  virtOverheadPct = 0,
): void {
  if (count <= 0) return;
  const rowHwOptions = resolveRowHardwareOptions(role, hwOptions, inputs);
  let hardware = resolveHardwareSpec(role, rowHwOptions);
  let osDiskGb = getOsDiskGb(role);
  let splunkDiskGb = getSplunkDiskGb(role);

  if (inputs.manualHardwareSpec) {
    const isIndexerRole = role === 'indexer' || role === 'combined';
    if (isIndexerRole && inputs.indexerHardwareTier === 'custom') {
      hardware = applyHardwareOverride(hardware, inputs.indexerCustomSpec);
      osDiskGb = inputs.indexerCustomSpec.osDiskGb;
      splunkDiskGb = inputs.indexerCustomSpec.splunkDiskGb;
    }

    const roleOverride = inputs.roleHardwareOverrides?.[role as keyof NonNullable<typeof inputs.roleHardwareOverrides>];
    if (roleOverride?.enabled) {
      hardware = applyHardwareOverride(hardware, roleOverride.values);
      osDiskGb = roleOverride.values.osDiskGb;
      splunkDiskGb = roleOverride.values.splunkDiskGb;
    }
  }

  if (virtOverheadPct > 0 && (role === 'indexer' || role === 'combined')) {
    hardware = applyVirtualizationOverhead(hardware, virtOverheadPct);
  }
  inventory.push({
    role,
    roleLabel: label,
    count,
    hardware,
    osDiskGb,
    splunkDiskGb,
  });
}

export function computeTopology(inputs: PlannerInputs): TopologyResult {
  const warnings: I18nMessage[] = [];
  const advisories: I18nMessage[] = [];
  const settings = resolveTopologySettings(inputs);

  warnings.push(...settings.topologyWarnings);

  const {
    prefix,
    prefixLabel,
    baseSuffix,
    isClustered,
    hasShc,
    indexerCount,
    operationalSearchHeadCount,
    clusterEstimation,
    singleServer,
  } = settings;

  const perf = getPerformanceRecommendation(inputs.dailyIngestGb, inputs.concurrentUsers);
  if (singleServer) {
    if (inputs.dailyIngestGb > 300) {
      warnings.push(msg('advisory.singleServerNotRecommended'));
    }
    advisories.push(msg('advisory.s1Combined'));
  } else {
    advisories.push(msg('advisory.indexingTier', { prefixLabel }));
    if (perf.useCombinedInstance && inputs.dailyIngestGb < 300) {
      advisories.push(msg('advisory.perfCombined', { summary: perf.summary }));
    } else if (indexerCount < perf.recommendedIndexers) {
      advisories.push(
        msg('advisory.perfUnder', {
          summary: perf.summary,
          recommendedIndexers: perf.recommendedIndexers,
          indexers: indexerCount,
        }),
      );
    } else {
      advisories.push(msg('advisory.perfSummary', { summary: perf.summary }));
    }
  }

  if (inputs.dailyIngestGb > clusterEstimation.maxVolumePerIndexGb * indexerCount && !singleServer) {
    warnings.push(
      msg('advisory.ingestExceeds', {
        maxVolumePerIndexGb: clusterEstimation.maxVolumePerIndexGb,
        indexers: indexerCount,
      }),
    );
  }

  if (inputs.enterpriseSecurity && inputs.itsi) {
    advisories.push(msg('advisory.esItsiSeparate'));
  }

  if (inputs.itsi && !hasShc) {
    advisories.push(msg('advisory.itsiShcRecommend'));
  }

  if (!singleServer) {
    advisories.push(
      msg('advisory.cluster', {
        indexers: indexerCount,
        rf: settings.replicationFactor,
        sf: settings.searchFactor,
        autoSuffixKey: clusterEstimation.autoEnabled
          ? 'advisory.clusterAutoSuffix'
          : 'advisory.clusterManualSuffix',
      }),
    );
  }

  if (inputs.environment === 'virtual') {
    advisories.push(msg('advisory.virtual'));
  }

  const svaCode = buildSvaCode(prefix, baseSuffix, inputs.enterpriseSecurity);
  const svaName = SVA_NAMES[svaCode] ?? `Splunk Validated Architecture ${svaCode}`;

  const hwOptions: HardwareOptions = {
    enterpriseSecurity: inputs.enterpriseSecurity,
    itsi: inputs.itsi,
    highIngest: inputs.dailyIngestGb >= 500,
  };

  const virtPct =
    inputs.environment === 'virtual'
      ? Math.max(0, Math.min(100, Math.round(inputs.virtualizationOverheadPct ?? 0)))
      : 0;

  const inventory: ServerInventoryRow[] = [];
  const esShCount = esSearchHeadCount(inputs, settings);
  const itsiShCount = itsiSearchHeadCount(inputs, settings);

  if (singleServer) {
    addRow(inventory, 'combined', 'Combined indexer + search (S1)', 1, hwOptions, inputs, virtPct);
    if (inputs.enterpriseSecurity) {
      addRow(inventory, 'search-head-es', 'Dedicated Enterprise Security SH', 1, hwOptions, inputs);
    }
    if (inputs.itsi) {
      addRow(inventory, 'search-head-itsi', 'Dedicated ITSI SH', 1, hwOptions, inputs);
    }
  } else {
    addRow(
      inventory,
      'search-head',
      hasShc ? `Search head cluster (operational, ${operationalSearchHeadCount})` : `Search head (operational, ${operationalSearchHeadCount})`,
      operationalSearchHeadCount,
      hwOptions,
      inputs,
    );
    if (esShCount > 0) {
      addRow(
        inventory,
        'search-head-es',
        esShCount >= 3 ? 'Enterprise Security SHC' : 'Enterprise Security search head',
        esShCount,
        hwOptions,
        inputs,
      );
    }
    if (itsiShCount > 0) {
      addRow(
        inventory,
        'search-head-itsi',
        itsiShCount >= 3 ? 'ITSI search head cluster' : 'ITSI search head',
        itsiShCount,
        hwOptions,
        inputs,
      );
    }

    addRow(inventory, 'indexer', isClustered ? 'Clustered indexer peer' : 'Indexer', indexerCount, hwOptions, inputs, virtPct);

    const managementPlan = buildManagementPlan(inputs, {
      isClustered,
      hasShc,
      isSingleServer: false,
      indexerCount,
    });

    for (const row of managementHostsToInventoryLabels(managementPlan)) {
      addRow(inventory, row.role, row.label, row.count, hwOptions, inputs);
    }

    if (inputs.enterpriseSecurity) {
      advisories.push(msg('advisory.esKvStore'));
    }
    if (inputs.itsi) {
      advisories.push(msg('advisory.itsiRealtime'));
    }
    if (hasShc) {
      advisories.push(msg('advisory.shcLb'));
    }

    return {
      svaCode,
      svaName,
      prefix,
      prefixLabel,
      baseSuffix,
      warnings,
      advisories,
      inventory,
      indexerCount,
      isClustered,
      hasShc,
      hasOperationalSh: true,
      hasEsSh: esShCount > 0,
      hasItsiSh: itsiShCount > 0,
      operationalSearchHeadCount,
      clusterEstimation,
      managementPlan,
    };
  }

  const managementPlan = buildManagementPlan(inputs, {
    isClustered: false,
    hasShc: false,
    isSingleServer: true,
    indexerCount: 1,
  });

  return {
    svaCode,
    svaName,
    prefix,
    prefixLabel,
    baseSuffix,
    warnings,
    advisories,
    inventory,
    indexerCount: 1,
    isClustered: false,
    hasShc: false,
    hasOperationalSh: true,
    hasEsSh: esShCount > 0,
    hasItsiSh: itsiShCount > 0,
    operationalSearchHeadCount: 0,
    clusterEstimation,
    managementPlan,
  };
}
