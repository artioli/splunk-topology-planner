import { t } from '../i18n';
import { escapeHtml } from '../lib/format';
import { bindNavEvents, renderNav } from '../nav';
import { filterCourses, filterCredentials, filterCredentialsForMatrix, groupByTrack, prerequisiteCount } from './catalog';
import { courses, getCredentials, manifest } from './data/load';
import { copyCsv, copyMarkdown, copyMatrixCsv } from './exportPath';
import { formatCost, formatHours, kindLabelKey, trackLabelKey } from './format';
import {
  buildCredentialMap,
  computeTeamTotals,
  defaultOrSelections,
  mergeOrSelections,
  resolvePath,
} from './pathResolver';
import {
  loadEnablementState,
  saveEnablementState,
  setFilters,
  setOrBranch,
  toggleCompleted,
  toggleTeamPlan,
} from './progress';
import type { Credential, CredentialTrack, EnablementState, PathNode } from './types';

const credentials = getCredentials();

function readState(): EnablementState {
  return loadEnablementState();
}

function badgeSrc(c: Credential): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return c.credlyBadgeImageUrl ?? `${base}badges/placeholder.svg`;
}

function renderFilters(state: EnablementState): string {
  const f = state.filters;
  return `
    <div class="enablement-filters">
      <div class="field">
        <label for="en-search">${escapeHtml(t('enablement.filter.search'))}</label>
        <input id="en-search" type="search" value="${escapeHtml(f.search)}" placeholder="${escapeHtml(t('enablement.filter.searchPlaceholder'))}" />
      </div>
      <div class="enablement-tabs" role="tablist">
        ${(['accreditations', 'certifications', 'badges', 'courses'] as const)
          .map(
            (tab) =>
              `<button type="button" class="enablement-tab ${f.tab === tab ? 'is-active' : ''}" data-tab="${tab}" role="tab">${escapeHtml(t(`enablement.tab.${tab}`))}</button>`,
          )
          .join('')}
      </div>
      <div class="field">
        <label for="en-track">${escapeHtml(t('enablement.filter.track'))}</label>
        <select id="en-track">
          <option value="all" ${f.track === 'all' ? 'selected' : ''}>${escapeHtml(t('enablement.filter.all'))}</option>
          ${(['general', 'observability', 'security', 'core'] as const)
            .map(
              (tr) =>
                `<option value="${tr}" ${f.track === tr ? 'selected' : ''}>${escapeHtml(t(trackLabelKey(tr)))}</option>`,
            )
            .join('')}
        </select>
      </div>
      <div class="field">
        <label for="en-persona">${escapeHtml(t('enablement.filter.persona'))}</label>
        <select id="en-persona">
          <option value="all" ${f.persona === 'all' ? 'selected' : ''}>${escapeHtml(t('enablement.filter.all'))}</option>
          ${(['sales', 'se', 'consultant', 'admin', 'developer'] as const)
            .map(
              (p) =>
                `<option value="${p}" ${f.persona === p ? 'selected' : ''}>${escapeHtml(t(`enablement.persona.${p}`))}</option>`,
            )
            .join('')}
        </select>
      </div>
      <label class="enablement-check">
        <input type="checkbox" id="en-partner-only" ${f.partnerOnly ? 'checked' : ''} />
        ${escapeHtml(t('enablement.filter.partnerOnly'))}
      </label>
      <label class="enablement-check">
        <input type="checkbox" id="en-hide-completed" ${f.hideCompleted ? 'checked' : ''} />
        ${escapeHtml(t('enablement.filter.hideCompleted'))}
      </label>
      <div class="field">
        <label for="en-cost-max">${escapeHtml(t('enablement.filter.costMax'))}: $${f.costMax.toLocaleString()}</label>
        <input id="en-cost-max" type="range" min="0" max="15000" step="500" value="${f.costMax}" />
      </div>
      <div class="field">
        <label for="en-time-max">${escapeHtml(t('enablement.filter.timeMax'))}: ${f.timeMax} h</label>
        <input id="en-time-max" type="range" min="0" max="300" step="5" value="${f.timeMax}" />
      </div>
    </div>`;
}

