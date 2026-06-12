import {
  profileDescriptionKey,
  profileLabelKey,
  stepPhaseKey,
  stepTitleKey,
  t,
} from '../i18n';
import { escapeHtml } from '../lib/format';
import { loadPlannerHandoff } from '../lib/plannerHandoff';
import { getHashParams, bindNavEvents, renderNav } from '../nav';
import { DEPLOYMENT_PROFILES, getProfile } from './profiles';
import { defaultHostConfig, hostByRole } from './hostDefaults';
import {
  isStepComplete,
  loadGuideState,
  saveGuideState,
  setSkipValidation,
  toggleStepComplete,
  toggleValidationCheck,
  validationsComplete,
} from './progress';
import { substitute, substituteCommands } from './substitute';
import { filterStepsForProfile, targetLabel } from './steps';
import type {
  DeploymentProfileId,
  GuideBlock,
  GuideState,
  GuideStep,
  HostConfig,
  LinuxDistro,
  StepValidation,
} from './types';

function handoffSubstitutions(): Record<string, string> {
  const handoff = loadPlannerHandoff();
  return {
    RF: String(handoff?.replicationFactor ?? 3),
    SF: String(handoff?.searchFactor ?? 2),
  };
}

function blockVisible(block: GuideBlock, distro: LinuxDistro): boolean {
  if (!block.distros?.length) return true;
  return block.distros.includes(distro);
}

function readHostConfigFromForm(state: GuideState): HostConfig {
  const config = { ...state.hostConfig, hosts: [...state.hostConfig.hosts] };
  const osUser = (document.getElementById('cfg-os-user') as HTMLInputElement)?.value;
  const adminPw = (document.getElementById('cfg-admin-password') as HTMLInputElement)?.value;
  const clusterSecret = (document.getElementById('cfg-cluster-secret') as HTMLInputElement)?.value;
  const splunkVersion = (document.getElementById('cfg-splunk-version') as HTMLInputElement)?.value;
  if (osUser) config.osUser = osUser;
  if (adminPw) config.adminPassword = adminPw;
  if (clusterSecret) config.clusterSecret = clusterSecret;
  if (splunkVersion) {
    config.splunkVersion = splunkVersion;
    config.splunkTgz = `splunk-${splunkVersion}-linux-amd64.tgz`;
  }
  document.querySelectorAll<HTMLInputElement>('[data-host-role]').forEach((el) => {
    const role = el.dataset.hostRole!;
    const field = el.dataset.hostField as 'hostname' | 'ip';
    const host = config.hosts.find((h) => h.role === role);
    if (host && el.value) host[field] = el.value;
  });
  return config;
}

