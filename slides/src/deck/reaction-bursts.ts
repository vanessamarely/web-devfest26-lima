// Reacciones con efecto: cuando la sala reacciona EN MASA, pasa algo en la pantalla.
//  🔥 fuego        → un avatar limeño cruza corriendo con un letrero
//  🤯 ¡wow!       → un parapente cruza el cielo de Miraflores
//  ❤️ me gusta     → el sol de Lima sale y sonríe
// Y si la sala sigue (o salen los tres efectos seguidos): ¡Fiesta en la Costa Verde! Avatares de
// la sala bailan con pañuelo y un surfista cruza sobre una ola.
// Y si UNA persona reacciona varias veces seguidas, su propio avatar aparece en la pantalla:
// 🔥 salta con llamas · ❤️ sube entre corazones · 🤯 gira con estrellas, con su nombre en un globo.
// No cuesta tiempo de charla: se dispara solo. Umbral proporcional a la sala y un enfriamiento
// por efecto para no saturar. Respeta prefers-reduced-motion.
import { avatarSVG, type AvatarOptions } from '../shared/avatar';
import type { Reaction } from '../shared/realtime';
import { gliderSVG, sunSVG } from './landmarks';

const WINDOW_MS = 6000;
const COOLDOWN_MS = 25000;
/** La fiesta: los tres efectos en 40 s, o una oleada del doble mientras un efecto descansa. Máximo una por minuto. */
const FIESTA_VENTANA_MS = 40000;
const FIESTA_COOLDOWN_MS = 60000;
const FIESTA_MS = 7000;

const AVATARES_FIESTA: AvatarOptions[] = [
  { piel: 3, pelo: 8, colorPelo: 0, ropa: 2, gorro: 0, lentes: 0, expresion: 0, accesorio: 0, rasgos: 3, abajo: 1 },
  { piel: 1, pelo: 2, colorPelo: 1, ropa: 6, gorro: 5, lentes: 1, expresion: 1, accesorio: 0, rasgos: 5, abajo: 0 },
  { piel: 4, pelo: 7, colorPelo: 3, ropa: 4, gorro: 0, lentes: 0, expresion: 0, accesorio: 0, rasgos: 1, abajo: 3 },
  { piel: 2, pelo: 0, colorPelo: 0, ropa: 0, gorro: 1, lentes: 2, expresion: 2, accesorio: 0, rasgos: 6, abajo: 0 },
  { piel: 0, pelo: 5, colorPelo: 4, ropa: 1, gorro: 6, lentes: 0, expresion: 0, accesorio: 0, rasgos: 7, abajo: 2 },
];
const SURFISTA: AvatarOptions = { piel: 3, pelo: 3, colorPelo: 0, ropa: 7, gorro: 0, lentes: 3, expresion: 0, accesorio: 0, rasgos: 0, abajo: 2 };

const PANUELO = `<svg class="panuelo" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 6 Q20 0 36 8 Q30 22 34 36 Q18 30 6 34 Q10 20 4 6Z" fill="#fff" stroke="#1e1e1e" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
const OLA = `<svg class="ola" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70 Q50 40 100 70 T200 70 T300 70 T400 70 V120 H0Z" fill="#4285f4" stroke="#1e1e1e" stroke-width="3"/><path d="M0 86 Q50 62 100 86 T200 86 T300 86 T400 86" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/></svg>`;
const TABLA = `<svg class="tabla" viewBox="0 0 160 30" aria-hidden="true"><ellipse cx="80" cy="15" rx="76" ry="11" fill="#ffd427" stroke="#1e1e1e" stroke-width="3"/><path d="M14 15 H146" stroke="#ea4335" stroke-width="3"/></svg>`;

/** Elige hasta n avatares distintos de la sala (o los de la casa si todavía no hay). */
function elegir(lista: AvatarOptions[], n: number): AvatarOptions[] {
  const pool = [...lista].sort(() => Math.random() - 0.5).slice(0, n);
  for (let i = 0; pool.length < n; i++) pool.push(AVATARES_FIESTA[i % AVATARES_FIESTA.length]);
  return pool;
}

/** Cuántas reacciones iguales en 6 s disparan el efecto: 4 como mínimo, ~6 % de la sala, 18 como máximo. */
export const burstThreshold = (players: number) => Math.min(18, Math.max(4, Math.ceil(players * 0.06)));

