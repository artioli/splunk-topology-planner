import { t } from '../i18n';
import { MAX_INDEXERS, MAX_RF_SF, defaultFactorsForIndexers } from '../lib/clusterFactors';
import { getDefaultMaxVolumeGb } from '../lib/clusterEstimation';
import { SIZING } from '../lib/constants';
import { escapeHtml } from '../lib/format';
import { epsToGbPerDay } from '../lib/ingestCalculator';
import { defaultHardwareOverrideValues, inferAutoIndexerTier } from '../lib/hardwareDefaults';
import { normalizePlannerInputs } from '../lib/inputNormalize';
import {
  buildManagementPlan,
  managementHostsToInventoryLabels,
} from '../lib/managementPlanner';
import { getPerformanceRecommendation } from '../lib/performanceRecommendations';
import { savePlannerHandoff } from '../lib/plannerHandoff';
import { runPlanner } from '../lib/planner';
import { resolveTopologySettings } from '../lib/topologyResolver';
import type {
  HardwareOverrideRole,
  HardwareOverrideValues,
  IndexerHardwareTier,
  PlannerInputs,
  PlannerResult,
  RetentionPeriod,
  RoleHardwareOverride,
  TimeUnit,
} from '../lib/types';
import { HARDWARE_OVERRIDE_ROLES } from '../lib/types';
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

const HW_ROLE_LABEL_KEYS: Record<HardwareOverrideRole, string> = {
  'search-head': 'planner.hwRole.searchHead',
  'search-head-es': 'planner.hwRole.searchHeadEs',
  'search-head-itsi': 'planner.hwRole.searchHeadItsi',
  'cluster-manager': 'planner.hwRole.clusterManager',
  'deployment-server': 'planner.hwRole.deploymentServer',
  'shc-deployer': 'planner.hwRole.shcDeployer',
  'license-manager': 'planner.hwRole.licenseManager',
  'monitoring-console': 'planner.hwRole.monitoringConsole',
  'management-stack': 'planner.hwRole.managementStack',
};

function renderHardwareValueFields(
  prefix: string,
  values: HardwareOverrideValues,
  hidden = false,
): string {
  return `
    <div id="${prefix}-fields" class="premium-shc-controls ${hidden ? 'is-hidden' : ''}">
      <div class="field">
        <label for="${prefix}-physicalCores">${escapeHtml(t('planner.field.hwPhysicalCores'))}</label>
        <input type="number" id="${prefix}-physicalCores" min="1" step="1" value="${values.physicalCores}" />
      </div>
      <div class="field">
        <label for="${prefix}-vcpu">${escapeHtml(t('planner.field.hwVcpu'))}</label>
        <input type="number" id="${prefix}-vcpu" min="1" step="1" value="${values.vcpu}" />
      </div>
      <div class="field">
        <label for="${prefix}-ramGb">${escapeHtml(t('planner.field.hwRamGb'))}</label>
        <input type="number" id="${prefix}-ramGb" min="4" step="1" value="${values.ramGb}" />
      </div>
      <div class="field">
        <label for="${prefix}-osDiskGb">${escapeHtml(t('planner.field.hwOsDiskGb'))}</label>
        <input type="number" id="${prefix}-osDiskGb" min="50" step="1" value="${values.osDiskGb}" />
      </div>
      <div class="field">
        <label for="${prefix}-splunkDiskGb">${escapeHtml(t('planner.field.hwSplunkDiskGb'))}</label>
        <input type="number" id="${prefix}-splunkDiskGb" min="50" step="1" value="${values.splunkDiskGb}" />
      </div>
    </div>`;
}

function renderRoleHardwareOverride(
  role: HardwareOverrideRole,
  override: RoleHardwareOverride,
): string {
  const prefix = `hw-${role}`;
  return `
    <div id="hw-role-${role}" class="is-hidden">
      <div class="checkbox-row">
        <input type="checkbox" id="${prefix}-enabled" ${override.enabled ? 'checked' : ''} />
        <label for="${prefix}-enabled">${escapeHtml(t(HW_ROLE_LABEL_KEYS[role]))}</label>
      </div>
      ${renderHardwareValueFields(prefix, override.values, !override.enabled)}
    </div>`;
}

