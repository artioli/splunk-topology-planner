import { credentialSearchText, courseSearchText } from './format';
import type { CatalogTab, Course, Credential, EnablementFilters, Persona } from './types';

const TAB_KINDS: Record<CatalogTab, Credential['kind'][] | null> = {
  accreditations: ['accreditation'],
  certifications: ['certification'],
  badges: ['technical_badge', 'assessment'],
  courses: null,
};

const TRACK_ORDER = ['general', 'observability', 'security', 'core'] as const;

export function filterCredentials(credentials: Credential[], filters: EnablementFilters, completedIds: string[]): Credential[] {
  return credentials.filter((c) => matchesCredentialFilters(c, filters, completedIds));
}

export function filterCourses(courses: Course[], filters: EnablementFilters): Course[] {
  if (filters.tab !== 'courses') return [];
  const q = filters.search.trim().toLowerCase();
  return courses.filter((course) => {
    if (q && !courseSearchText(course).includes(q)) return false;
    return true;
  });
}

function matchesCredentialFilters(c: Credential, filters: EnablementFilters, completedIds: string[]): boolean {
  if (filters.tab === 'courses') return false;
  const kinds = TAB_KINDS[filters.tab];
  if (kinds && !kinds.includes(c.kind)) return false;
  if (filters.partnerOnly && !c.partnerOnly) return false;
  if (filters.track !== 'all' && c.track !== filters.track) return false;
  if (filters.persona !== 'all' && !c.personas.includes(filters.persona as Persona)) return false;
  if (filters.hideCompleted && completedIds.includes(c.id)) return false;
  const q = filters.search.trim().toLowerCase();
  if (q && !credentialSearchText(c).includes(q)) return false;
  return true;
}

export function groupByTrack(credentials: Credential[]): Map<string, Credential[]> {
  const map = new Map<string, Credential[]>();
  for (const track of TRACK_ORDER) {
    map.set(track, []);
  }
  for (const c of credentials) {
    const list = map.get(c.track) ?? [];
    list.push(c);
    map.set(c.track, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => {
      if (a.partnerOnly !== b.partnerOnly) return a.partnerOnly ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
  return map;
}

function matchesCredentialFiltersExceptTab(
  c: Credential,
  filters: EnablementFilters,
  completedIds: string[],
): boolean {
  if (filters.partnerOnly && !c.partnerOnly) return false;
  if (filters.track !== 'all' && c.track !== filters.track) return false;
  if (filters.persona !== 'all' && !c.personas.includes(filters.persona as Persona)) return false;
  if (filters.hideCompleted && completedIds.includes(c.id)) return false;
  const q = filters.search.trim().toLowerCase();
  if (q && !credentialSearchText(c).includes(q)) return false;
  return true;
}

export function filterCredentialsForMatrix(
  credentials: Credential[],
  filters: EnablementFilters,
  completedIds: string[],
): Credential[] {
  return credentials.filter((c) => matchesCredentialFiltersExceptTab(c, filters, completedIds));
}

export function prerequisiteCount(c: Credential): number {
  return countPrereqNodes(c.prerequisites);
}

function countPrereqNodes(expr: Credential['prerequisites']): number {
  if (expr.type === 'credential') return 1;
  if (expr.type === 'all' || expr.type === 'any') {
    return expr.items.reduce((sum, item) => sum + countPrereqNodes(item), 0);
  }
  return 0;
}
