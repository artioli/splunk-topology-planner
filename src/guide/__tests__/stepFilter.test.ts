import { describe, expect, it } from 'vitest';
import { DEPLOYMENT_PROFILES } from '../profiles';
import { ALL_GUIDE_STEPS, filterNavigableSteps, filterStepsForProfile } from '../steps';

describe('stepFilter', () => {
  it('navigable steps exclude linux-tips (merged into Step 0)', () => {
    const all = filterStepsForProfile('single', false);
    const nav = filterNavigableSteps('single', false);
    expect(all.some((s) => s.id === 'linux-tips')).toBe(true);
    expect(nav.some((s) => s.id === 'linux-tips')).toBe(false);
  });

  it('single profile excludes cluster steps', () => {
    const steps = filterNavigableSteps('single', false);
    const ids = steps.map((s) => s.id);
    expect(ids).not.toContain('linux-tips');
    expect(ids).toContain('single-roles');
    expect(ids).not.toContain('ic-manager');
    expect(ids).not.toContain('shc-members');
  });

  it('distributed_ic includes cluster but not SHC deployer', () => {
    const steps = filterNavigableSteps('distributed_ic', false);
    const ids = steps.map((s) => s.id);
    expect(ids).toContain('ic-manager');
    expect(ids).toContain('ic-peers');
    expect(ids).not.toContain('shc-deployer');
  });

  it('distributed_ic_shc includes SHC steps', () => {
    const steps = filterNavigableSteps('distributed_ic_shc', false);
    const ids = steps.map((s) => s.id);
    expect(ids).toContain('shc-deployer');
    expect(ids).toContain('shc-members');
    expect(ids).toContain('shc-dedicated-ds');
  });

  it('forwarder appendix only when enabled', () => {
    const off = filterNavigableSteps('distributed_ic', false);
    const on = filterNavigableSteps('distributed_ic', true);
    expect(off.some((s) => s.id === 'uf-install')).toBe(false);
    expect(on.some((s) => s.id === 'uf-install')).toBe(true);
  });

  it('all steps have unique ids', () => {
    const ids = ALL_GUIDE_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('profiles', () => {
  it('ic_shc has 10 splunk hosts', () => {
    const p = DEPLOYMENT_PROFILES.find((x) => x.id === 'distributed_ic_shc');
    expect(p?.splunkHostCount).toBe(10);
    expect(p?.hostRoles).toHaveLength(10);
  });
});
