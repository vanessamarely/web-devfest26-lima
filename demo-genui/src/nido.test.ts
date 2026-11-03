// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { decidir, entender, serializar, trocear } from './ia';
import { LectorCompleto, LectorPorLineas, reparar } from './genui/stream';
import { DEPAS, generarDepas } from './data';
import { aplicarPiezas, estadoVacio, Libreta, ordenarEnHiloPrincipal } from './genui/estado';

const PEDIDO = 'Depa de 2 dormitorios en Barranco con vista al mar, menos de S/ 3.000';

describe('modelo simulado', () => {
  it('es determinista', () => {
    expect(generarDepas()).toEqual(DEPAS);
    expect(serializar(decidir(PEDIDO), 'ndjson')).toBe(serializar(decidir(PEDIDO), 'ndjson'));
  });
  it('entiende el pedido', () => {
    expect(entender(PEDIDO)).toMatchObject({ distritos: ['Barranco'], dorms: 2, max: 3000, vista: true });
  });
  it('decide plano primero, 6 destacados y el mapa DESPUÉS de las tarjetas', () => {
    const p = decidir(PEDIDO);
    expect(p[0].tipo).toBe('plano');
    expect(p.filter((x) => x.tipo === 'depa')).toHaveLength(6);
    expect(p.findIndex((x) => x.tipo === 'mapa')).toBeGreaterThan(p.findIndex((x) => x.tipo === 'depa'));
  });
});

describe('lectores del stream', () => {
  const piezas = decidir(PEDIDO);
  it('NDJSON y JSON completo producen las mismas piezas', () => {
    const a = new LectorPorLineas();
    const got: unknown[] = [];
    for (const t of trocear(serializar(piezas, 'ndjson'))) got.push(...a.alLlegar(t));
    const b = new LectorCompleto();
    let last: unknown[] = [];
    for (const t of trocear(serializar(piezas, 'json'))) last = b.alLlegar(t);
    expect(got).toEqual(piezas);
    expect(last).toEqual(piezas);
  });
  it('el lector por líneas lee cada carácter una vez; el completo, cientos de veces más', () => {
    const a = new LectorPorLineas();
    const texto = serializar(piezas, 'ndjson');
    for (const t of trocear(texto)) a.alLlegar(t);
    expect(a.leidos).toBe(texto.length);
    const b = new LectorCompleto();
    for (const t of trocear(serializar(piezas, 'json'))) b.alLlegar(t);
    expect(b.leidos).toBeGreaterThan(texto.length * 100);
  });
  it('reparar corta en la última pieza completa', () => {
    expect(reparar('{"piezas":[{"a":1},{"b":"x}')).toBe('{"piezas":[{"a":1}]}');
    expect(reparar('{"piezas":[')).toBe('{"piezas":[]}');
    expect(JSON.parse(reparar('{"piezas":[{"t":"un \\"}\\" raro"},{"x'))).toEqual({ piezas: [{ t: 'un "}" raro' }] });
  });
});

describe('libreta', () => {
  it('la IA dicta el filtro; el código calcula la lista y aplica correcciones de precio', () => {
    const e = estadoVacio();
    const l = new Libreta();
    const avisos: string[] = [];
    aplicarPiezas(e, l, decidir(PEDIDO));
    expect(e.lista!.ids.length).toBe(300);
    const id = e.destacados[0];
    l.escuchar(id, () => avisos.push(id));
    aplicarPiezas(e, l, [{ tipo: 'cambio', id, precio: 1234 }]);
    expect(l.get(id)!.precio).toBe(1234);
    expect(avisos).toEqual([id]);
  });
  it('ordenar en el hilo principal da el mismo orden que esperamos del Worker', () => {
    const ids = DEPAS.slice(0, 20).map((d) => d.id);
    const ord = ordenarEnHiloPrincipal(ids, new Libreta());
    expect(new Set(ord)).toEqual(new Set(ids));
  });
});
