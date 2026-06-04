import { resolveMessage, t } from '../i18n';
import { DOC_LINKS } from '../lib/constants';
import { escapeHtml, formatTb } from '../lib/format';
import { profileFromResult } from '../lib/plannerHandoff';
import type { PlannerResult, ServerRole } from '../lib/types';

function diskTypeFor(role: ServerRole): string {
  if (role.startsWith('search-head')) return t('planner.results.diskType.sh');
  if (role === 'indexer' || role === 'combined') return t('planner.results.diskType.idx');
  return t('planner.results.diskType.mgmt');
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

function storageLine(label: string, tb: number, days: number): string {
  return `<li>${escapeHtml(t('planner.results.storageLine', { label, tb: formatTb(tb), days }))}</li>`;
}

export function renderResults(result: PlannerResult): string {
  const { topology, storage, networkPorts, firewallChecklist, prerequisites, inputs } = result;

  const warnings = topology.warnings
    .map((w) => `<div class="alert alert-warn">${escapeHtml(resolveMessage(w))}</div>`)
    .join('');

  const advisories = topology.advisories
    .filter((a) => a.key !== 'advisory.mgmtNeverColocateCmDs')
    .map((a) => `<div class="alert alert-info">${escapeHtml(resolveMessage(a))}</div>`)
    .join('');

  const inventoryRows = topology.inventory
    .map(
      (row) => `
    <tr>
      <td>${escapeHtml(row.roleLabel)}</td>
      <td>${row.count}</td>
      <td>${escapeHtml(
        t('planner.results.hardwareCompute', {
          physicalCores: row.hardware.physicalCores,
          vcpu: row.hardware.vcpu,
          ramGb: row.hardware.ramGb,
        }),
      )}</td>
      <td>${escapeHtml(
        `${t('planner.results.hardwareDisk', {
          osDiskGb: row.osDiskGb,
          splunkDiskGb: row.splunkDiskGb,
        })} · ${diskTypeFor(row.role)}`,
      )}</td>
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
    t('planner.results.premiumNone');

  const mgmtHosts = topology.managementPlan.hosts
    .map(
      (h) =>
        `<li><strong>${escapeHtml(h.hostLabel)}</strong>: ${escapeHtml(h.roles.join(', '))}${h.notes.length ? ` — ${escapeHtml(h.notes.join('; '))}` : ''}</li>`,
    )
    .join('');

  const mgmtSuggestions = topology.managementPlan.suggestions
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('');

  const cluster = topology.clusterEstimation;
  const ingestNoteHtml = inputs.useEpsInput
    ? `<strong>${escapeHtml(t('planner.results.ingestFromEps', { value: result.resolvedIngestGb }))}</strong>`
    : `<strong>${escapeHtml(t('planner.results.ingestDaily', { value: inputs.dailyIngestGb }))}</strong>`;
  const ingestNotePlain = inputs.useEpsInput
    ? t('planner.results.ingestFromEps', { value: result.resolvedIngestGb })
    : t('planner.results.ingestDaily', { value: inputs.dailyIngestGb });

  const shcSuffix = topology.hasShc ? ` ${t('planner.results.shcSuffix')}` : '';

  const topologyBody = `
    <div class="result-card">
      <h3>${escapeHtml(t('planner.results.recommendedTopology'))}</h3>
      <div class="sva-code">${escapeHtml(topology.svaCode)}</div>
      <p>${escapeHtml(topology.svaName)}</p>
      <p>${ingestNoteHtml} · <strong>${escapeHtml(t('planner.results.indexingTier'))}:</strong> ${escapeHtml(topology.prefixLabel)} · <strong>${escapeHtml(t('planner.results.indexers'))}:</strong> ${topology.indexerCount} · <strong>${escapeHtml(t('planner.results.searchHeads'))}:</strong> ${topology.operationalSearchHeadCount}${escapeHtml(shcSuffix)}</p>
      <p><strong>${escapeHtml(t('planner.results.premiumApps'))}:</strong> ${escapeHtml(premium)}</p>
      <p class="field-hint">${escapeHtml(
        t('planner.results.clusterLine', {
          mode: cluster.autoEnabled ? t('planner.results.clusterAuto') : t('planner.results.clusterManual'),
          indexers: cluster.appliedIndexerCount,
          maxVolume: cluster.maxVolumePerIndexGb,
        }),
      )}</p>
      ${warnings}
      ${advisories}
    </div>`;

  const managementBody = `
    <div class="result-card">
      <ul class="compact">${mgmtHosts || `<li>${escapeHtml(t('planner.results.includedCombined'))}</li>`}</ul>
      <ul class="compact">${mgmtSuggestions}</ul>
    </div>`;

  const hardwareBody = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t('planner.results.tableRole'))}</th>
            <th>${escapeHtml(t('planner.results.tableQty'))}</th>
            <th>${escapeHtml(t('planner.results.tableCompute'))}</th>
            <th>${escapeHtml(t('planner.results.tableDisk'))}</th>
            <th>${escapeHtml(t('planner.results.tableSpecSource'))}</th>
          </tr>
        </thead>
        <tbody>${inventoryRows}</tbody>
      </table>
    </div>`;

  const storageBody = `
    <div class="storage-breakdown">
      <h4>${escapeHtml(t('planner.results.perIndexer'))}</h4>
      <ul class="compact">
        ${storageLine(t('planner.results.hotWarm'), storage.perIndexerHotWarmTb, storage.hotWarmDays)}
        ${storageLine(t('planner.results.cold'), storage.perIndexerColdTb, storage.coldDays)}
        ${storageLine(t('planner.results.frozenArchive'), storage.perIndexerFrozenTb, storage.frozenDays)}
        <li><strong>${escapeHtml(t('planner.results.total'))}: ${formatTb(storage.perIndexerTotalTb)}</strong></li>
      </ul>
      <h4>${escapeHtml(t('planner.results.clusterTotal'))}</h4>
      <ul class="compact">
        ${storageLine(t('planner.results.hotWarm'), storage.hotWarmTb, storage.hotWarmDays)}
        ${storageLine(t('planner.results.cold'), storage.coldTb, storage.coldDays)}
        ${storageLine(t('planner.results.frozenArchive'), storage.frozenTb, storage.frozenDays)}
        <li><strong>${escapeHtml(t('planner.results.total'))}: ${formatTb(storage.totalTb)}</strong> (${escapeHtml(t('planner.results.dayLifecycle', { days: storage.totalRetentionDays }))})</li>
      </ul>
    </div>`;

  const networkBody = `
    <p class="field-hint">${escapeHtml(t('planner.results.hecNote'))}</p>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t('planner.results.tableTier'))}</th>
            <th>${escapeHtml(t('planner.results.tableComponent'))}</th>
            <th>${escapeHtml(t('planner.results.tablePort'))}</th>
            <th>${escapeHtml(t('planner.results.tablePurpose'))}</th>
            <th>${escapeHtml(t('planner.results.tableAction'))}</th>
          </tr>
        </thead>
        <tbody>${portRows}</tbody>
      </table>
    </div>
    <h4 style="margin-top:1rem;font-size:0.9rem">${escapeHtml(t('planner.results.firewallChecklist'))}</h4>
    <ul class="compact">${fwList}</ul>`;

  const prereqBody = `<ul class="compact">${prereqList}</ul>`;

  const documentationBody = `
    <ul class="compact">
      <li><a href="${DOC_LINKS.sva}" target="_blank" rel="noopener">${escapeHtml(t('planner.docs.sva'))}</a></li>
      <li><a href="${DOC_LINKS.hardware104}" target="_blank" rel="noopener">${escapeHtml(t('planner.docs.hardware104'))}</a></li>
      <li><a href="${DOC_LINKS.performance104}" target="_blank" rel="noopener">${escapeHtml(t('planner.docs.performance104'))}</a></li>
      <li><a href="${DOC_LINKS.network104}" target="_blank" rel="noopener">${escapeHtml(t('planner.docs.network104'))}</a></li>
      <li><a href="${DOC_LINKS.management104}" target="_blank" rel="noopener">${escapeHtml(t('planner.docs.management104'))}</a></li>
      <li><a href="${DOC_LINKS.esMinimum}" target="_blank" rel="noopener">${escapeHtml(t('planner.docs.esMinimum'))}</a></li>
      <li><a href="${DOC_LINKS.itsiPlanning}" target="_blank" rel="noopener">${escapeHtml(t('planner.docs.itsiPlanning'))}</a></li>
    </ul>
    <p class="field-hint">${escapeHtml(t('planner.results.disclaimer'))}</p>`;

  return `
    <section class="results-panel panel" id="results">
      <div class="panel-header">${escapeHtml(t('planner.results.title'))}</div>
      <div class="panel-body">
        <div aria-live="polite" aria-atomic="true">
          ${escapeHtml(
            t('planner.results.updated', {
              svaCode: topology.svaCode,
              totalTb: storage.totalTb,
              ingestNote: ingestNotePlain,
            }),
          )}
        </div>

        <div class="results-dashboard">
          ${section(t('planner.results.topology'), topologyBody, true, true)}
          ${section(t('planner.results.hardware'), hardwareBody, false)}
          ${section(t('planner.results.storage'), storageBody, false)}
          ${section(t('planner.results.management'), managementBody, false)}
          ${section(t('planner.results.network'), networkBody, false)}
          ${section(t('planner.results.prerequisites'), prereqBody, false, true)}
          ${section(t('planner.results.documentation'), documentationBody, false, true)}
        </div>

        <div class="actions actions--desktop-only">
          <button type="button" class="btn" id="copy-summary">${escapeHtml(t('planner.results.copySummary'))}</button>
          <a href="#guide?profile=${profileFromResult(result)}" class="btn btn-secondary" id="deploy-guide-link">${escapeHtml(t('planner.results.deployGuide'))}</a>
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
    '## Storage (per indexer)',
    `- Hot/warm: ${storage.perIndexerHotWarmTb} TB (${storage.hotWarmDays}d)`,
    `- Cold: ${storage.perIndexerColdTb} TB (${storage.coldDays}d)`,
    `- Frozen/Archive: ${storage.perIndexerFrozenTb} TB (${storage.frozenDays}d)`,
    `- **Total: ${storage.perIndexerTotalTb} TB**`,
    '',
    '## Storage (cluster total)',
    `- Hot/warm: ${storage.hotWarmTb} TB`,
    `- Cold: ${storage.coldTb} TB`,
    `- Frozen/Archive: ${storage.frozenTb} TB`,
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
