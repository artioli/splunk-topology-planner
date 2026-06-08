import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../constants';
import { withHardwareDefaults } from '../hardwareDefaults';
import { normalizePlannerInputs } from '../inputNormalize';

describe('inputNormalize hardware', () => {
  it('clamps custom indexer and role override values', () => {
    const inputs = withHardwareDefaults({
      ...DEFAULT_INPUTS,
      manualHardwareSpec: true,
      indexerHardwareTier: 'custom',
      indexerCustomSpec: {
        physicalCores: 0,
        vcpu: 0,
        ramGb: 1,
        osDiskGb: 10,
        splunkDiskGb: 20,
      },
      roleHardwareOverrides: {
        'search-head': {
          enabled: true,
          values: {
            physicalCores: 0,
            vcpu: 0,
            ramGb: 2,
            osDiskGb: 25,
            splunkDiskGb: 30,
          },
        },
      },
    });

    const normalized = normalizePlannerInputs(inputs);
    expect(normalized.indexerCustomSpec).toEqual({
      physicalCores: 1,
      vcpu: 1,
      ramGb: 4,
      osDiskGb: 50,
      splunkDiskGb: 50,
    });
    expect(normalized.roleHardwareOverrides['search-head']).toEqual({
      enabled: true,
      values: {
        physicalCores: 1,
        vcpu: 1,
        ramGb: 4,
        osDiskGb: 50,
        splunkDiskGb: 50,
      },
    });
  });

  it('falls back to min tier for invalid indexer tier values', () => {
    const normalized = normalizePlannerInputs({
      ...withHardwareDefaults(DEFAULT_INPUTS),
      indexerHardwareTier: 'invalid' as never,
    });
    expect(normalized.indexerHardwareTier).toBe('min');
  });
});
