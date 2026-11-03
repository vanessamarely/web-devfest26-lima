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

export function crearLab(root: HTMLElement, onChange: () => void) {
  const m = metricasVacias();
  let dibujar = false;
  const capa = document.createElement('div');
  capa.className = 'xray-capa';
  capa.setAttribute('aria-hidden', 'true');
  document.body.append(capa);

  const marco = (r: DOMRectReadOnly | DOMRect, cls: string, label = '') => {
    if (!dibujar || r.width < 2 || r.height < 2) return;
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

  new MutationObserver((records) => {
    for (const r of records)
      r.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        m.creados += 1 + n.getElementsByTagName('*').length;
        if (dibujar && !n.closest('.lista-scroll')) marco(n.getBoundingClientRect(), 'nuevo');
      });
    m.dom = root.getElementsByTagName('*').length;
    changed();
  }).observe(root, { childList: true, subtree: true });

  return {
    m,
    reiniciar() {
      Object.assign(m, metricasVacias());
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
