// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { horariosLibres } from './data';
import { setBug } from './bugs';
import { ejecutar } from './tools';
import { formularioHTML } from './ui/reserva';

describe('Mesa', () => {
  beforeEach(() => {
    setBug('error', false);
    setBug('div', false);
  });
  it('el sábado a las 20:00 Kaiyō está lleno para 4 (el caso de la charla)', () => {
    const libres = horariosLibres('kaiyo', '2026-11-14', 4);
    expect(libres).not.toContain('20:00');
    expect(libres).toContain('19:30');
  });
  it('error útil: dice qué horas están libres', async () => {
    const out = await ejecutar('reservar_mesa', { restaurante: 'kaiyo', fecha: '2026-11-14', hora: '20:00', personas: 4 });
    expect(out).toMatch(/^Error: 20:00 no está libre\. Horas libres: .*19:30/);
  });
  it('con el bug 2, el error es opaco', async () => {
    setBug('error', true);
    expect(await ejecutar('reservar_mesa', { restaurante: 'kaiyo', fecha: '2026-11-14', hora: '20:00', personas: 4 })).toBe('Error');
  });
  it('con el bug 1, el botón es un div sin rol ni nombre; arreglado, un button con texto', () => {
    setBug('div', true);
    expect(formularioHTML('kaiyo')).toMatch(/<div class="btn-reservar solo-icono" data-clickable/);
    setBug('div', false);
    expect(formularioHTML('kaiyo')).toMatch(/<button type="submit"[^>]*>.*Reservar mesa<\/button>/s);
  });
});
