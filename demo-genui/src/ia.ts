// "Modelo" simulado y DETERMINISTA: para un mismo pedido produce siempre el mismo stream, con los
// mismos cortes, a la velocidad que elijas (tokens por segundo). Así cada comparación de la demo
// es justa: lo único que cambia entre "roto" y "arreglado" es nuestro código.
//
// El modelo no escribe HTML: elige PIEZAS del catálogo (ver genui/catalogo.ts) y las describe en JSON.
// Puede escribirlas como un JSON completo ({"piezas":[…]}) o como JSON por líneas (NDJSON).
import { DEPAS, DISTRITOS, filtrar, precioM2, type Depa, type Filtro } from './data';

export type Seccion = { id: string; tipo: TipoPieza; n?: number };
export type TipoPieza = 'resumen' | 'mapa' | 'destacados' | 'grafico' | 'lista';

export type Pieza =
  | { tipo: 'plano'; secciones: Seccion[] }
  | { tipo: 'texto'; id: 'resumen'; delta: string }
  | ({ tipo: 'depa' } & Omit<Depa, 'x' | 'y' | 'piso'>)
  | { tipo: 'mapa'; id: 'mapa'; zona: string; pins: string[] }
  | { tipo: 'grafico'; id: 'grafico'; titulo: string; barras: { distrito: string; valor: number }[] }
  | { tipo: 'lista'; id: 'lista'; filtro: Filtro; orden: 'precio_m2' | 'precio' | 'mar' }
  | { tipo: 'cambio'; id: string; precio: number; nota?: string };

export type Formato = 'ndjson' | 'json';

/** Lo que entendió el "modelo" del pedido (palabras clave, sin red). */
export function entender(pedido: string): Filtro & { zona: string } {
  const p = pedido.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const distritos = DISTRITOS.filter((d) => p.includes(d.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))).map((d) => d.nombre);
  const dorms = Number(p.match(/(\d)\s*(dorm|hab|cuarto)/)?.[1]) || (p.includes('estudio') ? 1 : 2);
  const max = Number(p.replace(/[.,](?=\d{3})/g, '').match(/(?:s\/?\s*|menos de\s*|hasta\s*|bajo\s*)(\d{3,5})/)?.[1]) || 3000;
  const vista = /vista|mar|malecon/.test(p);
  return { distritos: distritos.length ? distritos : ['Barranco'], dorms, max, vista, zona: distritos[0] ?? 'Barranco' };
}

/** Las piezas que "decide" el modelo, en el orden en que las escribe. */
export function decidir(pedido: string): Pieza[] {
  const f = entender(pedido);
  const zona = f.zona;
  const vecinos = zona === 'Barranco' ? ['Barranco', 'Chorrillos', 'Miraflores'] : [zona, 'Barranco', 'Miraflores'];
  const candidatos = filtrar(DEPAS, { ...f, distritos: vecinos, vista: false })
    .sort((a, b) => Number(b.vista) - Number(a.vista) || a.mar - b.mar || precioM2(a) - precioM2(b))
    .slice(0, 6);
  const total = filtrar(DEPAS, { distritos: vecinos, dorms: f.dorms }).length;
  const piezas: Pieza[] = [
    { tipo: 'plano', secciones: [{ id: 'resumen', tipo: 'resumen' }, { id: 'mapa', tipo: 'mapa' }, { id: 'destacados', tipo: 'destacados', n: 6 }, { id: 'grafico', tipo: 'grafico' }, { id: 'lista', tipo: 'lista' }] },
    { tipo: 'texto', id: 'resumen', delta: `Encontré ${total} depas de ${f.dorms}+ dormitorios entre ${vecinos.join(', ')}. ` },
    { tipo: 'texto', id: 'resumen', delta: `Te muestro primero los 6 más cerca al malecón${f.vista ? ' y con vista al mar' : ''} por menos de S/ ${f.max!.toLocaleString('es-PE')}. ` },
    { tipo: 'texto', id: 'resumen', delta: 'Abajo comparo el precio por m² de cada distrito y te dejo la lista completa.' },
  ];
  for (const d of candidatos) {
    const { x: _x, y: _y, piso: _p, ...rest } = d;
    piezas.push({ tipo: 'depa', ...rest });
  }
  // El mapa llega DESPUÉS de las tarjetas, pero va ARRIBA en el plano (aquí está el salto).
  piezas.push({ tipo: 'mapa', id: 'mapa', zona, pins: candidatos.map((d) => d.id) });
  piezas.push({
    tipo: 'grafico',
    id: 'grafico',
    titulo: 'Precio por m² (S/ al mes)',
    barras: ['Barranco', 'Miraflores', 'Chorrillos', 'San Isidro', 'Surco', 'Magdalena'].map((dn) => {
      const ds = DEPAS.filter((d) => d.distrito === dn);
      return { distrito: dn, valor: Math.round(ds.reduce((s, d) => s + precioM2(d), 0) / Math.max(1, ds.length)) };
    }),
  });
  piezas.push({ tipo: 'lista', id: 'lista', filtro: { distritos: DISTRITOS.map((d) => d.nombre) }, orden: 'mar' });
  // El modelo se corrige mientras escribe: precios actualizados (aquí se ve el reciclaje).
  candidatos.slice(0, 4).forEach((d, i) => piezas.push({ tipo: 'cambio', id: d.id, precio: d.precio - 60 - i * 20, nota: 'precio actualizado' }));
  return piezas;
}

/** "Actualizar precios": la IA revisa 24 depas de la lista y corrige sus precios. */
export function correcciones(ronda: number): Pieza[] {
  const out: Pieza[] = [];
  for (let i = 0; i < 24; i++) {
    const d = DEPAS[(i * 7 + ronda * 13) % 120];
    out.push({ tipo: 'cambio', id: d.id, precio: d.precio + ((i + ronda) % 2 ? -50 : 40) * (1 + (ronda % 3)) });
  }
  return out;
}

export function serializar(piezas: Pieza[], formato: Formato): string {
  return formato === 'ndjson' ? piezas.map((p) => JSON.stringify(p)).join('\n') + '\n' : `{"piezas":[${piezas.map((p) => JSON.stringify(p)).join(',')}]}`;
}

/** Corta el texto en trozos de 3–9 caracteres, siempre igual (como los tokens de un modelo). */
export function trocear(texto: string, seed = 7): string[] {
  let s = seed;
  const out: string[] = [];
  for (let i = 0; i < texto.length; ) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const n = 3 + (s % 7);
    out.push(texto.slice(i, i + n));
    i += n;
  }
  return out;
}

export interface StreamOpts {
  /** Tokens por segundo (~4 caracteres por token). */
  tps?: number;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
}

/** Emite los trozos con el ritmo de un modelo (≈ tps tokens por segundo). */
export function emitir(trozos: string[], { tps = 70, signal, onChunk }: StreamOpts): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const t0 = performance.now();
    let chars = 0;
    const tick = () => {
      if (signal?.aborted) return resolve();
      // ¿Cuántos caracteres "debería" haber escrito el modelo a esta hora?
      const due = ((performance.now() - t0) / 1000) * tps * 4;
      while (i < trozos.length && chars <= due) {
        chars += trozos[i].length;
        onChunk(trozos[i++]);
      }
      if (i >= trozos.length) return resolve();
      setTimeout(tick, 4);
    };
    tick();
  });
}
