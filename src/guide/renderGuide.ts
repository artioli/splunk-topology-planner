import { escapeHtml } from '../lib/format';
import { renderNav } from '../nav';
import { DEPLOYMENT_PROFILES, getProfile } from './profiles';
import { defaultHostConfig, hostByRole } from './hostDefaults';
import { isStepComplete, loadGuideState, saveGuideState, toggleStepComplete } from './progress';
import { substitute, substituteCommands } from './substitute';
import { filterStepsForProfile, targetLabel } from './steps';
import type { DeploymentProfileId, GuideBlock, GuideState, GuideStep, HostConfig } from './types';

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

function renderBlock(block: GuideBlock, config: HostConfig): string {
  const content = substitute(block.content, config);
  if (block.type === 'warning') {
    return `<div class="guide-warning">${formatInlineMarkdown(escapeHtml(content))}</div>`;
  }
  if (block.type === 'ubuntu') {
    return `<div class="callout-ubuntu"><strong>Ubuntu / Debian</strong><p>${formatInlineMarkdown(escapeHtml(content))}</p></div>`;
  }
  if (block.type === 'commands') {
    const cmds = substituteCommands(block.commands ?? [], config);
    const intro = content ? `<p>${formatInlineMarkdown(escapeHtml(content))}</p>` : '';
    const lines = cmds
      .map(
        (c) =>
          `<div class="command-row"><pre class="command-block">${escapeHtml(c)}</pre><button type="button" class="btn-copy">Copy</button></div>`,
      )
      .join('');
    return `${intro}<div class="command-list">${lines}</div>`;
  }
  return `<p>${formatInlineMarkdown(escapeHtml(content))}</p>`;
}

function formatInlineMarkdown(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderHostTable(profileId: DeploymentProfileId, config: HostConfig): string {
  const profile = getProfile(profileId);
  if (!profile) return '';
  const roles = profile.hostRoles;
  const rows = roles
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
  return `<div class="table-scroll"><table class="host-table"><thead><tr><th>Role</th><th>Hostname</th><th>IP</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderStep(step: GuideStep, state: GuideState, expandCurrent: boolean): string {
  const done = isStepComplete(state, step.id);
  const hidden = done && !state.showCompletedSteps;
  const targets = step.targets.map((t) => `<span class="target-chip">${escapeHtml(targetLabel(t))}</span>`).join('');
  const docs = step.docLinks
    .map((d) => `<a href="${d.url}" target="_blank" rel="noopener">${escapeHtml(d.label)}</a>`)
    .join(' · ');
  const blocks = step.blocks.map((b) => renderBlock(b, state.hostConfig)).join('');
  const collapsed = done && !expandCurrent;
  return `
    <section class="panel guide-step ${done ? 'step-done' : ''} ${hidden ? 'step-hidden' : ''} ${collapsed ? 'collapsed' : ''}" data-step-id="${step.id}" id="step-${step.id}">
      <div class="panel-header guide-step-header">
        <label class="step-check-label">
          <input type="checkbox" class="step-done-cb" data-step-id="${step.id}" ${done ? 'checked' : ''} />
          <span>${escapeHtml(step.phase)}: ${escapeHtml(step.title)}</span>
        </label>
      </div>
      <div class="panel-body">
        <div class="step-meta">
          <div class="target-chips">${targets}</div>
          <p class="field-hint doc-links">${docs}</p>
        </div>
        ${blocks}
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
      <p class="guide-progress-label"><strong>${done}</strong> / ${total} steps complete</p>
    </div>`;
}

function renderStepJumpMenu(steps: GuideStep[]): string {
  const options = steps
    .map((s) => `<option value="${s.id}">${escapeHtml(s.phase)}: ${escapeHtml(s.title)}</option>`)
    .join('');
  return `
    <div class="guide-step-jump">
      <label class="field" for="step-jump-select">
        <span>Jump to step</span>
        <select id="step-jump-select">
          ${options}
        </select>
      </label>
    </div>`;
}

function firstIncompleteStepId(steps: GuideStep[], state: GuideState): string | null {
  const step = steps.find((s) => !isStepComplete(state, s.id));
  return step?.id ?? null;
}

function buildMarkdown(state: GuideState): string {
  const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
  const profile = getProfile(state.profileId);
  let md = `# Splunk Linux Deployment Guide\n\n**Profile:** ${profile?.label ?? state.profileId}\n\n`;
  for (const step of steps) {
    md += `## ${step.phase}: ${step.title}\n\n`;
    for (const block of step.blocks) {
      const content = substitute(block.content, state.hostConfig);
      if (block.type === 'commands' && block.commands) {
        md += `${content}\n\n\`\`\`bash\n${substituteCommands(block.commands, state.hostConfig).join('\n')}\n\`\`\`\n\n`;
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
  if (label) label.innerHTML = `<strong>${done}</strong> / ${total} steps complete`;
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
      btn.textContent = 'Copied';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 1500);
    });
  });
}

