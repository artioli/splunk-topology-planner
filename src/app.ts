import './styles/global.css';
import { initLocaleFromHash, subscribeLocale } from './i18n';
import { renderGuide } from './guide/renderGuide';
import { getRoute, bindNavEvents } from './nav';
import { renderPlanner } from './planner/renderPlanner';
import { initTheme } from './theme';

const app = document.querySelector<HTMLDivElement>('#app')!;

initTheme();
initLocaleFromHash();

function render(): void {
  const route = getRoute();
  if (route === 'guide') {
    renderGuide(app);
    bindNavEvents(app, render);
  } else {
    renderPlanner(app, render);
  }
}

window.addEventListener('hashchange', render);
subscribeLocale(render);
render();
