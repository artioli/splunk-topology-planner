import { SETUP_STEP_ID, type DeploymentProfileId, type GuideState, type GuideStep, type LinuxDistro } from './types';
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

export function validationVisible(
  validation: GuideStep['validations'][number],
  profileId: DeploymentProfileId,
): boolean {
  if (!validation.profiles?.length) return true;
  return validation.profiles.includes(profileId);
}

export function requiredValidations(
  step: GuideStep,
  profileId?: DeploymentProfileId,
): GuideStep['validations'] {
  return step.validations.filter(
    (v) => !v.optional && (profileId === undefined || validationVisible(v, profileId)),
  );
}

export function validationsComplete(state: GuideState, step: GuideStep): boolean {
  if (state.skipValidationSteps.includes(step.id)) return true;
  const required = requiredValidations(step, state.profileId);
  if (!required.length) return true;
  const done = new Set(state.validatedChecks[step.id] ?? []);
  return required.every((v) => done.has(v.id));
}

export function resetGuideProgress(state: GuideState): GuideState {
  return {
    ...state,
    completedSteps: [],
    validatedChecks: {},
    skipValidationSteps: [],
    currentStepId: SETUP_STEP_ID,
  };
}

export function clearProgress(profileId: DeploymentProfileId): void {
  const state = loadGuideState();
  saveGuideState(resetGuideProgress({ ...state, profileId }));
}
