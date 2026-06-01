import { describe, expect, it, beforeEach, vi } from 'vitest';
import { DEFAULT_INPUTS } from '../constants';
import { profileFromResult, savePlannerHandoff, loadPlannerHandoff, HANDOFF_KEY } from '../plannerHandoff';
import { runPlanner } from '../planner';

describe('plannerHandoff', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
  });

  it('maps C3 topology to distributed_ic_shc profile', () => {
    const result = runPlanner({
      ...DEFAULT_INPUTS,
      dailyIngestGb: 1000,
      searchHeadCluster: true,
    });
    expect(profileFromResult(result)).toBe('distributed_ic_shc');
  });

  it('persists handoff to localStorage', () => {
    const result = runPlanner({ ...DEFAULT_INPUTS, singleServerDeployment: true });
    savePlannerHandoff(result);
    const loaded = loadPlannerHandoff();
    expect(loaded?.svaCode).toBe(result.topology.svaCode);
    expect(loaded?.profileId).toBe('single');
    localStorage.removeItem(HANDOFF_KEY);
  });
});
