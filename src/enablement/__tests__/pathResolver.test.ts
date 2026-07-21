import { describe, expect, it } from 'vitest';
import credentials from '../data/credentials.json';
import {
  buildCredentialMap,
  computeTeamTotals,
  defaultOrSelections,
  resolveOrPaths,
  resolvePath,
  resolvePathIds,
} from '../pathResolver';
import type { Credential } from '../types';

const creds = credentials as Credential[];
const map = buildCredentialMap(creds);

describe('pathResolver', () => {
  it('resolves simple prerequisite chain', () => {
    const ids = resolvePathIds('acc-sales-rep-ii', map);
    expect(ids).toContain('acc-sales-rep-i');
    expect(ids).toContain('acc-sales-rep-ii');
  });

  it('resolves Platform SE I prerequisites', () => {
    const ids = resolvePathIds('acc-platform-se-i', map);
    expect(ids).toContain('acc-tech-selling-foundations');
    expect(ids).toContain('acc-platform-se-i');
  });

  it('resolves Sales Engineer II with AND prerequisites', () => {
    const path = resolvePath('acc-sales-engineer-ii', creds);
    const names = path.nodes.map((n) => n.credential.id);
    expect(names).toContain('acc-tech-selling-foundations');
    expect(names).toContain('acc-platform-se-i');
    expect(names.some((id) => id === 'cert-enterprise-admin' || id === 'cert-cloud-admin')).toBe(true);
  });

  it('resolves SOAR Consultant I OR prerequisites with branch selection', () => {
    const selections = resolveOrPaths('acc-soar-consultant-i', creds, 'cheapest');
    const ids = resolvePathIds('acc-soar-consultant-i', map, selections);
    const hasConsultant = ids.includes('cert-core-consultant');
    const hasPowerPath =
      ids.includes('cert-core-power-user') &&
      ids.includes('cert-core-advanced-power-user') &&
      ids.includes('cert-enterprise-admin');
    expect(hasConsultant || hasPowerPath).toBe(true);
  });

  it('dedupes shared prerequisites in team totals', () => {
    const totals = computeTeamTotals(
      ['acc-platform-se-i', 'acc-security-se-i'],
      creds,
      defaultOrSelections(map.get('acc-platform-se-i')!, map, 'cheapest'),
    );
    expect(totals.nodeCount).toBeGreaterThan(2);
    expect(totals.timeHours.min).toBeGreaterThan(0);
  });

  it('computes remaining totals when some credentials completed', () => {
    const path = resolvePath('acc-sales-rep-ii', creds, { completedIds: ['acc-sales-rep-i'] });
    expect(path.remainingTotals).toBeDefined();
    expect(path.remainingTotals!.nodeCount).toBeLessThan(path.totals.nodeCount);
  });

  it('detects unknown credential references', () => {
    expect(() => resolvePath('nonexistent-id', creds)).toThrow(/Unknown credential/);
  });
});
