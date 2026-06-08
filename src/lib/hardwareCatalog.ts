import { SIZING } from './constants';
import type { HardwareSpec, ServerRole } from './types';

export type IndexerTier = 'min' | 'mid' | 'high';

export interface HardwareOptions {
  enterpriseSecurity: boolean;
  itsi: boolean;
  highIngest?: boolean;
  indexerTier?: IndexerTier;
}

interface RawSpec {
  physicalCores: number;
  physicalCoresRecommended?: number;
  vcpu: number;
  vcpuRecommended?: number;
  ramGb: number;
  ramGbRecommended?: number;
  storageNotes: string[];
  tierLabel: string;
}

const CPU_ARCH_NOTE =
  'x86_64 with AVX, SSE4.2, and AES-NI (required for KV Store)';

const BASELINE_104: Record<string, RawSpec> = {
  single: {
    physicalCores: 12,
    vcpu: 24,
    ramGb: 12,
    tierLabel: 'Single-instance (S1)',
    storageNotes: [
      'Hot/warm: NVMe or SSD per 10.4 indexer guidance',
      'Separate OS volume from index data',
      'Splunk install volume: ≥800 sustained IOPS',
      '1 Gb Ethernet NIC',
    ],
  },
  searchHead: {
    physicalCores: 16,
    vcpu: 32,
    ramGb: 12,
    tierLabel: 'Search head (10.4 minimum)',
    storageNotes: [
      'SSD or HDD with ≥800 sustained IOPS',
      '≥300 GB dedicated storage for search head',
      'Splunk install volume: ≥800 sustained IOPS',
    ],
  },
  indexerMin: {
    physicalCores: 12,
    vcpu: 24,
    ramGb: 12,
    tierLabel: 'Indexer (10.4 minimum)',
    storageNotes: [
      'Hot/warm: NVMe or SSD (never NFS for hot/warm)',
      'Cold: HDD, SAN, or NAS',
      'Frozen: HDD archival tier',
      'Separate OS volume from index paths',
    ],
  },
  indexerMid: {
    physicalCores: 24,
    vcpu: 48,
    ramGb: 64,
    tierLabel: 'Indexer (10.4 mid-range)',
    storageNotes: [
      'Hot/warm: NVMe or SSD',
      'Cold: network or HDD tier',
      'Additional headroom for search concurrency',
    ],
  },
  indexerHigh: {
    physicalCores: 48,
    vcpu: 96,
    ramGb: 128,
    tierLabel: 'Indexer (10.4 high-performance)',
    storageNotes: [
      'Enterprise PCIe NVMe for hot/warm',
      'Mandatory tier for premium apps and sustained search',
      'Cold/frozen per retention design',
    ],
  },
  management: {
    physicalCores: 12,
    vcpu: 24,
    ramGb: 12,
    tierLabel: 'Management component (10.4 baseline)',
    storageNotes: [
      'Standard virtual disk or HDD (~100 GB)',
      'Never colocate Deployment Server with Cluster Manager',
    ],
  },
};

const ES_MINIMUM: RawSpec = {
  physicalCores: 16,
  vcpu: 32,
  ramGb: 32,
  tierLabel: 'ES 8.5 production minimum',
  storageNotes: ['KV Store on search head; review ES deployment considerations'],
};

const ITSI_SH_MINIMUM: RawSpec = {
  physicalCores: 16,
  physicalCoresRecommended: 24,
  vcpu: 32,
  vcpuRecommended: 48,
  ramGb: 12,
  ramGbRecommended: 16,
  tierLabel: 'ITSI 4.21 search head minimum',
  storageNotes: [
    'Java 8–11 or 17 on ITSI search heads only',
    'SSL required on splunkd (TCP/8089)',
    'Forward SH internal data to indexers (best practice)',
  ],
};

const ITSI_INDEXER_MINIMUM: RawSpec = {
  physicalCores: 16,
  vcpu: 32,
  vcpuRecommended: 48,
  ramGb: 32,
  tierLabel: 'ITSI 4.21 indexer minimum',
  storageNotes: ['I/O-intensive; meet 10.4 indexer storage guidance'],
};

