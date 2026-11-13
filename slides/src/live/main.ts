// App de asistentes (celular). Sigue al deck en vivo:
//  · Escucha UN solo documento (índice + id del slide + pregunta abierta): el contenido ya viene en el bundle.
//  · Apodo ÚNICO por sesión: si alguien ya lo tiene, se le agrega una numeración ("Garúa Veloz 2").
//  · Dos charlas (Día 1 y Día 2): notas, apodo y avatar se guardan POR charla. Si ya tenías avatar
//    en la otra charla, vuelve para que le cambies la ropa o lo que lleva (y suma +200 en el podio).
//  · Las pantallas se construyen una vez por slide y se actualizan por partes (sin recrear todo).
//  · Notas con RETENCIÓN: si estás escribiendo, tu pantalla no cambia de slide hasta que guardes.
//  · 3 preguntas por el podio; la respuesta correcta solo llega cuando la presentadora revela.
//  · Avatar y memoria se generan EN EL DISPOSITIVO: tus notas nunca salen del teléfono.
import { Brain, Check, Circle, Diamond, Download, FileText, Flame, GitBranch, Heart, MessageCircleQuestion, Moon, NotebookPen, Radio, Send, Shuffle, Sparkles, Square, Sun, SunMoon, Triangle, Trophy, Map as MapIcon, X, createElement, createIcons, type IconNode } from 'lucide';
import { SLIDES, SLIDE_BY_ID, type SlideContent } from '../shared/content';
import { EVENT, META, NS, OTHER_TALK, PUBLIC_DEMO_URL, REPO_URL, SKILL_LABEL, SKILL_URL, TALK, TALKS, TALK_TITLE, setPrimera } from '../shared/config';
import { downloadFile, keepsakeHTML, keepsakeMarkdown, type SavedNote } from '../shared/keepsake';
import { ABAJOS, ACCESORIOS, COLORES_PELO, DEFAULT_AVATAR, EXPRESIONES, GORROS, LENTES, LEYENDA, MENSAJES, PELOS, PIELES, RASGOS, ROPAS, avatarPNG, avatarSilhouette, avatarSVG, diffAvatar, normalizeAvatar, randomAvatar, type AvatarOptions } from '../shared/avatar';
import { claimUniqueName, cleanName, randomName, TOTAL_COMBINATIONS } from '../shared/names';
import { QUESTIONS, type QuestionId } from '../shared/questions';
import { REACTIONS, correctCount, getRealtime, podiumKey, winnerCode, type Reaction, type Realtime, type SlideState, type Votes } from '../shared/realtime';
import { esc } from '../shared/esc';
import { esOfensiva, isOnTopic } from '../shared/ask';
import { LIMITE_NUBE, nubeDisponible, preguntarNube, quedanNube } from '../shared/asistente-nube';
import { buscar, esDeLaCharla, estadoNano, prepararNano, preguntarNano, respuestaSinModelo, sugerencias, type EstadoNano, type Fuente } from '../shared/asistente';

const ICONS = { Brain, Check, Download, FileText, Flame, GitBranch, Heart, MessageCircleQuestion, NotebookPen, Radio, Send, Shuffle, Sparkles, SunMoon, Trophy, Map: MapIcon, X };
const REACTION_ICONS: Record<Reaction, IconNode> = { fire: Flame, heart: Heart, mind: Brain, ask: MessageCircleQuestion };
const REACTION_SHORT: Record<Reaction, string> = { fire: 'Fuego', heart: 'Me gusta', mind: '¡Wow!', ask: 'Pregúntale' };
const SHAPES: IconNode[] = [Triangle, Diamond, Circle, Square];

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const icon = (node: IconNode, size = 20) => {
  const el = createElement(node);
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('aria-hidden', 'true');
  return el.outerHTML;
};
/** En ensayo local (?local) cada pestaña es una persona distinta: su propio apodo, avatar y notas. */
const TAB = (() => {
  if (!new URLSearchParams(location.search).has('local')) return '';
  try {
    let id = sessionStorage.getItem(`${NS}.uid`);
    if (!id) sessionStorage.setItem(`${NS}.uid`, (id = 'local-' + crypto.randomUUID().slice(0, 8)));
    return `${id}.`;
  } catch {
    return '';
  }
})();
/** Claves por charla (notas, apodo, avatar…); el tema es común a las dos. */
const keyOf = (k: string, talk = TALK) => (k === 'theme' ? `${NS}.live.theme` : `${NS}.live.${TAB}${talk}.${k}`);
const store = {
  get<T>(k: string, fallback: T, talk = TALK): T {
    try {
      return JSON.parse(localStorage.getItem(keyOf(k, talk)) ?? 'null') ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(keyOf(k), JSON.stringify(v));
    } catch {
      /* modo privado o cuota llena: seguimos en memoria */
    }
  },
};

