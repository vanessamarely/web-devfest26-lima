// Nido · buscador de depas con IA (precios y depas FICTICIOS).
// Producto "real" con un panel de laboratorio (Rayos X, tecla X) que apaga y prende cada regla
// de la charla y mide lo que la persona siente: CLS, INP, frames largos, nodos creados…
//
// Parámetros: ?preset=roto|arreglado · ?rules=1111 (espacio, plano, reciclar, libreta) · ?rayos
//             ?tps=70 (tokens/s del modelo simulado) · ?auto (genera al abrir) · ?embed (comparador)
import './styles.css';
import { correcciones, decidir, emitir, serializar, trocear, type Pieza } from './ia';
import { aplicarPiezas, crearOrdenador, estadoVacio, Libreta, ordenarEnHiloPrincipal, type Estado } from './genui/estado';
import { crearProgramador, LectorCompleto, LectorPorLineas, type Lector } from './genui/stream';
import { demoler, Reciclador } from './genui/render';
import { crearLab, type Metricas } from './lab/hud';
import { pista } from './lab/pistas';
import { esc } from './genui/piezas';

type ReglaId = 'espacio' | 'plano' | 'reciclar' | 'libreta';
const REGLAS: { id: ReglaId; n: number; titulo: string; sub: string; mide: string }[] = [
  { id: 'espacio', n: 1, titulo: 'Reserva el espacio', sub: 'El plano llega primero; cada sección con su tamaño final.', mide: 'CLS (saltos)' },
  { id: 'plano', n: 2, titulo: 'Lee cada parte una vez', sub: 'Un JSON por línea (cada carácter se lee una vez) y un dibujo por cuadro.', mide: 'Caracteres leídos · veces que dibuja' },
  { id: 'reciclar', n: 3, titulo: 'Reutiliza, no rehagas', sub: 'Un elemento por id; la lista larga con pocas filas.', mide: 'Elementos creados' },
  { id: 'libreta', n: 4, titulo: 'Un solo lugar para los datos', sub: 'Datos por id; ordenar en un Web Worker con respuesta inmediata al clic.', mide: 'INP' },
];

const params = new URLSearchParams(location.search);
const EMBED = params.has('embed');
const TPS = Number(params.get('tps')) || 70;
const PEDIDO_INICIAL = 'Departamento de 2 dormitorios en Barranco con vista al mar, menos de S/ 3.000';

const reglas: Record<ReglaId, boolean> = { espacio: true, plano: true, reciclar: true, libreta: true };
if (params.get('preset') === 'roto') for (const r of REGLAS) reglas[r.id] = false;
const bits = params.get('rules');
if (bits && /^[01]{4}$/.test(bits)) REGLAS.forEach((r, i) => (reglas[r.id] = bits[i] === '1'));

const $ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
if (EMBED) document.documentElement.dataset.embed = '';
const resultados = $('#resultados');
const libreta = new Libreta();
let estado: Estado = estadoVacio();
let generando: AbortController | null = null;
let fase: 'listo' | 'escribiendo' | 'ordenando' = 'listo';
let t0 = 0;
let rondaPrecios = 0;
let dictado = '';

const lab = crearLab(resultados, () => pintarHud());
const reciclador = new Reciclador(resultados, libreta, {
  get reserva() {
    return reglas.espacio;
  },
  reciclado: (el) => lab.reciclado(el),
});
const ordenarEnWorker = crearOrdenador();

// ── Render: demoler o reciclar (regla 3) ─────────────────────────────────
function render(e: Estado) {
  const t = performance.now();
  if (reglas.reciclar) reciclador.aplicar(e);
  else demoler(resultados, e, libreta, { reserva: reglas.espacio });
  lab.m.renders++;
  cargarFotos();
  pista('Render', t, 'primary', `${reglas.reciclar ? 'reciclar' : 'demoler'} · render ${lab.m.renders}`);
}

