import type { DeploymentProfileId, GuideState } from './types';
import { defaultHostConfig } from './hostDefaults';

const STORAGE_KEY = 'splunk-deployment-guide-state';

export function loadGuideState(): GuideState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        profileId: 'distributed_ic',
        includeForwarders: false,
        hostConfig: defaultHostConfig(),
        completedSteps: [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<GuideState>;
    return {
      profileId: parsed.profileId ?? 'distributed_ic',
      includeForwarders: parsed.includeForwarders ?? false,
      hostConfig: { ...defaultHostConfig(), ...parsed.hostConfig },
      completedSteps: parsed.completedSteps ?? [],
    };
  } catch {
    return {
      profileId: 'distributed_ic',
      includeForwarders: false,
      hostConfig: defaultHostConfig(),
      completedSteps: [],
    };
  }
}

export function saveGuideState(state: GuideState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function toggleStepComplete(state: GuideState, stepId: string, done: boolean): GuideState {
  const set = new Set(state.completedSteps);
  if (done) set.add(stepId);
  else set.delete(stepId);
  return { ...state, completedSteps: [...set] };
}

export function isStepComplete(state: GuideState, stepId: string): boolean {
  return state.completedSteps.includes(stepId);
}

export function clearProgress(profileId: DeploymentProfileId): void {
  const state = loadGuideState();
  saveGuideState({
    ...state,
    profileId,
    completedSteps: state.completedSteps.filter((id) => !id.startsWith(`${profileId}:`)),
  });
}
