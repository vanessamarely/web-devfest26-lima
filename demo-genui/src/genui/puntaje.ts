// "Precio por m² + cercanía al mar": un cálculo de verdad pesado (distancia a la línea costera
// con miles de puntos). Lo usa el Worker (una vez por depa) y el modo roto (¡dentro del comparador!).
import type { Depa } from '../data';

const COSTA: [number, number][] = Array.from({ length: 6000 }, (_, i) => {
  const t = i / 5999;
  return [13 + t * 58 + Math.sin(t * 9) * 3, t * 100];
});

export function distanciaCosta(x: number, y: number): number {
  let best = Infinity;
  for (const [cx, cy] of COSTA) {
    const d = Math.hypot(cx - x, cy - y);
    if (d < best) best = d;
  }
  return best;
}

/** Menor = mejor. */
export function puntaje(d: Pick<Depa, 'precio' | 'm2' | 'mar' | 'x' | 'y'>): number {
  return d.precio / d.m2 + distanciaCosta(d.x, d.y) * 2 + d.mar / 200;
}
