import {
  profileDescriptionKey,
  profileLabelKey,
  profileSvaHintKey,
  stepPhaseKey,
  stepTitleKey,
  t,
} from '../i18n';
import { escapeHtml } from '../lib/format';
import { loadPlannerHandoff } from '../lib/plannerHandoff';
import { getHashParams } from '../nav';
import { renderNav } from '../nav';
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

function distroLabel(distro: LinuxDistro): string {
  return t(`guide.distros.${distro}`);
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

function renderStep(step: GuideStep, state: GuideState, expandCurrent: boolean): string {
  const done = isStepComplete(state, step.id);
  const hidden = done && !state.showCompletedSteps;
  const expanded = expandCurrent;
  const phase = t(stepPhaseKey(step.id));
  const title = t(stepTitleKey(step.id));
  const targets = step.targets.map((tg) => `<span class="target-chip">${escapeHtml(targetLabel(tg))}</span>`).join('');
  const blocks = step.blocks.map((b) => renderBlock(b, state.hostConfig, state.linuxDistro)).join('');
  const canComplete = validationsComplete(state, step);
  return `
    <section class="panel guide-step ${done ? 'step-done' : ''} ${hidden ? 'step-hidden' : ''} ${expanded ? '' : 'collapsed'}" data-step-id="${step.id}" id="step-${step.id}">
      <div class="panel-header guide-step-header">
        <button type="button" class="step-toggle" aria-expanded="${expanded ? 'true' : 'false'}" aria-controls="step-body-${step.id}">
          <span class="step-title">${escapeHtml(phase)}: ${escapeHtml(title)}</span>
          <span class="step-chevron" aria-hidden="true"></span>
        </button>
      </div>
      <div class="panel-body" id="step-body-${step.id}">
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
      </div>
    </section>`;
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

function renderStepJumpMenu(steps: GuideStep[]): string {
  const options = steps
    .map((s) => {
      const label = `${t(stepPhaseKey(s.id))}: ${t(stepTitleKey(s.id))}`;
      return `<option value="${s.id}">${escapeHtml(label)}</option>`;
    })
    .join('');
  return `
    <div class="guide-step-jump">
      <label class="field" for="step-jump-select">
        <span>${escapeHtml(t('guide.jumpToStep'))}</span>
        <select id="step-jump-select">${options}</select>
      </label>
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

function expandStepElement(stepEl: HTMLElement | null): void {
  if (!stepEl) return;
  stepEl.classList.remove('collapsed');
  stepEl.querySelector('.step-toggle')?.setAttribute('aria-expanded', 'true');
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

function renderStepsHtml(steps: GuideStep[], state: GuideState, expandStepId: string | null): string {
  return steps.map((s) => renderStep(s, state, s.id === expandStepId)).join('');
}

function updateProgressUi(container: HTMLElement, steps: GuideStep[], state: GuideState): void {
  const total = steps.length;
  const done = steps.filter((s) => isStepComplete(state, s.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const fill = container.querySelector('.guide-progress-fill') as HTMLElement | null;
  const label = container.querySelector('.guide-progress-label');
  const bar = container.querySelector('[role="progressbar"]');
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = t('guide.progress', { done, total });
  if (bar) {
    bar.setAttribute('aria-valuenow', String(done));
    bar.setAttribute('aria-valuemax', String(total));
  }
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

function bindStepToggles(container: HTMLElement): void {
  container.querySelectorAll('.step-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.guide-step');
      if (!panel) return;
      const collapsed = panel.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
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

function renderGuideContent(container: HTMLElement, state: GuideState, expandStepId?: string | null): void {
  const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
  const currentExpand = expandStepId ?? null;
  const profileCards = DEPLOYMENT_PROFILES.map(
    (p) => `
    <label class="profile-card ${state.profileId === p.id ? 'selected' : ''}">
      <input type="radio" name="profile" value="${p.id}" ${state.profileId === p.id ? 'checked' : ''} />
      <strong>${escapeHtml(t(profileLabelKey(p.id)))}</strong>
      <span class="profile-desc">${escapeHtml(t(profileDescriptionKey(p.id)))}</span>
      <span class="badge">${escapeHtml(t('guide.hostsBadge', { count: p.splunkHostCount }))}</span>
      <span class="field-hint">${escapeHtml(t(profileSvaHintKey(p.id)))}</span>
    </label>`,
  ).join('');

  container.innerHTML = `
    ${renderNav('guide')}
    <header class="app-header">
      <h1>${escapeHtml(t('guide.title'))}</h1>
      <p class="subtitle">${escapeHtml(t('guide.subtitleDistro', { distro: distroLabel(state.linuxDistro) }))} · <a href="#planner">${escapeHtml(t('nav.planner'))}</a></p>
    </header>
    <main class="layout guide-layout">
      ${renderProgressBar(steps, state)}
      ${renderHandoffBanner(state)}

      <div class="guide-config-column">
        <section class="panel">
          <div class="panel-header">${escapeHtml(t('guide.profileHeader'))}</div>
          <div class="panel-body">
            <div class="profile-grid">${profileCards}</div>
            <p class="field-hint">${escapeHtml(t('guide.profileHint'))}</p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">${escapeHtml(t('guide.hostConfig'))}</div>
          <div class="panel-body">
            ${renderDistroSelector(state.linuxDistro)}
            <div class="grid-2">
              <div class="field"><label for="cfg-os-user">${escapeHtml(t('guide.osUser'))}</label><input id="cfg-os-user" value="${escapeHtml(state.hostConfig.osUser)}" /></div>
              <div class="field"><label for="cfg-splunk-version">${escapeHtml(t('guide.splunkVersion'))}</label><input id="cfg-splunk-version" value="${escapeHtml(state.hostConfig.splunkVersion)}" /></div>
              <div class="field"><label for="cfg-admin-password">${escapeHtml(t('guide.adminPassword'))}</label><input id="cfg-admin-password" type="password" value="${escapeHtml(state.hostConfig.adminPassword)}" autocomplete="off" /></div>
              <div class="field"><label for="cfg-cluster-secret">${escapeHtml(t('guide.clusterSecret'))}</label><input id="cfg-cluster-secret" value="${escapeHtml(state.hostConfig.clusterSecret)}" /></div>
            </div>
            ${renderHostConfig(state.profileId, state.hostConfig)}
            <div class="checkbox-row">
              <input type="checkbox" id="include-forwarders" ${state.includeForwarders ? 'checked' : ''} />
              <label for="include-forwarders">${escapeHtml(t('guide.includeForwarders'))}</label>
            </div>
          </div>
        </section>

        <div class="guide-actions">
          <button type="button" id="copy-guide-md" class="btn-secondary">${escapeHtml(t('guide.copyMarkdown'))}</button>
        </div>
      </div>

      <div class="guide-steps-column">
        ${renderStepJumpMenu(steps)}
        <div class="checkbox-row guide-show-completed">
          <input type="checkbox" id="show-completed-steps" ${state.showCompletedSteps ? 'checked' : ''} />
          <label for="show-completed-steps">${escapeHtml(t('guide.showCompleted'))}</label>
        </div>
        <div id="guide-steps">${renderStepsHtml(steps, state, currentExpand)}</div>
      </div>
    </main>
  `;

  bindGuideEvents(container, state);
}

function bindGuideEvents(container: HTMLElement, initialState: GuideState): void {
  const readState = (): GuideState => ({
    ...initialState,
    profileId: (document.querySelector<HTMLInputElement>('input[name="profile"]:checked')?.value ??
      initialState.profileId) as DeploymentProfileId,
    includeForwarders: (document.getElementById('include-forwarders') as HTMLInputElement)?.checked ?? false,
    showCompletedSteps: (document.getElementById('show-completed-steps') as HTMLInputElement)?.checked ?? false,
    linuxDistro: (document.querySelector<HTMLInputElement>('input[name="linux-distro"]:checked')?.value ??
      initialState.linuxDistro) as LinuxDistro,
    hostConfig: readHostConfigFromForm(initialState),
    validatedChecks: loadGuideState().validatedChecks,
    skipValidationSteps: loadGuideState().skipValidationSteps,
    completedSteps: loadGuideState().completedSteps,
  });

  const refresh = (expandStepId?: string | null) => {
    const state = readState();
    saveGuideState(state);
    renderGuideContent(container, state, expandStepId);
  };

  container.querySelectorAll('input[name="profile"]').forEach((el) => {
    el.addEventListener('change', () => refresh(null));
  });
  container.querySelectorAll('input[name="linux-distro"]').forEach((el) => {
    el.addEventListener('change', () => refresh(null));
  });
  container.querySelector('#include-forwarders')?.addEventListener('change', () => refresh(null));
  container.querySelector('#show-completed-steps')?.addEventListener('change', () => refresh());

  container.querySelectorAll('[data-host-role], #cfg-os-user, #cfg-admin-password, #cfg-cluster-secret, #cfg-splunk-version').forEach((el) => {
    el.addEventListener('change', () => {
      const state = readState();
      saveGuideState(state);
      document.getElementById('guide-steps')!.innerHTML = renderStepsHtml(
        filterStepsForProfile(state.profileId, state.includeForwarders),
        state,
        null,
      );
      bindStepHandlers(container, state);
      bindCopyButtons(container);
      bindStepToggles(container);
      bindValidationHandlers(container);
    });
  });

  container.querySelector('#step-jump-select')?.addEventListener('change', (e) => {
    const id = (e.target as HTMLSelectElement).value;
    const el = document.getElementById(`step-${id}`);
    expandStepElement(el);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  bindStepHandlers(container, initialState);
  bindCopyButtons(container);
  bindStepToggles(container);
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

  container.querySelectorAll('.guide-config-column .panel-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.parentElement?.classList.toggle('collapsed');
    });
  });
}

function bindStepHandlers(container: HTMLElement, _state: GuideState): void {
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
      const next = toggleStepComplete(current, id, (cb as HTMLInputElement).checked);
      saveGuideState(next);
      const stepsAfter = filterStepsForProfile(next.profileId, next.includeForwarders);
      const stepEl = (cb as HTMLElement).closest('.guide-step');
      stepEl?.classList.toggle('step-done', (cb as HTMLInputElement).checked);
      if ((cb as HTMLInputElement).checked) {
        stepEl?.classList.add('collapsed');
        stepEl?.querySelector('.step-toggle')?.setAttribute('aria-expanded', 'false');
      }
      if ((cb as HTMLInputElement).checked && !next.showCompletedSteps) {
        stepEl?.classList.add('step-hidden');
      } else {
        stepEl?.classList.remove('step-hidden');
      }
      if ((cb as HTMLInputElement).checked) {
        const nextId = nextIncompleteStepId(stepsAfter, next, id);
        if (nextId) {
          const nextEl = document.getElementById(`step-${nextId}`);
          expandStepElement(nextEl);
          nextEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      updateProgressUi(container, stepsAfter, next);
    });
  });
}

export function renderGuide(container: HTMLElement): void {
  let state = loadGuideState();
  if (!state.hostConfig.hosts.length) {
    state = { ...state, hostConfig: defaultHostConfig() };
  }
  state = resolveInitialProfile(state);
  saveGuideState(state);
  renderGuideContent(container, state);
}