function renderCatalogItem(c: Credential, state: EnablementState): string {
  const selected = state.selectedId === c.id;
  const inTeam = state.teamPlanIds.includes(c.id);
  const done = state.completedIds.includes(c.id);
  return `
    <li class="enablement-catalog-item">
      <button type="button" class="enablement-catalog-btn ${selected ? 'is-selected' : ''} ${done ? 'is-done' : ''}" data-select-id="${escapeHtml(c.id)}">
        <span class="enablement-catalog-name">${escapeHtml(c.name)}</span>
        <span class="enablement-catalog-meta">${escapeHtml(formatHours(c.timeHours))} · ${escapeHtml(formatCost(c.costUsd))}</span>
        <span class="enablement-chips">
          ${c.partnerOnly ? `<span class="chip chip-partner">${escapeHtml(t('enablement.partner'))}</span>` : ''}
          ${c.legacy ? `<span class="chip chip-legacy">${escapeHtml(t('enablement.legacy'))}</span>` : ''}
        </span>
      </button>
      <label class="enablement-team-check" title="${escapeHtml(t('enablement.teamPlan.add'))}">
        <input type="checkbox" class="team-plan-cb" data-team-id="${escapeHtml(c.id)}" ${inTeam ? 'checked' : ''} />
        +
      </label>
    </li>`;
}

function renderCourseItem(c: { id: string; name: string; durationLabel: string; iltCostUsd?: number; iltUnits?: number }): string {
  const cost =
    c.iltCostUsd != null ? `$${c.iltCostUsd} / ${c.iltUnits ?? 0} units` : t('enablement.course.elearningOnly');
  return `
    <li class="enablement-catalog-item">
      <div class="enablement-course-row">
        <span class="enablement-catalog-name">${escapeHtml(c.name)}</span>
        <span class="enablement-catalog-meta">${escapeHtml(c.durationLabel)} · ${escapeHtml(cost)}</span>
      </div>
    </li>`;
}

function renderCatalog(state: EnablementState): string {
  if (state.filters.tab === 'courses') {
    const list = filterCourses(courses, state.filters);
    return `<ul class="enablement-catalog">${list.map(renderCourseItem).join('')}</ul>`;
  }
  const filtered = filterCredentials(credentials, state.filters, state.completedIds);
  const grouped = groupByTrack(filtered);
  const sections = [...grouped.entries()]
    .filter(([, items]) => items.length > 0)
    .map(
      ([track, items]) => `
      <section class="enablement-track-section">
        <h3 class="enablement-track-title">${escapeHtml(t(trackLabelKey(track as CredentialTrack)))}</h3>
        <ul class="enablement-catalog">${items.map((c) => renderCatalogItem(c, state)).join('')}</ul>
      </section>`,
    )
    .join('');
  return sections || `<p class="field-hint">${escapeHtml(t('enablement.catalog.empty'))}</p>`;
}

function renderPathNode(node: PathNode): string {
  const c = node.credential;
  const done = node.completed;
  return `
    <div class="path-node ${done ? 'is-done' : ''}" data-level="${node.level}">
      <img class="path-node-badge" src="${escapeHtml(badgeSrc(c))}" alt="" width="72" height="72" loading="lazy" />
      <div class="path-node-body">
        <span class="chip chip-kind">${escapeHtml(t(kindLabelKey(c.kind)))}</span>
        ${c.partnerOnly ? `<span class="chip chip-partner">${escapeHtml(t('enablement.partner'))}</span>` : ''}
        <h4 class="path-node-title">${escapeHtml(c.name)}</h4>
        <p class="path-node-meta">${escapeHtml(formatHours(c.timeHours))} · ${escapeHtml(formatCost(c.costUsd))}</p>
        <div class="path-node-links">
          ${c.mindtickleUrl ? `<a href="${escapeHtml(c.mindtickleUrl)}" target="_blank" rel="noopener noreferrer">Mindtickle</a>` : ''}
          ${c.splunkUrl ? `<a href="${escapeHtml(c.splunkUrl)}" target="_blank" rel="noopener noreferrer">Splunk</a>` : ''}
          ${c.credlyPageUrl ? `<a href="${escapeHtml(c.credlyPageUrl)}" target="_blank" rel="noopener noreferrer">Credly</a>` : ''}
        </div>
        <label class="enablement-check path-complete-check">
          <input type="checkbox" class="complete-cb" data-complete-id="${escapeHtml(c.id)}" ${done ? 'checked' : ''} />
          ${escapeHtml(t('enablement.markComplete'))}
        </label>
      </div>
    </div>`;
}

