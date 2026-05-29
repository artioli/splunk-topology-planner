import { cycleTheme, getStoredTheme, themeToggleLabel } from './theme';

export type AppRoute = 'planner' | 'guide';

export function getRoute(): AppRoute {
  const hash = window.location.hash.replace(/^#/, '') || 'planner';
  return hash === 'guide' ? 'guide' : 'planner';
}

export function renderNav(active: AppRoute): string {
  const theme = getStoredTheme();
  return `
    <nav class="app-nav app-nav--top" aria-label="Main">
      <div class="nav-brand">Splunk Planner</div>
      <div class="nav-links nav-links--desktop">
        <a href="#planner" class="nav-link ${active === 'planner' ? 'active' : ''}">Topology Planner</a>
        <a href="#guide" class="nav-link ${active === 'guide' ? 'active' : ''}">Deployment Guide</a>
      </div>
      <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Toggle color theme">
        ${themeToggleLabel(theme)}
      </button>
    </nav>
    <nav class="app-nav app-nav--bottom" aria-label="Mobile">
      <a href="#planner" class="nav-tab ${active === 'planner' ? 'active' : ''}">
        <span class="nav-tab-icon" aria-hidden="true">📊</span>
        <span>Planner</span>
      </a>
      <a href="#guide" class="nav-tab ${active === 'guide' ? 'active' : ''}">
        <span class="nav-tab-icon" aria-hidden="true">📋</span>
        <span>Guide</span>
      </a>
    </nav>`;
}

export function bindNavEvents(container: HTMLElement): void {
  container.querySelector('#theme-toggle')?.addEventListener('click', () => {
    const next = cycleTheme();
    const btn = container.querySelector('#theme-toggle');
    if (btn) btn.textContent = themeToggleLabel(next);
  });
}
