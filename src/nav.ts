import { getLocale, setLocale, t } from './i18n';
import type { Locale } from './i18n/types';
import { cycleTheme, getStoredTheme, themeToggleLabel } from './theme';

export type AppRoute = 'home' | 'planner' | 'guide';

export function getRoute(): AppRoute {
  const hash = window.location.hash.replace(/^#/, '');
  const route = hash.split('?')[0].split('&')[0];
  if (route === 'guide') return 'guide';
  if (route === 'planner') return 'planner';
  return 'home';
}

export function getHashParams(): URLSearchParams {
  const hash = window.location.hash.replace(/^#/, '');
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(query);
}

function localeOptions(): string {
  const locales: { id: Locale; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'pt', label: 'Português' },
    { id: 'es', label: 'Español' },
  ];
  const current = getLocale();
  return locales
    .map((l) => `<option value="${l.id}" ${current === l.id ? 'selected' : ''}>${l.label}</option>`)
    .join('');
}

export function renderNav(active: AppRoute): string {
  const theme = getStoredTheme();
  return `
    <nav class="app-nav app-nav--top" aria-label="Main">
      <a href="#home" class="nav-brand-link">${escapeHtml(t('nav.brand'))}</a>
      <div class="nav-links nav-links--desktop">
        <a href="#home" class="nav-link ${active === 'home' ? 'active' : ''}">${escapeHtml(t('nav.home'))}</a>
        <a href="#planner" class="nav-link ${active === 'planner' ? 'active' : ''}">${escapeHtml(t('nav.planner'))}</a>
        <a href="#guide" class="nav-link ${active === 'guide' ? 'active' : ''}">${escapeHtml(t('nav.guide'))}</a>
      </div>
      <div class="nav-actions">
        <label class="nav-lang">
          <span class="nav-lang-label">${escapeHtml(t('nav.langLabel'))}</span>
          <select id="locale-select" aria-label="${escapeHtml(t('nav.langLabel'))}">${localeOptions()}</select>
        </label>
        <button type="button" id="theme-toggle" class="theme-toggle" aria-label="${escapeHtml(t('nav.themeToggle'))}">
          ${themeToggleLabel(theme)}
        </button>
      </div>
    </nav>
    <nav class="app-nav app-nav--bottom" aria-label="Mobile">
      <a href="#home" class="nav-tab ${active === 'home' ? 'active' : ''}">
        <span class="nav-tab-icon" aria-hidden="true">🏠</span>
        <span>${escapeHtml(t('nav.home'))}</span>
      </a>
      <a href="#planner" class="nav-tab ${active === 'planner' ? 'active' : ''}">
        <span class="nav-tab-icon" aria-hidden="true">📊</span>
        <span>${escapeHtml(t('nav.planner'))}</span>
      </a>
      <a href="#guide" class="nav-tab ${active === 'guide' ? 'active' : ''}">
        <span class="nav-tab-icon" aria-hidden="true">📋</span>
        <span>${escapeHtml(t('nav.guide'))}</span>
      </a>
    </nav>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function bindNavEvents(container: HTMLElement, onLocaleChange?: () => void): void {
  container.querySelector('#theme-toggle')?.addEventListener('click', () => {
    const next = cycleTheme();
    const btn = container.querySelector('#theme-toggle');
    if (btn) btn.textContent = themeToggleLabel(next);
  });

  container.querySelector('#locale-select')?.addEventListener('change', (e) => {
    const locale = (e.target as HTMLSelectElement).value as Locale;
    setLocale(locale, true);
    onLocaleChange?.();
  });
}
