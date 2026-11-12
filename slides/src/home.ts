// Portada: muestra "Día 1 / Día 2" según la agenda que fijó la presentadora (Firestore config/agenda).
import { diaDe, getPrimera, setPrimera } from './shared/config';
import { getRealtime } from './shared/realtime';

function pintar() {
  document.querySelectorAll<HTMLElement>('[data-dia-de]').forEach((el) => (el.textContent = diaDe(el.dataset.diaDe as 'genui' | 'agentes')));
  document.querySelector<HTMLElement>('.talks')?.setAttribute('data-primera', getPrimera());
}
addEventListener('agenda', pintar);
pintar();
void getRealtime().then((rt) => rt.onAgenda((p) => p && setPrimera(p)));
