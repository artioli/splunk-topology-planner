import { t } from '../../i18n';
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
import { tlsHecSteps } from './tlsHec';

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
  ...tlsHecSteps,
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
  return t(`guide.targets.${target}`);
}
