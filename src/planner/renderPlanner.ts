import { MAX_INDEXERS, MAX_RF_SF } from '../lib/clusterFactors';
import { getDefaultMaxVolumeGb, MAX_VOLUME_DEFAULTS } from '../lib/clusterEstimation';
import { DOC_LINKS, SIZING } from '../lib/constants';
import { epsToGbPerDay } from '../lib/ingestCalculator';
import { normalizePlannerInputs } from '../lib/inputNormalize';
import { runPlanner } from '../lib/planner';
import { resolveTopologySettings } from '../lib/topologyResolver';
import type { PlannerInputs, PlannerResult, RetentionPeriod, TimeUnit } from '../lib/types';
import { renderNav } from '../nav';
import { loadInputs, readRetentionField, saveInputs } from '../storage';
import { buildMarkdownSummary, renderResults } from '../ui/renderResults';
import { updateRetentionBarElement } from '../ui/retentionBar';

function num(id: string): number {
  return Number((document.getElementById(id) as HTMLInputElement).value);
}

function checked(id: string): boolean {
  return (document.getElementById(id) as HTMLInputElement).checked;
}

function val(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value;
}

function unitOptions(selected: TimeUnit): string {
  return (['days', 'months', 'years'] as const)
    .map((u) => `<option value="${u}" ${selected === u ? 'selected' : ''}>${u}</option>`)
    .join('');
}

function retentionField(prefix: string, label: string, period: RetentionPeriod): string {
  return `
    <div class="field retention-field">
      <label for="${prefix}Value">${label}</label>
      <div class="retention-input-row">
        <input type="number" id="${prefix}Value" min="0" step="1" value="${period.value}" />
        <select id="${prefix}Unit">${unitOptions(period.unit)}</select>
      </div>
    </div>`;
}

function readClusterFactors(): { replicationFactor: number; searchFactor: number } {
  const auto = checked('autoClusterEstimation');
  return {
    replicationFactor: num(auto ? 'replicationFactorAuto' : 'replicationFactor'),
    searchFactor: num(auto ? 'searchFactorAuto' : 'searchFactor'),
  };
}

function readInputs(): PlannerInputs {
  const useEpsInput = checked('useEpsInput');
  const utilization = num('utilizationPercent') / 100;
  const dailyIngestGb = useEpsInput
    ? epsToGbPerDay(num('eventsPerSecond'), num('avgEventBytes'), utilization)
    : num('dailyIngestGb');
  const { replicationFactor, searchFactor } = readClusterFactors();

  return {
    dailyIngestGb,
    useEpsInput,
    eventsPerSecond: num('eventsPerSecond'),
    avgEventBytes: num('avgEventBytes'),
    utilization,
    peakConcurrentSearches: num('peakConcurrentSearches') || undefined,
    concurrentUsers: Math.max(1, num('concurrentUsers')),
    singleServerDeployment: checked('singleServerDeployment'),
    searchHeadCount: num('searchHeadCount'),
    searchHeadCluster: checked('searchHeadCluster'),
    enterpriseSecurity: checked('enterpriseSecurity'),
    itsi: checked('itsi'),
    hotWarm: readRetentionField('hotWarm'),
    cold: readRetentionField('cold'),
    frozen: readRetentionField('frozen'),
    archivingMode: val('archivingMode') as PlannerInputs['archivingMode'],
    autoClusterEstimation: checked('autoClusterEstimation'),
    maxVolumePerIndexGb: num('maxVolumePerIndexGb'),
    manualIndexerCount: num('manualIndexerCount'),
    replicationFactor,
    searchFactor,
    environment: val('environment') as PlannerInputs['environment'],
    forwarderClientCount: num('forwarderClientCount'),
    managementManualConfig: checked('managementManualConfig'),
    dedicateDeploymentServer: checked('dedicateDeploymentServer'),
    colocateClusterManager: checked('colocateClusterManager'),
    colocateShcDeployer: checked('colocateShcDeployer'),
    dedicateLicenseManager: checked('dedicateLicenseManager'),
    dedicateMonitoringConsole: checked('dedicateMonitoringConsole'),
  };
}

function setVisible(id: string, visible: boolean): void {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('is-hidden', !visible);
}

function updateEpsPanel(): void {
  const useEps = checked('useEpsInput');
  setVisible('gb-ingest-fields', !useEps);
  setVisible('eps-ingest-fields', useEps);
  const utilization = num('utilizationPercent') / 100;
  const computed = epsToGbPerDay(num('eventsPerSecond'), num('avgEventBytes'), utilization);
  const hint = document.getElementById('eps-computed-gb');
  if (hint) hint.textContent = `Computed ingest: ${computed.toFixed(2)} GB/day`;
}

