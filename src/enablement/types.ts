export type CredentialKind = 'certification' | 'accreditation' | 'technical_badge' | 'assessment';

export type CredentialTrack = 'general' | 'observability' | 'security' | 'core';

export type Persona = 'sales' | 'se' | 'consultant' | 'admin' | 'developer';

export type OrStrategy = 'cheapest' | 'fastest';

export interface RangeValue {
  min: number;
  max: number;
  note?: string;
}

export interface Course {
  id: string;
  name: string;
  durationLabel: string;
  durationHours?: number;
  iltCostUsd?: number;
  iltUnits?: number;
  elearningCostUsd?: number;
  elearningUnits?: number;
  freeVideoOnly?: boolean;
  splunkUrl?: string;
}

export type PrerequisiteExpr =
  | { type: 'credential'; id: string }
  | { type: 'all'; items: PrerequisiteExpr[] }
  | { type: 'any'; items: PrerequisiteExpr[] };

export interface Credential {
  id: string;
  name: string;
  kind: CredentialKind;
  track: CredentialTrack;
  personas: Persona[];
  partnerOnly: boolean;
  legacy?: boolean;
  objective?: string;
  timeHours: RangeValue;
  costUsd: RangeValue;
  credlyBadgeImageUrl?: string;
  credlyPageUrl?: string;
  mindtickleUrl?: string;
  splunkUrl?: string;
  mandatoryCourseIds?: string[];
  recommendedCourseIds?: string[];
  /** @deprecated Use mandatoryCourseIds / recommendedCourseIds */
  relatedCourseIds?: string[];
  prerequisites: PrerequisiteExpr;
}

export interface CredlyBadgeEntry {
  credentialId: string;
  imageUrl: string;
  pageUrl: string;
  localImage?: string;
}

export interface EnablementManifest {
  lastUpdated: string;
  version: string;
  sources: string[];
}

export interface PathNode {
  credential: Credential;
  level: number;
  completed?: boolean;
}

export interface OrBranch {
  id: string;
  label: string;
  credentialIds: string[];
  timeHours: RangeValue;
  costUsd: RangeValue;
}

export interface ResolvedPath {
  targetId: string;
  target: Credential;
  nodes: PathNode[];
  orBranches: OrBranch[];
  totals: PathTotals;
  remainingTotals?: PathTotals;
}

export interface PathTotals {
  timeHours: RangeValue;
  costUsd: RangeValue;
  iltUnits: number;
  nodeCount: number;
}

export type CatalogTab = 'accreditations' | 'certifications' | 'badges' | 'courses';

export interface EnablementFilters {
  search: string;
  tab: CatalogTab;
  track: CredentialTrack | 'all';
  persona: Persona | 'all';
  partnerOnly: boolean;
  hideCompleted: boolean;
}

export interface EnablementState {
  selectedId: string | null;
  filters: EnablementFilters;
  completedIds: string[];
  teamPlanIds: string[];
  orBranchSelections: Record<string, string>;
  viewMode: 'path' | 'matrix';
  showMandatoryCourses: boolean;
  showRecommendedCourses: boolean;
}

export const DEFAULT_FILTERS: EnablementFilters = {
  search: '',
  tab: 'accreditations',
  track: 'all',
  persona: 'all',
  partnerOnly: false,
  hideCompleted: false,
};

export const EMPTY_PREREQ: PrerequisiteExpr = { type: 'all', items: [] };
