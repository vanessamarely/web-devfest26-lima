// Regla 3 · Recicla, no demuelas.
//  ❌ demoler(): arma el HTML de TODA la vista y lo pone con innerHTML en cada render. Cada
//     render crea cientos (o miles) de nodos nuevos, recarga las fotos y pierde foco y scroll.
//  ✅ Reciclador: un nodo por id. Si cambia el precio, cambia el texto del precio; la lista larga
//     usa un puñado de filas recicladas (pool) aunque haya 300 resultados.
// La regla 1 (reservar el espacio) decide si cada sección ocupa su tamaño final antes de llegar.
import { DEPA_BY_ID, soles } from '../data';
import type { Seccion, TipoPieza } from '../ia';
import { estiloReserva, medida, reservar } from './catalogo';
import type { Estado, Libreta } from './estado';
import { esc, filaHTML, graficoHTML, mapaHTML, tarjetaHTML } from './piezas';

export const FILA = 84; // alto fijo de cada fila de la lista
const VENTANA = 560; // alto visible de la lista

const coords = () => new Map([...DEPA_BY_ID].map(([id, d]) => [id, { x: d.x, y: d.y }]));
let COORDS: Map<string, { x: number; y: number }> | null = null;

export interface Opciones {
  reserva: boolean;
  /** se llama con cada elemento que se reutilizó (rayos X lo pinta de verde) */
  reciclado?: (el: Element) => void;
}

const SIN_PLANO: Seccion[] = [
  { id: 'resumen', tipo: 'resumen' },
  { id: 'mapa', tipo: 'mapa' },
  { id: 'destacados', tipo: 'destacados' },
  { id: 'grafico', tipo: 'grafico' },
  { id: 'lista', tipo: 'lista' },
];

function tieneContenido(e: Estado, tipo: TipoPieza): boolean {
  if (tipo === 'resumen') return Boolean(e.resumen);
  if (tipo === 'mapa') return Boolean(e.mapa);
  if (tipo === 'destacados') return e.destacados.length > 0;
  if (tipo === 'grafico') return Boolean(e.grafico);
  return Boolean(e.lista);
}

function contenidoHTML(e: Estado, libreta: Libreta, tipo: TipoPieza, reserva: boolean): string {
  switch (tipo) {
    case 'resumen':
      return `<div class="resumen"><span class="ia-chip">✦ Nido IA</span><p>${esc(e.resumen)}</p></div>`;
    case 'mapa':
      return mapaHTML(
        e.mapa!.pins.map((id) => libreta.get(id)!).filter(Boolean),
        (COORDS ??= coords()),
      );
    case 'destacados':
      return `<h2 class="sec-h">Los más cerca al malecón</h2><div class="grid">${e.destacados.map((id) => tarjetaHTML(libreta.get(id)!, reserva)).join('')}</div>`;
    case 'grafico':
      return graficoHTML(e.grafico!);
    case 'lista':
      return `${cabeceraLista(e)}<div class="lista-scroll" role="list">${e.lista!.ids.map((id, i) => filaHTML(libreta.get(id)!, i)).join('')}</div>`;
  }
}

const cabeceraLista = (e: Estado) =>
  `<div class="lista-head"><h2 class="sec-h">Todos los resultados <small>${e.lista!.ids.length} depas</small></h2></div>`;

/** ❌ Demoler: toda la vista con innerHTML, en cada render. */
export function demoler(root: HTMLElement, e: Estado, libreta: Libreta, { reserva }: Opciones) {
  const plano = e.plano ?? SIN_PLANO;
  const scroll = root.querySelector('.lista-scroll')?.scrollTop ?? 0;
  root.innerHTML = plano
    .map((s) => {
      const lleno = tieneContenido(e, s.tipo);
      if (!lleno && !reserva) return ''; // sin reserva, la sección no existe hasta que llega
      return `<section class="slot slot-${s.tipo}${lleno ? '' : ' esqueleto'}" data-seccion="${s.id}" data-medida="${esc(medida(s.tipo))}" style="${reserva ? estiloReserva(s.tipo) : ''}">${lleno ? contenidoHTML(e, libreta, s.tipo, reserva) : ''}</section>`;
    })
    .join('');
  const sc = root.querySelector('.lista-scroll');
  if (sc) sc.scrollTop = scroll;
}

/** ✅ Reciclar: cada sección, tarjeta y fila es un nodo estable por id. */
export class Reciclador {
  private secciones = new Map<string, HTMLElement>();
  private tarjetas = new Map<string, HTMLElement>();
  private apagar: (() => void)[] = [];
  private pool: HTMLElement[] = [];
  private listaIds: string[] = [];
  private scroller: HTMLElement | null = null;
  private resumenP: HTMLElement | null = null;

  constructor(
    private root: HTMLElement,
    private libreta: Libreta,
    private opts: Opciones,
  ) {}

  reiniciar() {
    this.apagar.forEach((f) => f());
    this.apagar = [];
    this.secciones.clear();
    this.tarjetas.clear();
    this.pool = [];
    this.listaIds = [];
    this.scroller = null;
    this.resumenP = null;
    this.root.replaceChildren();
  }

