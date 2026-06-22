import { getProfile } from './profiles';
import type { DeploymentProfileId, HostConfig, HostEntry } from './types';

export const DEFAULT_OS_USER = 'splunkuser';
export const DEFAULT_SPLUNK_VERSION = '10.4.0';

export function defaultHostEntries(): HostEntry[] {
  return [
    { role: 'combined', label: 'Combined / management', hostname: 'splunk-mgmt01', ip: '10.0.0.10' },
    { role: 'mgmt', label: 'Management (LM+MC)', hostname: 'splunk-mgmt01', ip: '10.0.0.10' },
    { role: 'idx1', label: 'Indexer 1', hostname: 'splunk-idx01', ip: '10.0.0.11' },
    { role: 'idx2', label: 'Indexer 2', hostname: 'splunk-idx02', ip: '10.0.0.12' },
    { role: 'idx3', label: 'Indexer 3', hostname: 'splunk-idx03', ip: '10.0.0.13' },
    { role: 'sh1', label: 'Search head 1', hostname: 'splunk-sh01', ip: '10.0.0.14' },
    { role: 'sh2', label: 'Search head 2', hostname: 'splunk-sh02', ip: '10.0.0.15' },
    { role: 'sh3', label: 'Search head 3', hostname: 'splunk-sh03', ip: '10.0.0.16' },
    { role: 'cm', label: 'Cluster Manager', hostname: 'splunk-cm01', ip: '10.0.0.17' },
    { role: 'deployer', label: 'SHC Deployer', hostname: 'splunk-deployer01', ip: '10.0.0.18' },
    { role: 'ds', label: 'Deployment Server', hostname: 'splunk-ds01', ip: '10.0.0.19' },
    { role: 'uf1', label: 'Universal Forwarder 1', hostname: 'splunk-uf01', ip: '10.0.0.21' },
    { role: 'uf2', label: 'Universal Forwarder 2', hostname: 'splunk-uf02', ip: '10.0.0.22' },
  ];
}

export function defaultHostConfig(): HostConfig {
  const version = DEFAULT_SPLUNK_VERSION;
  return {
    osUser: DEFAULT_OS_USER,
    adminPassword: 'CHANGE_ME_ADMIN',
    clusterSecret: 'idxcluster',
    clusterForwarderSecret: 'idxforwarders',
    splunkVersion: version,
    splunkTgz: `splunk-${version}-linux-amd64.tgz`,
    licensePath: '/opt/license/splunk.license',
    hosts: defaultHostEntries(),
  };
}

export function hostByRole(config: HostConfig, role: string): HostEntry | undefined {
  return config.hosts.find((h) => h.role === role);
}

function aliasHost(map: Record<string, string>, keys: string[], host: HostEntry): void {
  for (const key of keys) {
    map[key] = host.hostname;
    map[key.replace('_HOST', '_IP')] = host.ip;
  }
}

export function buildSubstitutionMap(
  config: HostConfig,
  profileId?: DeploymentProfileId,
): Record<string, string> {
  const map: Record<string, string> = {
    OS_USER: config.osUser,
    ADMIN_PASSWORD: config.adminPassword,
    CLUSTER_SECRET: config.clusterSecret,
    CLUSTER_FWD_SECRET: config.clusterForwarderSecret,
    SPLUNK_VERSION: config.splunkVersion,
    SPLUNK_TGZ: config.splunkTgz,
    LICENSE_PATH: config.licensePath,
    SPLUNK_HOME: '/opt/splunk',
    UF_HOME: '/opt/splunkforwarder',
  };
  for (const h of config.hosts) {
    map[`${h.role.toUpperCase()}_IP`] = h.ip;
    map[`${h.role.toUpperCase()}_HOST`] = h.hostname;
    if (h.role.startsWith('idx')) {
      map[`IDX${h.role.slice(3)}_IP`] = h.ip;
      map[`IDX${h.role.slice(3)}_HOST`] = h.hostname;
    }
    if (h.role.startsWith('sh')) {
      const n = h.role.slice(2);
      map[`SH${n}_IP`] = h.ip;
      map[`SH${n}_HOST`] = h.hostname;
    }
  }
  const combined = hostByRole(config, 'combined');
  const mgmt = hostByRole(config, 'mgmt') ?? combined;
  const cm = hostByRole(config, 'cm');
  const ds = hostByRole(config, 'ds');
  const deployer = hostByRole(config, 'deployer');
  if (combined) {
    map.COMBINED_IP = combined.ip;
    map.COMBINED_HOST = combined.hostname;
  }
  if (mgmt) {
    map.MGMT_IP = mgmt.ip;
    map.MGMT_HOST = mgmt.hostname;
    map.LM_IP = mgmt.ip;
  }
  if (cm) {
    map.CM_IP = cm.ip;
    map.CM_HOST = cm.hostname;
  }
  if (ds) {
    map.DS_IP = ds.ip;
    map.DS_HOST = ds.hostname;
  }
  if (deployer) {
    map.DEPLOYER_IP = deployer.ip;
    map.DEPLOYER_HOST = deployer.hostname;
  }
  const idx1 = hostByRole(config, 'idx1');
  const idx2 = hostByRole(config, 'idx2');
  const idx3 = hostByRole(config, 'idx3');
  const sh1 = hostByRole(config, 'sh1');
  if (idx1) map.IDX1_IP = idx1.ip;
  if (idx2) map.IDX2_IP = idx2.ip;
  if (idx3) map.IDX3_IP = idx3.ip;
  if (sh1) map.SH1_IP = sh1.ip;

  const profile = profileId ? getProfile(profileId) : undefined;
  if (profile && mgmt) {
    const roles = new Set(profile.hostRoles);
    const idxRoles = profile.hostRoles.filter((r) => r.startsWith('idx'));
    const idxIps = idxRoles
      .map((r) => hostByRole(config, r))
      .filter(Boolean)
      .map((h) => `${h!.ip}:9997`);
    if (profileId === 'single' && mgmt) {
      map.IDX_RECEIVING_LIST = `${mgmt.ip}:9997`;
    } else if (idxIps.length) {
      map.IDX_RECEIVING_LIST = idxIps.join(',');
    }

    if (profileId === 'single') {
      aliasHost(map, ['SH1_HOST', 'IDX1_HOST', 'DS_HOST'], mgmt);
    }
    if (profileId === 'distributed_nc' && !roles.has('ds')) {
      aliasHost(map, ['DS_HOST'], mgmt);
    }
  }

  if (!map.IDX_RECEIVING_LIST) {
    const idxIps = [idx1, idx2, idx3].filter(Boolean).map((h) => `${h!.ip}:9997`);
    map.IDX_RECEIVING_LIST = idxIps.join(',') || `${map.IDX1_IP ?? '10.0.0.11'}:9997`;
  }
  return map;
}
