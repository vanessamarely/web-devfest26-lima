// Controlador del deck: pie de página, tema, contraste, proporción de pantalla, menú,
// decoraciones (avatares limeños, checklist, código) y la conexión en vivo con el público y la consola.
import {
  Accessibility,
  Activity,
  ArrowUpRight,
  Bot,
  Braces,
  Camera,
  CirclePlay,
  Code,
  Cpu,
  Download,
  EyeOff,
  FileCode,
  Gauge,
  GitBranch,
  Globe,
  History,
  Hourglass,
  Image,
  LayoutGrid,
  LayoutTemplate,
  List,
  MessageSquareText,
  MousePointerClick,
  Move,
  Play,
  Radio,
  Recycle,
  Repeat,
  ScanEye,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Terminal,
  Trophy,
  User,
  Users,
  Wifi,
  Wrench,
  createIcons,
} from 'lucide';
import { CHECKLIST, CODE, CODE_LANG, SLIDE_BY_ID } from '../shared/content';
import { DEMO_URL, META, NS, OTHER_TALK, TALK, diaDe, getPrimera, setPrimera, PUBLIC_DEMO_URL, REPO_URL, TALKS, prettyUrl, publicLiveUrl, withSessionParams } from '../shared/config';
import { avatarSVG, type AvatarOptions } from '../shared/avatar';
import { QUESTIONS, type QuestionId } from '../shared/questions';
import { esc } from '../shared/esc';
import { animateNotchLogos } from './gdg-logo';
import { initLive } from './live';
import { MODES, RATIOS, initRatio, type RatioMode } from './ratio';
import { initCodeFocus } from './code-focus';
import { highlight } from './highlight';
import { LANDMARKS } from './landmarks';

type DeckStage = HTMLElement & { goTo(i: number): void; next(): void; prev(): void };

void animateNotchLogos().then(() => dispatchEvent(new Event('tweakchange')));

const stage = document.querySelector('deck-stage') as DeckStage;
const sections = [...stage.querySelectorAll<HTMLElement>(':scope > section')];
const total = sections.length;
const pad = (n: number) => String(n).padStart(2, '0');
const save = (k: string, v: string) => {
  try {
    localStorage.setItem(`${NS}.deck.${k}`, v);
  } catch {
    /* noop */
  }
};

// Cada slide del HTML debe existir en content.ts (fuente del celular, la consola y la memoria).
sections.forEach((s) => {
  if (!SLIDE_BY_ID.has(s.dataset.id ?? '')) console.warn('[deck] slide sin contenido en content.ts:', s.dataset.id);
});

// ── Pie de página con contador ───────────────────────────────────────
sections.forEach((s, i) => {
  if (i === 0 || s.classList.contains('section-slide') || s.classList.contains('cover')) return;
  s.insertAdjacentHTML(
    'beforeend',
    `<div class="footer"><span class="handles">Instagram <b>@vanessamarelycode</b> · GitHub <b>vanessamarely</b> · <b>vanessamarely.dev</b></span><span>${pad(i + 1)} / ${total}</span></div>`,
  );
});

// ── Vista: presentadora (?presenter) o público (la URL que ve todo el mundo) ──
// El público ve un menú simple: sin consola, otra charla, agenda, proporción, alto contraste ni QR por slide.
const VISTA_PRESENTADORA = new URLSearchParams(location.search).has('presenter');
document.documentElement.dataset.vista = VISTA_PRESENTADORA ? 'presentadora' : 'publico';
const soloPresentadora = (html: string) => (VISTA_PRESENTADORA ? html : '');

// ── QR pequeño para unirse en cada slide (para quien llega tarde) ─────
// Esquina inferior izquierda, simétrico al logo de GDG. No va donde ya hay un QR grande.
// Tecla J: mostrar / ocultar (se recuerda en este navegador).
// Sin QR pequeño donde ya hay un QR grande (portada, únete, demos, gracias).
sections.forEach((s) => {
  if (!VISTA_PRESENTADORA) return; // solo en la pantalla de la presentadora
  if (s.classList.contains('cover') || s.querySelector('[data-qr]')) return;
  s.insertAdjacentHTML('beforeend', '<div class="join-notch" aria-hidden="true"><div class="join-qr" data-qr="live"></div><span>Únete</span></div>');
});
try {
  if (localStorage.getItem(`${NS}.deck.joinqr`) === '0') document.documentElement.dataset.joinqr = 'off';
} catch {
  /* noop */
}
const toggleJoinQr = () => {
  const off = document.documentElement.dataset.joinqr !== 'off';
  if (off) document.documentElement.dataset.joinqr = 'off';
  else delete document.documentElement.dataset.joinqr;
  save('joinqr', off ? '0' : '1');
};

