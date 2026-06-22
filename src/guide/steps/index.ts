import { t } from '../../i18n';
import { DEPLOYMENT_PROFILES } from '../profiles';
import { LINUX_TIPS_STEP_ID, type DeploymentProfileId, type GuideStep } from '../types';
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

/** Install steps shown in sidebar / prev-next (linux-tips merged into Step 0). */
export function filterNavigableSteps(
  profileId: DeploymentProfileId,
  includeForwarders: boolean,
): GuideStep[] {
  return filterStepsForProfile(profileId, includeForwarders).filter(
    (step) => step.id !== LINUX_TIPS_STEP_ID,
  );
}

export function getLinuxTipsStep(): GuideStep | undefined {
  return ALL_GUIDE_STEPS.find((step) => step.id === LINUX_TIPS_STEP_ID);
}

export function targetLabel(target: string): string {
  return t(`guide.targets.${target}`);
}

export function targetsForProfile(
  targets: GuideStep['targets'],
  profileId: DeploymentProfileId,
): GuideStep['targets'] {
  const profile = DEPLOYMENT_PROFILES.find((p) => p.id === profileId);
  if (!profile) return targets;
  const roles = new Set(profile.hostRoles);
  return targets.filter((tg) => {
    if (tg === 'all-splunk') return true;
    if (tg === 'idx-all') return profile.hostRoles.some((r) => r.startsWith('idx'));
    if (tg === 'sh-all') return profile.hostRoles.some((r) => r.startsWith('sh'));
    if (tg === 'uf-all') return profile.hostRoles.some((r) => r.startsWith('uf'));
    return roles.has(tg as (typeof profile.hostRoles)[number]);
  });
}