function readHardwareOverrideValues(prefix: string): HardwareOverrideValues {
  return {
    physicalCores: num(`${prefix}-physicalCores`),
    vcpu: num(`${prefix}-vcpu`),
    ramGb: num(`${prefix}-ramGb`),
    osDiskGb: num(`${prefix}-osDiskGb`),
    splunkDiskGb: num(`${prefix}-splunkDiskGb`),
  };
}

function readRoleHardwareOverrides(): PlannerInputs['roleHardwareOverrides'] {
  const overrides: PlannerInputs['roleHardwareOverrides'] = {};
  for (const role of HARDWARE_OVERRIDE_ROLES) {
    const prefix = `hw-${role}`;
    overrides[role] = {
      enabled: checked(`${prefix}-enabled`),
      values: readHardwareOverrideValues(prefix),
    };
  }
  return overrides;
}

function getVisibleHardwareOverrideRoles(inputs: PlannerInputs): Set<HardwareOverrideRole> {
  const settings = resolveTopologySettings(normalizePlannerInputs(inputs));
  const visible = new Set<HardwareOverrideRole>();
  if (!settings.singleServer) {
    visible.add('search-head');
    const plan = buildManagementPlan(inputs, {
      isClustered: settings.isClustered,
      hasShc: settings.hasShc,
      isSingleServer: false,
      indexerCount: settings.indexerCount,
    });
    for (const row of managementHostsToInventoryLabels(plan)) {
      visible.add(row.role);
    }
  }
  if (inputs.enterpriseSecurity) visible.add('search-head-es');
  if (inputs.itsi) visible.add('search-head-itsi');
  return visible;
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
  const rfManual = document.getElementById('replicationFactor') as HTMLInputElement | null;
  const sfManual = document.getElementById('searchFactor') as HTMLInputElement | null;

  if (rfManual) {
    rfManual.max = String(rfMax);
    if (Number(rfManual.value) > rfMax) rfManual.value = String(rfMax);
  }

  const rf = Number(rfManual?.value) || rfMax;
  const sfMax = Math.max(1, Math.min(rf, rfMax));

  if (sfManual) {
    sfManual.max = String(sfMax);
    if (Number(sfManual.value) > sfMax) sfManual.value = String(sfMax);
  }
}

