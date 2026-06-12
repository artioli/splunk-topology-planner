import './styles/global.css';
import { initLocaleFromHash, subscribeLocale } from './i18n';
import { renderGuide } from './guide/renderGuide';
import { renderHome } from './home/renderHome';
import { getRoute } from './nav';
import { renderPlanner } from './planner/renderPlanner';
import { initTheme } from './theme';

const app = document.querySelector<HTMLDivElement>('#app')!;

initTheme();
initLocaleFromHash();

function render(): void {
  const route = getRoute();
  if (route === 'guide') {
    renderGuide(app, render);
  } else if (route === 'planner') {
    renderPlanner(app, render);
  } else {
    renderHome(app, render);
  }
}

window.addEventListener('hashchange', render);
subscribeLocale(render);
render();