function renderOrBranches(state: EnablementState, targetId: string): string {
  const target = credentials.find((c) => c.id === targetId);
  if (!target) return '';
  const path = resolvePath(targetId, credentials, {
    orSelections: state.orBranchSelections,
    completedIds: state.completedIds,
  });
  if (!path.orBranches.length) return '';
  const grouped = new Map<string, typeof path.orBranches>();
  for (const b of path.orBranches) {
    const prefix = b.id.replace(/-or-\d+$/, '');
    const list = grouped.get(prefix) ?? [];
    list.push(b);
    grouped.set(prefix, list);
  }
  return [...grouped.entries()]
    .map(([prefix, branches]) => {
      const selected = state.orBranchSelections[prefix] ?? 'or-0';
      return `
      <div class="or-branch-group">
        <p class="or-branch-label">${escapeHtml(t('enablement.orBranch.label'))}</p>
        <div class="or-branch-options">
          ${branches
            .map((b, i) => {
              const val = `or-${i}`;
              const active = selected === val;
              return `<button type="button" class="or-branch-btn ${active ? 'is-active' : ''}" data-or-prefix="${escapeHtml(prefix)}" data-or-value="${val}">${escapeHtml(b.label)} (${escapeHtml(formatCost(b.costUsd))})</button>`;
            })
            .join('')}
        </div>
      </div>`;
    })
    .join('');
}

function renderSummary(path: ReturnType<typeof resolvePath>, state: EnablementState): string {
  const totals = path.remainingTotals ?? path.totals;
  const teamTotals =
    state.teamPlanIds.length > 0
      ? computeTeamTotals(state.teamPlanIds, credentials, state.orBranchSelections, state.completedIds)
      : null;
  return `
    <div class="enablement-summary">
      <div class="enablement-summary-item">
        <span class="enablement-summary-label">${escapeHtml(t('enablement.summary.time'))}</span>
        <strong>${escapeHtml(formatHours(totals.timeHours))}</strong>
      </div>
      <div class="enablement-summary-item">
        <span class="enablement-summary-label">${escapeHtml(t('enablement.summary.cost'))}</span>
        <strong>${escapeHtml(formatCost(totals.costUsd))}</strong>
      </div>
      <div class="enablement-summary-item">
        <span class="enablement-summary-label">${escapeHtml(t('enablement.summary.steps'))}</span>
        <strong>${totals.nodeCount}</strong>
      </div>
      ${teamTotals ? `<div class="enablement-summary-item enablement-summary-team"><span class="enablement-summary-label">${escapeHtml(t('enablement.summary.team'))}</span><strong>${escapeHtml(formatHours(teamTotals.timeHours))} · ${escapeHtml(formatCost(teamTotals.costUsd))}</strong></div>` : ''}
      <div class="enablement-summary-item enablement-summary-updated">
        <span class="field-hint">${escapeHtml(t('enablement.summary.updated', { date: manifest.lastUpdated }))}</span>
      </div>
    </div>`;
}

function renderPathMap(state: EnablementState): string {
  if (!state.selectedId) {
    return `<p class="enablement-empty">${escapeHtml(t('enablement.selectPrompt'))}</p>`;
  }
  const target = credentials.find((c) => c.id === state.selectedId);
  if (!target) return '';
  const orSelections = mergeOrSelections(
    defaultOrSelections(target, buildCredentialMap(credentials), 'cheapest'),
    state.orBranchSelections,
  );
  const path = resolvePath(state.selectedId, credentials, {
    orSelections,
    completedIds: state.completedIds,
  });
  const maxLevel = Math.max(...path.nodes.map((n) => n.level), 0);
  const layers: PathNode[][] = [];
  for (let i = maxLevel; i >= 0; i--) {
    layers.push(path.nodes.filter((n) => n.level === i));
  }
  const guideCallout =
    target.track === 'observability'
      ? `<p class="enablement-callout">${escapeHtml(t('enablement.callout.observability'))} <a href="#guide">${escapeHtml(t('enablement.callout.guideLink'))}</a></p>`
      : '';
  return `
    ${renderSummary(path, state)}
    ${renderOrBranches(state, state.selectedId)}
    ${guideCallout}
    <div class="path-map">
      ${layers
        .map(
          (layer, idx) => `
        <div class="path-map-layer" data-layer="${idx}">
          ${idx < layers.length - 1 ? '<div class="path-map-connector" aria-hidden="true"></div>' : ''}
          <div class="path-map-row">${layer.map(renderPathNode).join('')}</div>
        </div>`,
        )
        .join('')}
    </div>
    <div class="enablement-export">
      <button type="button" id="en-copy-md" class="btn-secondary">${escapeHtml(t('enablement.export.markdown'))}</button>
      <button type="button" id="en-copy-csv" class="btn-secondary">${escapeHtml(t('enablement.export.csv'))}</button>
    </div>`;
}