function formatInlineMarkdown(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderBlock(block: GuideBlock, config: HostConfig, distro: LinuxDistro): string {
  if (!blockVisible(block, distro)) return '';
  const extra = handoffSubstitutions();
  const raw = t(block.contentKey);
  const content = substitute(raw, config, extra);
  if (block.type === 'warning') {
    return `<div class="guide-warning">${formatInlineMarkdown(escapeHtml(content))}</div>`;
  }
  if (block.type === 'commands') {
    const cmds = substituteCommands(block.commands ?? [], config, extra);
    const intro = content ? `<p>${formatInlineMarkdown(escapeHtml(content))}</p>` : '';
    if (block.copyAsBlock) {
      const text = cmds.join('\n');
      return `${intro}<div class="command-row command-row--block"><pre class="command-block">${escapeHtml(text)}</pre><button type="button" class="btn-copy">${escapeHtml(t('guide.copyBlock'))}</button></div>`;
    }
    const lines = cmds
      .map(
        (c) =>
          `<div class="command-row"><pre class="command-block">${escapeHtml(c)}</pre><button type="button" class="btn-copy">${escapeHtml(t('guide.copy'))}</button></div>`,
      )
      .join('');
    return `${intro}<div class="command-list">${lines}</div>`;
  }
  return `<p>${formatInlineMarkdown(escapeHtml(content))}</p>`;
}

function renderHostConfig(profileId: DeploymentProfileId, config: HostConfig): string {
  const profile = getProfile(profileId);
  if (!profile) return '';
  const cards = profile.hostRoles
    .map((role) => {
      const h = hostByRole(config, role);
      if (!h) return '';
      return `<div class="host-card">
        <div class="host-card-label">${escapeHtml(h.label)}</div>
        <div class="field"><label>${escapeHtml(t('guide.hostname'))}</label><input type="text" data-host-role="${role}" data-host-field="hostname" value="${escapeHtml(h.hostname)}" /></div>
        <div class="field"><label>${escapeHtml(t('guide.hostIp'))}</label><input type="text" data-host-role="${role}" data-host-field="ip" value="${escapeHtml(h.ip)}" /></div>
      </div>`;
    })
    .join('');
  const rows = profile.hostRoles
    .map((role) => {
      const h = hostByRole(config, role);
      if (!h) return '';
      return `<tr>
        <td>${escapeHtml(h.label)}</td>
        <td><input type="text" data-host-role="${role}" data-host-field="hostname" value="${escapeHtml(h.hostname)}" /></td>
        <td><input type="text" data-host-role="${role}" data-host-field="ip" value="${escapeHtml(h.ip)}" /></td>
      </tr>`;
    })
    .join('');
  return `
    <div class="host-cards">${cards}</div>
    <div class="table-scroll host-table-wrap"><table class="host-table"><thead><tr><th>${escapeHtml(t('guide.hostRole'))}</th><th>${escapeHtml(t('guide.hostname'))}</th><th>${escapeHtml(t('guide.hostIp'))}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderDocLinks(links: GuideStep['docLinks']): string {
  return links
    .map(
      (d) =>
        `<a class="doc-link-chip" href="${d.url}" target="_blank" rel="noopener">${escapeHtml(t(d.labelKey))}</a>`,
    )
    .join('');
}

function renderValidationRow(v: StepValidation, step: GuideStep, state: GuideState): string {
  const extra = handoffSubstitutions();
  const checked = (state.validatedChecks[step.id] ?? []).includes(v.id);
  const label = substitute(t(v.labelKey), state.hostConfig, extra);
  const expect = v.expectKey ? substitute(t(v.expectKey), state.hostConfig, extra) : '';
  const cmd = v.command ? substitute(v.command, state.hostConfig, extra) : '';
  const cmdRow = cmd
    ? `<div class="command-row validation-cmd"><pre class="command-block">${escapeHtml(cmd)}</pre><button type="button" class="btn-copy">${escapeHtml(t('guide.copy'))}</button></div>`
    : '';
  const expectHint = expect ? `<p class="validation-expect">${formatInlineMarkdown(escapeHtml(expect))}</p>` : '';
  const pasteArea = v.expectPattern
    ? `<div class="validation-paste">
        <textarea class="validation-output" data-step-id="${step.id}" data-validation-id="${v.id}" rows="2" placeholder="${escapeHtml(t('guide.validations.pastePlaceholder'))}"></textarea>
        <button type="button" class="btn-secondary validation-check-btn" data-step-id="${step.id}" data-validation-id="${v.id}">${escapeHtml(t('guide.validations.checkOutput'))}</button>
        <span class="validation-result" data-step-id="${step.id}" data-validation-id="${v.id}"></span>
      </div>`
    : '';
  return `
    <div class="validation-row ${v.optional ? 'validation-row--optional' : ''}" data-validation-id="${v.id}">
      <label class="validation-label">
        <input type="checkbox" class="validation-cb" data-step-id="${step.id}" data-validation-id="${v.id}" ${checked ? 'checked' : ''} />
        ${formatInlineMarkdown(escapeHtml(label))}${v.optional ? ` <span class="field-hint">(${escapeHtml(t('guide.validations.optional'))})</span>` : ''}
      </label>
      ${cmdRow}
      ${expectHint}
      ${pasteArea}
    </div>`;
}

function renderValidations(step: GuideStep, state: GuideState): string {
  if (!step.validations.length) return '';
  const rows = step.validations.map((v) => renderValidationRow(v, step, state)).join('');
  const skipChecked = state.skipValidationSteps.includes(step.id);
  const canComplete = validationsComplete(state, step);
  return `
    <div class="step-validations">
      <h4 class="step-validations-title">${escapeHtml(t('guide.validations.title'))}</h4>
      ${rows}
      <label class="validation-skip-lab">
        <input type="checkbox" class="validation-skip-cb" data-step-id="${step.id}" ${skipChecked ? 'checked' : ''} />
        ${escapeHtml(t('guide.validations.skipLab'))}
      </label>
      ${!canComplete ? `<p class="validation-blocked-hint">${escapeHtml(t('guide.validations.completeBlocked'))}</p>` : ''}
    </div>`;
}

function renderStepViewContent(step: GuideStep, state: GuideState): string {
  const done = isStepComplete(state, step.id);
  const phase = t(stepPhaseKey(step.id));
  const title = t(stepTitleKey(step.id));
  const targets = step.targets.map((tg) => `<span class="target-chip">${escapeHtml(targetLabel(tg))}</span>`).join('');
  const blocks = step.blocks.map((b) => renderBlock(b, state.hostConfig, state.linuxDistro)).join('');
  const canComplete = validationsComplete(state, step);
  return `
    <article class="guide-step-view" data-step-id="${step.id}" id="step-${step.id}">
      <p class="guide-step-phase">${escapeHtml(phase)}</p>
      <h2 class="guide-step-title">${escapeHtml(title)}</h2>
      <div class="step-meta">
        <div class="target-chips">${targets}</div>
        <div class="doc-links">${renderDocLinks(step.docLinks)}</div>
      </div>
      ${blocks}
      ${renderValidations(step, state)}
      <div class="step-footer">
        <label class="step-complete-label ${canComplete ? '' : 'step-complete-label--disabled'}">
          <input type="checkbox" class="step-done-cb" data-step-id="${step.id}" ${done ? 'checked' : ''} ${canComplete ? '' : 'disabled'} />
          ${escapeHtml(t('guide.markComplete'))}
        </label>
      </div>
    </article>`;
}

function renderProgressBar(steps: GuideStep[], state: GuideState): string {
  const total = steps.length;
  const done = steps.filter((s) => isStepComplete(state, s.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `
    <div class="guide-progress guide-progress-full">
      <div class="guide-progress-track" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}">
        <div class="guide-progress-fill" style="width:${pct}%"></div>
      </div>
      <p class="guide-progress-label">${escapeHtml(t('guide.progress', { done, total }))}</p>
    </div>`;
}

function resolveCurrentStepId(steps: GuideStep[], state: GuideState): string {
  if (state.currentStepId && steps.some((s) => s.id === state.currentStepId)) {
    return state.currentStepId;
  }
  const firstIncomplete = steps.find((s) => !isStepComplete(state, s.id));
  return firstIncomplete?.id ?? steps[0]?.id ?? '';
}

function renderGuideSetup(state: GuideState): string {
  const profileCards = DEPLOYMENT_PROFILES.map(
    (p) => `
    <label class="profile-card ${state.profileId === p.id ? 'selected' : ''}">
      <input type="radio" name="profile" value="${p.id}" ${state.profileId === p.id ? 'checked' : ''} />
      <strong>${escapeHtml(t(profileLabelKey(p.id)))}</strong>
      <span class="profile-desc">${escapeHtml(t(profileDescriptionKey(p.id)))}</span>
      <span class="badge">${escapeHtml(t('guide.hostsBadge', { count: p.splunkHostCount }))}</span>
    </label>`,
  ).join('');

  return `
    <div class="guide-setup">
      <button type="button" class="guide-setup-toggle" id="guide-setup-toggle" aria-expanded="${state.setupCollapsed ? 'false' : 'true'}">
        ${escapeHtml(t('guide.setupToggle'))}
        <span aria-hidden="true">${state.setupCollapsed ? '▸' : '▾'}</span>
      </button>
      <div class="guide-setup-body ${state.setupCollapsed ? 'is-collapsed' : ''}" id="guide-setup-body">
        <div class="profile-grid">${profileCards}</div>
        ${renderDistroSelector(state.linuxDistro)}
        <div class="field"><label for="cfg-os-user">${escapeHtml(t('guide.osUser'))}</label><input id="cfg-os-user" value="${escapeHtml(state.hostConfig.osUser)}" /></div>
        <div class="field"><label for="cfg-splunk-version">${escapeHtml(t('guide.splunkVersion'))}</label><input id="cfg-splunk-version" value="${escapeHtml(state.hostConfig.splunkVersion)}" /></div>
        <div class="field"><label for="cfg-admin-password">${escapeHtml(t('guide.adminPassword'))}</label><input id="cfg-admin-password" type="password" value="${escapeHtml(state.hostConfig.adminPassword)}" autocomplete="off" /></div>
        <div class="field"><label for="cfg-cluster-secret">${escapeHtml(t('guide.clusterSecret'))}</label><input id="cfg-cluster-secret" value="${escapeHtml(state.hostConfig.clusterSecret)}" /></div>
        ${renderHostConfig(state.profileId, state.hostConfig)}
        <div class="checkbox-row">
          <input type="checkbox" id="include-forwarders" ${state.includeForwarders ? 'checked' : ''} />
          <label for="include-forwarders">${escapeHtml(t('guide.includeForwarders'))}</label>
        </div>
        <button type="button" id="copy-guide-md" class="btn-secondary" style="width:100%;margin-top:var(--space-3)">${escapeHtml(t('guide.copyMarkdown'))}</button>
      </div>
    </div>`;
}

function renderGuideStepNav(steps: GuideStep[], state: GuideState, currentId: string): string {
  const items = steps
    .map((s) => {
      const done = isStepComplete(state, s.id);
      const active = s.id === currentId;
      const label = t(stepTitleKey(s.id));
      const marker = done ? '✓' : '○';
      return `
      <li class="guide-step-nav-item">
        <button type="button" class="guide-step-nav-link ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}" data-step-nav="${s.id}">
          <span class="guide-step-nav-marker">${marker}</span>
          <span>${escapeHtml(label)}</span>
        </button>
      </li>`;
    })
    .join('');
  return `<ul class="guide-step-nav" role="navigation" aria-label="Steps">${items}</ul>`;
}

function renderGuideFooter(steps: GuideStep[], currentId: string): string {
  const idx = steps.findIndex((s) => s.id === currentId);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < steps.length - 1;
  return `
    <div class="guide-step-footer-nav">
      <button type="button" class="btn-nav" id="guide-prev-step" ${hasPrev ? '' : 'disabled'}>${escapeHtml(t('guide.navPrevious'))}</button>
      <span class="guide-step-counter">${escapeHtml(t('guide.stepCounter', { current: idx + 1, total: steps.length }))}</span>
      <button type="button" class="btn-nav btn-nav--primary" id="guide-next-step" ${hasNext ? '' : 'disabled'}>${escapeHtml(t('guide.navNext'))}</button>
    </div>`;
}

function renderDistroSelector(distro: LinuxDistro): string {
  const distros: LinuxDistro[] = ['rhel', 'ubuntu', 'debian'];
  const radios = distros
    .map(
      (d) => `
      <label class="distro-option">
        <input type="radio" name="linux-distro" value="${d}" ${distro === d ? 'checked' : ''} />
        ${escapeHtml(t(`guide.distros.${d}`))}
      </label>`,
    )
    .join('');
  return `
    <fieldset class="distro-selector">
      <legend>${escapeHtml(t('guide.linuxDistro'))}</legend>
      <div class="distro-options">${radios}</div>
    </fieldset>`;
}

function nextIncompleteStepId(steps: GuideStep[], state: GuideState, afterId: string): string | null {
  const idx = steps.findIndex((s) => s.id === afterId);
  if (idx < 0) return null;
  return steps.slice(idx + 1).find((s) => !isStepComplete(state, s.id))?.id ?? null;
}

function buildMarkdown(state: GuideState): string {
  const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
  const profile = getProfile(state.profileId);
  const extra = handoffSubstitutions();
  let md = `# ${t('guide.title')}\n\n**Profile:** ${profile ? t(profileLabelKey(profile.id)) : state.profileId}\n\n`;
  for (const step of steps) {
    md += `## ${t(stepPhaseKey(step.id))}: ${t(stepTitleKey(step.id))}\n\n`;
    for (const block of step.blocks) {
      if (!blockVisible(block, state.linuxDistro)) continue;
      const content = substitute(t(block.contentKey), state.hostConfig, extra);
      if (block.type === 'commands' && block.commands) {
        md += `${content}\n\n\`\`\`bash\n${substituteCommands(block.commands, state.hostConfig, extra).join('\n')}\n\`\`\`\n\n`;
      } else {
        md += `${content}\n\n`;
      }
    }
  }
  return md;
}

