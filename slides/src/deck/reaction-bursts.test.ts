// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { burstThreshold, createBursts } from './reaction-bursts';

describe('reacciones con efecto', () => {
  it('el umbral escala con la sala (4 mínimo, 18 máximo)', () => {
    expect(burstThreshold(0)).toBe(4);
    expect(burstThreshold(100)).toBe(6);
    expect(burstThreshold(300)).toBe(18);
    expect(burstThreshold(1000)).toBe(18);
  });

  it('dispara con una oleada, no con reacciones sueltas, y respeta el enfriamiento', () => {
    const b = createBursts(() => 50); // umbral 4
    const t = 1_000_000;
    expect(b.add('fire', t)).toBe(false);
    expect(b.add('fire', t + 10_000)).toBe(false); // la primera ya salió de la ventana de 6 s
    expect(b.add('fire', t + 10_500)).toBe(false);
    expect(b.add('fire', t + 11_000)).toBe(false);
    expect(b.add('fire', t + 11_500)).toBe(true); // 4 en 6 s → efecto
    for (let i = 0; i < 4; i++) expect(b.add('fire', t + 12_000 + i * 100)).toBe(false); // enfriamiento
    expect(b.add('ask', t)).toBe(false); // las preguntas nunca disparan efectos
  });

  it('si la sala sigue reaccionando con fuerza, llega la fiesta (una por minuto)', () => {
    const b = createBursts(() => 50); // umbral 4
    const t = 2_000_000;
    for (let i = 0; i < 4; i++) b.add('fire', t + i * 100); // efecto normal
    for (let i = 0; i < 7; i++) expect(b.add('fire', t + 1000 + i * 100)).toBe(false); // enfriando, aún no el doble
    expect(b.add('fire', t + 1800)).toBe(true); // 8 en 6 s mientras descansa → fiesta
    expect(document.querySelector('.burst-fiesta')).not.toBeNull();
    expect(document.querySelectorAll('.burst-fiesta .bailarin').length).toBe(5);
    for (let i = 0; i < 8; i++) expect(b.add('fire', t + 3000 + i * 100)).toBe(false); // ya hubo fiesta este minuto
  });

  it('los tres efectos seguidos terminan en fiesta, con los avatares de la sala', () => {
    document.body.innerHTML = '';
    const sala = [{ piel: 1, pelo: 1, colorPelo: 1, ropa: 1, gorro: 1, lentes: 1, expresion: 1, accesorio: 1, rasgos: 1, abajo: 1 }];
    const b = createBursts(() => 50, () => sala);
    const t = 3_000_000;
    for (let i = 0; i < 4; i++) b.add('fire', t + i * 100);
    for (let i = 0; i < 4; i++) b.add('mind', t + 5000 + i * 100);
    expect(document.querySelector('.burst-fiesta')).toBeNull();
    let fiesta = false;
    for (let i = 0; i < 4; i++) fiesta = b.add('heart', t + 10_000 + i * 100) || fiesta;
    expect(fiesta).toBe(true);
    expect(document.querySelector('.burst-fiesta')).not.toBeNull();
  });
});