function updateClusterRfSfVisibility(): void {
  setVisible('cluster-rf-sf', !checked('singleServerDeployment'));
  const auto = checked('autoClusterEstimation');
  document.getElementById('replicationFactor')?.classList.toggle('is-hidden', auto);
  document.getElementById('replicationFactorAuto')?.classList.toggle('is-hidden', !auto);
  document.getElementById('searchFactor')?.classList.toggle('is-hidden', auto);
  document.getElementById('searchFactorAuto')?.classList.toggle('is-hidden', !auto);
}

function updateSearchHeadMin(): void {
  const shc = checked('searchHeadCluster');
  const countEl = document.getElementById('searchHeadCount') as HTMLInputElement | null;
  if (!countEl) return;
  countEl.min = shc ? String(SIZING.MIN_SHC_MEMBERS) : '1';
  if (shc && Number(countEl.value) < SIZING.MIN_SHC_MEMBERS) {
    countEl.value = String(SIZING.MIN_SHC_MEMBERS);
  }
}

function updateTopologyPanel(partial?: PlannerInputs): void {
  const single = checked('singleServerDeployment');
  setVisible('topology-distributed-fields', !single);
  const auto = checked('autoClusterEstimation');
  setVisible('cluster-manual-fields', !auto && !single);
  setVisible('cluster-auto-summary', auto && !single);
  updateClusterRfSfVisibility();
  updateSearchHeadMin();

  const inputs = partial ?? readInputs();
  const defaultMax = getDefaultMaxVolumeGb(inputs);

  const hint = document.getElementById('inferred-prefix-hint');
  const summary = document.getElementById('cluster-auto-summary');
  if (hint && !single) {
    hint.textContent =
      'Indexing tier prefix is chosen automatically from ingest, indexer count, and cluster settings.';
  }

  if (!single && auto) {
    const ingest = inputs.useEpsInput
      ? epsToGbPerDay(inputs.eventsPerSecond, inputs.avgEventBytes, inputs.utilization)
      : inputs.dailyIngestGb;
    const suggested = Math.ceil(ingest / defaultMax);
    const autoHint = document.getElementById('cluster-auto-hint');
    if (autoHint) {
      autoHint.innerHTML = `Max volume per index: <strong>${defaultMax} GB/day</strong>.`;
    }
    if (summary) {
      summary.innerHTML = `<p class="field-hint">Suggested indexers: <strong>${suggested}</strong></p>`;
    }
    const maxVolInput = document.getElementById('maxVolumePerIndexGb') as HTMLInputElement | null;
    if (maxVolInput) maxVolInput.value = String(defaultMax);
  } else if (summary) {
    summary.innerHTML = '';
  }
}

function updateManagementPanel(): void {
  const manual = checked('managementManualConfig');
  const single = checked('singleServerDeployment');
  setVisible('management-section', !single);
  setVisible('management-manual-fields', manual && !single);
  setVisible('management-auto-summary', !manual && !single);

  const resolved = resolveTopologySettings(normalizePlannerInputs(readInputs()));
  setVisible('mgmt-colocate-cm', manual && resolved.isClustered && resolved.indexerCount > 1);
  setVisible('mgmt-colocate-deployer', manual && resolved.isClustered);
}

function updateSummaryBar(result: PlannerResult): void {
  const el = document.getElementById('summary-content');
  if (!el) return;
  const premium = [
    result.inputs.enterpriseSecurity ? 'ES' : null,
    result.inputs.itsi ? 'ITSI' : null,
  ]
    .filter(Boolean)
    .join(', ');
  el.innerHTML = `
    <span class="badge"><strong>${result.topology.svaCode}</strong></span>
    <span class="badge">${result.resolvedIngestGb} GB/day</span>
    <span class="badge">${result.topology.prefix} · ${result.topology.indexerCount} idx</span>
    <span class="badge">${result.storage.totalTb} TB</span>
    ${premium ? `<span class="badge">${premium}</span>` : ''}
  `;
}

