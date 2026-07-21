import { formatCost, formatHours } from './format';
import type { Credential, ResolvedPath } from './types';

export function pathToMarkdown(path: ResolvedPath): string {
  const lines = [
    `# Enablement path: ${path.target.name}`,
    '',
    `**Total time:** ${formatHours(path.totals.timeHours)}`,
    `**Total cost:** ${formatCost(path.totals.costUsd)}`,
    `**Steps:** ${path.totals.nodeCount}`,
    '',
    '## Path',
    '',
  ];
  const sorted = [...path.nodes].sort((a, b) => b.level - a.level);
  for (const node of sorted) {
    const c = node.credential;
    const done = node.completed ? ' [x]' : ' [ ]';
    lines.push(`- ${done} **${c.name}** (${c.kind}) — ${formatHours(c.timeHours)}, ${formatCost(c.costUsd)}`);
    if (c.mindtickleUrl) lines.push(`  - Mindtickle: ${c.mindtickleUrl}`);
    if (c.splunkUrl) lines.push(`  - Splunk: ${c.splunkUrl}`);
    if (c.credlyPageUrl) lines.push(`  - Credly: ${c.credlyPageUrl}`);
  }
  return lines.join('\n');
}

export function pathToCsv(path: ResolvedPath): string {
  const header = 'name,kind,track,time_min_h,time_max_h,cost_min_usd,cost_max_usd,mindtickle_url,splunk_url,credly_url,completed';
  const rows = path.nodes.map((node) => {
    const c = node.credential;
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      esc(c.name),
      c.kind,
      c.track,
      c.timeHours.min,
      c.timeHours.max,
      c.costUsd.min,
      c.costUsd.max,
      esc(c.mindtickleUrl ?? ''),
      esc(c.splunkUrl ?? ''),
      esc(c.credlyPageUrl ?? ''),
      node.completed ? 'yes' : 'no',
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

export function credentialsToCsv(credentials: Credential[]): string {
  const header = 'id,name,kind,track,partner_only,time_min_h,time_max_h,cost_min_usd,cost_max_usd';
  const rows = credentials.map((c) =>
    [c.id, c.name, c.kind, c.track, c.partnerOnly, c.timeHours.min, c.timeHours.max, c.costUsd.min, c.costUsd.max].join(','),
  );
  return [header, ...rows].join('\n');
}

async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function copyMarkdown(path: ResolvedPath): Promise<void> {
  return copyText(pathToMarkdown(path));
}

export function copyCsv(path: ResolvedPath): Promise<void> {
  return copyText(pathToCsv(path));
}

export function copyMatrixCsv(credentials: Credential[]): Promise<void> {
  return copyText(credentialsToCsv(credentials));
}
