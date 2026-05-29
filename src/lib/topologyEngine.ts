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

function esSearchHeadCount(inputs: PlannerInputs, settings: ReturnType<typeof resolveTopologySettings>): number {
  if (!inputs.enterpriseSecurity) return 0;
  if (settings.hasShc || settings.isClustered) return SIZING.MIN_SHC_MEMBERS;
  return 1;
}

function itsiSearchHeadCount(inputs: PlannerInputs, settings: ReturnType<typeof resolveTopologySettings>): number {
  if (!inputs.itsi) return 0;
  if (settings.hasShc) return Math.max(SIZING.MIN_SHC_MEMBERS, settings.operationalSearchHeadCount);
  return 1;
}

function addRow(
  inventory: ServerInventoryRow[],
  role: ServerRole,
  label: string,
  count: number,
  hwOptions: HardwareOptions,
): void {
  if (count <= 0) return;
  inventory.push({
    role,
    roleLabel: label,
    count,
    hardware: resolveHardwareSpec(role, hwOptions),
    osDiskGb: getOsDiskGb(role),
    splunkDiskGb: getSplunkDiskGb(role),
  });
}

export function computeTopology(inputs: PlannerInputs): TopologyResult {
  const warnings: string[] = [];
  const advisories: string[] = [];
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
      warnings.push('Single-instance (S1) is not recommended above ~300 GB/day.');
    }
    advisories.push('S1: all core roles run on a single combined instance.');
  } else {
    advisories.push(`Indexing tier (auto): ${prefixLabel}`);
    if (perf.useCombinedInstance && inputs.dailyIngestGb < 300) {
      advisories.push(perf.summary + ' A single-server deployment may fit this profile.');
    } else if (indexerCount < perf.recommendedIndexers) {
      advisories.push(
        `${perf.summary} Table guideline: ${perf.recommendedIndexers} indexer(s); plan uses ${indexerCount}.`,
      );
    } else {
      advisories.push(perf.summary);
    }
  }

  if (inputs.dailyIngestGb > clusterEstimation.maxVolumePerIndexGb * indexerCount && !singleServer) {
    warnings.push(
      `Daily ingest exceeds ~${clusterEstimation.maxVolumePerIndexGb} GB/day × ${indexerCount} indexer(s).`,
    );
  }

  if (inputs.enterpriseSecurity && inputs.itsi) {
    advisories.push('Enterprise Security and ITSI cannot share the same search head. Separate dedicated search tiers are required.');
  }

  if (inputs.itsi && !hasShc) {
    advisories.push('For ITSI beyond ~200 KPIs, a search head cluster is recommended for stability.');
  }

  if (!singleServer) {
    advisories.push(
      `Cluster: ${indexerCount} indexers, RF=${settings.replicationFactor}, SF=${settings.searchFactor}` +
        (clusterEstimation.autoEnabled ? ' (auto estimation)' : ' (manual)'),
    );
  }

  advisories.push('Multi-site deployment (M prefix) — coming soon.');
  advisories.push('Never colocate Deployment Server and Cluster Manager on the same host.');

  if (inputs.environment === 'virtual') {
    advisories.push('Virtual: reserve CPU/RAM; use thick-provisioned disks for indexers.');
  }

  const svaCode = buildSvaCode(prefix, baseSuffix, inputs.enterpriseSecurity);
  const svaName = SVA_NAMES[svaCode] ?? `Splunk Validated Architecture ${svaCode}`;

  const hwOptions: HardwareOptions = {
    enterpriseSecurity: inputs.enterpriseSecurity,
    itsi: inputs.itsi,
    highIngest: inputs.dailyIngestGb >= 500,
  };

  const inventory: ServerInventoryRow[] = [];
  const esShCount = esSearchHeadCount(inputs, settings);
  const itsiShCount = itsiSearchHeadCount(inputs, settings);

  if (singleServer) {
    addRow(inventory, 'combined', 'Combined indexer + search (S1)', 1, hwOptions);
    if (inputs.enterpriseSecurity) {
      addRow(inventory, 'search-head-es', 'Dedicated Enterprise Security SH', 1, hwOptions);
    }
    if (inputs.itsi) {
      addRow(inventory, 'search-head-itsi', 'Dedicated ITSI SH', 1, hwOptions);
    }
  } else {
    addRow(
      inventory,
      'search-head',
      hasShc ? `Search head cluster (operational, ${operationalSearchHeadCount})` : `Search head (operational, ${operationalSearchHeadCount})`,
      operationalSearchHeadCount,
      hwOptions,
    );
    if (esShCount > 0) {
      addRow(
        inventory,
        'search-head-es',
        esShCount >= 3 ? 'Enterprise Security SHC' : 'Enterprise Security search head',
        esShCount,
        hwOptions,
      );
    }
    if (itsiShCount > 0) {
      addRow(
        inventory,
        'search-head-itsi',
        itsiShCount >= 3 ? 'ITSI search head cluster' : 'ITSI search head',
        itsiShCount,
        hwOptions,
      );
    }

    addRow(inventory, 'indexer', isClustered ? 'Clustered indexer peer' : 'Indexer', indexerCount, hwOptions);

    const managementPlan = buildManagementPlan(inputs, {
      isClustered,
      hasShc,
      isSingleServer: false,
      indexerCount,
    });

    for (const row of managementHostsToInventoryLabels(managementPlan)) {
      addRow(inventory, row.role, row.label, row.count, hwOptions);
    }

    if (inputs.enterpriseSecurity) {
      advisories.push('Enterprise Security: isolated search tier (+10 SVA). KV Store on ES search heads (8065, 8191).');
    }
    if (inputs.itsi) {
      advisories.push('ITSI: real-time searches cannot be disabled on ITSI tiers.');
    }
    if (hasShc) {
      advisories.push('SHC: configure load balancer cookie-based sticky sessions on TCP/8000.');
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