export function createBursts(getPlayers: () => number, getAvatars: () => AvatarOptions[] = () => []) {
  const hits: Record<string, number[]> = {};
  const lastFired: Record<string, number> = {};
  let ultimaFiesta = -Infinity;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(kind: Reaction) {
    const el = document.createElement('div');
    el.className = `burst burst-${kind}`;
    el.setAttribute('role', 'status');
    if (kind === 'fire')
      el.innerHTML = `<div class="burst-runner">${avatarSVG({ piel: 3, pelo: 2, colorPelo: 0, ropa: 2, gorro: 1, lentes: 1, expresion: 0, accesorio: 2, rasgos: 3, abajo: 2 }, 'Avatar')}</div><p class="burst-sign">¡Qué buena energía, Lima! 🔥</p>`;
    if (kind === 'mind') el.innerHTML = `<div class="burst-condor">${gliderSVG()}</div><p class="burst-sign">¡Esto sorprendió a la sala! 🤯</p>`;
    if (kind === 'heart') el.innerHTML = `<div class="burst-inti">${sunSVG()}</div><p class="burst-sign">¡Salió el sol en Lima! ❤️</p>`;
    document.body.append(el);
    setTimeout(() => el.remove(), reduced() ? 2500 : 5200);
  }

  /** El avatar de UNA persona que reaccionó varias veces seguidas, haciendo algo según la reacción. */
  let cameoHasta = 0;
  function cameo(kind: Reaction, opts: AvatarOptions | null, nombre: string): boolean {
    const ahora = Date.now();
    if (ahora < cameoHasta || document.querySelector('.burst-fiesta')) return false; // uno a la vez
    cameoHasta = ahora + 4200;
    const extras = { fire: ['🔥', '🔥', '🔥'], heart: ['❤️', '💛', '❤️'], mind: ['✨', '🤯', '✨'] }[kind as 'fire' | 'heart' | 'mind'] ?? ['✨'];
    const texto = { fire: `¡${nombre} se emocionó! 🔥`, heart: `¡A ${nombre} le encantó! ❤️`, mind: `¡Wow, ${nombre}! 🤯` }[kind as 'fire' | 'heart' | 'mind'] ?? nombre;
    const el = document.createElement('div');
    el.className = `burst cameo cameo-${kind}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="cameo-fig">${avatarSVG(opts ?? AVATARES_FIESTA[Math.floor(Math.random() * AVATARES_FIESTA.length)], nombre)}${extras.map((x, i) => `<i style="--i:${i}">${x}</i>`).join('')}</div><p class="cameo-globo"></p>`;
    el.querySelector('.cameo-globo')!.textContent = texto;
    document.body.append(el);
    setTimeout(() => el.remove(), reduced() ? 2500 : 4200);
    return true;
  }

  /** ¡Fiesta en la Costa Verde! Avatares de la sala bailan con pañuelo y un surfista cruza la ola. */
  function fiesta() {
    document.querySelectorAll('.burst:not(.burst-fiesta)').forEach((b) => b.remove());
    const el = document.createElement('div');
    el.className = 'burst burst-fiesta';
    el.setAttribute('role', 'status');
    const baile = elegir(getAvatars(), 5)
      .map((o, i) => `<div class="bailarin" style="--i:${i}">${avatarSVG(o, 'Avatar bailando')}${PANUELO}</div>`)
      .join('');
    const confeti = Array.from({ length: 28 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
    el.innerHTML = `<div class="fiesta-confeti">${confeti}</div>
      <p class="burst-sign">¡Fiesta en la Costa Verde! 🎉</p>
      <div class="fiesta-surf"><div class="surfista">${avatarSVG(SURFISTA, 'Surfista')}</div>${TABLA}</div>
      <div class="fiesta-mar">${OLA}</div>
      <div class="fiesta-baile">${baile}</div>`;
    document.body.append(el);
    setTimeout(() => el.remove(), reduced() ? 3000 : FIESTA_MS);
  }

  function quizasFiesta(now: number, kind: string, enfriando: boolean, n: number): boolean {
    if (now - ultimaFiesta < FIESTA_COOLDOWN_MS) return false;
    const tres = (['fire', 'mind', 'heart'] as const).every((k) => now - (lastFired[k] ?? -Infinity) < FIESTA_VENTANA_MS);
    const insiste = enfriando && n >= 2 * burstThreshold(getPlayers());
    if (!tres && !insiste) return false;
    ultimaFiesta = now;
    hits[kind] = [];
    fiesta();
    return true;
  }

  return {
    /** Llamar con cada reacción recibida. Devuelve true si disparó un efecto. */
    add(r: Reaction, now = Date.now()): boolean {
      if (r === 'ask') return false;
      const list = (hits[r] = (hits[r] ?? []).filter((t) => now - t < WINDOW_MS));
      list.push(now);
      const enfriando = now - (lastFired[r] ?? -Infinity) < COOLDOWN_MS;
      if (list.length < burstThreshold(getPlayers())) return false;
      if (enfriando) return quizasFiesta(now, r, true, list.length);
      lastFired[r] = now;
      hits[r] = [];
      if (quizasFiesta(now, r, false, 0)) return true; // el tercer efecto seguido: directo a la fiesta
      show(r);
      return true;
    },
    /** Para ensayar desde la consola: window.deckBurst('fire') · window.deckFiesta() */
    show,
    fiesta,
    cameo,
  };
}
