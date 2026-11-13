// Regla 4 · Una sola libreta de obra.
// La IA dicta QUÉ mostrar (piezas con id). Tu código calcula CUÁNTO: la lista completa, el orden,
// los totales. Todo vive en UNA libreta indexada por id y cada pieza de la pantalla escucha solo
// su id: si cambia un precio, se repinta una tarjeta, no la página.
import { DEPAS, DEPA_BY_ID, filtrar, type Depa } from '../data';
import type { Pieza, Seccion } from '../ia';
import { puntaje } from './puntaje';

export type DepaLite = Omit<Depa, 'x' | 'y' | 'piso'> & Partial<Pick<Depa, 'x' | 'y' | 'piso'>>;

export interface Estado {
  plano: Seccion[] | null;
  resumen: string;
  destacados: string[];
  mapa: { zona: string; pins: string[] } | null;
  grafico: { titulo: string; barras: { distrito: string; valor: number }[] } | null;
  lista: { ids: string[]; orden: string } | null;
}

export const estadoVacio = (): Estado => ({ plano: null, resumen: '', destacados: [], mapa: null, grafico: null, lista: null });

/** La libreta: una sola fuente de verdad, por id. */
export class Libreta {
  readonly depas = new Map<string, DepaLite>();
  private avisos = new Map<string, Set<() => void>>();

  anotar(id: string, cambio: Partial<DepaLite>) {
    const prev = this.depas.get(id) ?? (DEPA_BY_ID.get(id) as DepaLite | undefined);
    if (!prev) return;
    this.depas.set(id, { ...prev, ...cambio });
    this.avisos.get(id)?.forEach((pintar) => pintar()); // solo a quien lo usa
  }
  escuchar(id: string, fn: () => void): () => void {
    let s = this.avisos.get(id);
    if (!s) this.avisos.set(id, (s = new Set()));
    s.add(fn);
    return () => s!.delete(fn);
  }
  get(id: string): DepaLite | undefined {
    return this.depas.get(id) ?? (DEPA_BY_ID.get(id) as DepaLite | undefined);
  }
  limpiar() {
    this.depas.clear();
    this.avisos.clear();
  }
}

/** Aplica piezas al estado y a la libreta. Devuelve los ids de depas que cambiaron. */
export function aplicarPiezas(e: Estado, libreta: Libreta, piezas: Pieza[]): Set<string> {
  const cambiaron = new Set<string>();
  for (const p of piezas) {
    switch (p.tipo) {
      case 'plano':
        e.plano = p.secciones;
        break;
      case 'texto':
        e.resumen += p.delta;
        break;
      case 'inmueble': {
        const { tipo: _t, ...d } = p;
        const full = DEPA_BY_ID.get(d.id);
        libreta.anotar(d.id, { ...full, ...d });
        if (!libreta.depas.has(d.id)) libreta.depas.set(d.id, { ...full, ...d } as DepaLite);
        if (!e.destacados.includes(d.id)) e.destacados.push(d.id);
        cambiaron.add(d.id);
        break;
      }
      case 'mapa':
        e.mapa = { zona: p.zona, pins: p.pins };
        break;
      case 'grafico':
        e.grafico = { titulo: p.titulo, barras: p.barras };
        break;
      case 'lista': {
        // La IA dicta el filtro; la lista la calcula NUESTRO código (300 depas, sin pedírselos al modelo).
        const ids = filtrar(DEPAS, p.filtro)
          .sort((a, b) => (p.orden === 'precio' ? a.precio - b.precio : a.mar - b.mar))
          .map((d) => d.id);
        e.lista = { ids, orden: p.orden };
        break;
      }
      case 'cambio':
        libreta.anotar(p.id, { precio: p.precio });
        cambiaron.add(p.id);
        break;
    }
  }
  return cambiaron;
}

/** ❌ Ordenar en el hilo principal, calculando el puntaje DENTRO del comparador (miles de veces). */
export function ordenarEnHiloPrincipal(ids: string[], libreta: Libreta): string[] {
  const full = (id: string) => ({ ...DEPA_BY_ID.get(id)!, ...libreta.get(id) });
  return [...ids].sort((a, b) => puntaje(full(a) as Depa) - puntaje(full(b) as Depa));
}

/** ✅ Ordenar en un Worker: el clic responde al instante y el cálculo pesado va afuera. */
export function crearOrdenador() {
  const worker = new Worker(new URL('./orden.worker.ts', import.meta.url), { type: 'module' });
  return (ids: string[], libreta: Libreta) =>
    new Promise<string[]>((resolve) => {
      worker.onmessage = ({ data }) => resolve(data as string[]);
      worker.postMessage(ids.map((id) => ({ ...DEPA_BY_ID.get(id)!, ...libreta.get(id) })).map(({ id, precio, m2, mar, x, y }) => ({ id, precio, m2, mar, x, y })));
    });
}
