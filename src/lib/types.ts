export type ResiliencyFamily = 'S' | 'D' | 'C' | 'M';
export type ArchivingMode = 'none' | 'local' | 'clustered-optimized' | 'clustered-unoptimized';
export type EnvironmentType = 'physical' | 'virtual';
export type TimeUnit = 'days' | 'months' | 'years';

export interface RetentionPeriod {
  value: number;
  unit: TimeUnit;
}

export type IndexerHardwareTier = 'min' | 'mid' | 'high' | 'custom';

export interface HardwareOverrideValues {
  physicalCores: number;
  vcpu: number;
  ramGb: number;
  osDiskGb: number;
  splunkDiskGb: number;
}

export interface RoleHardwareOverride {
  enabled: boolean;
  values: HardwareOverrideValues;
}

export const HARDWARE_OVERRIDE_ROLES = [
  'search-head',
  'search-head-es',
  'search-head-itsi',
  'cluster-manager',
  'deployment-server',
  'shc-deployer',
  'license-manager',
  'monitoring-console',
  'management-stack',
] as const;

export type HardwareOverrideRole = (typeof HARDWARE_OVERRIDE_ROLES)[number];

export interface PlannerInputs {
  dailyIngestGb: number;
  useEpsInput: boolean;
  eventsPerSecond: number;
  avgEventBytes: number;
  utilization: number;
  peakConcurrentSearches?: number;
  concurrentUsers: number;
  singleServerDeployment: boolean;
  searchHeadCount: number;
  searchHeadCluster: boolean;
  enterpriseSecurity: boolean;
  itsi: boolean;
  hotWarm: RetentionPeriod;
  cold: RetentionPeriod;
  frozen: RetentionPeriod;
  archivingMode: ArchivingMode;
  autoClusterEstimation: boolean;
  maxVolumePerIndexGb: number;
  manualIndexerCount: number;
  clusterReplication: boolean;
  replicationFactor: number;
  searchFactor: number;
  esShc: boolean;
  esShcMembers: number;
  itsiShc: boolean;
  itsiShcMembers: number;
  environment: EnvironmentType;
  virtualizationOverheadPct: number;
  forwarderClientCount: number;
  managementManualConfig: boolean;
  dedicateDeploymentServer: boolean;
  colocateClusterManager: boolean;
  colocateShcDeployer: boolean;
  dedicateLicenseManager: boolean;
  dedicateMonitoringConsole: boolean;
  manualHardwareSpec: boolean;
  indexerHardwareTier: IndexerHardwareTier;
  indexerCustomSpec: HardwareOverrideValues;
  roleHardwareOverrides: Partial<Record<HardwareOverrideRole, RoleHardwareOverride>>;
}

export interface HardwareSpec {
  physicalCores: number;
  physicalCoresRecommended?: number;
  vcpu: number;
  vcpuRecommended?: number;
  ramGb: number;
  ramGbRecommended?: number;
  storageNotes: string[];
  tierLabel: string;
  sources: ('10.4' | 'ES' | 'ITSI' | 'VIRT' | 'CUSTOM')[];
}

export type ServerRole =
  | 'combined'
  | 'search-head'
  | 'search-head-es'
  | 'search-head-itsi'
  | 'indexer'
  | 'cluster-manager'
  | 'deployment-server'
  | 'shc-deployer'
  | 'license-manager'
  | 'monitoring-console'
  | 'heavy-forwarder'
  | 'management-stack';

export interface ServerInventoryRow {
  role: ServerRole;
  roleLabel: string;
  count: number;
  hardware: HardwareSpec;
  osDiskGb: number;
  splunkDiskGb: number;
}

export interface StorageTierResult {
  hotWarmTb: number;
  coldTb: number;
  searchableTb: number;
  frozenTb: number;
  totalTb: number;
  perIndexerHotWarmTb: number;
  perIndexerColdTb: number;
  perIndexerFrozenTb: number;
  perIndexerTotalTb: number;
  dailyMultiplier: number;
  hotWarmDays: number;
  coldDays: number;
  frozenDays: number;
  totalRetentionDays: number;
}

export interface NetworkPortRow {
  tier: string;
  component: string;
  purpose: string;
  protocol: string;
  ports: string;
  direction: 'inbound' | 'outbound' | 'internal';
  firewallAction: string;
}

export interface PerformanceRecommendation {
  ingestBandLabel: string;
  userBandLabel: string;
  recommendedIndexers: number;
  recommendedSearchHeads: number;
  useCombinedInstance: boolean;
  summary: string;
}

export interface I18nMessage {
  key: string;
  params?: Record<string, string | number>;
}

export interface ManagementHostPlan {
  hostLabel: string;
  roles: string[];
  notes: string[];
}

export interface ManagementPlan {
  hosts: ManagementHostPlan[];
  suggestions: string[];
}

export interface ClusterEstimation {
  autoEnabled: boolean;
  maxVolumePerIndexGb: number;
  suggestedIndexerCount: number;
  appliedIndexerCount: number;
}

export interface TopologyResult {
  svaCode: string;
  svaName: string;
  prefix: ResiliencyFamily;
  prefixLabel: string;
  baseSuffix: number;
  warnings: I18nMessage[];
  advisories: I18nMessage[];
  inventory: ServerInventoryRow[];
  indexerCount: number;
  isClustered: boolean;
  hasShc: boolean;
  hasOperationalSh: boolean;
  hasEsSh: boolean;
  hasItsiSh: boolean;
  operationalSearchHeadCount: number;
  clusterEstimation: ClusterEstimation;
  managementPlan: ManagementPlan;
}

export interface PlannerResult {
  inputs: PlannerInputs;
  resolvedIngestGb: number;
  topology: TopologyResult;
  storage: StorageTierResult;
  networkPorts: NetworkPortRow[];
  firewallChecklist: string[];
  prerequisites: string[];
  performanceRecommendation: PerformanceRecommendation | null;
}
