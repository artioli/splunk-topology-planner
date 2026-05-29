import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../constants';
import { buildManagementPlan } from '../managementPlanner';

describe('managementPlanner', () => {
  it('never colocates CM with DS on same host', () => {
    const plan = buildManagementPlan(
      {
        ...DEFAULT_INPUTS,
        managementManualConfig: true,
        colocateClusterManager: true,
        colocateShcDeployer: true,
        dedicateDeploymentServer: false,
      },
      { isClustered: true, hasShc: true, isSingleServer: false, indexerCount: 3 },
    );
    const combined = plan.hosts.find((h) => h.roles.includes('Cluster Manager') && h.roles.includes('Deployment Server'));
    expect(combined).toBeUndefined();
  });

  it('singleton stack becomes dedicated', () => {
    const plan = buildManagementPlan(
      {
        ...DEFAULT_INPUTS,
        managementManualConfig: true,
        colocateClusterManager: false,
        colocateShcDeployer: false,
        dedicateDeploymentServer: true,
        dedicateLicenseManager: true,
        dedicateMonitoringConsole: true,
        forwarderClientCount: 10,
      },
      { isClustered: false, hasShc: false, isSingleServer: false, indexerCount: 1 },
    );
    expect(plan.hosts.every((h) => h.roles.length === 1)).toBe(true);
  });
});