function renderGuideContent(container: HTMLElement, state: GuideState, expandStepId?: string | null): void {
  const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
  const currentExpand = expandStepId ?? firstIncompleteStepId(steps, state);
  const profileCards = DEPLOYMENT_PROFILES.map(
    (p) => `
    <label class="profile-card ${state.profileId === p.id ? 'selected' : ''}">
      <input type="radio" name="profile" value="${p.id}" ${state.profileId === p.id ? 'checked' : ''} />
      <strong>${escapeHtml(p.label)}</strong>
      <span class="profile-desc">${escapeHtml(p.description)}</span>
      <span class="badge">${p.splunkHostCount} hosts</span>
      <span class="field-hint">${escapeHtml(p.svaHint)}</span>
    </label>`,
  ).join('');

  container.innerHTML = `
    ${renderNav('guide')}
    <header class="app-header">
      <h1>Splunk Linux Deployment Guide</h1>
      <p class="subtitle">Step-by-step lab deployment for RHEL-family Linux · <a href="#planner">Topology planner</a></p>
    </header>
    <main class="layout guide-layout">
      ${renderProgressBar(steps, state)}

      <div class="guide-config-column">
        <section class="panel">
          <div class="panel-header">Choose deployment profile</div>
          <div class="panel-body">
            <div class="profile-grid">${profileCards}</div>
            <p class="field-hint">Sized with the planner? S1 → Single · D1 → Distributed NC · C1 → IC · C3 → IC + SHC</p>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">Host configuration</div>
          <div class="panel-body">
            <div class="grid-2">
              <div class="field"><label for="cfg-os-user">OS user</label><input id="cfg-os-user" value="${escapeHtml(state.hostConfig.osUser)}" /></div>
              <div class="field"><label for="cfg-splunk-version">Splunk version</label><input id="cfg-splunk-version" value="${escapeHtml(state.hostConfig.splunkVersion)}" /></div>
              <div class="field"><label for="cfg-admin-password">Splunk admin password (placeholder)</label><input id="cfg-admin-password" type="password" value="${escapeHtml(state.hostConfig.adminPassword)}" autocomplete="off" /></div>
              <div class="field"><label for="cfg-cluster-secret">Cluster secret</label><input id="cfg-cluster-secret" value="${escapeHtml(state.hostConfig.clusterSecret)}" /></div>
            </div>
            ${renderHostTable(state.profileId, state.hostConfig)}
            <div class="checkbox-row">
              <input type="checkbox" id="include-forwarders" ${state.includeForwarders ? 'checked' : ''} />
              <label for="include-forwarders">Include Universal Forwarder appendix</label>
            </div>
          </div>
        </section>

        <div class="guide-actions">
          <button type="button" id="copy-guide-md" class="btn-secondary">Copy guide (Markdown)</button>
        </div>
      </div>

      <div class="guide-steps-column">
        ${renderStepJumpMenu(steps)}
        <div class="checkbox-row guide-show-completed">
          <input type="checkbox" id="show-completed-steps" ${state.showCompletedSteps ? 'checked' : ''} />
          <label for="show-completed-steps">Show completed steps</label>
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
    hostConfig: readHostConfigFromForm(initialState),
  });

  const refresh = (expandStepId?: string | null) => {
    const state = readState();
    saveGuideState(state);
    renderGuideContent(container, state, expandStepId);
  };

  container.querySelectorAll('input[name="profile"]').forEach((el) => {
    el.addEventListener('change', () => {
      const state = readState();
      const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
      refresh(firstIncompleteStepId(steps, state));
    });
  });
  container.querySelector('#include-forwarders')?.addEventListener('change', () => {
    const state = readState();
    const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
    refresh(firstIncompleteStepId(steps, state));
  });
  container.querySelector('#show-completed-steps')?.addEventListener('change', () => refresh());

  container.querySelectorAll('[data-host-role], #cfg-os-user, #cfg-admin-password, #cfg-cluster-secret, #cfg-splunk-version').forEach((el) => {
    el.addEventListener('change', () => {
      const state = readState();
      saveGuideState(state);
      document.getElementById('guide-steps')!.innerHTML = renderStepsHtml(
        filterStepsForProfile(state.profileId, state.includeForwarders),
        state,
        firstIncompleteStepId(filterStepsForProfile(state.profileId, state.includeForwarders), state),
      );
      bindStepHandlers(container, state);
      bindCopyButtons(container);
    });
  });

  container.querySelector('#step-jump-select')?.addEventListener('change', (e) => {
    const id = (e.target as HTMLSelectElement).value;
    const el = document.getElementById(`step-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.classList.remove('collapsed');
  });

  bindStepHandlers(container, initialState);
  bindCopyButtons(container);

  container.querySelector('#copy-guide-md')?.addEventListener('click', async () => {
    const state = readState();
    await navigator.clipboard.writeText(buildMarkdown(state));
    const btn = container.querySelector('#copy-guide-md');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = 'Copy guide (Markdown)';
      }, 2000);
    }
  });

  container.querySelectorAll('.panel-header').forEach((header) => {
    header.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.step-check-label')) return;
      header.parentElement?.classList.toggle('collapsed');
    });
  });
}

function bindStepHandlers(container: HTMLElement, state: GuideState): void {
  const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
  container.querySelectorAll('.step-done-cb').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = (cb as HTMLInputElement).dataset.stepId!;
      const current = loadGuideState();
      const next = toggleStepComplete(current, id, (cb as HTMLInputElement).checked);
      saveGuideState(next);
      const stepEl = (cb as HTMLElement).closest('.guide-step');
      stepEl?.classList.toggle('step-done', (cb as HTMLInputElement).checked);
      if ((cb as HTMLInputElement).checked && !next.showCompletedSteps) {
        stepEl?.classList.add('step-hidden');
      } else {
        stepEl?.classList.remove('step-hidden');
      }
      updateProgressUi(container, steps, next);
    });
  });
}

export function renderGuide(container: HTMLElement): void {
  let state = loadGuideState();
  if (!state.hostConfig.hosts.length) {
    state = { ...state, hostConfig: defaultHostConfig() };
  }
  renderGuideContent(container, state);
}