function renderStepsHtml(steps: GuideStep[], state: GuideState, currentStepId: string): string {
  const step = steps.find((s) => s.id === currentStepId) ?? steps[0];
  if (!step) return '';
  return renderStepViewContent(step, state);
}

function bindCopyButtons(container: HTMLElement): void {
  container.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const pre = btn.closest('.command-row')?.querySelector('.command-block');
      const text = pre?.textContent ?? '';
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = t('guide.copied');
      setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    });
  });
}

function bindValidationHandlers(container: HTMLElement): void {
  container.querySelectorAll('.validation-cb').forEach((cb) => {
    cb.addEventListener('change', () => {
      const el = cb as HTMLInputElement;
      const stepId = el.dataset.stepId!;
      const validationId = el.dataset.validationId!;
      let state = loadGuideState();
      state = toggleValidationCheck(state, stepId, validationId, el.checked);
      saveGuideState(state);
      const step = filterStepsForProfile(state.profileId, state.includeForwarders).find((s) => s.id === stepId);
      if (!step) return;
      const stepEl = container.querySelector(`#step-${stepId}`);
      const completeCb = stepEl?.querySelector('.step-done-cb') as HTMLInputElement | null;
      const canComplete = validationsComplete(state, step);
      if (completeCb) {
        completeCb.disabled = !canComplete;
        completeCb.closest('.step-complete-label')?.classList.toggle('step-complete-label--disabled', !canComplete);
      }
      stepEl?.querySelector('.validation-blocked-hint')?.classList.toggle('is-hidden', canComplete);
    });
  });

  container.querySelectorAll('.validation-skip-cb').forEach((cb) => {
    cb.addEventListener('change', () => {
      const el = cb as HTMLInputElement;
      const stepId = el.dataset.stepId!;
      let state = loadGuideState();
      state = setSkipValidation(state, stepId, el.checked);
      saveGuideState(state);
      const step = filterStepsForProfile(state.profileId, state.includeForwarders).find((s) => s.id === stepId);
      if (!step) return;
      const stepEl = container.querySelector(`#step-${stepId}`);
      const completeCb = stepEl?.querySelector('.step-done-cb') as HTMLInputElement | null;
      const canComplete = validationsComplete(state, step);
      if (completeCb) {
        completeCb.disabled = !canComplete;
        completeCb.closest('.step-complete-label')?.classList.toggle('step-complete-label--disabled', !canComplete);
      }
      stepEl?.querySelector('.validation-blocked-hint')?.classList.toggle('is-hidden', canComplete);
    });
  });

  container.querySelectorAll('.validation-check-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const stepId = (btn as HTMLButtonElement).dataset.stepId!;
      const validationId = (btn as HTMLButtonElement).dataset.validationId!;
      const state = loadGuideState();
      const step = filterStepsForProfile(state.profileId, state.includeForwarders).find((s) => s.id === stepId);
      const validation = step?.validations.find((v) => v.id === validationId);
      if (!validation?.expectPattern) return;
      const textarea = container.querySelector(
        `.validation-output[data-step-id="${stepId}"][data-validation-id="${validationId}"]`,
      ) as HTMLTextAreaElement | null;
      const resultEl = container.querySelector(
        `.validation-result[data-step-id="${stepId}"][data-validation-id="${validationId}"]`,
      );
      const output = textarea?.value ?? '';
      let pass = false;
      try {
        pass = new RegExp(validation.expectPattern).test(output);
      } catch {
        pass = false;
      }
      if (resultEl) {
        resultEl.textContent = pass ? t('guide.validations.pass') : t('guide.validations.fail');
        resultEl.className = `validation-result ${pass ? 'validation-result--pass' : 'validation-result--fail'}`;
      }
    });
  });
}

