import './styles/global.css';
import { renderGuide } from './guide/renderGuide';
import { getRoute, bindNavEvents } from './nav';
import { renderPlanner } from './planner/renderPlanner';
import { initTheme } from './theme';

const app = document.querySelector<HTMLDivElement>('#app')!;

initTheme();

function render(): void {
  const route = getRoute();
  if (route === 'guide') {
    renderGuide(app);
  } else {
    renderPlanner(app);
  }
  bindNavEvents(app);
}

window.addEventListener('hashchange', render);
render();