function readClusterFactors(): { replicationFactor: number; searchFactor: number } {
  return {
    replicationFactor: num('replicationFactor'),
    searchFactor: num('searchFactor'),
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
    clusterReplication: checked('clusterReplication'),
    replicationFactor,
    searchFactor,
    esShc: checked('esShc'),
    esShcMembers: num('esShcMembers'),
    itsiShc: checked('itsiShc'),
    itsiShcMembers: num('itsiShcMembers'),
    environment: val('environment') as PlannerInputs['environment'],
    virtualizationOverheadPct: num('virtualizationOverheadPct'),
    forwarderClientCount: num('forwarderClientCount'),
    managementManualConfig: checked('managementManualConfig'),
    dedicateDeploymentServer: checked('dedicateDeploymentServer'),
    colocateClusterManager: checked('colocateClusterManager'),
    colocateShcDeployer: checked('colocateShcDeployer'),
    dedicateLicenseManager: checked('dedicateLicenseManager'),
    dedicateMonitoringConsole: checked('dedicateMonitoringConsole'),
    manualHardwareSpec: checked('manualHardwareSpec'),
    indexerHardwareTier: val('indexerHardwareTier') as IndexerHardwareTier,
    indexerCustomSpec: readHardwareOverrideValues('indexerCustom'),
    roleHardwareOverrides: readRoleHardwareOverrides(),
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
  const auto = checked('autoClusterEstimation');
  const count =
    indexerCount ??
    resolveTopologySettings(normalizePlannerInputs(readInputs())).indexerCount;
  // Item 6: the Cluster Replication toggle only appears in manual mode with > 1 indexer.
  const showReplicationToggle = !single && !auto && count > 1;
  setVisible('cluster-replication-row', showReplicationToggle);
  // Item 7: auto mode hides RF/SF entirely; manual mode shows them only when
  // Cluster Replication is enabled.
  const showRfSf = showReplicationToggle && checked('clusterReplication');
  setVisible('cluster-rf-sf', showRfSf);
}

function updateSearchHeadAuto(inputs?: PlannerInputs): void {
  const single = checked('singleServerDeployment');
  const auto = checked('autoClusterEstimation');
  const countEl = document.getElementById('searchHeadCount') as HTMLInputElement | null;
  const hint = document.getElementById('search-head-auto-hint');
  // Item 4: hide the search head quantity field entirely in auto mode (value is
  // still computed behind the scenes for the engine).
  setVisible('search-head-count-field', !single && !auto);
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

function updateEnvironmentPanel(): void {
  setVisible('virtualization-overhead-field', val('environment') === 'virtual');
  updateManualHardwarePanel();
}

function updateManualHardwarePanel(): void {
  const manual = checked('manualHardwareSpec');
  setVisible('manual-hardware-controls', manual);
  if (!manual) return;

  const tier = val('indexerHardwareTier');
  setVisible('indexerCustom-fields', tier === 'custom');

  const inputs = normalizePlannerInputs(readInputs());
  const settings = resolveTopologySettings(inputs);
  const tierLabel = document.getElementById('indexer-tier-label');
  if (tierLabel) {
    tierLabel.textContent = settings.singleServer
      ? t('planner.field.indexerHardwareTierCombined')
      : t('planner.field.indexerHardwareTier');
  }

  const visibleRoles = getVisibleHardwareOverrideRoles(inputs);
  for (const role of HARDWARE_OVERRIDE_ROLES) {
    setVisible(`hw-role-${role}`, visibleRoles.has(role));
    if (visibleRoles.has(role)) {
      setVisible(`hw-${role}-fields`, checked(`hw-${role}-enabled`));
    }
  }
}

function updatePremiumPanel(): void {
  // Item 8: per-app SHC controls only apply to a distributed/manual deployment.
  const single = checked('singleServerDeployment');
  const auto = checked('autoClusterEstimation');
  const manualDistributed = !single && !auto;
  const es = checked('enterpriseSecurity');
  const itsi = checked('itsi');
  setVisible('es-shc-controls', manualDistributed && es);
  setVisible('es-shc-members-field', manualDistributed && es && checked('esShc'));
  setVisible('itsi-shc-controls', manualDistributed && itsi);
  setVisible('itsi-shc-members-field', manualDistributed && itsi && checked('itsiShc'));
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
  updatePremiumPanel();
  updateManualHardwarePanel();

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
  setVisible('panel-management', !single);
  setVisible('management-manual-fields', manual && !single);
  setVisible('management-auto-summary', !manual && !single);

  const resolved = resolveTopologySettings(normalizePlannerInputs(readInputs()));
  setVisible('mgmt-colocate-cm', manual && resolved.isClustered && resolved.indexerCount > 1);
  setVisible('mgmt-colocate-deployer', manual && resolved.isClustered);
  updateManualHardwarePanel();
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
  if (resultsContainer) {
    // Item 0: preserve the reader's scroll position and which result sections
    // are expanded across the full re-render.
    const resultsColumn = document.getElementById('results-column');
    const prevScroll = resultsColumn?.scrollTop ?? 0;
    const prevOpen = Array.from(resultsContainer.querySelectorAll('details')).map(
      (d) => (d as HTMLDetailsElement).open,
    );
    resultsContainer.innerHTML = renderResults(result);
    const nextDetails = resultsContainer.querySelectorAll('details');
    nextDetails.forEach((d, i) => {
      if (i < prevOpen.length) (d as HTMLDetailsElement).open = prevOpen[i];
    });
    if (resultsColumn) resultsColumn.scrollTop = prevScroll;
  }

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

function indexerTierOptions(selected: IndexerHardwareTier): string {
  const tiers: { value: IndexerHardwareTier; key: string }[] = [
    { value: 'min', key: 'planner.field.indexerTierMin' },
    { value: 'mid', key: 'planner.field.indexerTierMid' },
    { value: 'high', key: 'planner.field.indexerTierHigh' },
    { value: 'custom', key: 'planner.field.indexerTierCustom' },
  ];
  return tiers
    .map(
      (tier) =>
        `<option value="${tier.value}" ${selected === tier.value ? 'selected' : ''}>${escapeHtml(t(tier.key))}</option>`,
    )
    .join('');
}

function renderPlannerSectionNavLinks(): string {
  const sections = [
    { id: 'panel-workload', labelKey: 'planner.panels.workload' },
    { id: 'panel-retention', labelKey: 'planner.panels.retention' },
    { id: 'panel-premium', labelKey: 'planner.panels.premium' },
    { id: 'panel-topology', labelKey: 'planner.panels.topology' },
    { id: 'panel-management', labelKey: 'planner.panels.management' },
    { id: 'panel-environment', labelKey: 'planner.panels.environment' },
  ];
  return `<ul class="planner-section-nav-list">${sections
    .map(
      (s) =>
        `<li><a href="#${s.id}" class="planner-section-nav-link" data-section="${s.id}">${escapeHtml(t(s.labelKey))}</a></li>`,
    )
    .join('')}</ul>`;
}

function renderPlannerSectionChips(): string {
  const sections = [
    { id: 'panel-workload', labelKey: 'planner.panels.workload' },
    { id: 'panel-retention', labelKey: 'planner.panels.retention' },
    { id: 'panel-premium', labelKey: 'planner.panels.premium' },
    { id: 'panel-topology', labelKey: 'planner.panels.topology' },
    { id: 'panel-management', labelKey: 'planner.panels.management' },
    { id: 'panel-environment', labelKey: 'planner.panels.environment' },
  ];
  return `<div class="planner-section-chips">${sections
    .map(
      (s) =>
        `<a href="#${s.id}" class="planner-section-chip" data-section="${s.id}">${escapeHtml(t(s.labelKey))}</a>`,
    )
    .join('')}</div>`;
}

function bindPlannerSectionNav(): void {
  document.querySelectorAll('.planner-section-nav-link, .planner-section-chip').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = (link as HTMLElement).dataset.section;
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll('.planner-section-nav-link, .planner-section-chip').forEach((el) => {
        el.classList.toggle('is-active', (el as HTMLElement).dataset.section === id);
      });
    });
  });
}

