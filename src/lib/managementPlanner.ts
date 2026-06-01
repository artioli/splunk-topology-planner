import { SIZING } from './constants';
import type { ManagementHostPlan, ManagementPlan, PlannerInputs } from './types';

type MgmtRole = 'Deployment Server' | 'Cluster Manager' | 'SHC Deployer' | 'License Manager' | 'Monitoring Console';

interface RolePlacement {
  role: MgmtRole;
  dedicated: boolean;
}

function roleEnabled(role: MgmtRole, opts: { isClustered: boolean; hasShc: boolean }): boolean {
  if (role === 'Cluster Manager') return opts.isClustered;
  if (role === 'SHC Deployer') return opts.hasShc;
  return true;
}

function resolvePlacements(
  inputs: PlannerInputs,
  opts: { isClustered: boolean; hasShc: boolean },
): RolePlacement[] {
  const dsDefaultDedicated =
    inputs.forwarderClientCount > SIZING.DS_DEDICATED_CLIENT_THRESHOLD;

  const placements: RolePlacement[] = [];

  const add = (role: MgmtRole, dedicated: boolean) => {
    if (!roleEnabled(role, opts)) return;
    placements.push({ role, dedicated });
  };

  if (inputs.managementManualConfig) {
    add('Deployment Server', inputs.dedicateDeploymentServer || dsDefaultDedicated);
    add('Cluster Manager', !inputs.colocateClusterManager);
    add('SHC Deployer', !inputs.colocateShcDeployer);
    add('License Manager', inputs.dedicateLicenseManager);
    add('Monitoring Console', inputs.dedicateMonitoringConsole);
  } else {
    add('Deployment Server', dsDefaultDedicated);
    add('Cluster Manager', true);
    add('SHC Deployer', true);
    add('License Manager', false);
    add('Monitoring Console', false);
  }

  return placements;
}

/** If only one role would share a stack, keep it dedicated (rule 2.4). */
function collapseSingletonStack(placements: RolePlacement[]): RolePlacement[] {
  const stack = placements.filter((p) => !p.dedicated);
  if (stack.length === 1) {
    return placements.map((p) =>
      p.role === stack[0].role ? { ...p, dedicated: true } : p,
    );
  }
  return placements;
}

function buildHostsFromPlacements(placements: RolePlacement[]): ManagementHostPlan[] {
  const hosts: ManagementHostPlan[] = [];
  const stackRoles = placements.filter((p) => !p.dedicated);

  for (const p of placements.filter((x) => x.dedicated)) {
    hosts.push({
      hostLabel: `${p.role} (dedicated)`,
      roles: [p.role],
      notes: [],
    });
  }

  if (stackRoles.length > 0) {
    const hasCm = stackRoles.some((p) => p.role === 'Cluster Manager');
    const hasDs = stackRoles.some((p) => p.role === 'Deployment Server');
    const notes: string[] = [];
    if (hasCm && hasDs) {
      notes.push('Invalid: CM and DS cannot share a host — CM moved to dedicated.');
    }

    const safeStack = hasCm && hasDs
      ? stackRoles.filter((p) => p.role !== 'Cluster Manager')
      : stackRoles;

    if (safeStack.length > 0) {
      hosts.push({
        hostLabel: 'Management node (colocated)',
        roles: safeStack.map((p) => p.role),
        notes: notes.length ? notes : ['Colocated management components'],
      });
    }

    if (hasCm && hasDs) {
      hosts.push({
        hostLabel: 'Cluster Manager (dedicated)',
        roles: ['Cluster Manager'],
        notes: ['Separated from Deployment Server per Splunk guidance'],
      });
    }
  }

  return hosts;
}

export function buildManagementPlan(
  inputs: PlannerInputs,
  options: {
    isClustered: boolean;
    hasShc: boolean;
    isSingleServer: boolean;
    indexerCount: number;
  },
): ManagementPlan {
  if (options.isSingleServer) {
    return {
      hosts: [],
      suggestions: ['Single-server (S1): management roles run on the combined instance.'],
    };
  }

  const suggestions: string[] = [
    'Never colocate Deployment Server and Cluster Manager.',
  ];

  if (inputs.forwarderClientCount > SIZING.DS_DEDICATED_CLIENT_THRESHOLD) {
    suggestions.push(
      `>${SIZING.DS_DEDICATED_CLIENT_THRESHOLD} clients: Deployment Server should be dedicated.`,
    );
  }

  let placements = resolvePlacements(inputs, options);
  placements = collapseSingletonStack(placements);
  const hosts = buildHostsFromPlacements(placements);

  if (!inputs.managementManualConfig) {
    suggestions.push(
      'Auto: Cluster Manager and SHC Deployer on dedicated hosts when applicable; LM, MC, and DS (≤50 clients) may colocate.',
    );
  }

  return { hosts, suggestions };
}

export function managementHostsToInventoryLabels(plan: ManagementPlan): {
  role: 'cluster-manager' | 'deployment-server' | 'license-manager' | 'monitoring-console' | 'shc-deployer' | 'management-stack';
  label: string;
  count: number;
}[] {
  const rows: {
    role: 'cluster-manager' | 'deployment-server' | 'license-manager' | 'monitoring-console' | 'shc-deployer' | 'management-stack';
    label: string;
    count: number;
  }[] = [];

  const map: Record<string, typeof rows[0]['role']> = {
    'Cluster Manager': 'cluster-manager',
    'Deployment Server': 'deployment-server',
    'License Manager': 'license-manager',
    'Monitoring Console': 'monitoring-console',
    'SHC Deployer': 'shc-deployer',
  };

  for (const host of plan.hosts) {
    if (host.roles.length > 1) {
      rows.push({
        role: 'management-stack',
        label: `${host.hostLabel}: ${host.roles.join(', ')}`,
        count: 1,
      });
      continue;
    }
    const role = map[host.roles[0]] ?? 'management-stack';
    rows.push({ role, label: host.hostLabel, count: 1 });
  }

  return rows;
}
