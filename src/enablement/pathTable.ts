import type { PathNode } from './types';

/** Prerequisite-first order for path steps table and exports. */
export function sortPathNodesForTable(nodes: PathNode[]): PathNode[] {
  return [...nodes].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return a.credential.name.localeCompare(b.credential.name);
  });
}