function renderApp(container: HTMLElement, initial: PlannerInputs): void {
  const n = normalizePlannerInputs(initial);
  const roleOverridesHtml = HARDWARE_OVERRIDE_ROLES.map((role) =>
    renderRoleHardwareOverride(
      role,
      n.roleHardwareOverrides?.[role] ?? {
        enabled: false,
        values: defaultHardwareOverrideValues(role),
      },
    ),
  ).join('');

  container.innerHTML = `
    ${renderNav('planner')}
    <div class="planner-shell">
      <div class="planner-summary-strip">
        <div class="summary-bar" id="summary-content"></div>
      </div>
      ${renderPlannerSectionChips()}
      <div class="planner-body">
        <nav class="planner-section-nav" aria-label="Sections">${renderPlannerSectionNavLinks()}</nav>
        <div class="planner-form-column">
          <h1 class="planner-page-title">${escapeHtml(t('planner.title'))}</h1>
          <form id="planner-form" class="wizard">
        <section class="panel" id="panel-workload">
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

        <section class="panel" id="panel-retention">
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

        <section class="panel" id="panel-premium">
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

        <section class="panel" id="panel-topology">
          <div class="panel-body">
            <div class="checkbox-row">
              <input type="checkbox" id="singleServerDeployment" ${n.singleServerDeployment ? 'checked' : ''} />
              <label for="singleServerDeployment">${escapeHtml(t('planner.field.singleServerDeployment'))}</label>
            </div>
            <div id="topology-distributed-fields" class="${n.singleServerDeployment ? 'is-hidden' : ''}">
              <div class="checkbox-row">
                <input type="checkbox" id="autoClusterEstimation" ${n.autoClusterEstimation ? 'checked' : ''} />
                <label for="autoClusterEstimation">${escapeHtml(t('planner.field.autoClusterEstimation'))}</label>
              </div>
              <p class="field-hint" id="inferred-prefix-hint"></p>
              <p class="field-hint"><strong id="inferred-prefix-result">—</strong></p>
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
              <div class="checkbox-row is-hidden" id="cluster-replication-row">
                <input type="checkbox" id="clusterReplication" ${n.clusterReplication ? 'checked' : ''} />
                <label for="clusterReplication">${escapeHtml(t('planner.field.clusterReplication'))}</label>
              </div>
              <div id="cluster-rf-sf" class="grid-2 cluster-rf-sf">
                <div class="field">
                  <label for="replicationFactor">${escapeHtml(t('planner.field.replicationFactor'))}</label>
                  <input type="number" id="replicationFactor" min="1" max="${MAX_RF_SF}" value="${n.replicationFactor}" />
                  <p class="field-hint">${escapeHtml(t('planner.field.rfHint'))}</p>
                </div>
                <div class="field">
                  <label for="searchFactor">${escapeHtml(t('planner.field.searchFactor'))}</label>
                  <input type="number" id="searchFactor" min="1" max="${MAX_RF_SF}" value="${n.searchFactor}" />
                  <p class="field-hint">${escapeHtml(t('planner.field.sfHint'))}</p>
                </div>
              </div>
              <div class="premium-shc-controls">
                <div class="checkbox-row">
                  <input type="checkbox" id="searchHeadCluster" ${n.searchHeadCluster ? 'checked' : ''} />
                  <label for="searchHeadCluster">${escapeHtml(t('planner.field.searchHeadCluster', { min: SIZING.MIN_SHC_MEMBERS }))}</label>
                </div>
                <div class="field" id="search-head-count-field">
                  <label for="searchHeadCount">${escapeHtml(t('planner.field.searchHeadCount'))}</label>
                  <input type="number" id="searchHeadCount" min="1" max="${MAX_INDEXERS}" value="${n.searchHeadCount}" />
                  <p class="field-hint" id="search-head-auto-hint"></p>
                </div>
              </div>
              <div id="es-shc-controls" class="is-hidden premium-shc-controls">
                <div class="checkbox-row">
                  <input type="checkbox" id="esShc" ${n.esShc ? 'checked' : ''} />
                  <label for="esShc">${escapeHtml(t('planner.field.esShc'))}</label>
                </div>
                <div class="field" id="es-shc-members-field">
                  <label for="esShcMembers">${escapeHtml(t('planner.field.esShcMembers'))}</label>
                  <input type="number" id="esShcMembers" min="${SIZING.MIN_SHC_MEMBERS}" max="${MAX_INDEXERS}" value="${n.esShcMembers}" />
                </div>
              </div>
              <div id="itsi-shc-controls" class="is-hidden premium-shc-controls">
                <div class="checkbox-row">
                  <input type="checkbox" id="itsiShc" ${n.itsiShc ? 'checked' : ''} />
                  <label for="itsiShc">${escapeHtml(t('planner.field.itsiShc'))}</label>
                </div>
                <div class="field" id="itsi-shc-members-field">
                  <label for="itsiShcMembers">${escapeHtml(t('planner.field.itsiShcMembers'))}</label>
                  <input type="number" id="itsiShcMembers" min="${SIZING.MIN_SHC_MEMBERS}" max="${MAX_INDEXERS}" value="${n.itsiShcMembers}" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="panel" id="panel-management">
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

        <section class="panel" id="panel-environment">
          <div class="panel-body">
            <div class="field">
              <label for="environment">${escapeHtml(t('planner.field.environment'))}</label>
              <select id="environment">
                <option value="physical" ${n.environment === 'physical' ? 'selected' : ''}>${escapeHtml(t('planner.field.environmentPhysical'))}</option>
                <option value="virtual" ${n.environment === 'virtual' ? 'selected' : ''}>${escapeHtml(t('planner.field.environmentVirtual'))}</option>
              </select>
            </div>
            <div class="field ${n.environment === 'virtual' ? '' : 'is-hidden'}" id="virtualization-overhead-field">
              <label for="virtualizationOverheadPct">${escapeHtml(t('planner.field.virtualizationOverheadPct'))}</label>
              <input type="number" id="virtualizationOverheadPct" min="0" max="100" step="1" value="${n.virtualizationOverheadPct}" />
              <p class="field-hint">${escapeHtml(t('planner.field.virtualizationOverheadHint'))}</p>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="manualHardwareSpec" ${n.manualHardwareSpec ? 'checked' : ''} />
              <label for="manualHardwareSpec">${escapeHtml(t('planner.field.manualHardwareSpec'))}</label>
            </div>
            <div id="manual-hardware-controls" class="${n.manualHardwareSpec ? 'premium-shc-controls' : 'is-hidden premium-shc-controls'}">
              <p class="field-hint">${escapeHtml(t('planner.field.manualHardwareHint'))}</p>
              <div class="field" id="indexer-tier-field">
                <label for="indexerHardwareTier" id="indexer-tier-label">${escapeHtml(
                  n.singleServerDeployment
                    ? t('planner.field.indexerHardwareTierCombined')
                    : t('planner.field.indexerHardwareTier'),
                )}</label>
                <select id="indexerHardwareTier">${indexerTierOptions(n.indexerHardwareTier)}</select>
              </div>
              ${renderHardwareValueFields('indexerCustom', n.indexerCustomSpec, n.indexerHardwareTier !== 'custom')}
              ${roleOverridesHtml}
            </div>
          </div>
        </section>
      </form>
        </div>

        <div class="planner-results-column" id="results-column">
          <div id="results-container"></div>
        </div>
      </div>

      <footer class="app-footer">
        <p class="field-hint">${escapeHtml(t('planner.disclaimer'))}</p>
      </footer>
    </div>

    <button type="button" id="jump-results" class="btn jump-results is-hidden">${escapeHtml(t('planner.results.jumpToResults'))}</button>
    <div class="mobile-copy-bar">
      <button type="button" class="btn" id="copy-summary-mobile">${escapeHtml(t('planner.results.copySummaryShort'))}</button>
    </div>
  `;

  bindPanelCollapse();
  collapseMobileWizardPanels();
  bindJumpToResults();
  bindPlannerSectionNav();

  const form = document.getElementById('planner-form');
  let wasAutoCluster = checked('autoClusterEstimation');

  const onFormChange = (): void => {
    updateEpsPanel();
    updateEnvironmentPanel();
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
    // Item 6: seed sensible RF/SF defaults the first time Cluster Replication
    // is enabled in manual mode.
    if (target.id === 'manualHardwareSpec' && checked('manualHardwareSpec')) {
      const partial = readInputs();
      const tier = inferAutoIndexerTier({
        enterpriseSecurity: partial.enterpriseSecurity,
        itsi: partial.itsi,
        dailyIngestGb: partial.dailyIngestGb,
      });
      const tierEl = document.getElementById('indexerHardwareTier') as HTMLSelectElement | null;
      if (tierEl) tierEl.value = tier;
    }
    if (target.id === 'clusterReplication' && checked('clusterReplication')) {
      const count = resolveTopologySettings(normalizePlannerInputs(readInputs())).indexerCount;
      const def = defaultFactorsForIndexers(count, true);
      const rf = document.getElementById('replicationFactor') as HTMLInputElement | null;
      const sf = document.getElementById('searchFactor') as HTMLInputElement | null;
      if (rf) rf.value = String(def.replicationFactor);
      if (sf) sf.value = String(def.searchFactor);
    }
    onFormChange();
  });

  updateEpsPanel();
  updateEnvironmentPanel();
  updateTopologyPanel(n);
  updateManagementPanel();
  updateManualHardwarePanel();
  recalculate();
}

export function renderPlanner(container: HTMLElement, onLocaleChange?: () => void): void {
  renderApp(container, loadInputs());
  bindNavEvents(container, onLocaleChange);
}
