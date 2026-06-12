import type { DeploymentProfileId, GuideState, GuideStep, LinuxDistro } from './types';
import { defaultHostConfig } from './hostDefaults';

const STORAGE_KEY = 'splunk-deployment-guide-state';

const DEFAULT_STATE: GuideState = {
  profileId: 'distributed_ic',
  includeForwarders: false,
  hostConfig: defaultHostConfig(),
  completedSteps: [],
  showCompletedSteps: false,
  linuxDistro: 'rhel',
  validatedChecks: {},
  skipValidationSteps: [],
  currentStepId: null,
  setupCollapsed: false,
};

export function loadGuideState(): GuideState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, hostConfig: defaultHostConfig() };
    const parsed = JSON.parse(raw) as Partial<GuideState>;
    return {
      profileId: parsed.profileId ?? DEFAULT_STATE.profileId,
      includeForwarders: parsed.includeForwarders ?? false,
      hostConfig: { ...defaultHostConfig(), ...parsed.hostConfig },
      completedSteps: parsed.completedSteps ?? [],
      showCompletedSteps: parsed.showCompletedSteps ?? false,
      linuxDistro: parsed.linuxDistro ?? 'rhel',
      validatedChecks: parsed.validatedChecks ?? {},
      skipValidationSteps: parsed.skipValidationSteps ?? [],
      currentStepId: parsed.currentStepId ?? null,
      setupCollapsed: parsed.setupCollapsed ?? false,
    };
  } catch {
    return { ...DEFAULT_STATE, hostConfig: defaultHostConfig() };
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

export function setLinuxDistro(state: GuideState, distro: LinuxDistro): GuideState {
  return { ...state, linuxDistro: distro };
}

export function toggleValidationCheck(
  state: GuideState,
  stepId: string,
  validationId: string,
  checked: boolean,
): GuideState {
  const current = new Set(state.validatedChecks[stepId] ?? []);
  if (checked) current.add(validationId);
  else current.delete(validationId);
  return {
    ...state,
    validatedChecks: { ...state.validatedChecks, [stepId]: [...current] },
  };
}

export function setSkipValidation(state: GuideState, stepId: string, skip: boolean): GuideState {
  const set = new Set(state.skipValidationSteps);
  if (skip) set.add(stepId);
  else set.delete(stepId);
  return { ...state, skipValidationSteps: [...set] };
}

export function requiredValidations(step: GuideStep): GuideStep['validations'] {
  return step.validations.filter((v) => !v.optional);
}

export function validationsComplete(state: GuideState, step: GuideStep): boolean {
  if (state.skipValidationSteps.includes(step.id)) return true;
  const required = requiredValidations(step);
  if (!required.length) return true;
  const done = new Set(state.validatedChecks[step.id] ?? []);
  return required.every((v) => done.has(v.id));
}

export function clearProgress(profileId: DeploymentProfileId): void {
  const state = loadGuideState();
  saveGuideState({
    ...state,
    profileId,
    completedSteps: state.completedSteps.filter((id) => !id.startsWith(`${profileId}:`)),
  });
}
