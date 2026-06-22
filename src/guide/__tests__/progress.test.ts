import { describe, expect, it } from 'vitest';
import { defaultHostConfig } from '../hostDefaults';
import { resetGuideProgress } from '../progress';
import { SETUP_STEP_ID, type GuideState } from '../types';

function sampleState(): GuideState {
  return {
    profileId: 'single',
    includeForwarders: true,
    hostConfig: defaultHostConfig(),
    completedSteps: ['os-prep', 'install-splunk'],
    showCompletedSteps: true,
    linuxDistro: 'ubuntu',
    validatedChecks: { 'os-prep': ['limits'] },
    skipValidationSteps: ['tls-web'],
    currentStepId: 'license-manager',
  };
}

describe('resetGuideProgress', () => {
  it('clears progress but keeps profile and host configuration', () => {
    const before = sampleState();
    const after = resetGuideProgress(before);

    expect(after.profileId).toBe('single');
    expect(after.hostConfig).toEqual(before.hostConfig);
    expect(after.includeForwarders).toBe(true);
    expect(after.linuxDistro).toBe('ubuntu');
    expect(after.showCompletedSteps).toBe(true);

    expect(after.completedSteps).toEqual([]);
    expect(after.validatedChecks).toEqual({});
    expect(after.skipValidationSteps).toEqual([]);
    expect(after.currentStepId).toBe(SETUP_STEP_ID);
  });
});
