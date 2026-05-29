import { epsToGbPerDay } from './ingestCalculator';
import { normalizePlannerInputs } from './inputNormalize';
import { computeNetworkPorts, buildPrerequisites } from './networkPlanner';
import { getPerformanceRecommendation } from './performanceRecommendations';
import { calculateStorage } from './storageEngine';
import { computeTopology } from './topologyEngine';
import type { PlannerInputs, PlannerResult } from './types';

export function resolveIngestGb(inputs: PlannerInputs): number {
  if (inputs.useEpsInput) {
    return Math.round(epsToGbPerDay(inputs.eventsPerSecond, inputs.avgEventBytes, inputs.utilization) * 100) / 100;
  }
  return inputs.dailyIngestGb;
}

export function runPlanner(rawInputs: PlannerInputs): PlannerResult {
  const dailyIngestGb = resolveIngestGb(rawInputs);
  const inputs = normalizePlannerInputs({ ...rawInputs, dailyIngestGb });

  const topology = computeTopology(inputs);
  const storage = calculateStorage(inputs, topology.indexerCount, topology.isClustered);
  const { ports, checklist } = computeNetworkPorts(topology, inputs);
  const prerequisites = buildPrerequisites(inputs, topology);

  const performanceRecommendation =
    inputs.concurrentUsers > 0
      ? getPerformanceRecommendation(inputs.dailyIngestGb, inputs.concurrentUsers)
      : null;

  return {
    inputs,
    resolvedIngestGb: dailyIngestGb,
    topology,
    storage,
    networkPorts: ports,
    firewallChecklist: checklist,
    prerequisites,
    performanceRecommendation,
  };
}
