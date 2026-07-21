import { DEFAULT_FILTERS, type EnablementFilters, type EnablementState } from './types';

const STORAGE_KEY = 'splunk-enablement-state';

const DEFAULT_STATE: EnablementState = {
  selectedId: null,
  filters: { ...DEFAULT_FILTERS },
  completedIds: [],
  teamPlanIds: [],
  orBranchSelections: {},
  viewMode: 'path',
  showMandatoryCourses: false,
  showRecommendedCourses: false,
};

export function loadEnablementState(): EnablementState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, filters: { ...DEFAULT_FILTERS } };
    const parsed = JSON.parse(raw) as Partial<EnablementState>;
    return {
      selectedId: parsed.selectedId ?? null,
      filters: { ...DEFAULT_FILTERS, ...parsed.filters },
      completedIds: parsed.completedIds ?? [],
      teamPlanIds: parsed.teamPlanIds ?? [],
      orBranchSelections: parsed.orBranchSelections ?? {},
      viewMode: parsed.viewMode ?? 'path',
      showMandatoryCourses: parsed.showMandatoryCourses ?? false,
      showRecommendedCourses: parsed.showRecommendedCourses ?? false,
    };
  } catch {
    return { ...DEFAULT_STATE, filters: { ...DEFAULT_FILTERS } };
  }
}

export function saveEnablementState(state: EnablementState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function toggleCompleted(state: EnablementState, id: string, done: boolean): EnablementState {
  const set = new Set(state.completedIds);
  if (done) set.add(id);
  else set.delete(id);
  return { ...state, completedIds: [...set] };
}

export function toggleTeamPlan(state: EnablementState, id: string, on: boolean): EnablementState {
  const set = new Set(state.teamPlanIds);
  if (on) set.add(id);
  else set.delete(id);
  return { ...state, teamPlanIds: [...set] };
}

export function setFilters(state: EnablementState, patch: Partial<EnablementFilters>): EnablementState {
  return { ...state, filters: { ...state.filters, ...patch } };
}

export function setOrBranch(state: EnablementState, branchId: string, value: string): EnablementState {
  return {
    ...state,
    orBranchSelections: { ...state.orBranchSelections, [branchId]: value },
  };
}

export function setPathCourseToggles(
  state: EnablementState,
  patch: Partial<Pick<EnablementState, 'showMandatoryCourses' | 'showRecommendedCourses'>>,
): EnablementState {
  return { ...state, ...patch };
}
