import type { NetworkPortRow, PlannerInputs, TopologyResult } from './types';

interface PortDef {
  tier: string;
  component: string;
  purpose: string;
  protocol: string;
  ports: string;
  direction: 'inbound' | 'outbound' | 'internal';
  when: (topo: TopologyResult, inputs: PlannerInputs) => boolean;
}

const PORT_CATALOG: PortDef[] = [
  {
    tier: 'All Splunk nodes',
    component: 'splunkd',
    purpose: 'Management / REST API',
    protocol: 'TCP',
    ports: '8089',
    direction: 'inbound',
    when: () => true,
  },
  {
    tier: 'Search tier',
    component: 'Splunk Web',
    purpose: 'Splunk Web access',
    protocol: 'TCP',
    ports: '8000',
    direction: 'inbound',
    when: (t) => t.hasOperationalSh || t.hasEsSh || t.hasItsiSh,
  },
  {
    tier: 'Search tier (ES / KV)',
    component: 'KV Store',
    purpose: 'App Key Value Store',
    protocol: 'TCP',
    ports: '8065, 8191',
    direction: 'inbound',
    when: (t, i) => t.hasEsSh || i.enterpriseSecurity,
  },
  {
    tier: 'Search tier (KV-heavy)',
    component: 'Storage sidecar',
    purpose: 'Storage sidecar services',
    protocol: 'TCP',
    ports: '5433, 5434, 2379, 2380, 8008, 5432, 6432',
    direction: 'inbound',
    when: (t, i) => t.hasEsSh || i.itsi,
  },
  {
    tier: 'Indexing tier',
    component: 'Receiving',
    purpose: 'Data from forwarders',
    protocol: 'TCP',
    ports: '9997',
    direction: 'inbound',
    when: (t) => t.indexerCount > 0 || t.prefix === 'S',
  },
  {
    tier: 'Indexing tier',
    component: 'HEC',
    purpose: 'HTTP Event Collector (always included)',
    protocol: 'TCP',
    ports: '8088',
    direction: 'inbound',
    when: (t) => t.indexerCount > 0 || t.prefix === 'S',
  },
  {
    tier: 'Search head cluster',
    component: 'SHC replication',
    purpose: 'Cluster member replication',
    protocol: 'TCP',
    ports: '8081, 9887, 8181',
    direction: 'internal',
    when: (t) => t.hasShc,
  },
  {
    tier: 'Indexer cluster',
    component: 'Peer replication',
    purpose: 'Indexer cluster replication',
    protocol: 'TCP',
    ports: '8080, 9887',
    direction: 'internal',
    when: (t) => t.isClustered,
  },
  {
    tier: 'Forwarders / clients',
    component: 'Deployment client',
    purpose: 'Phone home to DS / LM / CM',
    protocol: 'TCP',
    ports: '8089',
    direction: 'outbound',
    when: () => true,
  },
  {
    tier: 'Load balancer',
    component: 'LB frontend',
    purpose: 'User access to SHC (sticky sessions)',
    protocol: 'TCP',
    ports: '8000',
    direction: 'inbound',
    when: (t) => t.hasShc,
  },
];

function firewallAction(direction: NetworkPortRow['direction']): string {
  if (direction === 'inbound') return 'Allow inbound';
  if (direction === 'outbound') return 'Allow outbound';
  return 'Allow internal (cluster subnets)';
}

export function computeNetworkPorts(
  topology: TopologyResult,
  inputs: PlannerInputs,
): { ports: NetworkPortRow[]; checklist: string[] } {
  const seen = new Set<string>();
  const ports: NetworkPortRow[] = [];

  for (const def of PORT_CATALOG) {
    if (!def.when(topology, inputs)) continue;
    const key = `${def.ports}-${def.tier}-${def.purpose}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ports.push({
      tier: def.tier,
      component: def.component,
      purpose: def.purpose,
      protocol: def.protocol,
      ports: def.ports,
      direction: def.direction,
      firewallAction: firewallAction(def.direction),
    });
  }

  const checklist: string[] = [
    'Splunk components communicate primarily over TCP. Ensure firewalls between tiers permit the ports listed below.',
    ...ports.map(
      (p) =>
        `[${p.tier}] ${p.firewallAction} ${p.protocol}/${p.ports} — ${p.purpose}`,
    ),
  ];

  if (topology.hasShc) {
    checklist.push('Configure cookie-based sticky sessions on the load balancer in front of the SHC (TCP/8000).');
  }
  if (inputs.itsi) {
    checklist.push('ITSI: SSL must be enabled on splunkd (TCP/8089) on ITSI search heads.');
  }
  if (topology.isClustered) {
    checklist.push('Indexer cluster: allow TCP/8080 and TCP/9887 between all peer nodes and the Cluster Manager.');
  }

  return { ports, checklist };
}

export function buildPrerequisites(inputs: PlannerInputs, topology: TopologyResult): string[] {
  const items = [
    'Disable Transparent Huge Pages (THP): kernel parameter transparent_hugepage=never',
    'Verify: cat /sys/kernel/mm/transparent_hugepage/enabled shows [never]',
    'Ulimits for splunk user: nofile 64000, nproc 16384, fsize unlimited',
    'Never colocate Deployment Server and Cluster Manager',
    'Separate OS volume from Splunk index volumes; Splunk install path ≥800 sustained IOPS',
  ];

  if (topology.hasShc) {
    items.push('Search head cluster: load balancer with cookie-based sticky sessions');
  }
  if (inputs.enterpriseSecurity) {
    items.push('Enterprise Security: dedicated search tier; KV Store on ES search heads');
  }
  if (inputs.itsi) {
    items.push('ITSI: Java 8–11 or 17 on ITSI search heads; do not disable real-time searches on ITSI tiers');
    items.push('ITSI: forward search head internal data to the indexer layer');
  }
  if (inputs.environment === 'virtual') {
    items.push('Virtual: CPU and memory reservations; dedicated datastore for indexer hot/warm');
  }

  return items;
}
