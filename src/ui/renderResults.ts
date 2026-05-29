import { DOC_LINKS } from '../lib/constants';
import { formatTb } from '../lib/format';
import { formatPeriodLabel } from '../lib/retentionUtils';
import type { PlannerResult } from '../lib/types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function badges(sources: string[]): string {
  return sources
    .map((s) => `<span class="source-badge">${escapeHtml(s)}</span>`)
    .join('');
}

function section(title: string, body: string, open = true, fullWidth = false): string {
  const cls = fullWidth ? 'result-section result-section--full' : 'result-section';
  return `
    <details class="${cls}" ${open ? 'open' : ''}>
      <summary>${escapeHtml(title)}</summary>
      <div class="result-section-body">${body}</div>
    </details>`;
}

export function renderResults(result: PlannerResult): string {
  const { topology, storage, networkPorts, firewallChecklist, prerequisites, inputs } = result;

  const warnings = topology.warnings
    .map((w) => `<div class="alert alert-warn">${escapeHtml(w)}</div>`)
    .join('');

  const advisories = topology.advisories
    .map((a) => `<div class="alert alert-info">${escapeHtml(a)}</div>`)
    .join('');

  const inventoryRows = topology.inventory
    .map(
      (row) => `
    <tr>
      <td>${escapeHtml(row.roleLabel)}</td>
      <td>${row.count}</td>
      <td>${row.hardware.physicalCores}c / ${row.hardware.vcpu} vCPU / ${row.hardware.ramGb} GB RAM</td>
      <td>${row.osDiskGb} GB OS · ${row.splunkDiskGb}+ GB Splunk</td>
      <td><div class="source-badges">${badges(row.hardware.sources)}</div></td>
    </tr>`,
    )
    .join('');

  const portRows = networkPorts
    .map(
      (p) => `
    <tr>
      <td>${escapeHtml(p.tier)}</td>
      <td>${escapeHtml(p.component)}</td>
      <td>${escapeHtml(p.protocol)}/${escapeHtml(p.ports)}</td>
      <td>${escapeHtml(p.purpose)}</td>
      <td>${escapeHtml(p.firewallAction)}</td>
    </tr>`,
    )
    .join('');

  const prereqList = prerequisites.map((p) => `<li>${escapeHtml(p)}</li>`).join('');
  const fwList = firewallChecklist.map((f) => `<li>${escapeHtml(f)}</li>`).join('');

  const premium =
    [inputs.enterpriseSecurity ? 'ES' : null, inputs.itsi ? 'ITSI' : null].filter(Boolean).join(' + ') ||
    'None';

  const perf = result.performanceRecommendation;
  const perfBlock = perf
    ? `
      <div class="result-card">
        <h3>Concurrent users (10.4 performance table)</h3>
        <p>${escapeHtml(perf.summary)}</p>
        <ul class="compact">
          <li>User band: ${escapeHtml(perf.userBandLabel)}</li>
          <li>Ingest band: ${escapeHtml(perf.ingestBandLabel)}</li>
          <li>Guideline: ${perf.recommendedIndexers} indexer(s), ${perf.recommendedSearchHeads} search head(s)${perf.useCombinedInstance ? ' (combined instance)' : ''}</li>
        </ul>
        <p class="field-hint"><a href="${DOC_LINKS.performance104}" target="_blank" rel="noopener">Summary of performance recommendations</a></p>
      </div>`
    : '';

  const mgmtHosts = topology.managementPlan.hosts
    .map(
      (h) =>
        `<li><strong>${escapeHtml(h.hostLabel)}</strong>: ${escapeHtml(h.roles.join(', '))}${h.notes.length ? ` — ${escapeHtml(h.notes.join('; '))}` : ''}</li>`,
    )
    .join('');

  const mgmtSuggestions = topology.managementPlan.suggestions
    .map((s) => `<li>${s}</li>`)
    .join('');

  const cluster = topology.clusterEstimation;
  const ingestNote = inputs.useEpsInput
    ? `Resolved from EPS: <strong>${result.resolvedIngestGb} GB/day</strong>`
    : `Daily ingest: <strong>${inputs.dailyIngestGb} GB/day</strong>`;

  const topologyBody = `
    <div class="result-card">
      <h3>Recommended topology</h3>
      <div class="sva-code">${escapeHtml(topology.svaCode)}</div>
      <p>${escapeHtml(topology.svaName)}</p>
      <p>${ingestNote} · <strong>Indexing tier:</strong> ${escapeHtml(topology.prefixLabel)} · <strong>Indexers:</strong> ${topology.indexerCount} · <strong>SH:</strong> ${topology.operationalSearchHeadCount}${topology.hasShc ? ' (SHC)' : ''}</p>
      <p><strong>Premium apps:</strong> ${premium}</p>
      <p class="field-hint">Cluster: ${cluster.autoEnabled ? 'Auto' : 'Manual'} — ${cluster.appliedIndexerCount} indexers @ ${cluster.maxVolumePerIndexGb} GB/day max per index</p>
      ${warnings}
      ${advisories}
    </div>
    ${perfBlock}`;

  const managementBody = `
    <div class="result-card">
      <ul class="compact">${mgmtHosts || '<li>Included in combined instance</li>'}</ul>
      <ul class="compact">${mgmtSuggestions}</ul>
      <p class="field-hint"><a href="${DOC_LINKS.management104}" target="_blank" rel="noopener">Management components (10.4)</a></p>
    </div>`;

  const hardwareBody = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>Role</th><th>Qty</th><th>Compute</th><th>Disk (guide)</th><th>Spec source</th></tr>
        </thead>
        <tbody>${inventoryRows}</tbody>
      </table>
    </div>`;

  const storageBody = `
    <p>Daily multiplier: ${storage.dailyMultiplier.toFixed(2)}× ingest</p>
    <ul class="compact">
      <li>Hot/warm (${formatPeriodLabel(inputs.hotWarm)}, ${storage.hotWarmDays}d): ${formatTb(storage.hotWarmTb)}</li>
      <li>Cold (${formatPeriodLabel(inputs.cold)}, ${storage.coldDays}d): ${formatTb(storage.coldTb)}</li>
      <li>Searchable: ${formatTb(storage.searchableTb)}</li>
      <li>Frozen (${formatPeriodLabel(inputs.frozen)}, ${storage.frozenDays}d): ${formatTb(storage.frozenTb)}</li>
      <li><strong>Total: ${formatTb(storage.totalTb)}</strong> (${storage.totalRetentionDays} day lifecycle)</li>
    </ul>
    <p><strong>Per indexer peer:</strong> ${formatTb(storage.perIndexerTotalTb)} total</p>`;

  const networkBody = `
    <p class="field-hint">HEC (TCP/8088) is always included on the indexing tier.</p>
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>Tier</th><th>Component</th><th>Port</th><th>Purpose</th><th>Action</th></tr>
        </thead>
        <tbody>${portRows}</tbody>
      </table>
    </div>
    <h4 style="margin-top:1rem;font-size:0.9rem">Firewall checklist</h4>
    <ul class="compact">${fwList}</ul>`;

  const prereqBody = `
    <ul class="compact">${prereqList}</ul>
    <h4 style="margin-top:1rem;font-size:0.9rem">Documentation references</h4>
    <ul class="compact">
      <li><a href="${DOC_LINKS.hardware104}" target="_blank" rel="noopener">Splunk Enterprise 10.4 — Reference hardware</a></li>
      <li><a href="${DOC_LINKS.network104}" target="_blank" rel="noopener">Splunk Enterprise 10.4 — Network components</a></li>
      <li><a href="${DOC_LINKS.esMinimum}" target="_blank" rel="noopener">Enterprise Security 8.5 — Production minimums</a></li>
      <li><a href="${DOC_LINKS.itsiPlanning}" target="_blank" rel="noopener">ITSI 4.21 — Plan your deployment</a></li>
      <li><a href="${DOC_LINKS.sva}" target="_blank" rel="noopener">Splunk Validated Architectures</a></li>
    </ul>
    <p class="field-hint">Estimates only. Validate with Splunk Sales or PS for production commitments.</p>`;

  return `
    <section class="results-panel panel" id="results">
      <div class="panel-header">Sizing results</div>
      <div class="panel-body">
        <div aria-live="polite" aria-atomic="true">
          Updated: SVA ${topology.svaCode}, ${storage.totalTb} TB total, ${ingestNote}
        </div>

        <div class="results-dashboard">
          ${section('Topology', topologyBody, true, true)}
          ${section('Management', managementBody, false)}
          ${section('Hardware', hardwareBody, false)}
          ${section('Storage', storageBody, false)}
          ${section('Network', networkBody, false)}
          ${section('Prerequisites', prereqBody, false, true)}
        </div>

        <div class="actions actions--desktop-only">
          <button type="button" class="btn" id="copy-summary">Copy summary (Markdown)</button>
        </div>
      </div>
    </section>`;
}

export function buildMarkdownSummary(result: PlannerResult): string {
  const { topology, storage, inputs } = result;
  const lines = [
    `# Splunk Topology Plan — ${topology.svaCode}`,
    '',
    `**${topology.svaName}**`,
    '',
    `- Ingest: ${result.resolvedIngestGb} GB/day${inputs.useEpsInput ? ' (from EPS)' : ''}`,
    `- Indexers: ${topology.indexerCount} (${topology.clusterEstimation.autoEnabled ? 'auto' : 'manual'})`,
    `- ES: ${inputs.enterpriseSecurity ? 'Yes' : 'No'} | ITSI: ${inputs.itsi ? 'Yes' : 'No'}`,
    `- Users: ${inputs.concurrentUsers}`,
    '',
    '## Storage',
    `- Hot/warm: ${storage.hotWarmTb} TB (${storage.hotWarmDays}d)`,
    `- Cold: ${storage.coldTb} TB (${storage.coldDays}d)`,
    `- Frozen: ${storage.frozenTb} TB (${storage.frozenDays}d)`,
    `- **Total: ${storage.totalTb} TB**`,
    '',
    '## Servers',
    ...topology.inventory.map(
      (r) =>
        `- ${r.roleLabel} × ${r.count}: ${r.hardware.physicalCores}c, ${r.hardware.ramGb} GB RAM`,
    ),
    '',
    '## Management',
    ...topology.managementPlan.hosts.map((h) => `- ${h.hostLabel}: ${h.roles.join(', ')}`),
    '',
    '## Network ports',
    ...result.networkPorts.map((p) => `- ${p.tier}: ${p.protocol}/${p.ports} — ${p.purpose}`),
  ];
  return lines.join('\n');
}
