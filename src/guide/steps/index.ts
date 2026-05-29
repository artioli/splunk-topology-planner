import type { DeploymentProfileId, GuideStep } from '../types';
import { distributedNcSteps, singleServerSteps } from './distributedNc';
import { forwarderAppendixSteps } from './forwarderAppendix';
import { indexerClusterSteps } from './indexerCluster';
import { indexSteps } from './indexes';
import { installSteps } from './install';
import { licenseSteps } from './license';
import { linuxTipsSteps } from './linuxTips';
import { managementSteps } from './management';
import { osPrepSteps } from './osPrep';
import { shcSteps } from './shc';
import { validationSteps } from './validation';

export const ALL_GUIDE_STEPS: GuideStep[] = [
  ...linuxTipsSteps,
  ...osPrepSteps,
  ...installSteps,
  ...licenseSteps,
  ...singleServerSteps,
  ...distributedNcSteps,
  ...indexerClusterSteps,
  ...shcSteps,
  ...managementSteps,
  ...indexSteps,
  ...validationSteps,
  ...forwarderAppendixSteps,
];

export function filterStepsForProfile(
  profileId: DeploymentProfileId,
  includeForwarders: boolean,
): GuideStep[] {
  return ALL_GUIDE_STEPS.filter((step) => {
    if (!step.profiles.includes(profileId)) return false;
    if (step.optional && !includeForwarders) return false;
    return true;
  });
}

export function targetLabel(target: string): string {
  const labels: Record<string, string> = {
    'all-splunk': 'All Splunk Enterprise hosts',
    mgmt: 'Management (LM+MC)',
    combined: 'Combined server',
    idx1: 'Indexer 1',
    idx2: 'Indexer 2',
    idx3: 'Indexer 3',
    'idx-all': 'All indexers (multi-exec)',
    sh1: 'Search head 1',
    'sh-all': 'All search heads (multi-exec)',
    cm: 'Cluster Manager',
    deployer: 'SHC Deployer',
    ds: 'Deployment Server',
    'uf-all': 'All forwarders',
    uf1: 'UF 1',
    uf2: 'UF 2',
  };
  return labels[target] ?? target;
}
