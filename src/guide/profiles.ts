import type { DeploymentProfile } from './types';

export const DEPLOYMENT_PROFILES: DeploymentProfile[] = [
  {
    id: 'single',
    label: 'Single server',
    description: '1× combined Splunk Enterprise (indexer + search + LM + MC + DS on one host).',
    svaHint: 'Maps to SVA S1',
    hostRoles: ['combined'],
    splunkHostCount: 1,
  },
  {
    id: 'distributed_nc',
    label: 'Distributed non-cluster',
    description: '1× indexer, 1× search head, 1× management (LM + MC + DS colocated).',
    svaHint: 'Maps to SVA D1',
    hostRoles: ['mgmt', 'idx1', 'sh1'],
    splunkHostCount: 3,
  },
  {
    id: 'distributed_ic',
    label: 'Distributed + indexer cluster',
    description: '3× indexers, 1× Cluster Manager, 1× search head, 1× management (LM + MC + DS).',
    svaHint: 'Maps to SVA C1',
    hostRoles: ['mgmt', 'cm', 'idx1', 'idx2', 'idx3', 'sh1'],
    splunkHostCount: 6,
  },
  {
    id: 'distributed_ic_shc',
    label: 'Distributed + IC + SHC',
    description:
      '3× indexers, 1× CM, 3× search heads, 1× SHC deployer, 1× DS, 1× management (LM + MC).',
    svaHint: 'Maps to SVA C3',
    hostRoles: ['mgmt', 'cm', 'idx1', 'idx2', 'idx3', 'sh1', 'sh2', 'sh3', 'deployer', 'ds'],
    splunkHostCount: 10,
  },
];

export function getProfile(id: string): DeploymentProfile | undefined {
  return DEPLOYMENT_PROFILES.find((p) => p.id === id);
}