function recalculate(): void {
  const inputs = readInputs();
  saveInputs(inputs);
  const result = runPlanner(inputs);
  updateSummaryBar(result);
  updateRetentionBarElement(inputs.hotWarm, inputs.cold, inputs.frozen);
  updateTopologyPanel(inputs);
  updateManagementPanel();

  const resultsContainer = document.getElementById('results-container');
  if (resultsContainer) resultsContainer.innerHTML = renderResults(result);

  const prefixResult = document.getElementById('inferred-prefix-result');
  if (prefixResult) prefixResult.textContent = result.topology.prefixLabel;

  bindCopySummary(result);
}

function bindCopySummary(result: PlannerResult): void {
  const handler = async (btn: HTMLButtonElement) => {
    await navigator.clipboard.writeText(buildMarkdownSummary(result));
    const label = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = label?.includes('Markdown') ? 'Copy summary (Markdown)' : 'Copy summary';
    }, 2000);
  };

  for (const id of ['copy-summary', 'copy-summary-mobile'] as const) {
    const copyBtn = document.getElementById(id);
    if (!copyBtn) continue;
    const fresh = copyBtn.cloneNode(true) as HTMLButtonElement;
    copyBtn.parentNode?.replaceChild(fresh, copyBtn);
    fresh.addEventListener('click', () => handler(fresh));
  }
}

function collapseMobileWizardPanels(): void {
  if (!window.matchMedia('(max-width: 767px)').matches) return;
  document.querySelectorAll('.wizard-column .panel').forEach((panel, index) => {
    if (index >= 3) panel.classList.add('collapsed');
  });
}

function bindJumpToResults(): void {
  const jumpBtn = document.getElementById('jump-results');
  jumpBtn?.addEventListener('click', () => {
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  let interacted = false;
  const form = document.getElementById('planner-form');
  const showJump = (): void => {
    if (interacted) return;
    interacted = true;
    jumpBtn?.classList.remove('is-hidden');
  };
  form?.addEventListener('input', showJump, { once: false });
  form?.addEventListener('change', showJump, { once: false });
}

function bindPanelCollapse(): void {
  document.querySelectorAll('.panel-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.parentElement?.classList.toggle('collapsed');
    });
  });
}

