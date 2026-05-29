export type AppRoute = 'planner' | 'guide';

export function getRoute(): AppRoute {
  const hash = window.location.hash.replace(/^#/, '') || 'planner';
  return hash === 'guide' ? 'guide' : 'planner';
}

export function navigate(route: AppRoute): void {
  const next = route === 'guide' ? '#guide' : '#planner';
  if (window.location.hash !== next) {
    window.location.hash = next;
  }
}

export function renderNav(active: AppRoute): string {
  return `
    <nav class="app-nav" aria-label="Main">
      <a href="#planner" class="nav-link ${active === 'planner' ? 'active' : ''}">Topology Planner</a>
      <a href="#guide" class="nav-link ${active === 'guide' ? 'active' : ''}">Deployment Guide</a>
    </nav>`;
}
