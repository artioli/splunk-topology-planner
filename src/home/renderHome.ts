import { t } from '../i18n';
import { DOC_LINKS } from '../lib/constants';
import { escapeHtml } from '../lib/format';
import { bindNavEvents, renderNav } from '../nav';

export function renderHome(container: HTMLElement, onLocaleChange?: () => void): void {
  container.innerHTML = `
    ${renderNav('home')}
    <div class="home-shell app-viewport">
      <section class="home-hero-band">
        <div class="home-hero-inner prose-measure">
          <p class="splunk-eyebrow">${escapeHtml(t('home.eyebrow'))}</p>
          <h1 class="splunk-h1">${escapeHtml(t('home.title'))}</h1>
          <p class="splunk-subhead-lg">${escapeHtml(t('home.subtitle'))}</p>
        </div>
        <div class="home-callout">
          <p class="home-callout-text">${escapeHtml(t('home.calloutText'))}</p>
          <a href="#planner" class="home-callout-cta">${escapeHtml(t('home.calloutCta'))}</a>
        </div>
      </section>

      <section class="home-contents app-viewport--padded">
        <h2 class="splunk-h2">${escapeHtml(t('home.contentsTitle'))}</h2>
        <div class="home-cards">
          <a href="#planner" class="home-card">
            <span class="home-card-marker" aria-hidden="true"></span>
            <span class="home-card-meta">${escapeHtml(t('home.cardPlannerDuration'))}</span>
            <h2>${escapeHtml(t('home.cardPlannerTitle'))}</h2>
            <p>${escapeHtml(t('home.cardPlannerDesc'))}</p>
            <span class="home-card-cta">${escapeHtml(t('home.cardPlannerCta'))} →</span>
          </a>
          <a href="#guide" class="home-card">
            <span class="home-card-marker" aria-hidden="true"></span>
            <span class="home-card-meta">${escapeHtml(t('home.cardGuideDuration'))}</span>
            <h2>${escapeHtml(t('home.cardGuideTitle'))}</h2>
            <p>${escapeHtml(t('home.cardGuideDesc'))}</p>
            <span class="home-card-cta">${escapeHtml(t('home.cardGuideCta'))} →</span>
          </a>
          <a href="${DOC_LINKS.sva}" target="_blank" rel="noopener noreferrer" class="home-card">
            <span class="home-card-marker" aria-hidden="true"></span>
            <span class="home-card-meta">${escapeHtml(t('home.cardDocsDuration'))}</span>
            <h2>${escapeHtml(t('home.cardDocsTitle'))}</h2>
            <p>${escapeHtml(t('home.cardDocsDesc'))}</p>
            <span class="home-card-cta">${escapeHtml(t('home.cardDocsCta'))} →</span>
          </a>
        </div>
      </section>

      <footer class="home-footer">
        <p class="field-hint">${escapeHtml(t('planner.disclaimer'))}</p>
      </footer>
    </div>
  `;

  bindNavEvents(container, onLocaleChange);
}
