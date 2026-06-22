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
  resetGuideProgress,
  saveGuideState,
  setSkipValidation,
  toggleStepComplete,
  toggleValidationCheck,
  validationVisible,
  validationsComplete,
} from './progress';
import { substitute, substituteCommands } from './substitute';
import { filterNavigableSteps, filterStepsForProfile, getLinuxTipsStep, targetLabel, targetsForProfile } from './steps';
import {
  LINUX_TIPS_STEP_ID,
  SETUP_STEP_ID,
  type DeploymentProfileId,
  type GuideBlock,
  type GuideState,
  type GuideStep,
  type HostConfig,
  type LinuxDistro,
  type StepValidation,
} from './types';

function handoffSubstitutions(): Record<string, string> {
  const handoff = loadPlannerHandoff();
  return {
    RF: String(handoff?.replicationFactor ?? 3),
    SF: String(handoff?.searchFactor ?? 2),
  };
}

function blockVisible(block: GuideBlock, distro: LinuxDistro, profileId: DeploymentProfileId): boolean {
  if (block.distros?.length && !block.distros.includes(distro)) return false;
  if (block.profiles?.length && !block.profiles.includes(profileId)) return false;
  return true;
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

function renderBlock(block: GuideBlock, config: HostConfig, distro: LinuxDistro, profileId: DeploymentProfileId): string {
  if (!blockVisible(block, distro, profileId)) return '';
  const extra = handoffSubstitutions();
  const raw = t(block.contentKey);
  const content = substitute(raw, config, extra, profileId);
  if (block.type === 'warning') {
    return `<div class="guide-warning">${formatInlineMarkdown(escapeHtml(content))}</div>`;
  }
  if (block.type === 'commands') {
    const cmds = substituteCommands(block.commands ?? [], config, extra, profileId);
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
  if (!validationVisible(v, state.profileId)) return '';
  const extra = handoffSubstitutions();
  const checked = (state.validatedChecks[step.id] ?? []).includes(v.id);
  const label = substitute(t(v.labelKey), state.hostConfig, extra, state.profileId);
  const expect = v.expectKey ? substitute(t(v.expectKey), state.hostConfig, extra, state.profileId) : '';
  const cmd = v.command ? substitute(v.command, state.hostConfig, extra, state.profileId) : '';
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

function renderGuideBreadcrumb(phase: string): string {
  return `
    <nav class="guide-breadcrumb" aria-label="Breadcrumb">
      <a href="#home">${escapeHtml(t('guide.breadcrumbHome'))}</a>
      <span class="guide-breadcrumb-sep">›</span>
      <a href="#guide">${escapeHtml(t('guide.breadcrumbGuide'))}</a>
      <span class="guide-breadcrumb-sep">›</span>
      <span aria-current="page">${escapeHtml(phase)}</span>
    </nav>`;
}

function renderStepViewContent(step: GuideStep, state: GuideState): string {
  const done = isStepComplete(state, step.id);
  const phase = t(stepPhaseKey(step.id));
  const title = t(stepTitleKey(step.id));
  const targets = targetsForProfile(step.targets, state.profileId)
    .map((tg) => `<span class="target-chip">${escapeHtml(targetLabel(tg))}</span>`)
    .join('');
  const blocks = step.blocks.map((b) => renderBlock(b, state.hostConfig, state.linuxDistro, state.profileId)).join('');
  const canComplete = validationsComplete(state, step);
  return `
    <article class="guide-step-view" data-step-id="${step.id}" id="step-${step.id}">
      <header class="guide-doc-header">
        <p class="splunk-eyebrow guide-step-phase">${escapeHtml(phase)}</p>
        <h1 class="guide-step-title">${escapeHtml(title)}</h1>
      </header>
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

function resolveCurrentStepId(installSteps: GuideStep[], state: GuideState): string {
  const navIds = [SETUP_STEP_ID, ...installSteps.map((s) => s.id)];
  if (state.currentStepId === LINUX_TIPS_STEP_ID) return SETUP_STEP_ID;
  if (state.currentStepId && navIds.includes(state.currentStepId)) {
    return state.currentStepId;
  }
  return SETUP_STEP_ID;
}

function scrollGuideMainToTop(): void {
  const main = document.querySelector('.guide-main-inner');
  if (main) main.scrollTop = 0;
}

function renderGuideSetupFields(state: GuideState): string {
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
    <div class="guide-setup-main">
      <div class="profile-grid">${profileCards}</div>
      ${renderDistroSelector(state.linuxDistro)}
      <div class="field"><label for="cfg-os-user">${escapeHtml(t('guide.osUser'))}</label><input id="cfg-os-user" value="${escapeHtml(state.hostConfig.osUser)}" /></div>
      <div class="field"><label for="cfg-splunk-version">${escapeHtml(t('guide.splunkVersion'))}</label><input id="cfg-splunk-version" value="${escapeHtml(state.hostConfig.splunkVersion)}" /></div>
      <div class="field"><label for="cfg-admin-password">${escapeHtml(t('guide.adminPassword'))}</label><input id="cfg-admin-password" type="password" value="${escapeHtml(state.hostConfig.adminPassword)}" autocomplete="off" /></div>
      ${state.profileId === 'single' ? '' : `<div class="field"><label for="cfg-cluster-secret">${escapeHtml(t('guide.clusterSecret'))}</label><input id="cfg-cluster-secret" value="${escapeHtml(state.hostConfig.clusterSecret)}" /></div>`}
      ${renderHostConfig(state.profileId, state.hostConfig)}
      <div class="checkbox-row">
        <input type="checkbox" id="include-forwarders" ${state.includeForwarders ? 'checked' : ''} />
        <label for="include-forwarders">${escapeHtml(t('guide.includeForwarders'))}</label>
      </div>
      <button type="button" id="copy-guide-md" class="btn-secondary" style="width:100%;margin-top:var(--space-3)">${escapeHtml(t('guide.copyMarkdown'))}</button>
    </div>`;
}

function renderSetupStepContent(state: GuideState): string {
  const linuxStep = getLinuxTipsStep();
  const linuxTitle = t(stepTitleKey(LINUX_TIPS_STEP_ID));
  const linuxBlocks =
    linuxStep?.blocks.map((b) => renderBlock(b, state.hostConfig, state.linuxDistro, state.profileId)).join('') ?? '';
  const linuxDocs = linuxStep ? renderDocLinks(linuxStep.docLinks) : '';
  const linuxValidations = linuxStep ? renderValidations(linuxStep, state) : '';

  return `
    <article class="guide-step-view guide-setup-step" data-step-id="${SETUP_STEP_ID}" id="step-${SETUP_STEP_ID}">
      <header class="guide-doc-header">
        <h1 class="guide-step-title">${escapeHtml(t('guide.stepSetupTitle'))}</h1>
      </header>
      ${renderGuideSetupFields(state)}
      <hr class="guide-section-divider" />
      <section class="guide-linux-tips-section">
        <h2 class="guide-section-title">${escapeHtml(linuxTitle)}</h2>
        <div class="doc-links">${linuxDocs}</div>
        ${linuxBlocks}
        ${linuxValidations}
      </section>
    </article>`;
}

function renderGuideStepNav(installSteps: GuideStep[], state: GuideState, currentId: string): string {
  const setupItem = `
    <li class="guide-step-nav-item">
      <button type="button" class="guide-step-nav-link ${currentId === SETUP_STEP_ID ? 'is-active' : ''}" data-step-nav="${SETUP_STEP_ID}">
        <span class="guide-step-nav-marker">${currentId === SETUP_STEP_ID ? '●' : '○'}</span>
        <span>${escapeHtml(t('guide.stepSetupTitle'))}</span>
      </button>
    </li>`;

  const items = installSteps
    .map((s) => {
      const done = isStepComplete(state, s.id);
      const active = s.id === currentId;
      const label = t(stepTitleKey(s.id));
      const marker = done ? '✓' : active ? '●' : '○';
      return `
      <li class="guide-step-nav-item">
        <button type="button" class="guide-step-nav-link ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}" data-step-nav="${s.id}">
          <span class="guide-step-nav-marker">${marker}</span>
          <span>${escapeHtml(label)}</span>
        </button>
      </li>`;
    })
    .join('');
  return `<ul class="guide-step-nav" role="navigation" aria-label="Steps">${setupItem}${items}</ul>`;
}

function navStepIds(installSteps: GuideStep[]): string[] {
  return [SETUP_STEP_ID, ...installSteps.map((s) => s.id)];
}

function renderGuideFooter(installSteps: GuideStep[], currentId: string): string {
  const ids = navStepIds(installSteps);
  const idx = ids.indexOf(currentId);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < ids.length - 1;
  const counterCurrent = idx >= 0 ? idx : 0;
  const counterTotal = installSteps.length;
  return `
    <div class="guide-step-footer-nav">
      <button type="button" class="btn-nav" id="guide-prev-step" ${hasPrev ? '' : 'disabled'}>${escapeHtml(t('guide.navPrevious'))}</button>
      <span class="guide-step-counter">${escapeHtml(t('guide.stepCounter', { current: counterCurrent, total: counterTotal }))}</span>
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
      if (!blockVisible(block, state.linuxDistro, state.profileId)) continue;
      const content = substitute(t(block.contentKey), state.hostConfig, extra, state.profileId);
      if (block.type === 'commands' && block.commands) {
        md += `${content}\n\n\`\`\`bash\n${substituteCommands(block.commands, state.hostConfig, extra, state.profileId).join('\n')}\n\`\`\`\n\n`;
      } else {
        md += `${content}\n\n`;
      }
    }
  }
  return md;
}

