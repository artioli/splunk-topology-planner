export type DeploymentProfileId =
  | 'single'
  | 'distributed_nc'
  | 'distributed_ic'
  | 'distributed_ic_shc';

export type HostRoleKey =
  | 'combined'
  | 'mgmt'
  | 'idx1'
  | 'idx2'
  | 'idx3'
  | 'sh1'
  | 'sh2'
  | 'sh3'
  | 'cm'
  | 'deployer'
  | 'ds'
  | 'uf1'
  | 'uf2';

export type StepTarget =
  | 'all-splunk'
  | 'mgmt'
  | 'combined'
  | 'idx1'
  | 'idx2'
  | 'idx3'
  | 'idx-all'
  | 'sh1'
  | 'sh-all'
  | 'cm'
  | 'deployer'
  | 'ds'
  | 'uf-all'
  | 'uf1'
  | 'uf2';

export interface DocLink {
  label: string;
  url: string;
}

export interface GuideBlock {
  type: 'text' | 'warning' | 'commands' | 'ubuntu';
  content: string;
  commands?: string[];
}

export interface GuideStep {
  id: string;
  phase: string;
  title: string;
  profiles: DeploymentProfileId[];
  targets: StepTarget[];
  optional?: boolean;
  docLinks: DocLink[];
  blocks: GuideBlock[];
}

export interface HostEntry {
  role: HostRoleKey;
  label: string;
  hostname: string;
  ip: string;
}

export interface HostConfig {
  osUser: string;
  adminPassword: string;
  clusterSecret: string;
  clusterForwarderSecret: string;
  splunkVersion: string;
  splunkTgz: string;
  licensePath: string;
  hosts: HostEntry[];
}

export interface DeploymentProfile {
  id: DeploymentProfileId;
  label: string;
  description: string;
  svaHint: string;
  hostRoles: HostRoleKey[];
  splunkHostCount: number;
}

export interface GuideState {
  profileId: DeploymentProfileId;
  includeForwarders: boolean;
  hostConfig: HostConfig;
  completedSteps: string[];
}