function renderApp(container: HTMLElement, initial: PlannerInputs): void {
  const n = initial;

  container.innerHTML = `
    ${renderNav('planner')}
    <header class="app-header">
      <h1>Splunk On-Prem Topology Planner</h1>
      <p class="subtitle">SVA topology, storage, hardware (10.4), firewall ports, management colocation · <a href="#guide">Linux deployment guide</a></p>
      <div class="summary-bar summary-bar--sticky" id="summary-content"></div>
    </header>

    <main class="layout planner-layout">
      <div class="wizard-column">
      <form id="planner-form" class="wizard">
        <section class="panel">
          <div class="panel-header">1. Workload</div>
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="useEpsInput" ${n.useEpsInput ? 'checked' : ''} />
              <label for="useEpsInput">Calculate ingest from EPS</label>
            </div>
            <div id="gb-ingest-fields" class="${n.useEpsInput ? 'is-hidden' : ''}">
              <div class="field">
                <label for="dailyIngestGb">Daily ingest (GB/day, uncompressed)</label>
                <input type="number" id="dailyIngestGb" min="0.1" max="50000" step="0.1" value="${n.dailyIngestGb}" />
              </div>
            </div>
            <div id="eps-ingest-fields" class="${n.useEpsInput ? '' : 'is-hidden'}">
              <div class="grid-2">
                <div class="field">
                  <label for="eventsPerSecond">Events per second (Y)</label>
                  <input type="number" id="eventsPerSecond" min="1" value="${n.eventsPerSecond}" />
                </div>
                <div class="field">
                  <label for="avgEventBytes">Average event size (bytes, Z)</label>
                  <input type="number" id="avgEventBytes" min="1" value="${n.avgEventBytes}" />
                </div>
                <div class="field">
                  <label for="utilizationPercent">Utilization (W), %</label>
                  <input type="number" id="utilizationPercent" min="1" max="100" step="1" value="${Math.round(n.utilization * 100)}" />
                  <p class="field-hint">Recommended: 60–70%</p>
                </div>
              </div>
              <p class="field-hint" id="eps-computed-gb"></p>
              <p class="field-hint formula-hint">GB/day = ((Y × Z × 3600 × 24) / 1024³) × (W/100)</p>
            </div>
            <div class="field">
              <label for="concurrentUsers">Expected concurrent users</label>
              <input type="number" id="concurrentUsers" min="1" max="500" value="${n.concurrentUsers}" />
              <p class="field-hint"><a href="${DOC_LINKS.performance104}" target="_blank" rel="noopener">10.4 performance recommendations</a></p>
            </div>
            <div class="field">
              <label for="peakConcurrentSearches">Peak concurrent searches (optional)</label>
              <input type="number" id="peakConcurrentSearches" min="0" value="${n.peakConcurrentSearches ?? ''}" />
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">2. Data retention</div>
          <div class="panel-body">
            <div class="grid-2">
              ${retentionField('hotWarm', 'Hot / warm', n.hotWarm)}
              ${retentionField('cold', 'Cold', n.cold)}
              ${retentionField('frozen', 'Frozen / archive', n.frozen)}
            </div>
            <div class="field">
              <label for="archivingMode">Archiving mode</label>
              <select id="archivingMode">
                <option value="none" ${n.archivingMode === 'none' ? 'selected' : ''}>None (delete frozen)</option>
                <option value="local" ${n.archivingMode === 'local' ? 'selected' : ''}>Local archive</option>
                <option value="clustered-optimized" ${n.archivingMode === 'clustered-optimized' ? 'selected' : ''}>Clustered optimized</option>
                <option value="clustered-unoptimized" ${n.archivingMode === 'clustered-unoptimized' ? 'selected' : ''}>Clustered un-optimized (×RF)</option>
              </select>
            </div>
            <div id="retention-bar-container"></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">3. Premium applications</div>
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="enterpriseSecurity" ${n.enterpriseSecurity ? 'checked' : ''} />
              <label for="enterpriseSecurity">Enterprise Security (+10 SVA) · max ${MAX_VOLUME_DEFAULTS.es} GB/day/index</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="itsi" ${n.itsi ? 'checked' : ''} />
              <label for="itsi">IT Service Intelligence · max ${MAX_VOLUME_DEFAULTS.itsi} GB/day/index</label>
            </div>
            <p class="field-hint" id="premium-warn"></p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">4. Topology preferences</div>
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="singleServerDeployment" ${n.singleServerDeployment ? 'checked' : ''} />
              <label for="singleServerDeployment">Single Server Deployment (S1) — combined indexer and search</label>
            </div>
            <div id="topology-distributed-fields" class="${n.singleServerDeployment ? 'is-hidden' : ''}">
              <p class="field-hint" id="inferred-prefix-hint"></p>
              <p class="field-hint">Auto indexing tier: <strong id="inferred-prefix-result">—</strong></p>
              <div class="checkbox-row">
                <input type="checkbox" id="autoClusterEstimation" ${n.autoClusterEstimation ? 'checked' : ''} />
                <label for="autoClusterEstimation">Automatic cluster estimation</label>
              </div>
              <p class="field-hint" id="cluster-auto-hint"></p>
              <div id="cluster-auto-summary"></div>
              <div id="cluster-manual-fields" class="${n.autoClusterEstimation ? 'is-hidden' : ''}">
                <div class="grid-2">
                  <div class="field">
                    <label for="maxVolumePerIndexGb">Max volume per index (GB/day)</label>
                    <input type="number" id="maxVolumePerIndexGb" min="10" max="5000" value="${n.maxVolumePerIndexGb}" />
                  </div>
                  <div class="field">
                    <label for="manualIndexerCount">Number of indexers (max ${MAX_INDEXERS})</label>
                    <input type="number" id="manualIndexerCount" min="1" max="${MAX_INDEXERS}" value="${n.manualIndexerCount}" />
                  </div>
                </div>
              </div>
              <div class="grid-2">
                <div class="field">
                  <label for="searchHeadCount">Search heads (quantity)</label>
                  <input type="number" id="searchHeadCount" min="1" max="${MAX_INDEXERS}" value="${n.searchHeadCount}" />
                </div>
                <div class="checkbox-row" style="align-self:end">
                  <input type="checkbox" id="searchHeadCluster" ${n.searchHeadCluster ? 'checked' : ''} />
                  <label for="searchHeadCluster">Search head cluster (SHC, min ${SIZING.MIN_SHC_MEMBERS} members)</label>
                </div>
              </div>
              <div id="cluster-rf-sf" class="grid-2 cluster-rf-sf">
                <div class="field">
                  <label>Replication factor (RF)</label>
                  <input type="number" id="replicationFactorAuto" min="1" max="${MAX_RF_SF}" value="${n.replicationFactor}" class="${n.autoClusterEstimation ? '' : 'is-hidden'}" />
                  <input type="number" id="replicationFactor" min="1" max="${MAX_RF_SF}" value="${n.replicationFactor}" class="${n.autoClusterEstimation ? 'is-hidden' : ''}" />
                  <p class="field-hint">RF ≤ indexer count</p>
                </div>
                <div class="field">
                  <label>Search factor (SF)</label>
                  <input type="number" id="searchFactorAuto" min="1" max="${MAX_RF_SF}" value="${n.searchFactor}" class="${n.autoClusterEstimation ? '' : 'is-hidden'}" />
                  <input type="number" id="searchFactor" min="1" max="${MAX_RF_SF}" value="${n.searchFactor}" class="${n.autoClusterEstimation ? 'is-hidden' : ''}" />
                  <p class="field-hint">SF ≤ RF</p>
                </div>
              </div>
              <p class="field-hint footnote">Multi-site deployment (M prefix) — coming soon.</p>
            </div>
          </div>
        </section>

        <section class="panel" id="management-section">
          <div class="panel-header">5. Management node</div>
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="managementManualConfig" ${n.managementManualConfig ? 'checked' : ''} />
              <label for="managementManualConfig">Manual configuration</label>
            </div>
            <div class="field">
              <label for="forwarderClientCount">Forwarders / deployment clients</label>
              <input type="number" id="forwarderClientCount" min="0" value="${n.forwarderClientCount}" />
            </div>
            <div id="management-auto-summary" class="${n.managementManualConfig ? 'is-hidden' : ''}">
              <p class="field-hint">Auto: CM and Deployer dedicated when applicable; LM/MC/DS may colocate if rules allow.</p>
            </div>
            <div id="management-manual-fields" class="${n.managementManualConfig ? '' : 'is-hidden'}">
              <div class="checkbox-row">
                <input type="checkbox" id="dedicateDeploymentServer" ${n.dedicateDeploymentServer ? 'checked' : ''} />
                <label for="dedicateDeploymentServer">Dedicated Deployment Server (DS)</label>
              </div>
              <div class="checkbox-row" id="mgmt-colocate-cm">
                <input type="checkbox" id="colocateClusterManager" ${n.colocateClusterManager ? 'checked' : ''} />
                <label for="colocateClusterManager">Colocate Indexer cluster manager node (CM)</label>
              </div>
              <div class="checkbox-row" id="mgmt-colocate-deployer">
                <input type="checkbox" id="colocateShcDeployer" ${n.colocateShcDeployer ? 'checked' : ''} />
                <label for="colocateShcDeployer">Colocate Search head cluster deployer</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="dedicateLicenseManager" ${n.dedicateLicenseManager ? 'checked' : ''} />
                <label for="dedicateLicenseManager">Dedicated License Manager (LM)</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="dedicateMonitoringConsole" ${n.dedicateMonitoringConsole ? 'checked' : ''} />
                <label for="dedicateMonitoringConsole">Dedicated Monitoring Console (MC)</label>
              </div>
            </div>
            <p class="field-hint"><a href="${DOC_LINKS.management104}" target="_blank" rel="noopener">Management components (10.4)</a></p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">6. Environment</div>
          <div class="panel-body">
            <div class="field">
              <label for="environment">Hosting</label>
              <select id="environment">
                <option value="physical" ${n.environment === 'physical' ? 'selected' : ''}>Physical / bare metal</option>
                <option value="virtual" ${n.environment === 'virtual' ? 'selected' : ''}>Virtualized</option>
              </select>
            </div>
          </div>
        </section>
      </form>
      </div>

      <div class="results-column" id="results-column">
        <div id="results-container"></div>
      </div>
    </main>

    <button type="button" id="jump-results" class="btn jump-results is-hidden">Jump to results</button>
    <div class="mobile-copy-bar">
      <button type="button" class="btn" id="copy-summary-mobile">Copy summary</button>
    </div>
  `;

  bindPanelCollapse();
  collapseMobileWizardPanels();
  bindJumpToResults();

  const form = document.getElementById('planner-form');
  const onFormChange = (): void => {
    updateEpsPanel();
    updateTopologyPanel();
    const es = checked('enterpriseSecurity');
    const itsi = checked('itsi');
    const warn = document.getElementById('premium-warn');
    if (warn) warn.textContent = es && itsi ? 'ES and ITSI require separate search heads.' : '';
    recalculate();
  };

  form?.addEventListener('input', onFormChange);
  form?.addEventListener('change', onFormChange);

  updateEpsPanel();
  updateTopologyPanel(n);
  updateManagementPanel();
  recalculate();
}

export function renderPlanner(container: HTMLElement): void {
  renderApp(container, loadInputs());
}
