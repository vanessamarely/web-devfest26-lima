// Reacciones con efecto: cuando la sala reacciona EN MASA, pasa algo en la pantalla.
//  🔥 fuego        → un avatar limeño cruza corriendo con un letrero
//  🤯 mente volada → un parapente cruza el cielo de Miraflores
//  ❤️ me gusta     → el sol de Lima sale (¡aunque haya garúa!) y sonríe
// No cuesta tiempo de charla: se dispara solo. Umbral proporcional a la sala y un enfriamiento
// por efecto para no saturar. Respeta prefers-reduced-motion.
import { avatarSVG } from '../shared/avatar';
import type { Reaction } from '../shared/realtime';
import { gliderSVG, sunSVG } from './landmarks';

const WINDOW_MS = 6000;
const COOLDOWN_MS = 25000;

/** Cuántas reacciones iguales en 6 s disparan el efecto: 4 como mínimo, ~6 % de la sala, 18 como máximo. */
export const burstThreshold = (players: number) => Math.min(18, Math.max(4, Math.ceil(players * 0.06)));

export function createBursts(getPlayers: () => number) {
  const hits: Record<string, number[]> = {};
  const lastFired: Record<string, number> = {};
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(kind: Reaction) {
    const el = document.createElement('div');
    el.className = `burst burst-${kind}`;
    el.setAttribute('role', 'status');
    if (kind === 'fire')
      el.innerHTML = `<div class="burst-runner">${avatarSVG({ piel: 3, pelo: 2, colorPelo: 0, ropa: 2, gorro: 1, lentes: 1, expresion: 0, accesorio: 2, rasgos: 3, abajo: 2 }, 'Avatar')}</div><p class="burst-sign">¡Lima está que arde! 🔥</p>`;
    if (kind === 'mind') el.innerHTML = `<div class="burst-condor">${gliderSVG()}</div><p class="burst-sign">¡Mente volada! 🤯</p>`;
    if (kind === 'heart') el.innerHTML = `<div class="burst-inti">${sunSVG()}</div><p class="burst-sign">¡Salió el sol en Lima! ❤️</p>`;
    document.body.append(el);
    setTimeout(() => el.remove(), reduced() ? 2500 : 5200);
  }

  return {
    /** Llamar con cada reacción recibida. Devuelve true si disparó un efecto. */
    add(r: Reaction, now = Date.now()): boolean {
      if (r === 'ask') return false;
      const list = (hits[r] = (hits[r] ?? []).filter((t) => now - t < WINDOW_MS));
      list.push(now);
      if (list.length < burstThreshold(getPlayers()) || now - (lastFired[r] ?? 0) < COOLDOWN_MS) return false;
      lastFired[r] = now;
      hits[r] = [];
      show(r);
      return true;
    },
    /** Para ensayar desde la consola: window.deckBurst('fire') */
    show,
  };
}