/** Las fotos llegan "de la red" un poco después (aquí se ve si su hueco estaba reservado). */
function cargarFotos() {
  resultados.querySelectorAll<HTMLImageElement>('img[data-src]:not([src])').forEach((img) => {
    img.setAttribute('src', '');
    img.removeAttribute('src');
    const id = img.closest<HTMLElement>('[data-id]')?.dataset.id ?? '';
    const delay = 180 + ([...id].reduce((s, c) => s + c.charCodeAt(0), 0) % 7) * 70;
    img.dataset.pending = '1';
    setTimeout(() => {
      if (img.isConnected) img.src = img.dataset.src!;
    }, delay);
  });
}

// ── Generar: el modelo dicta; nosotros leemos (regla 2) y pintamos ───────
async function generar(pedido = PEDIDO_INICIAL, piezasExtra?: Pieza[]) {
  generando?.abort();
  generando = new AbortController();
  const nuevo = !piezasExtra;
  if (nuevo) {
    estado = estadoVacio();
    libreta.limpiar();
    reciclador.reiniciar();
    resultados.replaceChildren();
    lab.reiniciar();
    dictado = '';
  }
  t0 = performance.now();
  fase = 'escribiendo';
  pintarToolbar();
  const formato = reglas.plano ? 'ndjson' : 'json';
  const piezas = piezasExtra ?? decidir(pedido);
  const lector: Lector = reglas.plano ? new LectorPorLineas() : new LectorCompleto();
  // ❌ Modo roto: el estado se reconstruye con TODAS las piezas en cada trozo.
  const base = nuevo ? null : structuredClone(estado);
  const programador = crearProgramador((nuevas) => {
    aplicarPiezas(estado, libreta, nuevas);
    render(estado);
  });
  const leidosAntes = lab.m.leidos;
  await emitir(trocear(serializar(piezas, formato)), {
    tps: TPS,
    signal: generando.signal,
    onChunk(trozo) {
      dictado = (dictado + trozo).slice(-2400);
      const t = performance.now();
      const nuevas = lector.alLlegar(trozo);
      lab.m.leidos = leidosAntes + lector.leidos;
      pista('Parser', t, 'tertiary', `${trozo.length} caracteres`);
      if (reglas.plano) programador.agregar(nuevas);
      else if (nuevas.length) {
        // reconstruir desde cero y pintar YA (un render por trozo)
        estado = base ? structuredClone(base) : estadoVacio();
        aplicarPiezas(estado, libreta, nuevas);
        render(estado);
      }
      pintarDictado();
    },
  });
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  lab.m.ms = Math.round(performance.now() - t0);
  fase = 'listo';
  pintarToolbar();
  pintarHud();
  avisarPadre('listo');
}

/** "Actualizar precios": la IA corrige 24 precios de la lista (regla 3 en acción). */
const actualizarPrecios = () => generar(undefined, correcciones(++rondaPrecios));

/** "Precio/m² inteligente": ordenar 300 depas (regla 4). */
async function ordenar() {
  if (!estado.lista) return;
  const btn = $<HTMLButtonElement>('[data-ordenar]');
  const t = performance.now();
  if (reglas.libreta) {
    // ✅ feedback inmediato en el MISMO frame del clic, el cálculo en el Worker
    btn.setAttribute('aria-busy', 'true');
    fase = 'ordenando';
    pintarToolbar();
    const ids = await ordenarEnWorker(estado.lista.ids, libreta);
    estado.lista = { ids, orden: 'inteligente' };
    if (reglas.reciclar) reciclador.reordenar(estado);
    else render(estado);
    btn.removeAttribute('aria-busy');
  } else {
    // ❌ todo en el hilo principal: la página se congela hasta terminar
    const ids = ordenarEnHiloPrincipal(estado.lista.ids, libreta);
    estado.lista = { ids, orden: 'inteligente' };
    render(estado);
  }
  pista('Ordenar', t, reglas.libreta ? 'secondary' : 'error', reglas.libreta ? 'Worker' : 'hilo principal');
  fase = 'listo';
  pintarToolbar();
  avisarPadre('ordenado');
}