function resolveInitialProfile(state: GuideState): GuideState {
  const params = getHashParams();
  const paramProfile = params.get('profile') as DeploymentProfileId | null;
  if (paramProfile && DEPLOYMENT_PROFILES.some((p) => p.id === paramProfile)) {
    return { ...state, profileId: paramProfile };
  }
  const handoff = loadPlannerHandoff();
  if (handoff?.profileId) {
    return { ...state, profileId: handoff.profileId };
  }
  return state;
}

function renderHandoffBanner(state: GuideState): string {
  const handoff = loadPlannerHandoff();
  if (!handoff) return '';
  const profile = getProfile(state.profileId);
  const profileLabel = profile ? t(profileLabelKey(profile.id)) : handoff.profileId;
  const shcSuffix = handoff.hasShc ? ', SHC' : '';
  return `
    <div class="guide-handoff-banner alert alert-info">
      ${escapeHtml(t('guide.handoff', { svaCode: handoff.svaCode, profileLabel }))}
      <span class="field-hint"> · ${escapeHtml(t('guide.handoffDetail', { indexerCount: handoff.indexerCount, shcSuffix }))}</span>
    </div>`;
}

function renderGuideContent(container: HTMLElement, state: GuideState, stepIdOverride?: string | null): void {
  const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
  const currentStepId = stepIdOverride ?? resolveCurrentStepId(steps, state);
  const stateWithStep = { ...state, currentStepId };

  container.innerHTML = `
    ${renderNav('guide')}
    <div class="guide-shell">
      <header class="guide-page-header">
        <button type="button" class="guide-drawer-toggle" id="guide-drawer-toggle" aria-label="Menu">☰</button>
        <div>
          <h1>${escapeHtml(t('guide.title'))}</h1>
          ${renderProgressBar(steps, stateWithStep)}
        </div>
      </header>
      ${renderHandoffBanner(stateWithStep)}
      <div class="guide-sidebar-backdrop" id="guide-sidebar-backdrop"></div>
      <div class="guide-body">
        <aside class="guide-sidebar" id="guide-sidebar">
          ${renderGuideSetup(stateWithStep)}
          ${renderGuideStepNav(steps, stateWithStep, currentStepId)}
        </aside>
        <div class="guide-main">
          <div class="guide-main-inner" id="guide-steps">
            ${renderStepsHtml(steps, stateWithStep, currentStepId)}
          </div>
          ${renderGuideFooter(steps, currentStepId)}
        </div>
      </div>
    </div>
  `;

  bindGuideEvents(container, stateWithStep);
}