function renderStepsHtml(installSteps: GuideStep[], state: GuideState, currentStepId: string): string {
  if (currentStepId === SETUP_STEP_ID) {
    return renderSetupStepContent(state);
  }
  const step = installSteps.find((s) => s.id === currentStepId) ?? installSteps[0];
  if (!step) return renderSetupStepContent(state);
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

function findGuideStep(state: GuideState, stepId: string): GuideStep | undefined {
  if (stepId === LINUX_TIPS_STEP_ID) return getLinuxTipsStep();
  return filterNavigableSteps(state.profileId, state.includeForwarders).find((s) => s.id === stepId);
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
      const step = findGuideStep(state, stepId);
      if (!step) return;
      const stepEl = container.querySelector(`#step-${stepId}, #step-${SETUP_STEP_ID}`);
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
      const step = findGuideStep(state, stepId);
      if (!step) return;
      const stepEl = container.querySelector(`#step-${stepId}, #step-${SETUP_STEP_ID}`);
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
      const step = findGuideStep(state, stepId);
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

function renderGuideSidebarFooter(state: GuideState): string {
  const profileLabel = t(profileLabelKey(state.profileId));
  return `
    <div class="guide-sidebar-footer">
      <p class="guide-sidebar-profile">${escapeHtml(t('guide.profileSelected', { profileLabel }))}</p>
      <button type="button" id="guide-start-over" class="btn-secondary guide-start-over-btn">${escapeHtml(t('guide.startOver'))}</button>
    </div>`;
}

function renderGuideContent(container: HTMLElement, state: GuideState, stepIdOverride?: string | null): void {
  const installSteps = filterNavigableSteps(state.profileId, state.includeForwarders);
  const currentStepId = stepIdOverride ?? resolveCurrentStepId(installSteps, state);
  const stateWithStep = { ...state, currentStepId };
  const breadcrumbLabel =
    currentStepId === SETUP_STEP_ID
      ? t('guide.stepSetupTitle')
      : installSteps.find((s) => s.id === currentStepId)
        ? t(stepPhaseKey(currentStepId))
        : '';

  container.innerHTML = `
    ${renderNav('guide')}
    <div class="guide-shell app-viewport">
      <div class="guide-mobile-bar">
        <button type="button" class="guide-drawer-toggle" id="guide-drawer-toggle" aria-label="${escapeHtml(t('guide.menuToggle'))}">☰</button>
        <div class="guide-mobile-progress">${renderProgressBar(installSteps, stateWithStep)}</div>
      </div>
      <div class="guide-sidebar-backdrop" id="guide-sidebar-backdrop"></div>
      <div class="guide-body">
        <aside class="guide-sidebar" id="guide-sidebar">
          <div class="guide-sidebar-section-label">${escapeHtml(t('guide.sidebarSteps'))}</div>
          ${renderGuideStepNav(installSteps, stateWithStep, currentStepId)}
          ${renderGuideSidebarFooter(stateWithStep)}
        </aside>
        <div class="guide-main">
          ${renderGuideBreadcrumb(breadcrumbLabel)}
          ${renderHandoffBanner(stateWithStep)}
          <div class="guide-main-inner">
            <div class="guide-prose prose-measure" id="guide-steps">
              ${renderStepsHtml(installSteps, stateWithStep, currentStepId)}
            </div>
          </div>
          ${renderGuideFooter(installSteps, currentStepId)}
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
      showCompletedSteps: stored.showCompletedSteps,
    };
  };

  const refresh = (stepId?: string | null) => {
    const state = readState();
    const installSteps = filterNavigableSteps(state.profileId, state.includeForwarders);
    const nextStepId = stepId ?? resolveCurrentStepId(installSteps, state);
    const next = { ...state, currentStepId: nextStepId };
    saveGuideState(next);
    renderGuideContent(container, next, nextStepId);
  };

  const goToStep = (stepId: string) => {
    const state = readState();
    saveGuideState({ ...state, currentStepId: stepId });
    renderGuideContent(container, { ...state, currentStepId: stepId }, stepId);
    scrollGuideMainToTop();
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

  container.querySelector('#guide-start-over')?.addEventListener('click', () => {
    if (!window.confirm(t('guide.startOverConfirm'))) return;
    const reset = resetGuideProgress(readState());
    saveGuideState(reset);
    renderGuideContent(container, reset, SETUP_STEP_ID);
    scrollGuideMainToTop();
    closeDrawer();
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
      const installSteps = filterNavigableSteps(state.profileId, state.includeForwarders);
      const currentId = resolveCurrentStepId(installSteps, state);
      document.getElementById('guide-steps')!.innerHTML = renderStepsHtml(installSteps, state, currentId);
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
    const installSteps = filterNavigableSteps(state.profileId, state.includeForwarders);
    const ids = navStepIds(installSteps);
    const idx = ids.indexOf(resolveCurrentStepId(installSteps, state));
    if (idx > 0) goToStep(ids[idx - 1]);
  });

  container.querySelector('#guide-next-step')?.addEventListener('click', () => {
    const state = readState();
    const installSteps = filterNavigableSteps(state.profileId, state.includeForwarders);
    const ids = navStepIds(installSteps);
    const idx = ids.indexOf(resolveCurrentStepId(installSteps, state));
    if (idx >= 0 && idx < ids.length - 1) goToStep(ids[idx + 1]);
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
      const installSteps = filterNavigableSteps(current.profileId, current.includeForwarders);
      const step = installSteps.find((s) => s.id === id);
      if ((cb as HTMLInputElement).checked && step && !validationsComplete(current, step)) {
        (cb as HTMLInputElement).checked = false;
        return;
      }
      let next = toggleStepComplete(current, id, (cb as HTMLInputElement).checked);
      if ((cb as HTMLInputElement).checked) {
        const nextId = nextIncompleteStepId(installSteps, next, id);
        if (nextId) next = { ...next, currentStepId: nextId };
      }
      saveGuideState(next);
      renderGuideContent(container, next, next.currentStepId);
      scrollGuideMainToTop();
    });
  });
}

export function renderGuide(container: HTMLElement, onLocaleChange?: () => void): void {
  let state = loadGuideState();
  if (!state.hostConfig.hosts.length) {
    state = { ...state, hostConfig: defaultHostConfig() };
  }
  state = resolveInitialProfile(state);
  const installSteps = filterNavigableSteps(state.profileId, state.includeForwarders);
  state = { ...state, currentStepId: resolveCurrentStepId(installSteps, state) };
  saveGuideState(state);
  renderGuideContent(container, state);
  bindNavEvents(container, onLocaleChange);
}
