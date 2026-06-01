import type { DeploymentProfileId } from '../guide/types';
import type { PlannerResult } from './types';

export const HANDOFF_KEY = 'splunk-planner-guide-handoff';

export interface PlannerHandoff {
  svaCode: string;
  profileId: DeploymentProfileId;
  indexerCount: number;
  hasShc: boolean;
  enterpriseSecurity: boolean;
  itsi: boolean;
  replicationFactor: number;
  searchFactor: number;
  savedAt: string;
}

export function profileFromResult(result: PlannerResult): DeploymentProfileId {
  const { topology } = result;
  if (topology.prefix === 'S' || result.inputs.singleServerDeployment) return 'single';
  if (topology.isClustered && topology.hasShc) return 'distributed_ic_shc';
  if (topology.isClustered) return 'distributed_ic';
  return 'distributed_nc';
}

export function savePlannerHandoff(result: PlannerResult): void {
  const payload: PlannerHandoff = {
    svaCode: result.topology.svaCode,
    profileId: profileFromResult(result),
    indexerCount: result.topology.indexerCount,
    hasShc: result.topology.hasShc,
    enterpriseSecurity: result.inputs.enterpriseSecurity,
    itsi: result.inputs.itsi,
    replicationFactor: result.inputs.replicationFactor,
    searchFactor: result.inputs.searchFactor,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadPlannerHandoff(): PlannerHandoff | null {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlannerHandoff;
  } catch {
    return null;
  }
}

export function clearPlannerHandoff(): void {
  try {
    localStorage.removeItem(HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}