function bindGuideEvents(container: HTMLElement, initialState: GuideState): void {
  const readState = (): GuideState => {
    const stored = loadGuideState();
    return {
      ...initialState,
      profileId: (document.querySelector<HTMLInputElement>('input[name="profile"]:checked')?.value ??
        initialState.profileId) as DeploymentProfileId,
      includeForwarders: (document.getElementById('include-forwarders') as HTMLInputElement)?.checked ?? false,
      linuxDistro: (document.querySelector<HTMLInputElement>('input[name="linux-distro"]:checked')?.value ??
        initialState.linuxDistro) as LinuxDistro,
      hostConfig: readHostConfigFromForm(initialState),
      validatedChecks: stored.validatedChecks,
      skipValidationSteps: stored.skipValidationSteps,
      completedSteps: stored.completedSteps,
      currentStepId: stored.currentStepId ?? initialState.currentStepId,
      setupCollapsed: stored.setupCollapsed ?? initialState.setupCollapsed,
      showCompletedSteps: stored.showCompletedSteps,
    };
  };

  const refresh = (stepId?: string | null) => {
    const state = readState();
    const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
    const nextStepId = stepId ?? resolveCurrentStepId(steps, state);
    const next = { ...state, currentStepId: nextStepId };
    saveGuideState(next);
    renderGuideContent(container, next, nextStepId);
  };

  const goToStep = (stepId: string) => {
    const state = readState();
    saveGuideState({ ...state, currentStepId: stepId });
    renderGuideContent(container, { ...state, currentStepId: stepId }, stepId);
    closeDrawer();
  };

  const closeDrawer = (): void => {
    document.getElementById('guide-sidebar')?.classList.remove('is-open');
    document.getElementById('guide-sidebar-backdrop')?.classList.remove('is-open');
  };

  const openDrawer = (): void => {
    document.getElementById('guide-sidebar')?.classList.add('is-open');
    document.getElementById('guide-sidebar-backdrop')?.classList.add('is-open');
  };

  container.querySelector('#guide-drawer-toggle')?.addEventListener('click', openDrawer);
  container.querySelector('#guide-sidebar-backdrop')?.addEventListener('click', closeDrawer);

  container.querySelector('#guide-setup-toggle')?.addEventListener('click', () => {
    const state = readState();
    const collapsed = !state.setupCollapsed;
    saveGuideState({ ...state, setupCollapsed: collapsed });
    document.getElementById('guide-setup-body')?.classList.toggle('is-collapsed', collapsed);
    document.getElementById('guide-setup-toggle')?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  });

  container.querySelectorAll('input[name="profile"]').forEach((el) => {
    el.addEventListener('change', () => refresh(null));
  });
  container.querySelectorAll('input[name="linux-distro"]').forEach((el) => {
    el.addEventListener('change', () => refresh(null));
  });
  container.querySelector('#include-forwarders')?.addEventListener('change', () => refresh(null));

  container.querySelectorAll('[data-host-role], #cfg-os-user, #cfg-admin-password, #cfg-cluster-secret, #cfg-splunk-version').forEach((el) => {
    el.addEventListener('change', () => {
      const state = readState();
      saveGuideState(state);
      const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
      const currentId = resolveCurrentStepId(steps, state);
      document.getElementById('guide-steps')!.innerHTML = renderStepsHtml(steps, state, currentId);
      bindStepHandlers(container);
      bindCopyButtons(container);
      bindValidationHandlers(container);
    });
  });

  container.querySelectorAll('[data-step-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      goToStep((btn as HTMLButtonElement).dataset.stepNav!);
    });
  });

  container.querySelector('#guide-prev-step')?.addEventListener('click', () => {
    const state = readState();
    const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
    const idx = steps.findIndex((s) => s.id === resolveCurrentStepId(steps, state));
    if (idx > 0) goToStep(steps[idx - 1].id);
  });

  container.querySelector('#guide-next-step')?.addEventListener('click', () => {
    const state = readState();
    const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
    const idx = steps.findIndex((s) => s.id === resolveCurrentStepId(steps, state));
    if (idx >= 0 && idx < steps.length - 1) goToStep(steps[idx + 1].id);
  });

  bindStepHandlers(container);
  bindCopyButtons(container);
  bindValidationHandlers(container);

  container.querySelector('#copy-guide-md')?.addEventListener('click', async () => {
    const state = readState();
    await navigator.clipboard.writeText(buildMarkdown(state));
    const btn = container.querySelector('#copy-guide-md');
    if (btn) {
      btn.textContent = t('guide.copied');
      setTimeout(() => {
        btn.textContent = t('guide.copyMarkdown');
      }, 2000);
    }
  });
}

