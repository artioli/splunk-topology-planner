import { addRanges, sumRanges } from './format';
import type {
  Credential,
  OrBranch,
  OrStrategy,
  PathNode,
  PathTotals,
  PrerequisiteExpr,
  RangeValue,
  ResolvedPath,
} from './types';

export type CredentialMap = Map<string, Credential>;

export function buildCredentialMap(credentials: Credential[]): CredentialMap {
  return new Map(credentials.map((c) => [c.id, c]));
}

function emptyTotals(): PathTotals {
  return {
    timeHours: { min: 0, max: 0 },
    costUsd: { min: 0, max: 0 },
    iltUnits: 0,
    nodeCount: 0,
  };
}

function collectCredentialIds(
  expr: PrerequisiteExpr,
  map: CredentialMap,
  visiting: Set<string>,
  path: Set<string>,
): string[] {
  if (expr.type === 'credential') {
    if (path.has(expr.id)) {
      throw new Error(`Prerequisite cycle detected at credential: ${expr.id}`);
    }
    if (!map.has(expr.id)) {
      throw new Error(`Unknown credential in prerequisites: ${expr.id}`);
    }
    if (visiting.has(expr.id)) return [];
    visiting.add(expr.id);
    path.add(expr.id);
    const cred = map.get(expr.id)!;
    const nested = flattenPrereqIds(cred.prerequisites, map, visiting, path);
    path.delete(expr.id);
    return [...nested, expr.id];
  }
  if (expr.type === 'all') {
    const ids: string[] = [];
    for (const item of expr.items) {
      ids.push(...collectCredentialIds(item, map, visiting, path));
    }
    return ids;
  }
  return [];
}

function flattenPrereqIds(
  expr: PrerequisiteExpr,
  map: CredentialMap,
  visiting: Set<string> = new Set(),
  path: Set<string> = new Set(),
): string[] {
  if (expr.type === 'credential') {
    return collectCredentialIds(expr, map, visiting, path);
  }
  if (expr.type === 'all') {
    const ids: string[] = [];
    for (const item of expr.items) {
      ids.push(...flattenPrereqIds(item, map, visiting, path));
    }
    return ids;
  }
  if (expr.type === 'any') {
    return [];
  }
  return [];
}

function branchCredentialIds(expr: PrerequisiteExpr, map: CredentialMap): string[] {
  if (expr.type === 'credential') {
    const cred = map.get(expr.id);
    if (!cred) return [];
    return [...flattenPrereqIds(cred.prerequisites, map), expr.id];
  }
  if (expr.type === 'all') {
    const ids: string[] = [];
    for (const item of expr.items) {
      ids.push(...branchCredentialIds(item, map));
    }
    return ids;
  }
  return [];
}

