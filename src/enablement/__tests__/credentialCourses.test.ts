import { describe, expect, it } from 'vitest';
import { mandatoryCourseIds, recommendedCourseIds } from '../credentialCourses';
import type { Credential } from '../types';

function cred(partial: Partial<Credential> & Pick<Credential, 'id'>): Credential {
  return {
    name: partial.id,
    kind: 'certification',
    track: 'core',
    personas: ['admin'],
    partnerOnly: false,
    timeHours: { min: 1, max: 2 },
    costUsd: { min: 130, max: 130 },
    prerequisites: { type: 'all', items: [] },
    ...partial,
  };
}

describe('credentialCourses', () => {
  it('uses explicit mandatory and recommended lists', () => {
    const c = cred({
      id: 'x',
      mandatoryCourseIds: ['a'],
      recommendedCourseIds: ['b'],
      relatedCourseIds: ['a', 'b', 'c'],
    });
    expect(mandatoryCourseIds(c)).toEqual(['a']);
    expect(recommendedCourseIds(c)).toEqual(['b']);
  });

  it('treats legacy related ids as mandatory when note says required', () => {
    const c = cred({
      id: 'arch',
      relatedCourseIds: ['lab', 'admin'],
      costUsd: { min: 130, max: 5000, note: 'Exam plus required architect ILT courses and lab' },
    });
    expect(mandatoryCourseIds(c)).toEqual(['lab', 'admin']);
    expect(recommendedCourseIds(c)).toEqual([]);
  });

  it('treats legacy related ids as recommended when note says recommended', () => {
    const c = cred({
      id: 'admin',
      relatedCourseIds: ['sys', 'data'],
      costUsd: { min: 130, max: 3880, note: 'Exam plus recommended admin ILT courses' },
    });
    expect(mandatoryCourseIds(c)).toEqual([]);
    expect(recommendedCourseIds(c)).toEqual(['sys', 'data']);
  });
});
