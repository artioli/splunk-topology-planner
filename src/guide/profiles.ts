import type { DeploymentProfile } from './types';

export const DEPLOYMENT_PROFILES: DeploymentProfile[] = [
  {
    id: 'single',
    hostRoles: ['combined'],
    splunkHostCount: 1,
  },
  {
    id: 'distributed_nc',
    hostRoles: ['mgmt', 'idx1', 'sh1'],
    splunkHostCount: 3,
  },
  {
    id: 'distributed_ic',
    hostRoles: ['mgmt', 'cm', 'idx1', 'idx2', 'idx3', 'sh1'],
    splunkHostCount: 6,
  },
  {
    id: 'distributed_ic_shc',
    hostRoles: ['mgmt', 'cm', 'idx1', 'idx2', 'idx3', 'sh1', 'sh2', 'sh3', 'deployer', 'ds'],
    splunkHostCount: 10,
  },
];

export function getProfile(id: string): DeploymentProfile | undefined {
  return DEPLOYMENT_PROFILES.find((p) => p.id === id);
}