// ── Toolbar del producto ────────────────────────────────────────────────
function pintarToolbar() {
  const tb = $('.toolbar');
  tb.hidden = !estado.plano && !estado.resumen && fase === 'listo';
  const st = $('[data-estado]');
  st.innerHTML = fase === 'escribiendo' ? '<span class="dots"></span> Nido está armando tus resultados…' : fase === 'ordenando' ? '<span class="dots"></span> Ordenando 300 departamentos…' : `✓ Listo${lab.m.ms ? ` en ${(lab.m.ms / 1000).toFixed(1)} s` : ''}`;
}

// ── Panel Rayos X ───────────────────────────────────────────────────────
const panel = $('.rayos');
function armarPanel() {
  panel.innerHTML = `<header><h2>Rayos X <small>lo que no se ve</small></h2><button class="x-close" type="button" aria-label="Cerrar rayos X" data-x-close>✕</button></header>
    <div class="x-presets"><button type="button" data-preset="roto">Todo roto</button><button type="button" data-preset="arreglado">Todo arreglado</button></div>
    <div class="x-reglas">${REGLAS.map(
      (r) => `<label class="x-regla" data-regla="${r.id}"><span class="x-n">${r.n}</span><span class="x-t"><b>${r.titulo}</b><small>${r.sub}</small><em>mide: ${r.mide}</em></span><input type="checkbox" role="switch" data-rule="${r.id}" ${reglas[r.id] ? 'checked' : ''} /></label>`,
    ).join('')}</div>
    <div class="x-hud" data-hud></div>
    <div class="x-actions"><button type="button" class="x-go" data-x-generar>Generar</button><button type="button" data-x-precios>Actualizar precios</button><button type="button" data-x-ordenar>Ordenar</button></div>
    <details class="x-dictado" open><summary>Lo que envía la IA <small data-formato></small></summary><p class="x-ayuda">La respuesta del modelo tal como llega, antes de convertirse en pantalla. Con la regla 2 llega un componente por línea (↵); sin ella, un solo JSON que el código vuelve a leer completo cada vez que llega algo.</p><pre data-dictado></pre></details>
    <p class="x-tip">Consejo: en DevTools → Performance, pon el procesador 4× más lento y graba. Verás la línea <b>Nido · UI generativa</b>.</p>`;
  panel.addEventListener('change', (e) => {
    const r = (e.target as HTMLElement).closest<HTMLInputElement>('[data-rule]');
    if (!r) return;
    reglas[r.dataset.rule as ReglaId] = r.checked;
    pintarHud();
  });
  panel.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const pre = t.closest<HTMLElement>('[data-preset]')?.dataset.preset;
    if (pre) {
      for (const r of REGLAS) reglas[r.id] = pre === 'arreglado';
      panel.querySelectorAll<HTMLInputElement>('[data-rule]').forEach((i) => (i.checked = reglas[i.dataset.rule as ReglaId]));
      pintarHud();
    }
    if (t.closest('[data-x-generar]')) void generar($<HTMLInputElement>('#pedido').value || PEDIDO_INICIAL);
    if (t.closest('[data-x-precios]')) void actualizarPrecios();
    if (t.closest('[data-x-ordenar]')) void ordenar();
    if (t.closest('[data-x-close]')) toggleRayos(false);
  });
}