function mergeSpecs(base: RawSpec, ...overlays: (RawSpec | undefined)[]): HardwareSpec {
  let physicalCores = base.physicalCores;
  let physicalCoresRecommended = base.physicalCoresRecommended;
  let vcpu = base.vcpu;
  let vcpuRecommended = base.vcpuRecommended;
  let ramGb = base.ramGb;
  let ramGbRecommended = base.ramGbRecommended;
  const sources: ('10.4' | 'ES' | 'ITSI' | 'CUSTOM')[] = ['10.4'];
  const storageNotes = [...base.storageNotes];

  for (const o of overlays) {
    if (!o) continue;
    if (o.physicalCores > physicalCores) physicalCores = o.physicalCores;
    if (o.physicalCoresRecommended) {
      physicalCoresRecommended = Math.max(
        physicalCoresRecommended ?? 0,
        o.physicalCoresRecommended,
      );
    }
    if (o.vcpu > vcpu) vcpu = o.vcpu;
    if (o.vcpuRecommended) {
      vcpuRecommended = Math.max(vcpuRecommended ?? 0, o.vcpuRecommended);
    }
    if (o.ramGb > ramGb) ramGb = o.ramGb;
    if (o.ramGbRecommended) {
      ramGbRecommended = Math.max(ramGbRecommended ?? 0, o.ramGbRecommended);
    }
    if (o.tierLabel.includes('ES')) sources.push('ES');
    if (o.tierLabel.includes('ITSI')) sources.push('ITSI');
    for (const n of o.storageNotes) {
      if (!storageNotes.includes(n)) storageNotes.push(n);
    }
  }

  return {
    physicalCores,
    physicalCoresRecommended,
    vcpu,
    vcpuRecommended,
    ramGb,
    ramGbRecommended,
    storageNotes: [CPU_ARCH_NOTE, ...storageNotes],
    tierLabel: base.tierLabel,
    sources: [...new Set(sources)],
  };
}

export function getIndexerBaselineByTier(tier: IndexerTier): RawSpec {
  if (tier === 'high') return BASELINE_104.indexerHigh;
  if (tier === 'mid') return BASELINE_104.indexerMid;
  return BASELINE_104.indexerMin;
}

export function pickIndexerBaseline(
  options: HardwareOptions,
): RawSpec {
  if (options.indexerTier) return getIndexerBaselineByTier(options.indexerTier);
  if (options.enterpriseSecurity || options.itsi) return BASELINE_104.indexerHigh;
  if (options.highIngest) return BASELINE_104.indexerMid;
  return BASELINE_104.indexerMin;
}

export function resolveHardwareSpec(
  role: ServerRole,
  options: HardwareOptions,
): HardwareSpec {
  const { enterpriseSecurity, itsi } = options;

  switch (role) {
    case 'combined': {
      const base = options.indexerTier
        ? pickIndexerBaseline(options)
        : BASELINE_104.single;
      return mergeSpecs(
        base,
        enterpriseSecurity || itsi ? ES_MINIMUM : undefined,
      );
    }

    case 'search-head':
      return mergeSpecs(BASELINE_104.searchHead);

    case 'search-head-es':
      return mergeSpecs(BASELINE_104.searchHead, ES_MINIMUM);

    case 'search-head-itsi':
      return mergeSpecs(BASELINE_104.searchHead, ITSI_SH_MINIMUM);

    case 'indexer': {
      const base = pickIndexerBaseline(options);
      return mergeSpecs(
        base,
        enterpriseSecurity ? ES_MINIMUM : undefined,
        itsi ? ITSI_INDEXER_MINIMUM : undefined,
      );
    }

    case 'management-stack':
      return mergeSpecs(BASELINE_104.management);

    default:
      return mergeSpecs(BASELINE_104.management);
  }
}

export function getOsDiskGb(role: ServerRole): number {
  if (role === 'search-head' || role === 'search-head-es' || role === 'search-head-itsi') {
    return SIZING.OS_DISK_GB;
  }
  if (role === 'indexer' || role === 'combined') return SIZING.OS_DISK_GB;
  return SIZING.MANAGEMENT_DISK_GB;
}

export function getSplunkDiskGb(role: ServerRole): number {
  if (role.startsWith('search-head')) return SIZING.SPLUNK_INSTALL_DISK_GB + SIZING.SEARCH_HEAD_DATA_DISK_GB;
  if (role === 'indexer' || role === 'combined') return SIZING.SPLUNK_INSTALL_DISK_GB;
  return SIZING.MANAGEMENT_DISK_GB;
}
