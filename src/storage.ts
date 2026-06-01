import { DEFAULT_INPUTS } from './lib/constants';
import { defaultPeriod } from './lib/retentionUtils';
import type { PlannerInputs, RetentionPeriod, TimeUnit } from './lib/types';

const STORAGE_KEY = 'splunk-topology-planner-inputs';

function migrateLegacy(parsed: Record<string, unknown>): PlannerInputs {
  const base = { ...DEFAULT_INPUTS } as PlannerInputs & Record<string, unknown>;
  Object.assign(base, parsed);

  if (parsed.hotWarmDays != null && !parsed.hotWarm) {
    base.hotWarm = defaultPeriod(Number(parsed.hotWarmDays), 'days');
  }
  if (parsed.coldDays != null && !parsed.cold) {
    base.cold = defaultPeriod(Number(parsed.coldDays), 'days');
  }
  if (parsed.frozenDays != null && !parsed.frozen) {
    base.frozen = defaultPeriod(Number(parsed.frozenDays), 'days');
  }

  if (parsed.resiliency === 'S' || parsed.singleServerDeployment == null) {
    base.singleServerDeployment = parsed.resiliency === 'S' || parsed.singleServerDeployment === true;
  }
  if (parsed.searchTier != null && base.searchHeadCluster == null) {
    const tier = String(parsed.searchTier);
    base.searchHeadCluster = tier === '3' || tier === '4';
    base.searchHeadCount = tier === '3' || tier === '4' ? 3 : tier === '2' ? 2 : 1;
  }
  if (parsed.dedicateClusterManager != null && parsed.colocateClusterManager == null) {
    base.colocateClusterManager = !parsed.dedicateClusterManager;
  }
  if (parsed.dedicateLicenseStack != null) {
    base.dedicateLicenseManager = parsed.dedicateLicenseStack === true;
    base.dedicateMonitoringConsole = parsed.dedicateLicenseStack === true;
  }

  delete base.hotWarmDays;
  delete base.coldDays;
  delete base.frozenDays;
  delete base.hecEnabled;
  delete base.resiliency;
  delete base.searchTier;
  delete base.multiSite;
  delete base.multiSiteDeployment;
  delete base.siteCount;

  return base as PlannerInputs;
}

export function loadInputs(): PlannerInputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_INPUTS };
    return migrateLegacy(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return { ...DEFAULT_INPUTS };
  }
}

export function saveInputs(inputs: PlannerInputs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
}

export function readRetentionField(prefix: string): RetentionPeriod {
  const value = Number((document.getElementById(`${prefix}Value`) as HTMLInputElement)?.value ?? 0);
  const unit = (document.getElementById(`${prefix}Unit`) as HTMLSelectElement)?.value as TimeUnit;
  return { value, unit };
}
