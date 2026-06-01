import { describe, expect, it } from 'vitest';
import { defaultHostConfig } from '../hostDefaults';
import {
  loadGuideState,
  requiredValidations,
  setSkipValidation,
  toggleValidationCheck,
  validationsComplete,
} from '../progress';
import { filterStepsForProfile } from '../steps';
import type { GuideState } from '../types';

function baseState(): GuideState {
  return {
    ...loadGuideState(),
    hostConfig: defaultHostConfig(),
    validatedChecks: {},
    skipValidationSteps: [],
    completedSteps: [],
  };
}

describe('stepValidation', () => {
  it('requires all non-optional validations before complete', () => {
    const steps = filterStepsForProfile('distributed_ic', false);
    const osPrep = steps.find((s) => s.id === 'os-prep');
    expect(osPrep).toBeDefined();
    const required = requiredValidations(osPrep!);
    expect(required.length).toBeGreaterThan(0);

    let state = baseState();
    expect(validationsComplete(state, osPrep!)).toBe(false);

    for (const v of required) {
      state = toggleValidationCheck(state, osPrep!.id, v.id, true);
    }
    expect(validationsComplete(state, osPrep!)).toBe(true);
  });

  it('allows skip in lab', () => {
    const steps = filterStepsForProfile('distributed_ic', false);
    const osPrep = steps.find((s) => s.id === 'os-prep')!;
    let state = baseState();
    state = setSkipValidation(state, osPrep.id, true);
    expect(validationsComplete(state, osPrep)).toBe(true);
  });

  it('profile filters steps so validations are profile-scoped', () => {
    const single = filterStepsForProfile('single', false);
    const ic = filterStepsForProfile('distributed_ic', false);
    expect(single.some((s) => s.id === 'ic-manager')).toBe(false);
    expect(ic.some((s) => s.id === 'ic-manager')).toBe(true);
  });
});
