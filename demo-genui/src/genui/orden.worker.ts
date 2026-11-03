// Regla 4 · Lo pesado, fuera del hilo principal: el Worker calcula cada puntaje UNA vez y
// devuelve solo los ids en orden. La página sigue respondiendo mientras tanto.
import { puntaje } from './puntaje';
import type { Depa } from '../data';

const ctx = self as unknown as { onmessage: (e: MessageEvent<Pick<Depa, 'id' | 'precio' | 'm2' | 'mar' | 'x' | 'y'>[]>) => void; postMessage: (d: unknown) => void };

ctx.onmessage = ({ data }) => {
  const conPuntaje = data.map((d) => ({ id: d.id, p: puntaje(d) }));
  conPuntaje.sort((a, b) => a.p - b.p);
  ctx.postMessage(conPuntaje.map((d) => d.id));
};