function renderMatrix(state: EnablementState): string {
  const unique = filterCredentialsForMatrix(credentials, state.filters, state.completedIds);
  const rows = unique
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (c) => `
      <tr class="matrix-row" data-matrix-id="${escapeHtml(c.id)}">
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(t(kindLabelKey(c.kind)))}</td>
        <td>${escapeHtml(t(trackLabelKey(c.track)))}</td>
        <td>${escapeHtml(formatHours(c.timeHours))}</td>
        <td>${escapeHtml(formatCost(c.costUsd))}</td>
        <td>${prerequisiteCount(c)}</td>
        <td>${c.partnerOnly ? escapeHtml(t('enablement.yes')) : '—'}</td>
      </tr>`,
    )
    .join('');
  return `
    <div class="enablement-matrix-wrap">
      <table class="enablement-matrix">
        <thead>
          <tr>
            <th>${escapeHtml(t('enablement.matrix.name'))}</th>
            <th>${escapeHtml(t('enablement.matrix.kind'))}</th>
            <th>${escapeHtml(t('enablement.matrix.track'))}</th>
            <th>${escapeHtml(t('enablement.matrix.time'))}</th>
            <th>${escapeHtml(t('enablement.matrix.cost'))}</th>
            <th>${escapeHtml(t('enablement.matrix.prereqs'))}</th>
            <th>${escapeHtml(t('enablement.matrix.partner'))}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <button type="button" id="en-copy-matrix" class="btn-secondary">${escapeHtml(t('enablement.export.matrixCsv'))}</button>
    </div>`;
}

function renderMain(state: EnablementState): string {
  const target = state.selectedId ? credentials.find((c) => c.id === state.selectedId) : null;
  const title = target?.name ?? t('enablement.pathTitle');
  return `
    <div class="enablement-main">
      <header class="enablement-main-header">
        <h1 class="splunk-h2">${escapeHtml(title)}</h1>
        <div class="enablement-view-toggle">
          <button type="button" class="btn-secondary ${state.viewMode === 'path' ? 'is-active' : ''}" data-view="path">${escapeHtml(t('enablement.view.path'))}</button>
          <button type="button" class="btn-secondary ${state.viewMode === 'matrix' ? 'is-active' : ''}" data-view="matrix">${escapeHtml(t('enablement.view.matrix'))}</button>
        </div>
      </header>
      ${state.viewMode === 'path' ? renderPathMap(state) : renderMatrix(state)}
      <footer class="enablement-disclaimer">
        <p class="field-hint">${escapeHtml(t('enablement.disclaimer'))}</p>
        <p class="field-hint">${escapeHtml(t('enablement.credlyNotice'))}</p>
      </footer>
    </div>`;
}