const fmt = (n: number) => n.toLocaleString('es-PE');
function pintarHud() {
  const m = lab.m;
  const hud = panel.querySelector('[data-hud]');
  const color = (bad: boolean, warn = false) => (bad ? 'bad' : warn ? 'warn' : 'good');
  if (hud)
    hud.innerHTML = [
      ['CLS', m.cls.toFixed(3), color(m.cls > 0.25, m.cls > 0.1), 'espacio'],
      ['INP', m.inp ? `${fmt(m.inp)} ms` : '-', color(m.inp > 500, m.inp > 200), 'libreta'],
      ['Pausas largas', `${m.loaf}${m.loafMax ? ` · ${m.loafMax} ms` : ''}`, color(m.loafMax > 200, m.loaf > 0), 'libreta'],
      ['Caracteres leídos', fmt(m.leidos), color(m.leidos > 60000, m.leidos > 8000), 'plano'],
      ['Veces que dibujó', fmt(m.renders), color(m.renders > 150, m.renders > 60), 'plano'],
      ['Elementos creados', fmt(m.creados), color(m.creados > 8000, m.creados > 2500), 'reciclar'],
      ['Elementos en pantalla', fmt(m.dom), color(m.dom > 3000, m.dom > 1500), 'reciclar'],
      ['Tiempo', m.ms ? `${(m.ms / 1000).toFixed(1)} s` : '-', 'neutral', ''],
    ]
      .map(([k, v, c, r]) => `<div class="x-m ${c}" data-for="${r}"><span>${k}</span><b>${v}</b></div>`)
      .join('');
  const f = panel.querySelector('[data-formato]');
  if (f) f.textContent = reglas.plano ? '· un JSON por línea' : '· un solo JSON, se relee completo';
  // indicador mínimo en modo embed (comparador)
  const mini = document.querySelector('[data-mini]');
  if (mini) mini.innerHTML = `<span>CLS <b>${m.cls.toFixed(3)}</b></span><span>INP <b>${m.inp || '-'}</b></span><span>leídos <b>${fmt(m.leidos)}</b></span><span>dibujos <b>${fmt(m.renders)}</b></span><span>elementos <b>${fmt(m.creados)}</b></span>`;
  avisarPadre('metricas');
}

function pintarDictado() {
  const pre = panel.querySelector('[data-dictado]');
  if (!pre || panel.hidden) return;
  pre.innerHTML = esc(dictado).replace(/\n/g, '<span class="nl">↵</span>\n');
  pre.scrollTop = pre.scrollHeight;
}

function toggleRayos(on: boolean = panel.hidden === true) {
  panel.hidden = !on;
  lab.dibujar = on;
  document.documentElement.toggleAttribute('data-rayos', on);
  if (on) {
    pintarHud();
    pintarDictado();
  }
}

// ── Comparador (/compare.html) y grabación de clips ─────────────────────
function avisarPadre(tipo: string) {
  if (parent !== window) parent.postMessage({ type: 'nido', tipo, m: { ...lab.m } satisfies Metricas, reglas: { ...reglas } }, location.origin);
}
addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'nido-cmd') return;
  const { cmd, pedido } = e.data as { cmd: string; pedido?: string };
  if (cmd === 'generar') void generar(pedido);
  if (cmd === 'precios') void actualizarPrecios();
  if (cmd === 'ordenar') void ordenar();
  if (cmd === 'scroll') resultados.querySelector('.lista-scroll')?.scrollBy({ top: 900, behavior: 'smooth' });
});
Object.assign(window, { nido: { generar, actualizarPrecios, ordenar, reglas, metricas: () => ({ ...lab.m }), toggleRayos } });

// ── Arranque ────────────────────────────────────────────────────────────
armarPanel();
const form = $<HTMLFormElement>('.ask');
const input = $<HTMLInputElement>('#pedido');
input.value = params.get('q') ?? PEDIDO_INICIAL;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  void generar(input.value.trim() || PEDIDO_INICIAL);
});
document.querySelectorAll<HTMLButtonElement>('[data-sugerido]').forEach((b) =>
  b.addEventListener('click', () => {
    input.value = b.textContent!.trim();
    void generar(input.value);
  }),
);
$('[data-ordenar]').addEventListener('click', () => void ordenar());
$('[data-precios]').addEventListener('click', () => void actualizarPrecios());
$('[data-rayos-btn]').addEventListener('click', () => toggleRayos());
resultados.addEventListener('click', (e) => {
  const fav = (e.target as HTMLElement).closest<HTMLButtonElement>('.fav');
  if (fav) fav.classList.toggle('on');
});
addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
  if (e.key.toLowerCase() === 'x') toggleRayos();
});
toggleRayos(params.has('rayos') && params.get('rayos') !== '0');
// En el comparador no hay panel, pero sí los dibujos (saltos en rojo, nodos nuevos/reciclados).
if (EMBED) lab.dibujar = true;
const foco = params.get('focus');
if (foco) document.documentElement.dataset.focus = foco;
pintarToolbar();
pintarHud();
if (params.has('auto')) setTimeout(() => void generar(input.value), 400);