// ── Código: una sola fuente (content.ts) para el deck, el celular y la memoria ──
document.querySelectorAll<HTMLElement>('[data-code]').forEach((el) => {
  const src = CODE[el.dataset.code!] ?? '';
  const pre = el.querySelector('pre')!;
  pre.innerHTML = highlight(src, CODE_LANG[el.dataset.code!] ?? 'js');
});

// ── Preguntas: texto en el deck (las respuestas NO están en el bundle) ──
document.querySelectorAll<HTMLElement>('[data-q-text]').forEach((el) => (el.textContent = QUESTIONS[el.dataset.qText as QuestionId].text));

// ── Decoraciones: avatares limeños de ejemplo, paisajes de Lima y checklist ──
// Semilla fija por posición: los mismos avatares en cada ensayo (y en las miniaturas). Variados a propósito.
const DECOR: AvatarOptions[] = [
  { piel: 2, pelo: 8, colorPelo: 0, ropa: 1, gorro: 0, lentes: 0, expresion: 0, accesorio: 1, rasgos: 3, abajo: 1 },
  { piel: 4, pelo: 7, colorPelo: 0, ropa: 2, gorro: 4, lentes: 0, expresion: 1, accesorio: 10, rasgos: 0, abajo: 0 },
  { piel: 1, pelo: 2, colorPelo: 2, ropa: 3, gorro: 0, lentes: 2, expresion: 2, accesorio: 3, rasgos: 2, abajo: 3 },
  { piel: 3, pelo: 0, colorPelo: 1, ropa: 7, gorro: 3, lentes: 1, expresion: 0, accesorio: 6, rasgos: 5, abajo: 2 },
  { piel: 0, pelo: 4, colorPelo: 3, ropa: 6, gorro: 5, lentes: 3, expresion: 1, accesorio: 9, rasgos: 4, abajo: 1 },
  { piel: 5, pelo: 1, colorPelo: 0, ropa: 5, gorro: 0, lentes: 4, expresion: 4, accesorio: 7, rasgos: 1, abajo: 0 },
];
document.querySelectorAll<HTMLElement>('[data-landmark]').forEach((el) => {
  el.innerHTML = LANDMARKS[el.dataset.landmark!]?.() ?? '';
});
// Un avatar limeño camina por el malecón en cada capítulo, en la receta y en la portada.
document.querySelectorAll<HTMLElement>('[data-runner]').forEach((el) => {
  el.innerHTML = avatarSVG(DECOR[Number(el.dataset.runner) % DECOR.length], 'Avatar limeño');
});
document.querySelectorAll<HTMLElement>('[data-avatars]').forEach((el, k) => {
  const n = Number(el.dataset.avatars) || 3;
  el.innerHTML = Array.from({ length: n }, (_, i) => avatarSVG(DECOR[(i + k * 3) % DECOR.length], 'Avatar limeño').replace('<svg ', `<svg style="--i:${i}" `)).join('');
});
// Barras "releer todo" (crecen) vs "leer una vez" (planas) y ticks de trozos vs frames.
document.querySelectorAll<HTMLElement>('[data-bars]').forEach((el) => {
  const bad = el.dataset.bars === 'bad';
  el.innerHTML = Array.from({ length: 24 }, (_, k) => `<i style="--k:${k};${bad ? `height:${Math.round(((k + 1) / 24) * 100)}%` : ''}"></i>`).join('');
});
document.querySelectorAll<HTMLElement>('[data-ticks]').forEach((el) => (el.innerHTML = '<i></i>'.repeat(Number(el.dataset.ticks) || 60)));
// Números reales medidos al grabar los clips (scripts/record-clips.mjs escribe metrics.json).
fetch(`/clips/${TALK}/metrics.json`, { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .then((m: Record<string, string | number> | null) => {
    if (!m) return;
    document.querySelectorAll<HTMLElement>('[data-metric]').forEach((el) => {
      const v = m[el.dataset.metric!];
      if (v !== undefined) el.textContent = typeof v === 'number' ? v.toLocaleString('es-PE') : v;
    });
  })
  .catch(() => undefined);
// ── Agenda: "Día 1/Día 2" y el título de la otra charla (el CSS elige los textos de primera o segunda) ──
function pintarAgenda() {
  document.querySelectorAll('[data-dia]').forEach((el) => (el.textContent = diaDe(TALK)));
  document.querySelectorAll('[data-otra-titulo]').forEach((el) => (el.textContent = TALKS[OTHER_TALK].title));
  menu?.querySelectorAll<HTMLElement>('[data-primera]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.primera === getPrimera())));
  const otra = menu?.querySelector('[data-otra-dia]');
  if (otra) otra.textContent = TALKS[OTHER_TALK].day;
  dispatchEvent(new Event('tweakchange'));
}
addEventListener('agenda', pintarAgenda);
const checklist = document.querySelector('[data-checklist]');
if (checklist) checklist.innerHTML = CHECKLIST.map(([h, p]) => `<li><span><b>${esc(h)}:</b> ${esc(p)}</span></li>`).join('');

// ── Enlaces a la demo ────────────────────────────────────────────────
document.querySelectorAll<HTMLAnchorElement>('[data-demo-link]').forEach((a) => (a.href = new URL(a.dataset.demoLink!, DEMO_URL).toString()));
// El QR y el texto de la demo apuntan SIEMPRE a la versión publicada (los asistentes no pueden abrir localhost).
document.querySelectorAll('[data-demo-url]').forEach((el) => (el.textContent = prettyUrl(PUBLIC_DEMO_URL)));

// ── Tema (claro / oscuro) y alto contraste ───────────────────────────
const isDark = () => document.documentElement.dataset.theme === 'dark';
function setTheme(dark: boolean) {
  if (dark) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  save('theme', dark ? 'dark' : 'light');
  dispatchEvent(new Event('tweakchange')); // deck-stage re-sincroniza las miniaturas
}
function toggleContrast() {
  const on = document.documentElement.dataset.contrast !== 'high';
  if (on) document.documentElement.dataset.contrast = 'high';
  else delete document.documentElement.dataset.contrast;
  save('contrast', on ? '1' : '0');
  dispatchEvent(new Event('tweakchange'));
}
document.fonts?.ready.then(() => dispatchEvent(new Event('tweakchange')));

// ── Pantalla completa / panel lateral ────────────────────────────────
const toggleFullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => undefined);
let railOn = true;
try {
  railOn = localStorage.getItem('deck-stage.railVisible') !== '0';
} catch {
  /* noop */
}
const toggleRail = () => {
  railOn = !railOn;
  postMessage({ type: '__deck_rail_visible', on: railOn }, location.origin);
};

// ── Menú hamburguesa (siempre arriba a la derecha) ───────────────────
const menuBtn = document.querySelector<HTMLButtonElement>('.deck-menu-btn')!;
const menu = document.querySelector<HTMLElement>('.deck-menu-panel')!;
let current = Math.max(0, sections.findIndex((s) => s.hasAttribute('data-deck-active')));

const ratioLabel = (m: RatioMode) => (m === 'auto' ? ['Auto', 'según la ventana'] : m === 'event' ? ['Extendida', '1680×672 · bandas'] : [RATIOS[m].label, RATIOS[m].hint]);
menu.innerHTML = `
  <div class="group">Enlaces</div>
  ${soloPresentadora(`<a href="${withSessionParams('/presenter/')}" target="_blank" rel="noreferrer">Consola de la presentadora <kbd>P</kbd></a>`)}
  <a href="${publicLiveUrl()}" target="_blank" rel="noreferrer">App de asistentes <i data-lucide="arrow-up-right"></i></a>
  <a href="${DEMO_URL}" target="_blank" rel="noreferrer">Demo: ${META.demoName} <i data-lucide="arrow-up-right"></i></a>
  ${soloPresentadora(`<a href="${withSessionParams(TALKS[OTHER_TALK].deckPath).replace(/talk=\w+&?/, '')}">Ir a la otra charla: <span data-otra-dia>${TALKS[OTHER_TALK].day}</span> <i data-lucide="arrow-up-right"></i></a>`)}
  <a href="${REPO_URL}" target="_blank" rel="noreferrer">Repositorio <i data-lucide="arrow-up-right"></i></a>
  ${soloPresentadora(`<div class="group">Agenda · ¿qué charla va primero?</div>
  <div class="ratio-row agenda-row"><button type="button" data-primera="genui">Primero<small>UI generativa</small></button><button type="button" data-primera="agentes">Primero<small>DevTools para agentes</small></button></div>
  <div class="group">Proporción de pantalla <kbd><span data-ratio-state></span> · A</kbd></div>
  <div class="ratio-row">${MODES.map((m) => {
    const [l, h] = ratioLabel(m);
    return `<button type="button" data-ratio-pick="${m}">${l}<small>${h}</small></button>`;
  }).join('')}</div>`)}
  <div class="group">Vista</div>
  <button type="button" data-act="theme">Modo claro / oscuro <kbd>L</kbd></button>
  ${soloPresentadora('<button type="button" data-act="contrast">Alto contraste (proyector) <kbd>H</kbd></button>')}
  <button type="button" data-act="fs">Pantalla completa <kbd>F</kbd></button>
  <button type="button" data-act="rail">Panel de miniaturas <kbd>S</kbd></button>
  ${soloPresentadora('<button type="button" data-act="joinqr">QR para unirse en cada slide <kbd>J</kbd></button>')}
  ${soloPresentadora('<button type="button" data-act="present" data-presenter-only>Presentar en vivo (GitHub)</button>')}
  <button type="button" data-act="answers" data-presenter-ui hidden>Cargar respuestas del podio… <kbd data-answers-status></kbd></button>
  <button type="button" data-act="questions" data-presenter-ui hidden>Preguntas del público <kbd><span data-q-count>0</span> · Q</kbd></button>
  <button type="button" data-act="wipe" data-presenter-ui hidden>Vaciar sesión en vivo…</button>
  <div class="group">Ir a</div>
  <div class="slides-list"></div>`;

function renderMenuList() {
  const list = menu.querySelector('.slides-list')!;
  if (!list.childElementCount) {
    sections.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${pad(i + 1)} · ${s.dataset.label ?? 'Slide'}`;
      b.addEventListener('click', () => {
        stage.goTo(i);
        closeMenu();
      });
      list.append(b);
    });
  }
  [...list.children].forEach((b, i) => (i === current ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
}

const openMenu = () => {
  menu.hidden = false;
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.setAttribute('aria-label', 'Cerrar menú');
  menu.querySelector<HTMLElement>('a, button')?.focus();
};
const closeMenu = () => {
  menu.hidden = true;
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Abrir menú');
};
menuBtn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
addEventListener('pointerdown', (e) => {
  if (!menu.hidden && !menu.contains(e.target as Node) && !menuBtn.contains(e.target as Node)) closeMenu();
});
menu.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const prim = t.closest<HTMLElement>('[data-primera]')?.dataset.primera as 'genui' | 'agentes' | undefined;
  if (prim) {
    setPrimera(prim);
    document.dispatchEvent(new CustomEvent('deck:agenda', { detail: prim }));
    return;
  }
  const pickRatio = t.closest<HTMLElement>('[data-ratio-pick]')?.dataset.ratioPick as RatioMode | undefined;
  if (pickRatio) return ratio.set(pickRatio);
  const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
  if (act === 'theme') setTheme(!isDark());
  if (act === 'contrast') toggleContrast();
  if (act === 'fs') toggleFullscreen();
  if (act === 'rail') toggleRail();
  if (act === 'joinqr') toggleJoinQr();
  if (act === 'present') document.dispatchEvent(new CustomEvent('deck:present'));
  if (act === 'answers') document.dispatchEvent(new CustomEvent('deck:answers'));
  if (act === 'wipe') {
    closeMenu();
    document.dispatchEvent(new CustomEvent('deck:wipe'));
  }
  if (act === 'questions') {
    closeMenu();
    document.dispatchEvent(new CustomEvent('deck:questions'));
  }
});

// Clips de DevTools: un clic agranda el clip a todo el slide; otro clic lo devuelve.
document.addEventListener('click', (e) => {
  const fig = (e.target as HTMLElement).closest<HTMLElement>('.dt-clip');
  if (!fig) return;
  const abierto = fig.classList.contains('zoom');
  document.querySelectorAll('.dt-clip.zoom').forEach((x) => x.classList.remove('zoom'));
  if (!abierto) fig.classList.add('zoom');
});

// Cada publicación tiene su versión: los clips y sus pósters se piden con ?v=, así nunca se ve uno viejo.
declare const __CLIPS_V__: string;
const conVersion = (url: string) => `${url}${url.includes('?') ? '&' : '?'}v=${typeof __CLIPS_V__ === 'string' ? __CLIPS_V__ : 'dev'}`;
document.querySelectorAll<HTMLVideoElement>('video[poster]').forEach((v) => (v.poster = conVersion(v.getAttribute('poster')!)));

// ── Clips de la demo: se cargan perezosamente y solo se reproducen en el slide activo ──
function playClips(slide: HTMLElement) {
  document.querySelectorAll<HTMLVideoElement>('video[data-src]').forEach((v) => {
    if (slide.contains(v)) {
      if (!v.src) v.src = conVersion(v.dataset.src!);
      v.currentTime = 0;
      v.play().catch(() => undefined);
    } else v.pause();
  });
}
stage.addEventListener('slidechange', (e) => {
  const { index, slide } = (e as CustomEvent).detail as { index: number; slide: HTMLElement };
  current = index;
  renderMenuList();
  playClips(slide);
});
setTimeout(() => {
  const first = sections.find((s) => s.hasAttribute('data-deck-active'));
  if (first) playClips(first);
});
renderMenuList();

createIcons({
  icons: { Accessibility, Activity, ArrowUpRight, Bot, Braces, Camera, CirclePlay, Code, Cpu, Download, EyeOff, FileCode, Gauge, GitBranch, Globe, History, Hourglass, Image, LayoutGrid, LayoutTemplate, List, MessageSquareText, MousePointerClick, Move, Play, Radio, Recycle, Repeat, ScanEye, ShieldCheck, Smartphone, Snowflake, Sparkles, Terminal, Trophy, User, Users, Wifi, Wrench },
  attrs: { 'stroke-width': 1.75, 'aria-hidden': 'true' },
});
dispatchEvent(new Event('tweakchange'));

// ── Atajos (sin chocar con deck-stage: ←/→, espacio, R, números) ─────
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'escape' && !menu.hidden) closeMenu();
  if (k === 'l') setTheme(!isDark());
  if (k === 'h' && VISTA_PRESENTADORA) toggleContrast();
  if (k === 'f') toggleFullscreen();
  if (k === 's') toggleRail();
  if (k === 'a' && VISTA_PRESENTADORA) ratio.cycle();
  if (k === 'e' && VISTA_PRESENTADORA) ratio.toggleEvent();
  if (k === 'm') (menu.hidden ? openMenu : closeMenu)();
  if (k === 'j' && VISTA_PRESENTADORA) toggleJoinQr();
  if (k === 'p' && VISTA_PRESENTADORA) open(withSessionParams('/presenter/'), `${NS}-presenter`);
});

// ── Proporción de pantalla (4:3 · 16:10 · 16:9 · 21:9 · extendida) ───
const ratio = initRatio(stage, sections);

// ── Modo foco en el código: una idea a la vez (↓/↑ o clic) ──
initCodeFocus(stage, sections);

// ── El código siempre cabe: ajusta el tamaño de letra al ancho Y al alto disponibles ──
// (en 4:3 la columna es más angosta; en 21:9 hay más espacio). Mínimo legible: 11 px.
function fitCode() {
  document.querySelectorAll<HTMLElement>('.code pre').forEach((pre) => {
    const frame = pre.closest<HTMLElement>('.card-frame');
    let size = 17;
    pre.style.fontSize = `${size}px`;
    const tooBig = () => pre.scrollWidth > pre.clientWidth + 1 || (frame ? frame.scrollHeight > frame.clientHeight + 1 : false);
    while (size > 9.5 && tooBig()) pre.style.fontSize = `${(size -= 0.5)}px`;
  });
}
let fitRaf = 0;
addEventListener('resize', () => {
  cancelAnimationFrame(fitRaf);
  fitRaf = requestAnimationFrame(fitCode);
});
document.fonts?.ready.then(fitCode);
fitCode();

pintarAgenda();
initLive(stage, sections).catch((err) => console.error('[live]', err));
