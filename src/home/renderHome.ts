import { t } from '../i18n';
import { DOC_LINKS } from '../lib/constants';
import { escapeHtml } from '../lib/format';
import { bindNavEvents, renderNav } from '../nav';

export function renderHome(container: HTMLElement, onLocaleChange?: () => void): void {
  container.innerHTML = `
    ${renderNav('home')}
    <div class="home-layout">
      <header class="home-hero">
        <h1>${escapeHtml(t('home.title'))}</h1>
        <p>${escapeHtml(t('home.subtitle'))}</p>
      </header>

      <div class="home-cards">
        <a href="#planner" class="home-card">
          <span class="home-card-icon" aria-hidden="true">📊</span>
          <h2>${escapeHtml(t('home.cardPlannerTitle'))}</h2>
          <p>${escapeHtml(t('home.cardPlannerDesc'))}</p>
          <span class="home-card-cta">${escapeHtml(t('home.cardPlannerCta'))} →</span>
        </a>
        <a href="#guide" class="home-card">
          <span class="home-card-icon" aria-hidden="true">📋</span>
          <h2>${escapeHtml(t('home.cardGuideTitle'))}</h2>
          <p>${escapeHtml(t('home.cardGuideDesc'))}</p>
          <span class="home-card-cta">${escapeHtml(t('home.cardGuideCta'))} →</span>
        </a>
        <a href="${DOC_LINKS.sva}" target="_blank" rel="noopener noreferrer" class="home-card">
          <span class="home-card-icon" aria-hidden="true">📚</span>
          <h2>${escapeHtml(t('home.cardDocsTitle'))}</h2>
          <p>${escapeHtml(t('home.cardDocsDesc'))}</p>
          <span class="home-card-cta">${escapeHtml(t('home.cardDocsCta'))} →</span>
        </a>
      </div>

      <footer class="home-footer">
        <p class="field-hint">${escapeHtml(t('planner.disclaimer'))}</p>
      </footer>
    </div>
  `;

  bindNavEvents(container, onLocaleChange);
}
