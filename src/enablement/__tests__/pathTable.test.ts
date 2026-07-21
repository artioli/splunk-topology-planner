import { describe, expect, it } from 'vitest';
import { sortPathNodesForTable } from '../pathTable';
import type { PathNode } from '../types';

function node(id: string, name: string, level: number): PathNode {
  return {
    credential: {
      id,
      name,
      kind: 'certification',
      track: 'core',
      personas: ['admin'],
      partnerOnly: false,
      timeHours: { min: 1, max: 2 },
      costUsd: { min: 130, max: 130 },
      prerequisites: { type: 'all', items: [] },
    },
    level,
    completed: false,
  };
}

describe('sortPathNodesForTable', () => {
  it('orders by level descending then name', () => {
    const sorted = sortPathNodesForTable([
      node('a', 'Zebra', 0),
      node('b', 'Alpha', 1),
      node('c', 'Beta', 1),
    ]);
    expect(sorted.map((n) => n.credential.id)).toEqual(['b', 'c', 'a']);
  });
});
