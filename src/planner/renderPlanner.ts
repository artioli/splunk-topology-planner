import { t } from '../i18n';
import { MAX_INDEXERS, MAX_RF_SF } from '../lib/clusterFactors';
import { getDefaultMaxVolumeGb } from '../lib/clusterEstimation';
import { SIZING } from '../lib/constants';
import { escapeHtml } from '../lib/format';
import { epsToGbPerDay } from '../lib/ingestCalculator';
import { normalizePlannerInputs } from '../lib/inputNormalize';
import { getPerformanceRecommendation } from '../lib/performanceRecommendations';
import { savePlannerHandoff } from '../lib/plannerHandoff';
import { runPlanner } from '../lib/planner';
import { resolveTopologySettings } from '../lib/topologyResolver';
import type { PlannerInputs, PlannerResult, RetentionPeriod, TimeUnit } from '../lib/types';
import { bindNavEvents, renderNav } from '../nav';
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
    .map(
      (u) =>
        `<option value="${u}" ${selected === u ? 'selected' : ''}>${escapeHtml(t(`planner.units.${u}`))}</option>`,
    )
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

function getAutoSuggestions(inputs: PlannerInputs): { indexers: number; searchHeads: number } {
  const ingest = inputs.useEpsInput
    ? epsToGbPerDay(inputs.eventsPerSecond, inputs.avgEventBytes, inputs.utilization)
    : inputs.dailyIngestGb;
  const defaultMax = getDefaultMaxVolumeGb(inputs);
  const indexers = Math.ceil(ingest / defaultMax);
  const perf = getPerformanceRecommendation(ingest, inputs.concurrentUsers);
  let searchHeads = perf.recommendedSearchHeads;
  if (inputs.searchHeadCluster) {
    searchHeads = Math.max(SIZING.MIN_SHC_MEMBERS, searchHeads);
  }
  return { indexers, searchHeads };
}

function updateRfSfMax(indexerCount: number): void {
  const rfMax = Math.max(1, indexerCount);
  const rfAuto = document.getElementById('replicationFactorAuto') as HTMLInputElement | null;
  const rfManual = document.getElementById('replicationFactor') as HTMLInputElement | null;
  const sfAuto = document.getElementById('searchFactorAuto') as HTMLInputElement | null;
  const sfManual = document.getElementById('searchFactor') as HTMLInputElement | null;

  for (const el of [rfAuto, rfManual]) {
    if (el) {
      el.max = String(rfMax);
      if (Number(el.value) > rfMax) el.value = String(rfMax);
    }
  }

  const rf = Number(rfAuto?.classList.contains('is-hidden') ? rfManual?.value : rfAuto?.value) || rfMax;
  const sfMax = Math.max(1, Math.min(rf, rfMax));

  for (const el of [sfAuto, sfManual]) {
    if (el) {
      el.max = String(sfMax);
      if (Number(el.value) > sfMax) el.value = String(sfMax);
    }
  }
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
    archivingMode: 'local',
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
  if (hint) hint.textContent = t('planner.field.epsComputedGb', { value: computed.toFixed(2) });
}

function updateClusterRfSfVisibility(indexerCount?: number): void {
  const single = checked('singleServerDeployment');
  const count =
    indexerCount ??
    resolveTopologySettings(normalizePlannerInputs(readInputs())).indexerCount;
  const showRfSf = !single && count > 1;
  setVisible('cluster-rf-sf', showRfSf);
  const auto = checked('autoClusterEstimation');
  document.getElementById('replicationFactor')?.classList.toggle('is-hidden', auto);
  document.getElementById('replicationFactorAuto')?.classList.toggle('is-hidden', !auto);
  document.getElementById('searchFactor')?.classList.toggle('is-hidden', auto);
  document.getElementById('searchFactorAuto')?.classList.toggle('is-hidden', !auto);
}

