// Rayos X: mide lo que la persona SIENTE y dibuja lo que normalmente no se ve.
//  · CLS: suma de layout-shift (sin input reciente) desde la última generación.
//  · INP: la interacción más lenta (Event Timing) desde la última generación.
//  · Frames largos: long-animation-frame (LoAF) > 50 ms.
//  · Nodos creados: MutationObserver sobre los resultados.
// Dibujos: cada salto en ROJO sobre lo que se movió; nodos nuevos en NARANJA; reciclados en VERDE.
export interface Metricas {
  cls: number;
  inp: number;
  loaf: number;
  loafMax: number;
  leidos: number;
  renders: number;
  creados: number;
  dom: number;
  ms: number;
}

export const metricasVacias = (): Metricas => ({ cls: 0, inp: 0, loaf: 0, loafMax: 0, leidos: 0, renders: 0, creados: 0, dom: 0, ms: 0 });

const now = (v: number | undefined) => v ?? -Infinity;

export function crearLab(root: HTMLElement, onChange: () => void) {
  const m = metricasVacias();
  let dibujar = false;
  const capa = document.createElement('div');
  capa.className = 'xray-capa';
  capa.setAttribute('aria-hidden', 'true');
  document.body.append(capa);

  // Un mismo lugar se marca como mucho cada 500 ms: si todo se recrea 40 veces por segundo,
  // se ve un contorno que parpadea, no una pantalla tapada de naranja.
  const ultimos = new Map<string, number>();
  const marco = (r: DOMRectReadOnly | DOMRect, cls: string, label = '') => {
    if (!dibujar || r.width < 2 || r.height < 2) return;
    const k = `${cls}:${Math.round(r.left / 8)}:${Math.round(r.top / 8)}:${Math.round(r.width / 8)}:${Math.round(r.height / 8)}`;
    const ahora = performance.now();
    if (now(ultimos.get(k)) > ahora - 500) return;
    ultimos.set(k, ahora);
    if (ultimos.size > 400) ultimos.clear();
    const b = document.createElement('div');
    b.className = `xray-box ${cls}`;
    Object.assign(b.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    if (label) b.dataset.label = label;
    capa.append(b);
    setTimeout(() => b.remove(), 1100);
  };

  let tick = 0;
  const changed = () => {
    if (tick) return;
    tick = requestAnimationFrame(() => {
      tick = 0;
      onChange();
    });
  };

  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { currentRect: DOMRectReadOnly }[] })[]) {
        if (e.hadRecentInput) continue;
        m.cls += e.value;
        e.sources?.forEach((s) => marco(s.currentRect, 'shift', `salto +${e.value.toFixed(3)}`));
      }
      changed();
    }).observe({ type: 'layout-shift', buffered: false });
  } catch {
    /* sin layout-shift */
  }
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { interactionId?: number })[]) if (e.interactionId) m.inp = Math.max(m.inp, Math.round(e.duration));
      changed();
    }).observe({ type: 'event', durationThreshold: 16, buffered: false } as PerformanceObserverInit);
  } catch {
    /* sin event timing */
  }
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        m.loaf++;
        m.loafMax = Math.max(m.loafMax, Math.round(e.duration));
      }
      changed();
    }).observe({ type: 'long-animation-frame', buffered: false });
  } catch {
    /* sin LoAF */
  }

  // Saltos que la persona ve aunque el elemento se haya recreado (con innerHTML, Chrome no los
  // cuenta como layout-shift porque el nodo es nuevo). Se compara dónde estaba cada sección.
  const posiciones = new Map<string, { top: number; el: Element }>();
  const saltosRecreados = () => {
    const vh = innerHeight;
    root.querySelectorAll<HTMLElement>('[data-seccion]').forEach((el) => {
      const id = el.dataset.seccion!;
      const r = el.getBoundingClientRect();
      const top = r.top + scrollY; // posición en la página: el scroll no es un salto
      const antes = posiciones.get(id);
      posiciones.set(id, { top, el });
      if (!antes || antes.el === el || r.height < 2) return; // mismo nodo: ya lo mide layout-shift
      const d = Math.abs(top - antes.top);
      if (d < 3) return;
      const visible = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, Math.min(r.top, antes.top - scrollY)));
      if (!visible) return;
      const valor = Math.min(1, visible / vh) * Math.min(1, d / vh);
      m.cls += valor;
      marco(r, 'shift', `salto +${valor.toFixed(3)}`);
    });
  };

  new MutationObserver((records) => {
    for (const r of records)
      r.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        m.creados += 1 + n.getElementsByTagName('*').length;
        if (dibujar && !n.closest('.lista-scroll')) marco(n.getBoundingClientRect(), 'nuevo');
      });
    m.dom = root.getElementsByTagName('*').length;
    saltosRecreados();
    changed();
  }).observe(root, { childList: true, subtree: true });

  return {
    m,
    reiniciar() {
      Object.assign(m, metricasVacias());
      posiciones.clear();
      m.dom = root.getElementsByTagName('*').length;
      changed();
    },
    set dibujar(v: boolean) {
      dibujar = v;
      document.documentElement.toggleAttribute('data-xray', v);
    },
    get dibujar() {
      return dibujar;
    },
    reciclado(el: Element) {
      marco(el.getBoundingClientRect(), 'reciclado');
    },
    changed,
  };
}