// ── Tema (sistema / claro / oscuro) ─────────────────────────────────────
type Theme = 'system' | 'light' | 'dark';
function applyTheme(t: Theme) {
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  store.set('theme', t);
  document.querySelectorAll<HTMLElement>('[data-theme-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themePick === t)));
}

// ── Estado ──────────────────────────────────────────────────────────────
type View = 'live' | 'avatar' | 'notes';
let rt: Realtime;
let live: SlideState | null = null;
let view: View = 'live';
let name: string | null = store.get('name', null);
let myVotes: Votes = {};
/** Notas GUARDADAS por slide (lo que va a la memoria). */
const notes: Record<string, SavedNote> = store.get('notes', {});
/** Borradores sin guardar: sobreviven a recargas, pero no cuentan como guardados. */
const drafts: Record<string, string> = store.get('drafts', {});
/** Slides que esta persona vio (para "Mis notas"). */
const seen: string[] = store.get('seen', []);
interface AvatarState {
  name: string;
  mensaje: number;
  opts: AvatarOptions;
  saved: boolean;
  published: boolean;
  /** Vino de la otra charla (se muestra el aviso "tu avatar volvió") */
  from?: string;
}
const avatar: AvatarState = store.get('avatar', { name: '', mensaje: 0, opts: { ...DEFAULT_AVATAR }, saved: false, published: false });
avatar.opts = normalizeAvatar(avatar.opts);
avatar.mensaje = Math.min(MENSAJES.length - 1, Math.max(0, avatar.mensaje | 0));
/** El avatar que guardaste en la otra charla (en este celular), si existe. */
const otherLocal: AvatarState | null = store.get<AvatarState | null>('avatar', null, OTHER_TALK);
/** Apodo de la otra charla: se propone primero al entrar. */
const otherName: string | null = store.get<string | null>('name', null, OTHER_TALK);
/** Avatar de la otra charla (local o del servidor) para traerlo y editarlo. */
let otherAvatar: { name: string; opts: AvatarOptions } | null = otherLocal?.saved ? { name: otherLocal.name, opts: normalizeAvatar(otherLocal.opts) } : null;

/** Slide que se muestra en "En vivo" (puede ir detrás del en vivo si hay una nota sin guardar). */
let shownId: string | null = null;

const savedText = (id: string) => notes[id]?.text ?? '';
const draftText = (id: string) => drafts[id] ?? savedText(id);
const isDirty = (id: string | null) => Boolean(id) && draftText(id!) !== savedText(id!);
/** ¿Estamos reteniendo un slide porque hay una nota a medio escribir? (Las preguntas NO se retienen.) */
const holding = () => view === 'live' && isDirty(shownId) && Boolean(live?.id) && live!.id !== shownId && live!.kind !== 'poll';

function setDraft(id: string, text: string) {
  if (text === savedText(id)) delete drafts[id];
  else drafts[id] = text;
  store.set('drafts', drafts);
}
function saveNote(id: string) {
  const text = draftText(id).trim();
  if (text) notes[id] = { text, savedAt: Date.now() };
  else delete notes[id];
  delete drafts[id];
  store.set('notes', notes);
  store.set('drafts', drafts);
}
function discardDraft(id: string) {
  delete drafts[id];
  store.set('drafts', drafts);
}
function markSeen(id: string) {
  if (id && !seen.includes(id)) {
    seen.push(id);
    store.set('seen', seen);
  }
}

function pintarMarca() {
  const brand = document.querySelector('[data-brand]');
  if (brand) brand.innerHTML = `${esc(META.day)} · <b>${esc(META.short)}</b>`;
}

async function boot() {
  pintarMarca();
  document.title = `${META.title} · en vivo`;
  applyTheme(store.get<Theme>('theme', 'system'));
  createIcons({ icons: ICONS, attrs: { 'stroke-width': 1.75, 'aria-hidden': 'true' } });
  setupMenu();
  setupReactions();
  rt = await getRealtime();
  // Agenda compartida: "Día 1/Día 2" y los avisos de "tu avatar volvió" siguen lo que elija la presentadora.
  addEventListener('agenda', () => {
    pintarMarca();
    if (view !== 'live' || !holding()) render();
  });
  rt.onAgenda((p) => p && setPrimera(p));
  const forcedLocal = new URLSearchParams(location.search).has('local');
  if (rt.mode === 'local' && !forcedLocal && import.meta.env.VITE_FIREBASE_API_KEY) {
    $('[data-status]').innerHTML = 'Sin conexión en vivo con la pantalla. Reintentando… <button class="link" type="button" onclick="location.reload()">Reintentar</button>';
    setTimeout(() => location.reload(), 20000);
  } else $('[data-status]').textContent = rt.mode === 'local' ? 'Modo ensayo (local) · esperando el deck…' : 'Conectado · esperando el deck…';

  rt.onSlide((s) => {
    const prev = live;
    live = s;
    if (s.id) markSeen(s.id);
    $('[data-status]').textContent = s.total ? `En vivo · ${s.label} · ${s.index + 1}/${s.total}` : 'Conectado · esperando a que empiece la charla…';
    // Cambios dentro del mismo slide (revelar, podio publicado) actualizan por partes.
    const sameSlide = prev?.id === s.id;
    if (view === 'live') renderLive(!sameSlide);
    renderHold();
  });
  rt.onMyVotes((v) => {
    myVotes = v;
    if (view === 'live' && live?.kind === 'poll') updatePoll($('#screen'));
    renderScore();
  });
  renderMe();
  if (name) void rt.join(name).catch(() => undefined);
  // ¿Ya tenías avatar en la otra charla? (mismo celular = mismo uid). Se ofrece para editarlo.
  rt.myOtherAvatar()
    .then((o) => {
      if (o && !otherAvatar) otherAvatar = { name: o.name, opts: normalizeAvatar(o.opts) };
      if (otherAvatar && !avatar.saved) adoptOther(false);
      if (view === 'avatar' || !name) render();
    })
    .catch(() => undefined);
  if (otherAvatar && !avatar.saved) adoptOther(false);
  render();
  // Volvemos a "Mis notas" si recargamos por una versión nueva al descargar la memoria.
  if (sessionStorage.getItem('dflima.abrir') === 'notes' && name) {
    sessionStorage.removeItem('dflima.abrir');
    go('notes');
  }
}

/** Trae el avatar de la otra charla como punto de partida (luego se le cambian los detalles). */
function adoptOther(persist = true) {
  if (!otherAvatar) return;
  avatar.opts = { ...otherAvatar.opts };
  avatar.name ||= otherAvatar.name;
  avatar.from = TALKS[OTHER_TALK].day;
  if (persist) store.set('avatar', avatar);
}

function renderMe() {
  const el = $('[data-me]');
  el.hidden = !name;
  el.textContent = name ?? '';
}
function renderScore() {
  const el = $('[data-score]');
  const n = correctCount(myVotes, live?.answers ?? {});
  const answered = Object.keys(myVotes).length;
  el.hidden = !answered;
  el.textContent = `${n}/${answered} ✓`;
}

// ── Pantallas ───────────────────────────────────────────────────────────
function render() {
  const screen = $('#screen');
  renderHold();
  if (view === 'avatar') return renderAvatar(screen);
  if (view === 'notes') return renderNotes(screen);
  if (!name) return renderJoin(screen);
  renderLive(true);
}

/** Propone 3 apodos LIBRES: genera candidatos distintos y descarta los ya reservados. */
async function freshOptions(): Promise<string[]> {
  const pool = new Set<string>();
  // Si ya viniste a la otra charla, tu apodo de ese día va primero (si alguien lo tomó, se numera).
  const base = otherName?.replace(/ \d+$/, '');
  while (pool.size < 10) pool.add(randomName());
  const taken = await rt.takenNames([...pool]).catch(() => new Set<string>());
  const free = [...pool].filter((n) => !taken.has(n));
  const opts = (free.length >= 3 ? free : [...pool]).slice(0, 3);
  return base ? [base, ...opts.filter((o) => o !== base)].slice(0, 3) : opts;
}

function renderJoin(screen: HTMLElement, msg = '') {
  screen.dataset.screen = 'join';
  let options: string[] = [];
  const draw = () => {
    screen.innerHTML = `<section class="card-sheet">
      <div class="weave-strip" aria-hidden="true"></div>
      <p class="kicker">¡Hola, Lima! · ${esc(EVENT)} · ${esc(META.day)}</p>
      <h1>${otherName ? '¡Volviste! Elige tu apodo' : 'Elige tu apodo'}</h1>
      <p class="muted">Es único en la sala: si alguien ya lo tiene, te damos el mismo con un número. Aparece en el podio y en el muro. Sin correo, sin contraseña.</p>
      <div class="name-options" role="radiogroup" aria-label="Apodos">${
        options.length ? options.map((o, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-name="${esc(o)}">${esc(o)}</button>`).join('') : '<p class="muted">Buscando apodos libres…</p>'
      }</div>
      <p class="fine" data-join-msg role="status">${esc(msg)}</p>
      <div class="row"><button class="btn ghost" type="button" data-shuffle>${icon(Shuffle, 18)} Otros apodos</button>
      <button class="btn primary" type="button" data-join ${options.length ? '' : 'disabled'}>Entrar</button></div>
      <p class="fine">${TOTAL_COMBINATIONS.toLocaleString('es-PE')} apodos posibles · tus notas se guardan solo en este celular.</p>
    </section>`;
    screen.querySelectorAll<HTMLButtonElement>('[data-name]').forEach((b) =>
      b.addEventListener('click', () => screen.querySelectorAll('[data-name]').forEach((x) => x.setAttribute('aria-checked', String(x === b)))),
    );
    $('[data-shuffle]', screen).addEventListener('click', () => void load());
    $('[data-join]', screen).addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const pick = screen.querySelector<HTMLElement>('[aria-checked="true"]')?.dataset.name ?? options[0];
      btn.disabled = true;
      $('[data-join-msg]', screen).textContent = 'Reservando tu apodo…';
      try {
        // Reserva atómica: si alguien lo tomó un segundo antes, recibes el mismo con numeración.
        name = await claimUniqueName(pick, (n) => rt.reserveName(n));
        store.set('name', name);
        if (!avatar.name) avatar.name = name.slice(0, 18);
        await rt.join(name);
        renderMe();
        render();
      } catch (err) {
        console.error('[live] entrar', err);
        btn.disabled = false;
        $('[data-join-msg]', screen).textContent = 'No se pudo entrar. Revisa tu conexión e inténtalo de nuevo.';
      }
    });
  };
  const load = async () => {
    options = [];
    draw();
    options = await freshOptions();
    if (screen.dataset.screen === 'join') draw();
  };
  void load();
}

/** "En vivo": construye la pantalla una vez por slide; el resto son actualizaciones puntuales. */
function renderLive(force = false) {
  if (!name) return renderJoin($('#screen'));
  const screen = $('#screen');
  if (!holding()) shownId = live?.id || shownId;
  const c = shownId ? SLIDE_BY_ID.get(shownId) : undefined;
  const key = `live:${shownId ?? 'wait'}`;
  if (!force && screen.dataset.screen === key) {
    if (c?.kind === 'poll') updatePoll(screen);
    if (c?.kind === 'podium') renderPodium(screen);
    renderScore();
    return void updateProgress(screen);
  }
  screen.dataset.screen = key;

  if (!c) {
    screen.innerHTML = `<section class="card-sheet"><p class="kicker">Hola, ${esc(name)}</p><h1>La charla está por empezar</h1>
      <p class="muted">Cuando la presentadora avance, aquí verás cada slide con sus ideas clave, las preguntas del podio y podrás tomar notas.</p>
      <button class="btn wide" type="button" data-go-avatar>${icon(Sparkles, 18)} ${avatar.saved ? 'Editar mi avatar' : 'Crear mi avatar mientras espero'}</button></section>`;
    $('[data-go-avatar]', screen).addEventListener('click', () => go('avatar'));
    return;
  }
  if (c.kind === 'join') return renderLobby(screen);
  if (c.kind === 'poll' && c.qid) return renderPoll(screen, c.qid);
  if (c.kind === 'podium') return renderPodium(screen);
  if (c.kind === 'wall') return renderWallCta(screen);
  if (c.kind === 'end') return renderEnd(screen);
  renderMirror(screen, c);
}

function updateProgress(screen: HTMLElement) {
  const p = screen.querySelector<HTMLElement>('[data-progress]');
  const label = screen.querySelector<HTMLElement>('[data-on-screen]');
  if (!live?.total || !p || !label) return;
  const idx = SLIDES.findIndex((s) => s.id === shownId);
  p.style.width = `${Math.round(((idx + 1) / live.total) * 100)}%`;
  label.textContent = live.id === shownId ? `En pantalla · ${live.index + 1}/${live.total}` : `Tu nota · slide ${idx + 1}/${live.total}`;
}

function renderMirror(screen: HTMLElement, c: SlideContent) {
  const idx = SLIDES.indexOf(c);
  screen.innerHTML = `<section class="mirror" data-tone="${idx % 4}">
    <div class="mirror-top">
      <span class="live-dot" aria-hidden="true"></span>
      <span data-on-screen>En pantalla</span>
      <span class="mirror-progress" aria-hidden="true"><i data-progress></i></span>
    </div>
    ${c.section ? `<p class="kicker">${esc(c.section)}</p>` : ''}
    <h1>${esc(c.title)}</h1>
    <ul class="mirror-points">${c.summary.map((p, i) => `<li data-tone="${['blue', 'green', 'yellow', 'red'][i % 4]}"><span>${esc(p)}</span></li>`).join('')}</ul>
    ${c.code ? `<figure class="mirror-code"><figcaption>${esc(c.code.file)}</figcaption><pre><code>${esc(c.code.text)}</code></pre></figure>` : ''}
  </section>
  <section class="card-sheet">
    ${noteBoxHTML(c.id, 'Mi nota sobre este slide')}
    ${c.kind === 'demo' ? `<a class="btn wide primary" href="${PUBLIC_DEMO_URL}" target="_blank" rel="noreferrer">${icon(MapIcon, 18)} Abrir ${esc(META.demoName)} (mejor en laptop con Chrome)</a>` : ''}
    <p class="muted small">Mientras escribes, tu pantalla <b>se queda en este slide</b>. Al guardar vuelves al en vivo.</p>
  </section>`;
  bindNoteBox(screen, c.id, { followLiveOnSave: true });
  updateProgress(screen);
}

function noteBoxHTML(id: string, label: string) {
  const saved = notes[id];
  return `<div class="note-box" data-note="${esc(id)}" ${isDirty(id) ? 'data-dirty' : ''}>
    <label><span>${esc(label)}</span><textarea rows="3" maxlength="1200" data-note-text placeholder="Algo que quiero probar, una duda, un enlace…">${esc(draftText(id))}</textarea></label>
    <div class="note-meta">
      <p class="fine" data-note-state role="status">${saved ? `<span class="saved-chip">${icon(Check, 12)} Guardada</span>` : 'Sin guardar · Ctrl/⌘ + Enter guarda'}</p>
      <button class="btn primary" type="button" data-note-save ${isDirty(id) ? '' : 'disabled'}>Guardar nota</button>
    </div>
  </div>`;
}

function bindNoteBox(root: ParentNode, id: string, { followLiveOnSave }: { followLiveOnSave: boolean }) {
  const box = $<HTMLElement>(`[data-note="${CSS.escape(id)}"]`, root);
  const area = $<HTMLTextAreaElement>('[data-note-text]', box);
  const btn = $<HTMLButtonElement>('[data-note-save]', box);
  const state = $('[data-note-state]', box);
  const sync = () => {
    const dirty = isDirty(id);
    box.toggleAttribute('data-dirty', dirty);
    btn.disabled = !dirty;
    state.innerHTML = dirty ? 'Sin guardar · tu pantalla espera' : notes[id] ? `<span class="saved-chip">${icon(Check, 12)} Guardada</span>` : 'Sin guardar · Ctrl/⌘ + Enter guarda';
    renderHold();
  };
  area.addEventListener('input', () => {
    setDraft(id, area.value);
    sync();
  });
  const doSave = () => {
    saveNote(id);
    sync();
    state.innerHTML = `<span class="saved-chip">${icon(Check, 12)} Guardada</span>`;
    if (followLiveOnSave && live?.id && live.id !== id) renderLive();
  };
  btn.addEventListener('click', doSave);
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      doSave();
    }
  });
}

/** Banner fijo: la presentadora avanzó mientras escribías (o ya guardaste y vas detrás). */
function renderHold() {
  const el = $('[data-hold]');
  const behind = view === 'live' && Boolean(live?.id) && Boolean(shownId) && live!.id !== shownId;
  if (!behind) {
    if (!el.hidden) el.hidden = true;
    return;
  }
  const dirty = isDirty(shownId);
  const sig = `${live!.id}:${dirty}`;
  if (el.dataset.for !== sig || el.hidden) {
    el.dataset.for = sig;
    const next = SLIDE_BY_ID.get(live!.id);
    const where = `“${esc(next?.title ?? live!.label)}” (${live!.index + 1}/${live!.total})`;
    el.innerHTML = dirty
      ? `<p><span class="pulse" aria-hidden="true"></span><b>La charla avanzó</b> a ${where}. Tu pantalla te espera hasta que guardes tu nota.</p>
        <div class="row"><button class="btn" type="button" data-hold-discard>Descartar cambios</button><button class="btn primary" type="button" data-hold-save>Guardar y seguir en vivo</button></div>`
      : `<p><span class="pulse" aria-hidden="true"></span>La charla va en ${where}.</p>
        <div class="row"><button class="btn primary" type="button" data-hold-go>Ir al en vivo</button></div>`;
    const jump = () => {
      el.hidden = true;
      shownId = live!.id;
      renderLive(true);
    };
    el.querySelector('[data-hold-save]')?.addEventListener('click', () => (shownId && saveNote(shownId), jump()));
    el.querySelector('[data-hold-discard]')?.addEventListener('click', () => (shownId && discardDraft(shownId), jump()));
    el.querySelector('[data-hold-go]')?.addEventListener('click', jump);
  }
  el.hidden = false;
}

const LOBBY: AvatarOptions[] = [
  { piel: 1, pelo: 8, colorPelo: 1, ropa: 1, gorro: 0, lentes: 0, expresion: 0, accesorio: 1, rasgos: 3, abajo: 1 },
  { piel: 4, pelo: 0, colorPelo: 0, ropa: 2, gorro: 1, lentes: 1, expresion: 1, accesorio: 10, rasgos: 5, abajo: 0 },
  { piel: 3, pelo: 7, colorPelo: 0, ropa: 6, gorro: 0, lentes: 2, expresion: 2, accesorio: 3, rasgos: 2, abajo: 3 },
  { piel: 0, pelo: 2, colorPelo: 2, ropa: 7, gorro: 3, lentes: 0, expresion: 0, accesorio: 2, rasgos: 1, abajo: 2 },
];
function renderLobby(screen: HTMLElement) {
  screen.innerHTML = `<section class="card-sheet">
    <div class="weave-strip" aria-hidden="true"></div>
    <p class="kicker">Hola, ${esc(name)}</p>
    <h1>¡Estás dentro!</h1>
    <div class="lobby-dolls" aria-hidden="true">${LOBBY.map((o) => avatarSVG(o)).join('')}</div>
    <p class="muted">En cada slide verás las ideas clave y podrás escribir tus notas. Hay <b>3 preguntas</b> por el podio: responde rápido. Si estás escribiendo, <b>la app no te cambia de slide</b> hasta que guardes.</p>
    ${otherAvatar ? `<p class="return-note">${icon(Sparkles, 16)} Tu avatar del <b>${esc(TALKS[OTHER_TALK].day)}</b> volvió: cámbiale lo que quieras para hoy. Por traerlo sumas <b>+200</b>.</p>` : `<p class="legend">${esc(LEYENDA)}</p>`}
    <button class="btn wide primary" type="button" data-go-avatar>${icon(Sparkles, 18)} ${otherAvatar || avatar.saved ? 'Editar mi avatar' : 'Crear mi avatar'}</button>
  </section>`;
  $('[data-go-avatar]', screen).addEventListener('click', () => go('avatar'));
}

// ── Preguntas del podio ─────────────────────────────────────────────────
const closed = (qid: QuestionId) => Boolean(live?.revealed?.[qid]);
function renderPoll(screen: HTMLElement, qid: QuestionId) {
  const q = QUESTIONS[qid];
  screen.innerHTML = `<section class="poll" data-q="${qid}">
    <div class="poll-head"><p class="kicker">Pregunta ${qid.slice(1)} de 3 · ${esc(q.topic)}</p><span class="score-chip" data-poll-score></span></div>
    <h1>${esc(q.text)}</h1>
    <div class="answers">${q.options.map((o, i) => `<button type="button" class="answer" data-opt="${o.id}"><span class="shape">${icon(SHAPES[i], 22)}</span><span>${esc(o.label)}</span></button>`).join('')}</div>
    <p class="poll-msg" data-msg role="status"></p>
    <p class="fine">Acertar: 500 puntos + hasta 500 por rapidez. Una sola respuesta por pregunta.</p>
  </section>`;
  screen.querySelectorAll<HTMLButtonElement>('.answer').forEach((b) =>
    b.addEventListener('click', async () => {
      if (myVotes[qid] || closed(qid) || b.classList.contains('pending')) return;
      b.classList.add('pending');
      const msg = $('[data-msg]', screen);
      msg.className = 'poll-msg';
      msg.textContent = 'Enviando…';
      navigator.vibrate?.(20);
      try {
        await rt.vote(qid, b.dataset.opt!);
        if (!myVotes[qid]) myVotes = { ...myVotes, [qid]: b.dataset.opt! };
        updatePoll(screen);
      } catch (err) {
        console.error('[live] voto', err);
        b.classList.remove('pending');
        msg.className = 'poll-msg bad';
        msg.textContent = closed(qid) ? 'La pregunta ya se cerró.' : 'No se pudo enviar tu respuesta. Revisa tu conexión y toca otra vez.';
      }
    }),
  );
  updatePoll(screen);
}
function updatePoll(screen: HTMLElement) {
  const qid = screen.querySelector<HTMLElement>('.poll')?.dataset.q as QuestionId | undefined;
  if (!qid) return;
  const mine = myVotes[qid];
  // La respuesta correcta solo existe en el celular cuando la presentadora revela.
  const answer = live?.revealed?.[qid] ? live?.answers?.[qid] : undefined;
  screen.querySelectorAll<HTMLButtonElement>('.answer').forEach((b) => {
    const opt = b.dataset.opt;
    b.disabled = Boolean(mine) || closed(qid);
    b.classList.remove('pending');
    b.toggleAttribute('data-mine', opt === mine);
    b.toggleAttribute('data-correct', Boolean(answer) && opt === answer!.correct);
    b.toggleAttribute('data-wrong', Boolean(answer) && opt === mine && mine !== answer!.correct);
  });
  const msg = $('[data-msg]', screen);
  if (answer) {
    const ok = mine === answer.correct;
    msg.className = `poll-msg ${ok ? 'ok' : mine ? 'bad' : ''}`;
    msg.innerHTML = `${mine ? (ok ? `${icon(Check, 18)} <b>¡Correcto!</b>` : '<b>Casi.</b>') : '<b>No respondiste a tiempo.</b>'} ${esc(answer.explain)}`;
  } else if (mine) {
    msg.className = 'poll-msg';
    msg.innerHTML = `${icon(Send, 18)} Respuesta enviada. Mira la pantalla para el resultado.`;
  } else msg.textContent = '';
  const chip = screen.querySelector<HTMLElement>('[data-poll-score]');
  if (chip) chip.textContent = `${correctCount(myVotes, live?.answers ?? {})} aciertos`;
}

const PLACES = ['Primer lugar', 'Segundo lugar', 'Tercer lugar'];
const MEDALS = ['🥇', '🥈', '🥉'];
let celebratedPos = -1;
function renderPodium(screen: HTMLElement) {
  screen.dataset.screen = `live:${shownId}`;
  const myKey = podiumKey(rt.uid());
  const podium = live?.podium ?? [];
  // Cada celular se reconoce por su clave larga (no por el código corto, que podría repetirse).
  const pos = podium.findIndex((p) => (p.key ? p.key === myKey : p.code === winnerCode(rt.uid())));
  const myCode = pos >= 0 ? podium[pos].code : winnerCode(rt.uid());
  const onPodium = pos >= 0 && pos < 3;
  const me = pos >= 0 ? podium[pos] : null;
  const myAvatar = avatar.saved ? avatarSVG(avatar.opts, avatar.name) : me?.opts ? avatarSVG(me.opts, me.name) : '';
  screen.innerHTML = `<section class="card-sheet podium-card ${onPodium ? `winner place-${pos + 1}` : ''}">
    ${onPodium ? '<div class="confetti" aria-hidden="true">' + Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join('') + '</div>' : ''}
    <p class="kicker">${icon(Trophy, 16)} Podio</p>
    ${
      onPodium
        ? `<p class="medal-big" aria-hidden="true">${MEDALS[pos]}</p>
           <h1>¡Entraste al podio, ${esc(name)}!</h1>
           <p class="place-chip">${PLACES[pos]} · ${me!.score.toLocaleString('es-PE')} puntos</p>
           ${myAvatar ? `<div class="winner-avatar" role="img" aria-label="Tu avatar bailando">${myAvatar}<span class="notas" aria-hidden="true"><i>🎉</i><i>🎶</i><i>✨</i></span></div>` : `<button class="btn wide" type="button" data-go-avatar>${icon(Sparkles, 18)} Crea tu avatar y míralo bailar</button>`}
           <p>Acércate al escenario y muestra este código:</p><p class="code">${myCode}</p>`
        : pos >= 3
          ? `<h1>¡Quedaste en el puesto ${pos + 1}!</h1>${myAvatar ? `<div class="winner-avatar suave" role="img" aria-label="Tu avatar celebrando">${myAvatar}<span class="notas" aria-hidden="true"><i>👏</i><i>✨</i><i>🎶</i></span></div>` : ''}<p class="muted">Estás en el top 10 con ${me!.score.toLocaleString('es-PE')} puntos. ¡Muy bien!</p>`
          : `<h1>¡Gracias por jugar!</h1><p class="muted">Acertaste ${correctCount(myVotes, live?.answers ?? {})} de 3. Para entrar al podio hay que acertar al menos una; los bonos suben posiciones. El podio está en la pantalla.</p>`
    }
    ${podium.length ? `<ol class="podium-list">${podium.slice(0, 5).map((p, i) => `<li ${i === pos ? 'data-me' : ''}><span class="pl-avatar">${p.opts ? avatarSVG(p.opts, p.name) : avatarSilhouette()}</span><span class="pl-name">${i + 1}. ${esc(p.name)}</span><b>${p.score.toLocaleString('es-PE')}</b></li>`).join('')}</ol>` : '<p class="muted">Esperando el podio…</p>'}
    <p class="fine">Tu código: <b>${myCode}</b></p>
  </section>`;
  screen.querySelector('[data-go-avatar]')?.addEventListener('click', () => go('avatar'));
  // Vibra una sola vez cuando entras al podio.
  if (onPodium && celebratedPos !== pos) {
    celebratedPos = pos;
    navigator.vibrate?.([120, 60, 120, 60, 240]);
  }
}

function renderWallCta(screen: HTMLElement) {
  screen.innerHTML = `<section class="card-sheet">
    <p class="kicker">Muro de avatares</p>
    <h1>${avatar.published ? '¡Tu avatar está en la pantalla!' : '¿Ya creaste tu avatar?'}</h1>
    ${avatar.saved ? `<div class="end-doll">${avatarSVG(avatar.opts, avatar.name)}<div><b>${esc(avatar.name)}</b><span>“${esc(MENSAJES[avatar.mensaje])}”</span></div></div>` : ''}
    <p class="muted">Se dibuja en tu celular; al muro solo viajan las opciones que elegiste. Publicarlo suma <b>+100</b>${otherAvatar ? ' y traerlo de la otra charla, <b>+200</b>' : ''}.</p>
    <button class="btn wide primary" type="button" data-go-avatar>${icon(Sparkles, 18)} ${avatar.saved ? 'Editar mi avatar' : 'Crear mi avatar'}</button>
  </section>`;
  $('[data-go-avatar]', screen).addEventListener('click', () => go('avatar'));
}

// ── Memoria ─────────────────────────────────────────────────────────────
function keepsakeInput() {
  return { nickname: name, notes, avatar: avatar.saved ? { name: avatar.name, mensaje: avatar.mensaje, opts: avatar.opts } : null };
}
const slug = () => `memoria-devfest-lima-${TALK}${name ? '-' + name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').toLowerCase() : ''}`;

function keepsakeButtons() {
  return `<button class="btn wide primary" type="button" data-dl-pdf>${icon(Download, 18)} Descargar memoria (PDF)</button>
    <div class="row">
      <button class="btn" type="button" data-dl-html>${icon(FileText, 18)} HTML</button>
      <button class="btn" type="button" data-dl-md>${icon(FileText, 18)} Markdown</button>
    </div>
    <p class="fine" data-pdf-msg role="status"></p>
    ${avatar.saved ? `<button class="btn wide" type="button" data-dl-avatar>${icon(Download, 18)} Descargar mi avatar (PNG)</button>` : ''}
    <button class="btn wide ghost" type="button" data-share>${icon(Send, 18)} Compartir</button>`;
}
/**
 * PDF con pdf-lib (pesa: no va en la carga inicial). Se precarga cuando la app ya está quieta, así
 * el botón responde al instante y funciona aunque se publique una versión nueva con la app abierta.
 */
let pdfModulo: Promise<typeof import('../shared/keepsake-pdf')> | null = null;
const cargarPDF = () =>
  (pdfModulo ??= import('../shared/keepsake-pdf').catch((err) => {
    pdfModulo = null;
    throw err;
  }));
const precargarPDF = () => void cargarPDF().catch(() => undefined);
if ('requestIdleCallback' in window) requestIdleCallback(precargarPDF, { timeout: 8000 });
else setTimeout(precargarPDF, 4000);

/** ¿El error es porque se publicó una versión nueva y el archivo viejo ya no existe? */
const esVersionVieja = (err: unknown) => /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(String((err as Error)?.message ?? err));

async function makePDF(): Promise<Blob> {
  const { keepsakePDF } = await cargarPDF();
  return keepsakePDF(keepsakeInput());
}
function bindKeepsake(root: ParentNode) {
  root.querySelector('[data-dl-pdf]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const msg = root.querySelector<HTMLElement>('[data-pdf-msg]');
    btn.disabled = true;
    if (msg) msg.textContent = 'Generando tu PDF en el celular…';
    try {
      downloadFile(`${slug()}.pdf`, await makePDF());
      if (msg) msg.textContent = 'Listo: revisa tus descargas.';
    } catch (err) {
      console.error('[memoria] PDF', err);
      if (esVersionVieja(err)) {
        // Hay una versión nueva publicada: recargamos (las notas y el avatar están guardados en el celular).
        if (msg) msg.textContent = 'Hay una versión nueva de la app. Recargando…';
        sessionStorage.setItem('dflima.abrir', 'notes');
        setTimeout(() => location.reload(), 900);
        return;
      }
      if (msg) msg.textContent = 'No se pudo generar el PDF. Prueba con HTML.';
    } finally {
      btn.disabled = false;
    }
  });
  root.querySelector('[data-dl-html]')?.addEventListener('click', () => downloadFile(`${slug()}.html`, keepsakeHTML(keepsakeInput()), 'text/html;charset=utf-8'));
  root.querySelector('[data-dl-md]')?.addEventListener('click', () => downloadFile(`${slug()}.md`, keepsakeMarkdown(keepsakeInput()), 'text/markdown;charset=utf-8'));
  root.querySelector('[data-dl-avatar]')?.addEventListener('click', async () => downloadFile(`avatar-${slug()}.png`, await avatarPNG({ ...avatar, both: Boolean(otherAvatar) })));
  root.querySelector('[data-share]')?.addEventListener('click', async () => {
    try {
      const file = new File([await makePDF()], `${slug()}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: `Memoria · ${TALK_TITLE}`, files: [file] });
      else if (navigator.share) await navigator.share({ title: `Memoria · ${TALK_TITLE}`, text: keepsakeMarkdown(keepsakeInput()) });
      else {
        await navigator.clipboard.writeText(keepsakeMarkdown(keepsakeInput()));
        alert('Memoria copiada al portapapeles (Markdown).');
      }
    } catch {
      /* la persona canceló */
    }
  });
}

function renderEnd(screen: HTMLElement) {
  const n = Object.keys(notes).length;
  screen.innerHTML = `<section class="card-sheet keepsake">
    <div class="weave-strip" aria-hidden="true"></div>
    <p class="kicker">¡Gracias, Lima! · ${esc(META.day)}</p>
    <h1>Tu memoria de la charla</h1>
    <p class="muted">Un resumen con lo más importante de cada slide, tus notas${avatar.saved ? ' y tu avatar' : ''}. Se genera en tu celular; ábrelo sin internet o imprímelo.</p>
    <div class="stats"><span>${SLIDES.filter((s) => s.inSummary).length} ideas clave</span><span>${n} ${n === 1 ? 'nota' : 'notas'}</span><span>${avatar.saved ? '1 avatar' : 'sin avatar'}</span></div>
    ${avatar.saved ? `<div class="end-doll">${avatarSVG(avatar.opts, avatar.name)}<div><b>${esc(avatar.name)}</b><span>“${esc(MENSAJES[avatar.mensaje])}”</span></div></div>` : `<button class="btn wide" type="button" data-go-avatar>${icon(Sparkles, 18)} Crear mi avatar para la memoria</button>`}
    ${keepsakeButtons()}
    <a class="btn wide" href="${SKILL_URL}" target="_blank" rel="noreferrer">${icon(Sparkles, 18)} ${esc(SKILL_LABEL)}</a>
    <p class="fine">Instálala en Claude Code, Gemini CLI o Cursor y pídele: <i>“${TALK === 'genui' ? 'revisa la performance de mi UI generativa' : 'revisa si mi web es fácil de usar para agentes'}”</i>. Aplica las 10 reglas de la charla en tu proyecto.</p>
    <a class="btn wide ghost" href="${REPO_URL}" target="_blank" rel="noreferrer">${icon(GitBranch, 18)} Ver el repositorio</a>
  </section>`;
  screen.querySelector('[data-go-avatar]')?.addEventListener('click', () => go('avatar'));
  bindKeepsake(screen);
}

// ── Mis notas (todas) + memoria ─────────────────────────────────────────
function renderNotes(screen: HTMLElement) {
  screen.dataset.screen = 'notes';
  const list = SLIDES.filter((s) => seen.includes(s.id) || notes[s.id] || drafts[s.id]).filter((s) => s.kind === 'content' || s.kind === 'demo');
  let section = '';
  screen.innerHTML = `<section class="card-sheet">
    <div class="creator-head"><p class="kicker">Mis notas</p><button class="icon-btn" type="button" data-close aria-label="Volver al en vivo">${icon(X, 20)}</button></div>
    <h1>Lo que me llevo</h1>
    <p class="muted small">Edita cualquier nota y guárdala. La memoria incluye el resumen de <b>todos</b> los slides, aunque hayas llegado tarde.</p>
    ${keepsakeButtons()}
    ${
      list.length
        ? `<ol class="notes-list">${list
            .map((s) => {
              const head = s.section && s.section !== section ? `<p class="section-label">${esc((section = s.section))}</p>` : '';
              return `${head}<li><h3>${esc(s.title)}</h3><ul class="pts">${s.summary.slice(0, 2).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>${noteBoxHTML(s.id, 'Mi nota')}</li>`;
            })
            .join('')}</ol>`
        : '<p class="muted">Se irán llenando mientras avanza la charla.</p>'
    }
    <button class="btn wide ghost" type="button" data-back>Volver al en vivo</button>
  </section>`;
  list.forEach((s) => bindNoteBox(screen, s.id, { followLiveOnSave: false }));
  bindKeepsake(screen);
  $('[data-back]', screen).addEventListener('click', () => go('live'));
  $('[data-close]', screen).addEventListener('click', () => go('live'));
}

// ── Crea tu avatar limeño (todo en el dispositivo) ───────────────────────
function renderAvatar(screen: HTMLElement) {
  screen.dataset.screen = 'avatar';
  avatar.name ||= (name ?? '').slice(0, 18);
  const changes = otherAvatar ? diffAvatar(otherAvatar.opts, avatar.opts) : [];
  screen.innerHTML = `<section class="card-sheet creator">
    <div class="creator-head"><p class="kicker">Mi avatar · ${esc(META.day)}</p><button class="icon-btn" type="button" data-close aria-label="Cerrar">${icon(X, 20)}</button></div>
    ${
      otherAvatar
        ? `<p class="return-note">${icon(Sparkles, 16)} Tu avatar del <b>${esc(TALKS[OTHER_TALK].day)}</b> volvió (<b>+200</b>). Cada charla guarda su propia versión: cámbiale la ropa, el gorro o lo que lleva para hoy.
           <span data-diff>${changes.length ? `Hoy cambiaste: ${esc(changes.join(', '))}.` : 'Todavía está igual que en la otra charla.'}</span>
           <button class="link" type="button" data-restore>Volver a como estaba</button></p>`
        : ''
    }
    <div class="doll-preview" data-preview></div>
    <label class="field"><span>Nombre de tu avatar</span><input data-f="name" maxlength="18" value="${esc(avatar.name)}" autocomplete="off" /></label>
    <fieldset class="field"><legend>Lo que te llevas de la charla</legend><div class="chips penas" role="radiogroup">${MENSAJES.map(
      (p, i) => `<button type="button" role="radio" aria-checked="${avatar.mensaje === i}" data-mensaje="${i}">${esc(p)}</button>`,
    ).join('')}</div></fieldset>
    <div data-opts></div>
    <button class="btn ghost" type="button" data-random>${icon(Shuffle, 16)} Sorpréndeme</button>
    <p class="fine">Se dibuja <b>en tu celular</b> (SVG). Si lo publicas, al muro solo viajan tus elecciones.</p>
    <div class="row">
      <button class="btn" type="button" data-download>${icon(Download, 18)} Descargar PNG</button>
      <button class="btn primary" type="button" data-save>${icon(Check, 18)} ${avatar.saved ? 'Guardado' : 'Guardar en mi memoria'}</button>
    </div>
    <button class="btn wide" type="button" data-publish>${icon(Send, 18)} ${avatar.published ? 'Actualizar en el muro' : 'Publicar en el muro (+100)'}</button>
    <p class="fine" data-msg role="status"></p>
  </section>`;

  const persist = () => store.set('avatar', avatar);
  const preview = () => {
    $('[data-preview]', screen).innerHTML = `${avatarSVG(avatar.opts, `Avatar de ${avatar.name}`)}<span class="pena-bubble">“${esc(MENSAJES[avatar.mensaje])}”</span>`;
    const d = screen.querySelector('[data-diff]');
    if (d && otherAvatar) {
      const ch = diffAvatar(otherAvatar.opts, avatar.opts);
      d.textContent = ch.length ? `Hoy cambiaste: ${ch.join(', ')}.` : 'Todavía está igual que en la otra charla.';
    }
  };
  const chips = (key: keyof AvatarOptions, label: string, labels: readonly string[]) =>
    `<p class="mini">${label}</p><div class="chips" role="radiogroup" aria-label="${label}">${labels
      .map((l, i) => `<button type="button" role="radio" aria-checked="${avatar.opts[key] === i}" data-opt="${key}" data-v="${i}">${esc(l)}</button>`)
      .join('')}</div>`;
  const swatches = (key: keyof AvatarOptions, label: string, colors: readonly string[], names?: readonly string[]) =>
    `<p class="mini">${label}</p><div class="swatches" role="radiogroup" aria-label="${label}">${colors
      .map((c, i) => `<button type="button" class="swatch" role="radio" aria-label="${esc(names?.[i] ?? `${label} ${i + 1}`)}" aria-checked="${avatar.opts[key] === i}" data-opt="${key}" data-v="${i}" style="--swatch:${c}"></button>`)
      .join('')}</div>`;
  $('[data-opts]', screen).innerHTML = `${swatches('piel', 'Piel', PIELES)}${chips('pelo', 'Peinado', PELOS)}
    ${swatches('colorPelo', 'Color de pelo', COLORES_PELO.map((c) => c.c), COLORES_PELO.map((c) => c.label))}
    ${chips('rasgos', 'Detalles', RASGOS)}${chips('ropa', 'Arriba', ROPAS)}${chips('abajo', 'Abajo', ABAJOS)}
    ${chips('gorro', 'Gorro', GORROS)}${chips('lentes', 'Lentes', LENTES)}${chips('accesorio', 'Lo que llevas', ACCESORIOS)}${chips('expresion', 'Expresión', EXPRESIONES)}`;
  const changed = () => {
    persist();
    preview();
  };
  $('.creator', screen).addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-opt],[data-mensaje]');
    if (!b) return;
    if (b.dataset.mensaje) avatar.mensaje = Number(b.dataset.mensaje);
    else avatar.opts = { ...avatar.opts, [b.dataset.opt as keyof AvatarOptions]: Number(b.dataset.v) };
    b.parentElement!.querySelectorAll('[role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    changed();
  });
  $('[data-f="name"]', screen).addEventListener('input', (e) => {
    avatar.name = (e.target as HTMLInputElement).value;
    changed();
  });
  screen.querySelector('[data-restore]')?.addEventListener('click', () => {
    adoptOther();
    renderAvatar(screen);
  });
  $('[data-random]', screen).addEventListener('click', () => {
    avatar.opts = randomAvatar();
    avatar.mensaje = Math.floor(Math.random() * MENSAJES.length);
    persist();
    renderAvatar(screen);
  });
  $('[data-close]', screen).addEventListener('click', () => go('live'));
  $('[data-download]', screen).addEventListener('click', async () => {
    avatar.name = cleanName(avatar.name || name || '');
    downloadFile(`avatar-${slug()}.png`, await avatarPNG({ ...avatar, both: Boolean(otherAvatar) }));
  });
  $('[data-save]', screen).addEventListener('click', (e) => {
    avatar.name = cleanName(avatar.name || name || '');
    avatar.saved = true;
    persist();
    (e.currentTarget as HTMLElement).innerHTML = `${icon(Check, 18)} Guardado`;
    $('[data-msg]', screen).textContent = 'Listo: tu avatar estará en tu memoria de la charla.';
  });
  $('[data-publish]', screen).addEventListener('click', async () => {
    const msg = $('[data-msg]', screen);
    avatar.name = cleanName(avatar.name || name || '');
    msg.textContent = 'Publicando…';
    try {
      await rt.publishAvatar({ name: avatar.name, mensaje: avatar.mensaje, opts: avatar.opts });
      avatar.published = true;
      avatar.saved = true;
      persist();
      msg.textContent = otherAvatar ? '¡Listo! Tu avatar de hoy está en el muro (con la insignia de los 2 días).' : '¡Listo! Tu avatar está en el muro y en tu memoria.';
    } catch (err) {
      console.error(err);
      msg.textContent = 'No se pudo publicar. Revisa tu conexión e inténtalo de nuevo.';
    }
  });
  preview();
}

// ── Menú y reacciones ───────────────────────────────────────────────────
function go(v: View) {
  view = v;
  closeMenu();
  render();
  scrollTo({ top: 0 });
}

const menuBtn = () => $<HTMLButtonElement>('.menu-btn');
const menuPanel = () => $('.menu-panel');
function closeMenu() {
  menuPanel().hidden = true;
  menuBtn().setAttribute('aria-expanded', 'false');
  menuBtn().setAttribute('aria-label', 'Abrir menú');
}
function setupMenu() {
  menuBtn().addEventListener('click', () => {
    const open = menuPanel().hidden;
    menuPanel().hidden = !open;
    menuBtn().setAttribute('aria-expanded', String(open));
    menuBtn().setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (open) menuPanel().querySelector<HTMLElement>('button, a')?.focus();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go as View)));
  document.querySelector('[data-asistente]')?.addEventListener('click', () => openAsistente());
  const row = $('[data-theme-row]');
  row.innerHTML = `<button type="button" data-theme-pick="system">${icon(SunMoon, 16)} Auto</button><button type="button" data-theme-pick="light">${icon(Sun, 16)} Claro</button><button type="button" data-theme-pick="dark">${icon(Moon, 16)} Oscuro</button>`;
  row.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-theme-pick]')?.dataset.themePick as Theme | undefined;
    if (t) applyTheme(t);
  });
  applyTheme(store.get<Theme>('theme', 'system'));
  addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
  addEventListener('pointerdown', (e) => {
    if (!menuPanel().hidden && !menuPanel().contains(e.target as Node) && !menuBtn().contains(e.target as Node)) closeMenu();
  });
}

function setupReactions() {
  const bar = $('[data-reactions]');
  bar.innerHTML = (Object.keys(REACTIONS) as Reaction[])
    .map((r) => `<button type="button" data-r="${r}" title="${REACTIONS[r].label}" style="--c:${REACTIONS[r].color}">${icon(REACTION_ICONS[r], 24)}<span>${REACTION_SHORT[r]}</span></button>`)
    .join('');
  let last = 0;
  bar.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-r]');
    if (!b || !rt) return;
    const r = b.dataset.r as Reaction;
    if (r === 'ask') return openAsistente();
    if (Date.now() - last < 900) return; // las reglas también lo limitan
    last = Date.now();
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
    navigator.vibrate?.(15);
    await rt.react(r).catch(() => undefined);
  });
}

// ── Pregúntale a la charla ──────────────────────────────────────────────
// Un asistente que responde SOLO con el contenido de esta charla:
//  · Con Gemini Nano (Chrome 148+ de escritorio): busca los slides relevantes y Nano responde con ellos.
//  · Sin Nano (celulares, otros navegadores): responde con lo que dicen esos slides.
// La pregunta no sale del dispositivo, salvo que la persona decida enviársela a la presentadora
// (texto libre: NO se proyecta, solo ella lo lee y suma +100 al podio).
interface Mensaje {
  q: string;
  a: string;
  fuentes: { n: number; titulo: string }[];
  motor: 'nano' | 'nube' | 'charla';
  enviada?: boolean;
  /** se canceló porque la persona hizo otra pregunta */
  cancelada?: boolean;
}
const chat: Mensaje[] = store.get('chat', []);
const guardarChat = () => store.set('chat', chat.slice(-20));
let estadoIA: EstadoNano | null = null;
let preguntaActual: AbortController | null = null;

/** Texto del modelo → HTML seguro (negritas, `código` y viñetas). */
function formatear(t: string): string {
  return esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\s*[-*•]\s+/gm, '• ')
    .replace(/\n/g, '<br>');
}

function openAsistente() {
  closeMenu();
  document.querySelector('.asistente-sheet')?.remove();
  const dlg = document.createElement('dialog');
  dlg.className = 'ask-sheet asistente-sheet';
  dlg.setAttribute('aria-labelledby', 'asis-t');
  dlg.innerHTML = `<div class="asis">
    <div class="asis-head"><h2 id="asis-t">${icon(Sparkles, 22)} Pregúntale a la charla</h2><button class="icon-btn" type="button" data-close aria-label="Cerrar">${icon(X, 20)}</button></div>
    <p class="fine">Respondo dudas sobre <b>${esc(TALK_TITLE)}</b> con el contenido de la charla. Tu pregunta no sale de tu dispositivo.</p>
    <div class="ia-estado" data-ia-estado role="status"></div>
    <ol class="chat" data-chat aria-live="polite"></ol>
    <div class="chips sug" data-sug></div>
    <form class="asis-form" data-form>
      <label class="sr" for="asis-q">Tu pregunta</label>
      <textarea id="asis-q" rows="2" maxlength="280" required placeholder="${TALK === 'genui' ? 'Ej.: ¿Por qué mi página salta mientras la IA responde?' : 'Ej.: ¿Qué ve un agente de mi página?'}"></textarea>
      <button class="btn primary" type="submit">${icon(Send, 18)} Preguntar</button>
    </form>
  </div>`;
  document.body.append(dlg);
  const lista = $('[data-chat]', dlg);
  const estadoBox = $('[data-ia-estado]', dlg);
  const area = $<HTMLTextAreaElement>('#asis-q', dlg);
  const cerrar = () => {
    preguntaActual?.abort();
    dlg.close();
    dlg.remove();
  };
  $('[data-close]', dlg).addEventListener('click', cerrar);
  dlg.addEventListener('cancel', () => preguntaActual?.abort());

  // Estado de Gemini Nano en este dispositivo
  const pintarEstado = (progreso?: number) => {
    const e = estadoIA;
    estadoBox.dataset.estado = e ?? 'revisando';
    if (!e) estadoBox.innerHTML = '<span class="dot"></span> Revisando si este dispositivo tiene Gemini Nano…';
    else if (e === 'listo') estadoBox.innerHTML = `<span class="dot ok"></span> <b>Gemini Nano</b> · responde en tu dispositivo, sin enviar datos`;
    else if (e === 'descargable')
      estadoBox.innerHTML = `<span class="dot"></span> Tu Chrome puede usar Gemini Nano. <button class="btn small" type="button" data-activar>Activar (descarga única)</button>`;
    else if (e === 'descargando')
      estadoBox.innerHTML = `<span class="dot"></span> Descargando Gemini Nano… <b>${progreso !== undefined ? Math.round(progreso * 100) + ' %' : ''}</b> Mientras tanto te respondo con lo que dice la charla.`;
    else
      estadoBox.innerHTML = nubeDisponible()
        ? `<span class="dot ok"></span> <b>Gemini</b> en la nube · responde solo con la charla · te quedan <b>${quedanNube()}</b> de ${LIMITE_NUBE} preguntas con IA`
        : `<span class="dot"></span> Te respondo con lo que dicen los slides de la charla.`;
    estadoBox.querySelector('[data-activar]')?.addEventListener('click', activar);
  };
  const activar = async () => {
    estadoIA = 'descargando';
    pintarEstado(0);
    try {
      await prepararNano((p) => pintarEstado(p)); // necesita el clic (activación de usuario)
      estadoIA = 'listo';
    } catch (err) {
      console.warn('[asistente] Nano', err);
      estadoIA = 'no-disponible';
    }
    pintarEstado();
  };
  void (async () => {
    estadoIA ??= await estadoNano();
    pintarEstado();
    if (estadoIA === 'descargando') void activar(); // ya se estaba descargando: mostramos el progreso
  })();

  const pintarMensaje = (m: Mensaje, li: HTMLElement = document.createElement("li")) => {
    li.className = 'msg';
    li.innerHTML = `<p class="q">${esc(m.q)}</p>
      <div class="a"><span class="motor">${m.motor === 'nano' ? '✦ Gemini Nano' : m.motor === 'nube' ? '✦ Gemini' : '📖 De la charla'}</span><div class="txt" data-txt>${m.a ? formatear(m.a) : m.cancelada ? '-' : '<span class="pensando">Pensando…</span>'}</div>
      ${m.cancelada ? '<p class="fine">Cancelada: hiciste otra pregunta.</p>' : ''}
      ${m.fuentes.length ? `<p class="fuentes">${m.fuentes.filter((f, i, l) => l.findIndex((x) => x.n === f.n) === i).map((f) => `<span>Slide ${f.n} · ${esc(f.titulo)}</span>`).join('')}</p>` : ''}
      ${m.enviada ? '<p class="fine enviada">✓ Enviada a Vanessa</p>' : `<button class="link" type="button" data-enviar>¿No te sirvió? Enviar mi pregunta a Vanessa (+100)</button>`}</div>`;
    li.querySelector('[data-enviar]')?.addEventListener('click', () => void enviarAVanessa(m, li));
    return li;
  };
  const pintarChat = () => {
    lista.replaceChildren(...chat.map((m) => pintarMensaje(m)));
    const sug = $('[data-sug]', dlg);
    sug.hidden = chat.length > 0;
    sug.innerHTML = sugerencias().map((q) => `<button type="button" data-sugerencia>${esc(q)}</button>`).join('');
    sug.querySelectorAll<HTMLButtonElement>('[data-sugerencia]').forEach((b) => b.addEventListener('click', () => void preguntar(b.textContent!)));
    lista.lastElementChild?.scrollIntoView({ block: 'end' });
  };

  async function preguntar(q: string) {
    q = q.trim();
    if (q.length < 3) return;
    if (esOfensiva(q)) {
      estadoBox.innerHTML = '<span class="dot"></span> Mejor una pregunta sobre la charla 🙂';
      return;
    }
    preguntaActual?.abort(); // la pregunta anterior ya no importa
    const ctrl = (preguntaActual = new AbortController());
    const cancelar = () => {
      if (m.cancelada) return;
      m.cancelada = true;
      m.a = m.a ? `${m.a.trim()} …` : '';
      pintarMensaje(m, li);
      guardarChat();
    };
    area.value = '';
    $('[data-sug]', dlg).hidden = true;
    const m: Mensaje = { q, a: '', fuentes: [], motor: estadoIA === 'listo' ? 'nano' : nubeDisponible() ? 'nube' : 'charla' };
    chat.push(m);
    const li = pintarMensaje(m);
    lista.append(li);
    li.scrollIntoView({ block: 'end' });
    const txt = () => li.querySelector<HTMLElement>('[data-txt]')!;
    const conRespaldo = () => {
      const r = respuestaSinModelo(q);
      Object.assign(m, { a: r.texto, fuentes: r.fuentes.map(({ n, titulo }: Fuente) => ({ n, titulo })), motor: 'charla' });
    };
    if (m.motor !== 'charla' && esDeLaCharla(buscar(q))) {
      try {
        for await (const x of (m.motor === 'nano' ? preguntarNano : preguntarNube)(q, ctrl.signal)) {
          if (ctrl.signal.aborted) return cancelar();
          if (x.fuentes) m.fuentes = x.fuentes.map(({ n, titulo }) => ({ n, titulo }));
          if (x.trozo) {
            m.a += x.trozo;
            txt().innerHTML = formatear(m.a); // pinta mientras piensa
          }
        }
        if (!m.a.trim()) conRespaldo();
      } catch (err) {
        if (ctrl.signal.aborted) return cancelar();
        console.warn(`[asistente] ${m.motor} falló, uso el respaldo`, err);
        conRespaldo();
        if (!nubeDisponible()) pintarEstado(); // la nube se apagó: el estado lo dice
      }
    } else conRespaldo(); // sin Nano, o la pregunta no es de esta charla: no inventamos
    pintarMensaje(m, li);
    guardarChat();
    if (estadoIA !== 'listo') pintarEstado(); // actualiza cuántas preguntas con IA quedan
  }

  async function enviarAVanessa(m: Mensaje, li: HTMLElement) {
    const b = li.querySelector<HTMLButtonElement>('[data-enviar]');
    if (!b) return;
    if (!(esDeLaCharla(buscar(m.q)) || isOnTopic(m.q)) || esOfensiva(m.q)) {
      b.textContent = 'Solo se envían preguntas sobre la charla.';
      return;
    }
    if (Date.now() - lastAsk < 15000) {
      b.textContent = 'Espera unos segundos antes de enviar otra.';
      return;
    }
    b.disabled = true;
    b.textContent = 'Enviando…';
    try {
      await rt.ask({ name: name ?? 'Anónimo', text: m.q.slice(0, 280), slide: (live?.label ?? '').slice(0, 80) });
      void rt.react('ask').catch(() => undefined);
      lastAsk = Date.now();
      m.enviada = true;
      guardarChat();
      pintarMensaje(m, li);
    } catch (err) {
      console.error('[live] pregunta', err);
      b.disabled = false;
      b.textContent = 'No se pudo enviar. Toca para reintentar.';
    }
  }

  $('[data-form]', dlg).addEventListener('submit', (e) => {
    e.preventDefault();
    void preguntar(area.value);
  });
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void preguntar(area.value);
    }
  });
  pintarChat();
  dlg.showModal();
  area.focus();
}
let lastAsk = 0;

void boot();