function bindStepHandlers(container: HTMLElement): void {
  container.querySelectorAll('.step-done-cb').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = (cb as HTMLInputElement).dataset.stepId!;
      const current = loadGuideState();
      const steps = filterStepsForProfile(current.profileId, current.includeForwarders);
      const step = steps.find((s) => s.id === id);
      if ((cb as HTMLInputElement).checked && step && !validationsComplete(current, step)) {
        (cb as HTMLInputElement).checked = false;
        return;
      }
      let next = toggleStepComplete(current, id, (cb as HTMLInputElement).checked);
      if ((cb as HTMLInputElement).checked) {
        const nextId = nextIncompleteStepId(steps, next, id);
        if (nextId) next = { ...next, currentStepId: nextId };
      }
      saveGuideState(next);
      renderGuideContent(container, next, next.currentStepId);
    });
  });
}

export function renderGuide(container: HTMLElement, onLocaleChange?: () => void): void {
  let state = loadGuideState();
  if (!state.hostConfig.hosts.length) {
    state = { ...state, hostConfig: defaultHostConfig() };
  }
  state = resolveInitialProfile(state);
  const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
  state = { ...state, currentStepId: resolveCurrentStepId(steps, state) };
  saveGuideState(state);
  renderGuideContent(container, state);
  bindNavEvents(container, onLocaleChange);
}
