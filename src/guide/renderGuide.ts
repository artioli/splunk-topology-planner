import { escapeHtml } from '../lib/format';
import { renderNav } from '../nav';
import { DEPLOYMENT_PROFILES, getProfile } from './profiles';
import { defaultHostConfig, hostByRole } from './hostDefaults';
import { loadGuideState, saveGuideState, toggleStepComplete } from './progress';
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
  return `<table class="host-table"><thead><tr><th>Role</th><th>Hostname</th><th>IP</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderStep(step: GuideStep, state: GuideState): string {
  const done = state.completedSteps.includes(step.id);
  const targets = step.targets.map((t) => `<span class="target-chip">${escapeHtml(targetLabel(t))}</span>`).join('');
  const docs = step.docLinks
    .map((d) => `<a href="${d.url}" target="_blank" rel="noopener">${escapeHtml(d.label)}</a>`)
    .join(' · ');
  const blocks = step.blocks.map((b) => renderBlock(b, state.hostConfig)).join('');
  return `
    <section class="panel guide-step ${done ? 'step-done' : ''}" data-step-id="${step.id}">
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

function renderGuideContent(container: HTMLElement, state: GuideState): void {
  const steps = filterStepsForProfile(state.profileId, state.includeForwarders);
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
        <span class="field-hint">${steps.length} steps for this profile</span>
      </div>

      <div id="guide-steps">${steps.map((s) => renderStep(s, state)).join('')}</div>
    </main>
  `;

  bindGuideEvents(container, state);
}

function bindGuideEvents(container: HTMLElement, initialState: GuideState): void {
  const refresh = () => {
    const state = {
      ...initialState,
      profileId: (document.querySelector<HTMLInputElement>('input[name="profile"]:checked')?.value ??
        initialState.profileId) as DeploymentProfileId,
      includeForwarders: (document.getElementById('include-forwarders') as HTMLInputElement)?.checked ?? false,
      hostConfig: readHostConfigFromForm(initialState),
    };
    saveGuideState(state);
    renderGuideContent(container, state);
  };

  container.querySelectorAll('input[name="profile"]').forEach((el) => {
    el.addEventListener('change', refresh);
  });
  container.querySelector('#include-forwarders')?.addEventListener('change', refresh);
  container.querySelectorAll('[data-host-role], #cfg-os-user, #cfg-admin-password, #cfg-cluster-secret, #cfg-splunk-version').forEach((el) => {
    el.addEventListener('change', () => {
      const state = {
        ...initialState,
        profileId: (document.querySelector<HTMLInputElement>('input[name="profile"]:checked')?.value ??
          initialState.profileId) as DeploymentProfileId,
        includeForwarders: (document.getElementById('include-forwarders') as HTMLInputElement)?.checked ?? false,
        hostConfig: readHostConfigFromForm(initialState),
      };
      saveGuideState(state);
      document.getElementById('guide-steps')!.innerHTML = filterStepsForProfile(
        state.profileId,
        state.includeForwarders,
      )
        .map((s) => renderStep(s, state))
        .join('');
      bindStepHandlers(container, state);
    });
  });

  bindStepHandlers(container, initialState);

  container.querySelector('#copy-guide-md')?.addEventListener('click', async () => {
    const state = {
      ...initialState,
      profileId: (document.querySelector<HTMLInputElement>('input[name="profile"]:checked')?.value ??
        initialState.profileId) as DeploymentProfileId,
      includeForwarders: (document.getElementById('include-forwarders') as HTMLInputElement)?.checked ?? false,
      hostConfig: readHostConfigFromForm(initialState),
    };
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

  container.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const pre = btn.previousElementSibling;
      const text = pre?.textContent ?? '';
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 1500);
    });
  });
}

function bindStepHandlers(container: HTMLElement, state: GuideState): void {
  container.querySelectorAll('.step-done-cb').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = (cb as HTMLInputElement).dataset.stepId!;
      const next = toggleStepComplete(state, id, (cb as HTMLInputElement).checked);
      saveGuideState(next);
      (cb as HTMLElement).closest('.guide-step')?.classList.toggle('step-done', (cb as HTMLInputElement).checked);
    });
  });
  container.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const pre = btn.previousElementSibling;
      const text = pre?.textContent ?? '';
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 1500);
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