  /** Sincroniza el DOM con el estado tocando solo lo que falta o cambió. */
  aplicar(e: Estado) {
    const plano = e.plano ?? SIN_PLANO;
    for (const s of plano) {
      const lleno = tieneContenido(e, s.tipo);
      let sec = this.secciones.get(s.id);
      if (!sec) {
        if (!lleno && !this.opts.reserva) continue;
        sec = this.opts.reserva ? reservar(s.id, s.tipo) : Object.assign(document.createElement('section'), { className: `slot slot-${s.tipo}` });
        sec.dataset.seccion = s.id;
        this.secciones.set(s.id, sec);
        // en su lugar del plano (aunque llegue después que las de abajo)
        const idx = plano.indexOf(s);
        const despues = plano.slice(idx + 1).map((x) => this.secciones.get(x.id)).find(Boolean);
        this.root.insertBefore(sec, despues ?? null);
      }
      if (!lleno) continue;
      sec.classList.remove('esqueleto');
      this.pintar(sec, s.tipo, e);
    }
  }

  private pintar(sec: HTMLElement, tipo: TipoPieza, e: Estado) {
    switch (tipo) {
      case 'resumen':
        if (!this.resumenP) {
          sec.innerHTML = `<div class="resumen"><span class="ia-chip">✦ Nido IA</span><p></p></div>`;
          this.resumenP = sec.querySelector('p');
        }
        if (this.resumenP!.textContent !== e.resumen) this.resumenP!.textContent = e.resumen;
        return;
      case 'mapa':
      case 'grafico':
        if (!sec.firstChild) sec.innerHTML = tipo === 'mapa' ? mapaHTML(e.mapa!.pins.map((id) => this.libreta.get(id)!), (COORDS ??= coords())) : graficoHTML(e.grafico!);
        return;
      case 'destacados': {
        let grid = sec.querySelector<HTMLElement>('.grid');
        if (!grid) {
          sec.innerHTML = `<h2 class="sec-h">Los más cerca al malecón</h2><div class="grid"></div>`;
          grid = sec.querySelector<HTMLElement>('.grid')!;
        }
        for (const id of e.destacados) {
          if (this.tarjetas.has(id)) continue;
          const tpl = document.createElement('template');
          tpl.innerHTML = tarjetaHTML(this.libreta.get(id)!, this.opts.reserva);
          const el = tpl.content.firstElementChild as HTMLElement;
          this.tarjetas.set(id, el);
          grid.append(el);
          // la tarjeta escucha SOLO su id en la libreta
          this.apagar.push(this.libreta.escuchar(id, () => this.precio(el, this.libreta.get(id)!.precio)));
        }
        return;
      }
      case 'lista':
        this.lista(sec, e);
        return;
    }
  }

  private precio(el: HTMLElement, precio: number) {
    if (el.dataset.precio === String(precio)) return;
    el.dataset.precio = String(precio);
    (el.querySelector('.precio span') ?? el.querySelector('.precio'))!.textContent = soles(precio);
    this.opts.reciclado?.(el);
  }

  /** Lista larga con pool: unas 9 filas reales que se reutilizan al hacer scroll. */
  private lista(sec: HTMLElement, e: Estado) {
    if (!this.scroller) {
      sec.innerHTML = `${cabeceraLista(e)}<div class="lista-scroll" role="list"><div class="lista-alto"></div></div>`;
      this.scroller = sec.querySelector<HTMLElement>('.lista-scroll')!;
      this.scroller.addEventListener('scroll', () => this.filas(), { passive: true });
    }
    const orden = e.lista!.ids;
    const cambio = orden !== this.listaIds;
    this.listaIds = orden;
    (this.scroller.firstElementChild as HTMLElement).style.height = `${orden.length * FILA}px`;
    sec.querySelector('.lista-head small')!.textContent = `${orden.length} depas`;
    this.filas(cambio);
  }

  private filas(forzar = false) {
    const sc = this.scroller!;
    const visibles = Math.ceil(VENTANA / FILA) + 2;
    while (this.pool.length < visibles) {
      const fila = document.createElement('div');
      fila.className = 'fila';
      fila.setAttribute('role', 'listitem');
      fila.style.position = 'absolute';
      sc.append(fila);
      this.pool.push(fila);
    }
    const desde = Math.max(0, Math.floor(sc.scrollTop / FILA) - 1);
    this.pool.forEach((fila, k) => {
      const i = desde + k;
      const id = this.listaIds[i];
      fila.hidden = !id;
      if (!id) return;
      const d = this.libreta.get(id)!;
      const sig = `${id}:${d.precio}:${i}`;
      fila.style.transform = `translateY(${i * FILA}px)`;
      if (fila.dataset.sig === sig && !forzar) return;
      const reusada = Boolean(fila.dataset.sig);
      fila.dataset.sig = sig;
      fila.dataset.id = id;
      // el MISMO nodo con otro contenido (como la vitrina de una pastelería)
      fila.innerHTML = filaHTML(d, i).replace(/^<div[^>]*>|<\/div>\s*$/g, '');
      if (reusada) this.opts.reciclado?.(fila);
    });
  }

  /** Reordenar moviendo filas del pool (con View Transition si el navegador la tiene). */
  reordenar(e: Estado) {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const go = () => this.aplicar(e);
    if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) doc.startViewTransition(go);
    else go();
  }
}