function branchTotals(ids: string[], map: CredentialMap): { timeHours: RangeValue; costUsd: RangeValue } {
  const creds = uniqueIds(ids).map((id) => map.get(id)).filter(Boolean) as Credential[];
  return {
    timeHours: sumRanges(creds.map((c) => c.timeHours)),
    costUsd: sumRanges(creds.map((c) => c.costUsd)),
  };
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function findOrGroups(
  expr: PrerequisiteExpr,
  map: CredentialMap,
  prefix: string,
  out: OrBranch[],
): void {
  if (expr.type === 'any') {
    expr.items.forEach((item, i) => {
      const ids = branchCredentialIds(item, map);
      const totals = branchTotals(ids, map);
      out.push({
        id: `${prefix}-or-${i}`,
        label: describeOrItem(item, map),
        credentialIds: uniqueIds(ids),
        timeHours: totals.timeHours,
        costUsd: totals.costUsd,
      });
    });
    return;
  }
  if (expr.type === 'all') {
    expr.items.forEach((item, i) => findOrGroups(item, map, `${prefix}-${i}`, out));
  }
  if (expr.type === 'credential') {
    const cred = map.get(expr.id);
    if (cred) findOrGroups(cred.prerequisites, map, `${prefix}-${expr.id}`, out);
  }
}

function describeOrItem(expr: PrerequisiteExpr, map: CredentialMap): string {
  if (expr.type === 'credential') return map.get(expr.id)?.name ?? expr.id;
  if (expr.type === 'all') {
    return expr.items.map((i) => describeOrItem(i, map)).join(' + ');
  }
  return 'Path';
}

function resolveWithOrSelection(
  expr: PrerequisiteExpr,
  map: CredentialMap,
  orSelections: Record<string, string>,
  orPrefix: string,
): string[] {
  if (expr.type === 'credential') {
    const cred = map.get(expr.id);
    if (!cred) return [];
    return [...resolveWithOrSelection(cred.prerequisites, map, orSelections, `${orPrefix}-${expr.id}`), expr.id];
  }
  if (expr.type === 'all') {
    const ids: string[] = [];
    expr.items.forEach((item, i) => {
      ids.push(...resolveWithOrSelection(item, map, orSelections, `${orPrefix}-${i}`));
    });
    return ids;
  }
  if (expr.type === 'any') {
    const branchKey = orPrefix;
    const selectedIdx = orSelections[branchKey];
    let idx = 0;
    if (selectedIdx !== undefined) {
      const parsed = Number.parseInt(selectedIdx.replace(/\D/g, ''), 10);
      if (!Number.isNaN(parsed) && parsed < expr.items.length) idx = parsed;
    }
    return resolveWithOrSelection(expr.items[idx]!, map, orSelections, `${branchKey}-or-${idx}`);
  }
  return [];
}

export function pickOrBranchIndex(branch: OrBranch, strategy: OrStrategy, allBranches: OrBranch[]): number {
  const idx = allBranches.findIndex((b) => b.id === branch.id);
  if (idx < 0) return 0;
  if (strategy === 'cheapest') {
    let best = 0;
    let bestCost = allBranches[0]!.costUsd.min;
    allBranches.forEach((b, i) => {
      if (b.costUsd.min < bestCost) {
        bestCost = b.costUsd.min;
        best = i;
      }
    });
    return best;
  }
  let best = 0;
  let bestTime = allBranches[0]!.timeHours.min;
  allBranches.forEach((b, i) => {
    if (b.timeHours.min < bestTime) {
      bestTime = b.timeHours.min;
      best = i;
    }
  });
  return best;
}

export function defaultOrSelections(
  target: Credential,
  map: CredentialMap,
  strategy: OrStrategy = 'cheapest',
): Record<string, string> {
  const branches = findOrGroupsForTarget(target, map);
  const selections: Record<string, string> = {};
  const grouped = groupOrBranchesByPrefix(branches);
  for (const [prefix, group] of grouped) {
    const idx = pickOrBranchIndex(group[0]!, strategy, group);
    selections[prefix] = `or-${idx}`;
  }
  return selections;
}

function groupOrBranchesByPrefix(branches: OrBranch[]): Map<string, OrBranch[]> {
  const m = new Map<string, OrBranch[]>();
  for (const b of branches) {
    const prefix = b.id.replace(/-or-\d+$/, '');
    const list = m.get(prefix) ?? [];
    list.push(b);
    m.set(prefix, list);
  }
  return m;
}

function findOrGroupsForTarget(target: Credential, map: CredentialMap): OrBranch[] {
  const out: OrBranch[] = [];
  findOrGroups(target.prerequisites, map, 'root', out);
  return out;
}

export function resolvePathIds(
  targetId: string,
  map: CredentialMap,
  orSelections: Record<string, string> = {},
): string[] {
  const target = map.get(targetId);
  if (!target) throw new Error(`Unknown credential: ${targetId}`);
  const prereqIds = resolveWithOrSelection(target.prerequisites, map, orSelections, 'root');
  return uniqueIds([...prereqIds, targetId]);
}

export function resolvePath(
  targetId: string,
  credentials: Credential[],
  options: {
    orSelections?: Record<string, string>;
    completedIds?: string[];
  } = {},
): ResolvedPath {
  const map = buildCredentialMap(credentials);
  const target = map.get(targetId);
  if (!target) throw new Error(`Unknown credential: ${targetId}`);

  const orSelections = options.orSelections ?? defaultOrSelections(target, map, 'cheapest');
  const ids = resolvePathIds(targetId, map, orSelections);
  const creds = ids.map((id) => map.get(id)).filter(Boolean) as Credential[];

  const levelMap = new Map<string, number>();
  function assignLevel(id: string, level: number): void {
    const current = levelMap.get(id) ?? -1;
    if (level <= current) return;
    levelMap.set(id, level);
    const cred = map.get(id);
    if (!cred) return;
    const childIds = resolveWithOrSelection(cred.prerequisites, map, orSelections, `root-${id}`);
    for (const cid of childIds) assignLevel(cid, level + 1);
  }
  assignLevel(targetId, 0);

  const nodes: PathNode[] = creds.map((credential) => ({
    credential,
    level: levelMap.get(credential.id) ?? 0,
    completed: options.completedIds?.includes(credential.id),
  }));

  nodes.sort((a, b) => b.level - a.level);

  const orBranches = findOrGroupsForTarget(target, map);
  const totals = computeTotalsFromCredentials(creds);
  const remainingCreds = creds.filter((c) => !options.completedIds?.includes(c.id));
  const remainingTotals =
    remainingCreds.length < creds.length ? computeTotalsFromCredentials(remainingCreds) : undefined;

  return {
    targetId,
    target,
    nodes,
    orBranches,
    totals,
    remainingTotals,
  };
}

export function computeTotalsFromCredentials(creds: Credential[]): PathTotals {
  if (!creds.length) return emptyTotals();
  return {
    timeHours: sumRanges(creds.map((c) => c.timeHours)),
    costUsd: sumRanges(creds.map((c) => c.costUsd)),
    iltUnits: 0,
    nodeCount: creds.length,
  };
}

export function computeTeamTotals(
  targetIds: string[],
  credentials: Credential[],
  orSelections: Record<string, string>,
  completedIds: string[] = [],
): PathTotals {
  const map = buildCredentialMap(credentials);
  const allIds = new Set<string>();
  for (const tid of targetIds) {
    for (const id of resolvePathIds(tid, map, orSelections)) {
      allIds.add(id);
    }
  }
  const creds = [...allIds]
    .map((id) => map.get(id))
    .filter(Boolean)
    .filter((c) => !completedIds.includes(c!.id)) as Credential[];
  return computeTotalsFromCredentials(creds);
}

export function resolveOrPaths(
  targetId: string,
  credentials: Credential[],
  strategy: OrStrategy,
): Record<string, string> {
  const map = buildCredentialMap(credentials);
  const target = map.get(targetId);
  if (!target) return {};
  return defaultOrSelections(target, map, strategy);
}

export function mergeOrSelections(
  base: Record<string, string>,
  patch: Record<string, string>,
): Record<string, string> {
  return { ...base, ...patch };
}

export function addRangeValues(a: RangeValue, b: RangeValue): RangeValue {
  return addRanges(a, b);
}
