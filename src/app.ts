import './styles/global.css';
import { renderGuide } from './guide/renderGuide';
import { getRoute } from './nav';
import { renderPlanner } from './planner/renderPlanner';

const app = document.querySelector<HTMLDivElement>('#app')!;

function render(): void {
  const route = getRoute();
  if (route === 'guide') {
    renderGuide(app);
  } else {
    renderPlanner(app);
  }
}

window.addEventListener('hashchange', render);
render();
