import type { Course, Credential } from './types';

function noteText(c: Credential): string {
  return `${c.costUsd.note ?? ''} ${c.timeHours.note ?? ''}`.toLowerCase();
}

/** Mandatory training courses for a credential (explicit data or legacy heuristic). */
export function mandatoryCourseIds(c: Credential): string[] {
  if (c.mandatoryCourseIds?.length) return c.mandatoryCourseIds;
  const legacy = c.relatedCourseIds ?? [];
  if (!legacy.length) return [];
  const note = noteText(c);
  if (note.includes('required')) return legacy;
  if (c.kind === 'accreditation' && legacy.length) return legacy;
  return [];
}

/** Recommended / optional prep courses for a credential. */
export function recommendedCourseIds(c: Credential): string[] {
  if (c.recommendedCourseIds?.length) return c.recommendedCourseIds;
  const legacy = c.relatedCourseIds ?? [];
  if (!legacy.length) return [];
  const mandatory = new Set(mandatoryCourseIds(c));
  return legacy.filter((id) => !mandatory.has(id));
}

export function courseTrainingUrl(course: Course): string {
  if (course.splunkUrl) return course.splunkUrl;
  return `https://www.splunk.com/en_us/training/courses/${encodeURIComponent(course.id)}.html`;
}

export function resolveCourses(ids: string[], catalog: Course[]): Course[] {
  const map = new Map(catalog.map((c) => [c.id, c]));
  return ids.map((id) => map.get(id)).filter((c): c is Course => c != null);
}