function bindEnablementEvents(container: HTMLElement, onLocaleChange?: () => void): void {
  const rerender = () => {
    const state = readState();
    renderEnablement(container, onLocaleChange);
    saveEnablementState(state);
  };

  const patchFilters = (patch: Partial<EnablementState['filters']>) => {
    const state = setFilters(readState(), patch);
    saveEnablementState(state);
    renderEnablement(container, onLocaleChange);
  };

  container.querySelector('#en-search')?.addEventListener('input', (e) => {
    patchFilters({ search: (e.target as HTMLInputElement).value });
  });

  container.querySelectorAll('[data-tab]').forEach((el) => {
    el.addEventListener('click', () => patchFilters({ tab: (el as HTMLElement).dataset.tab as EnablementState['filters']['tab'] }));
  });

  container.querySelector('#en-track')?.addEventListener('change', (e) => {
    patchFilters({ track: (e.target as HTMLSelectElement).value as EnablementState['filters']['track'] });
  });

  container.querySelector('#en-persona')?.addEventListener('change', (e) => {
    patchFilters({ persona: (e.target as HTMLSelectElement).value as EnablementState['filters']['persona'] });
  });

  container.querySelector('#en-partner-only')?.addEventListener('change', (e) => {
    patchFilters({ partnerOnly: (e.target as HTMLInputElement).checked });
  });

  container.querySelector('#en-hide-completed')?.addEventListener('change', (e) => {
    patchFilters({ hideCompleted: (e.target as HTMLInputElement).checked });
  });

  container.querySelector('#en-cost-max')?.addEventListener('input', (e) => {
    patchFilters({ costMax: Number((e.target as HTMLInputElement).value) });
  });

  container.querySelector('#en-time-max')?.addEventListener('input', (e) => {
    patchFilters({ timeMax: Number((e.target as HTMLInputElement).value) });
  });

  container.querySelectorAll('[data-select-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const state = { ...readState(), selectedId: (el as HTMLElement).dataset.selectId ?? null, viewMode: 'path' as const };
      saveEnablementState(state);
      renderEnablement(container, onLocaleChange);
    });
  });

  container.querySelectorAll('.team-plan-cb').forEach((el) => {
    el.addEventListener('change', (e) => {
      const id = (el as HTMLInputElement).dataset.teamId!;
      const state = toggleTeamPlan(readState(), id, (e.target as HTMLInputElement).checked);
      saveEnablementState(state);
      renderEnablement(container, onLocaleChange);
    });
  });

  container.querySelectorAll('.complete-cb').forEach((el) => {
    el.addEventListener('change', (e) => {
      const id = (el as HTMLInputElement).dataset.completeId!;
      const state = toggleCompleted(readState(), id, (e.target as HTMLInputElement).checked);
      saveEnablementState(state);
      renderEnablement(container, onLocaleChange);
    });
  });

  container.querySelectorAll('.or-branch-btn').forEach((el) => {
    el.addEventListener('click', () => {
      const prefix = (el as HTMLElement).dataset.orPrefix!;
      const value = (el as HTMLElement).dataset.orValue!;
      const state = setOrBranch(readState(), prefix, value);
      saveEnablementState(state);
      renderEnablement(container, onLocaleChange);
    });
  });

  container.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', () => {
      const state = { ...readState(), viewMode: (el as HTMLElement).dataset.view as 'path' | 'matrix' };
      saveEnablementState(state);
      renderEnablement(container, onLocaleChange);
    });
  });

  container.querySelectorAll('.matrix-row').forEach((el) => {
    el.addEventListener('click', () => {
      const state = {
        ...readState(),
        selectedId: (el as HTMLElement).dataset.matrixId ?? null,
        viewMode: 'path' as const,
      };
      saveEnablementState(state);
      renderEnablement(container, onLocaleChange);
    });
  });

  container.querySelector('#en-copy-md')?.addEventListener('click', async () => {
    const state = readState();
    if (!state.selectedId) return;
    const path = resolvePath(state.selectedId, credentials, {
      orSelections: state.orBranchSelections,
      completedIds: state.completedIds,
    });
    await copyMarkdown(path);
  });

  container.querySelector('#en-copy-csv')?.addEventListener('click', async () => {
    const state = readState();
    if (!state.selectedId) return;
    const path = resolvePath(state.selectedId, credentials, {
      orSelections: state.orBranchSelections,
      completedIds: state.completedIds,
    });
    await copyCsv(path);
  });

  container.querySelector('#en-copy-matrix')?.addEventListener('click', async () => {
    await copyMatrixCsv(credentials);
  });

  bindNavEvents(container, onLocaleChange ?? rerender);
}

export function renderEnablement(container: HTMLElement, onLocaleChange?: () => void): void {
  const state = readState();
  container.innerHTML = `
    ${renderNav('enablement')}
    <div class="enablement-shell app-viewport">
      <header class="enablement-hero prose-measure">
        <p class="splunk-eyebrow">${escapeHtml(t('enablement.eyebrow'))}</p>
        <h1 class="splunk-h1">${escapeHtml(t('enablement.title'))}</h1>
        <p class="splunk-subhead-lg">${escapeHtml(t('enablement.subtitle'))}</p>
      </header>
      <div class="enablement-body">
        <aside class="enablement-sidebar">
          ${renderFilters(state)}
          <div class="enablement-catalog-wrap">${renderCatalog(state)}</div>
        </aside>
        ${renderMain(state)}
      </div>
    </div>`;
  bindEnablementEvents(container, onLocaleChange);
}
