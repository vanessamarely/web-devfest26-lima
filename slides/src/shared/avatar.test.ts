// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { AVATAR_KEYS, MENSAJES_BY_TALK, avatarSilhouette, avatarSVG, diffAvatar, normalizeAvatar } from './avatar';
import * as A from './avatar';

const LISTS: Record<string, readonly unknown[]> = { piel: A.PIELES, pelo: A.PELOS, colorPelo: A.COLORES_PELO, ropa: A.ROPAS, gorro: A.GORROS, lentes: A.LENTES, expresion: A.EXPRESIONES, accesorio: A.ACCESORIOS, rasgos: A.RASGOS, abajo: A.ABAJOS };

describe('avatar limeño', () => {
  it('dibuja un SVG válido para cada opción', () => {
    const parser = new DOMParser();
    for (const k of AVATAR_KEYS)
      for (let i = 0; i < LISTS[k].length; i++) {
        const svg = avatarSVG(normalizeAvatar({ [k]: i }));
        expect(parser.parseFromString(svg, 'image/svg+xml').querySelector('parsererror')).toBeNull();
      }
  });

  it('ofrece rasgos y ropa variados (no todos los avatares se ven igual)', () => {
    expect(A.PELOS).toContain('Largo suelto');
    expect(A.RASGOS).toEqual(expect.arrayContaining(['Pestañas', 'Aretes', 'Barba']));
    expect(A.ABAJOS).toEqual(expect.arrayContaining(['Falda', 'Vestido']));
    expect(avatarSVG(normalizeAvatar({ rasgos: 2 }))).toContain('#f9ab00');
  });

  it('normaliza opciones fuera de rango (lo que llegue de la red)', () => {
    const o = normalizeAvatar({ ropa: 99, gorro: -1, accesorio: 2.5 } as never);
    expect(o.ropa).toBe(0);
    expect(o.gorro).toBe(0);
    expect(o.accesorio).toBe(0);
  });

  it('escapa el título', () => {
    expect(avatarSVG(normalizeAvatar({}), '<script>')).not.toContain('<script>');
    expect(avatarSilhouette('<b>Ana</b>')).not.toContain('<b>Ana');
  });

  it('las listas caben en las reglas de Firestore (índices ≤ 12, mensajes ≤ 20)', () => {
    for (const k of AVATAR_KEYS) expect(LISTS[k].length).toBeLessThanOrEqual(13);
    for (const list of Object.values(MENSAJES_BY_TALK)) expect(list.length).toBeLessThanOrEqual(21);
  });

  it('describe qué cambió al pasar de una charla a otra', () => {
    const a = normalizeAvatar({ ropa: 0, gorro: 0, accesorio: 1 });
    expect(diffAvatar(a, { ...a, gorro: 3, accesorio: 6 })).toEqual(['casco de parapente', 'lupa']);
    expect(diffAvatar(a, a)).toEqual([]);
  });
});