function updateSearchHeadAuto(inputs?: PlannerInputs): void {
  const single = checked('singleServerDeployment');
  const auto = checked('autoClusterEstimation');
  const countEl = document.getElementById('searchHeadCount') as HTMLInputElement | null;
  const hint = document.getElementById('search-head-auto-hint');
  if (!countEl || single) return;

  if (auto) {
    const n = inputs ?? readInputs();
    const ingest = n.useEpsInput
      ? epsToGbPerDay(n.eventsPerSecond, n.avgEventBytes, n.utilization)
      : n.dailyIngestGb;
    const perf = getPerformanceRecommendation(ingest, n.concurrentUsers);
    let sh = perf.recommendedSearchHeads;
    if (checked('searchHeadCluster')) {
      sh = Math.max(SIZING.MIN_SHC_MEMBERS, sh);
    }
    countEl.value = String(sh);
    countEl.disabled = true;
    if (hint) {
      hint.textContent = t('planner.field.searchHeadAutoHint');
    }
  } else {
    countEl.disabled = false;
    if (hint) hint.textContent = '';
  }
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
  const inputs = partial ?? readInputs();
  const single = checked('singleServerDeployment');
  setVisible('topology-distributed-fields', !single);
  const auto = checked('autoClusterEstimation');
  setVisible('cluster-manual-fields', !auto && !single);
  setVisible('cluster-auto-summary', auto && !single);
  const resolved = resolveTopologySettings(normalizePlannerInputs(inputs));
  updateClusterRfSfVisibility(resolved.indexerCount);
  updateSearchHeadAuto(inputs);
  updateSearchHeadMin();
  updateRfSfMax(resolved.indexerCount);

  const hint = document.getElementById('inferred-prefix-hint');
  const summary = document.getElementById('cluster-auto-summary');
  if (hint && !single) {
    hint.textContent = t('planner.field.inferredPrefixHint');
  }

  if (!single && auto) {
    const { indexers, searchHeads } = getAutoSuggestions(inputs);
    const autoHint = document.getElementById('cluster-auto-hint');
    if (autoHint) {
      autoHint.innerHTML = t('planner.field.clusterAutoHint', {
        maxVolumePerIndexGb: getDefaultMaxVolumeGb(inputs),
      });
    }
    if (summary) {
      summary.innerHTML = `
        <p class="field-hint">${escapeHtml(t('planner.field.suggestedIndexers', { indexers }))}</p>
        <p class="field-hint">${escapeHtml(t('planner.field.suggestedSearchHeads', { searchHeads }))}</p>`;
    }
    const maxVolInput = document.getElementById('maxVolumePerIndexGb') as HTMLInputElement | null;
    if (maxVolInput) maxVolInput.value = String(getDefaultMaxVolumeGb(inputs));
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
  if (prefixResult) {
    prefixResult.textContent = t('planner.field.inferredPrefixResult', {
      prefixLabel: result.topology.prefixLabel,
    });
  }

  bindCopySummary(result);

  document.getElementById('deploy-guide-link')?.addEventListener('click', () => {
    savePlannerHandoff(result);
  });
}

function bindCopySummary(result: PlannerResult): void {
  const copySummaryLabel = t('planner.results.copySummary');
  const copySummaryShortLabel = t('planner.results.copySummaryShort');
  const handler = async (btn: HTMLButtonElement) => {
    await navigator.clipboard.writeText(buildMarkdownSummary(result));
    const label = btn.textContent;
    btn.textContent = t('planner.results.copied');
    setTimeout(() => {
      btn.textContent =
        label === copySummaryShortLabel ? copySummaryShortLabel : copySummaryLabel;
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
      <h1>${escapeHtml(t('planner.title'))}</h1>
      <p class="subtitle">${escapeHtml(t('planner.subtitle'))} · <a href="#guide">${escapeHtml(t('planner.subtitleGuideLink'))}</a></p>
      <div class="summary-bar summary-bar--sticky" id="summary-content"></div>
    </header>

    <main class="layout planner-layout">
      <div class="wizard-column">
      <form id="planner-form" class="wizard">
        <section class="panel">
          <div class="panel-header">${escapeHtml(t('planner.panels.workload'))}</div>
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="useEpsInput" ${n.useEpsInput ? 'checked' : ''} />
              <label for="useEpsInput">${escapeHtml(t('planner.field.useEpsInput'))}</label>
            </div>
            <div id="gb-ingest-fields" class="${n.useEpsInput ? 'is-hidden' : ''}">
              <div class="field">
                <label for="dailyIngestGb">${escapeHtml(t('planner.field.dailyIngestGb'))}</label>
                <input type="number" id="dailyIngestGb" min="0.1" max="50000" step="0.1" value="${n.dailyIngestGb}" />
              </div>
            </div>
            <div id="eps-ingest-fields" class="${n.useEpsInput ? '' : 'is-hidden'}">
              <div class="grid-2">
                <div class="field">
                  <label for="eventsPerSecond">${escapeHtml(t('planner.field.eventsPerSecond'))}</label>
                  <input type="number" id="eventsPerSecond" min="1" value="${n.eventsPerSecond}" />
                </div>
                <div class="field">
                  <label for="avgEventBytes">${escapeHtml(t('planner.field.avgEventBytes'))}</label>
                  <input type="number" id="avgEventBytes" min="1" value="${n.avgEventBytes}" />
                </div>
                <div class="field">
                  <label for="utilizationPercent">${escapeHtml(t('planner.field.utilizationPercent'))}</label>
                  <input type="number" id="utilizationPercent" min="1" max="100" step="1" value="${Math.round(n.utilization * 100)}" />
                  <p class="field-hint">${escapeHtml(t('planner.field.utilizationHint'))}</p>
                </div>
              </div>
              <p class="field-hint" id="eps-computed-gb"></p>
              <p class="field-hint formula-hint">${escapeHtml(t('planner.field.epsFormula'))}</p>
            </div>
            <div class="field">
              <label for="concurrentUsers">${escapeHtml(t('planner.field.concurrentUsers'))}</label>
              <input type="number" id="concurrentUsers" min="1" max="500" value="${n.concurrentUsers}" />
            </div>
            <div class="field">
              <label for="peakConcurrentSearches">${escapeHtml(t('planner.field.peakConcurrentSearches'))}</label>
              <input type="number" id="peakConcurrentSearches" min="0" value="${n.peakConcurrentSearches ?? ''}" />
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">${escapeHtml(t('planner.panels.retention'))}</div>
          <div class="panel-body">
            <div class="retention-stack">
              ${retentionField('hotWarm', t('planner.field.hotWarm'), n.hotWarm)}
              ${retentionField('cold', t('planner.field.cold'), n.cold)}
              ${retentionField('frozen', t('planner.field.frozen'), n.frozen)}
            </div>
            <div id="retention-bar-container"></div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">${escapeHtml(t('planner.panels.premium'))}</div>
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="enterpriseSecurity" ${n.enterpriseSecurity ? 'checked' : ''} />
              <label for="enterpriseSecurity">${escapeHtml(t('planner.field.enterpriseSecurity'))}</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="itsi" ${n.itsi ? 'checked' : ''} />
              <label for="itsi">${escapeHtml(t('planner.field.itsi'))}</label>
            </div>
            <p class="field-hint" id="premium-warn"></p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">${escapeHtml(t('planner.panels.topology'))}</div>
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="singleServerDeployment" ${n.singleServerDeployment ? 'checked' : ''} />
              <label for="singleServerDeployment">${escapeHtml(t('planner.field.singleServerDeployment'))}</label>
            </div>
            <div id="topology-distributed-fields" class="${n.singleServerDeployment ? 'is-hidden' : ''}">
              <p class="field-hint" id="inferred-prefix-hint"></p>
              <p class="field-hint"><strong id="inferred-prefix-result">—</strong></p>
              <div class="checkbox-row">
                <input type="checkbox" id="autoClusterEstimation" ${n.autoClusterEstimation ? 'checked' : ''} />
                <label for="autoClusterEstimation">${escapeHtml(t('planner.field.autoClusterEstimation'))}</label>
              </div>
              <p class="field-hint" id="cluster-auto-hint"></p>
              <div id="cluster-auto-summary"></div>
              <div id="cluster-manual-fields" class="${n.autoClusterEstimation ? 'is-hidden' : ''}">
                <div class="grid-2">
                  <div class="field">
                    <label for="maxVolumePerIndexGb">${escapeHtml(t('planner.field.maxVolumePerIndexGb'))}</label>
                    <input type="number" id="maxVolumePerIndexGb" min="10" max="5000" value="${n.maxVolumePerIndexGb}" />
                  </div>
                  <div class="field">
                    <label for="manualIndexerCount">${escapeHtml(t('planner.field.manualIndexerCount', { max: MAX_INDEXERS }))}</label>
                    <input type="number" id="manualIndexerCount" min="1" max="${MAX_INDEXERS}" value="${n.manualIndexerCount}" />
                  </div>
                </div>
              </div>
              <div class="grid-2">
                <div class="field">
                  <label for="searchHeadCount">${escapeHtml(t('planner.field.searchHeadCount'))}</label>
                  <input type="number" id="searchHeadCount" min="1" max="${MAX_INDEXERS}" value="${n.searchHeadCount}" />
                  <p class="field-hint" id="search-head-auto-hint"></p>
                </div>
                <div class="checkbox-row" style="align-self:end">
                  <input type="checkbox" id="searchHeadCluster" ${n.searchHeadCluster ? 'checked' : ''} />
                  <label for="searchHeadCluster">${escapeHtml(t('planner.field.searchHeadCluster', { min: SIZING.MIN_SHC_MEMBERS }))}</label>
                </div>
              </div>
              <div id="cluster-rf-sf" class="grid-2 cluster-rf-sf">
                <div class="field">
                  <label>${escapeHtml(t('planner.field.replicationFactor'))}</label>
                  <input type="number" id="replicationFactorAuto" min="1" max="${MAX_RF_SF}" value="${n.replicationFactor}" class="${n.autoClusterEstimation ? '' : 'is-hidden'}" />
                  <input type="number" id="replicationFactor" min="1" max="${MAX_RF_SF}" value="${n.replicationFactor}" class="${n.autoClusterEstimation ? 'is-hidden' : ''}" />
                  <p class="field-hint">${escapeHtml(t('planner.field.rfHint'))}</p>
                </div>
                <div class="field">
                  <label>${escapeHtml(t('planner.field.searchFactor'))}</label>
                  <input type="number" id="searchFactorAuto" min="1" max="${MAX_RF_SF}" value="${n.searchFactor}" class="${n.autoClusterEstimation ? '' : 'is-hidden'}" />
                  <input type="number" id="searchFactor" min="1" max="${MAX_RF_SF}" value="${n.searchFactor}" class="${n.autoClusterEstimation ? 'is-hidden' : ''}" />
                  <p class="field-hint">${escapeHtml(t('planner.field.sfHint'))}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="panel" id="management-section">
          <div class="panel-header">${escapeHtml(t('planner.panels.management'))}</div>
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="managementManualConfig" ${n.managementManualConfig ? 'checked' : ''} />
              <label for="managementManualConfig">${escapeHtml(t('planner.field.managementManualConfig'))}</label>
            </div>
            <div class="field">
              <label for="forwarderClientCount">${escapeHtml(t('planner.field.forwarderClientCount'))}</label>
              <input type="number" id="forwarderClientCount" min="0" value="${n.forwarderClientCount}" />
            </div>
            <div id="management-auto-summary" class="${n.managementManualConfig ? 'is-hidden' : ''}">
              <p class="field-hint">${escapeHtml(t('planner.field.managementAutoSummary'))}</p>
            </div>
            <div id="management-manual-fields" class="${n.managementManualConfig ? '' : 'is-hidden'}">
              <div class="checkbox-row">
                <input type="checkbox" id="dedicateDeploymentServer" ${n.dedicateDeploymentServer ? 'checked' : ''} />
                <label for="dedicateDeploymentServer">${escapeHtml(t('planner.field.dedicateDeploymentServer'))}</label>
              </div>
              <div class="checkbox-row" id="mgmt-colocate-cm">
                <input type="checkbox" id="colocateClusterManager" ${n.colocateClusterManager ? 'checked' : ''} />
                <label for="colocateClusterManager">${escapeHtml(t('planner.field.colocateClusterManager'))}</label>
              </div>
              <div class="checkbox-row" id="mgmt-colocate-deployer">
                <input type="checkbox" id="colocateShcDeployer" ${n.colocateShcDeployer ? 'checked' : ''} />
                <label for="colocateShcDeployer">${escapeHtml(t('planner.field.colocateShcDeployer'))}</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="dedicateLicenseManager" ${n.dedicateLicenseManager ? 'checked' : ''} />
                <label for="dedicateLicenseManager">${escapeHtml(t('planner.field.dedicateLicenseManager'))}</label>
              </div>
              <div class="checkbox-row">
                <input type="checkbox" id="dedicateMonitoringConsole" ${n.dedicateMonitoringConsole ? 'checked' : ''} />
                <label for="dedicateMonitoringConsole">${escapeHtml(t('planner.field.dedicateMonitoringConsole'))}</label>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">${escapeHtml(t('planner.panels.environment'))}</div>
          <div class="panel-body">
            <div class="field">
              <label for="environment">${escapeHtml(t('planner.field.environment'))}</label>
              <select id="environment">
                <option value="physical" ${n.environment === 'physical' ? 'selected' : ''}>${escapeHtml(t('planner.field.environmentPhysical'))}</option>
                <option value="virtual" ${n.environment === 'virtual' ? 'selected' : ''}>${escapeHtml(t('planner.field.environmentVirtual'))}</option>
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

    <button type="button" id="jump-results" class="btn jump-results is-hidden">${escapeHtml(t('planner.results.jumpToResults'))}</button>
    <div class="mobile-copy-bar">
      <button type="button" class="btn" id="copy-summary-mobile">${escapeHtml(t('planner.results.copySummaryShort'))}</button>
    </div>
  `;

  bindPanelCollapse();
  collapseMobileWizardPanels();
  bindJumpToResults();

  const form = document.getElementById('planner-form');
  let wasAutoCluster = checked('autoClusterEstimation');

  const onFormChange = (): void => {
    updateEpsPanel();
    updateTopologyPanel();
    const es = checked('enterpriseSecurity');
    const itsi = checked('itsi');
    const warn = document.getElementById('premium-warn');
    if (warn) warn.textContent = es && itsi ? t('planner.field.premiumWarn') : '';
    recalculate();
  };

  form?.addEventListener('input', onFormChange);
  form?.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'autoClusterEstimation') {
      const nowAuto = checked('autoClusterEstimation');
      if (wasAutoCluster && !nowAuto) {
        const { indexers, searchHeads } = getAutoSuggestions(readInputs());
        const manualIdx = document.getElementById('manualIndexerCount') as HTMLInputElement | null;
        const shCount = document.getElementById('searchHeadCount') as HTMLInputElement | null;
        if (manualIdx) manualIdx.value = String(indexers);
        if (shCount) shCount.value = String(searchHeads);
      }
      wasAutoCluster = nowAuto;
    }
    onFormChange();
  });

  updateEpsPanel();
  updateTopologyPanel(n);
  updateManagementPanel();
  recalculate();
}

export function renderPlanner(container: HTMLElement, onLocaleChange?: () => void): void {
  renderApp(container, loadInputs());
  bindNavEvents(container, onLocaleChange);
}
