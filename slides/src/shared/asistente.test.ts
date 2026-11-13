// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

async function cargar(path: string) {
  vi.resetModules();
  history.replaceState(null, '', path);
  return import('./asistente');
}
afterEach(() => vi.unstubAllGlobals());

const CASOS_GENUI: [string, RegExp][] = [
  ['¿Por qué mi página salta mientras la IA responde?', /espacio|salta|plano/i],
  ['¿Por qué NDJSON y no un JSON completo?', /llega|stream|línea|releer/i],
  ['¿Cuándo conviene usar un Worker?', /libreta|store|worker|estado/i],
  ['¿Qué es el CLS?', /espacio|salta|sensaciones|plano/i],
  ['¿Cómo hago para que una lista de 300 resultados no sea lenta?', /lista|dom/i],
];
const CASOS_AGENTES: [string, RegExp][] = [
  ['¿Qué ve un agente de mi página?', /ve|árbol|formas/i],
  ['¿Cómo instalo Chrome DevTools for agents?', /devtools|chrome real/i],
  ['¿Cómo evito que la IA local congele la página?', /ia|streaming|bugs/i],
  ['¿Por qué el agente no encuentra mi botón?', /botón|rol|árbol|ve/i],
  ['¿Qué pasa si la tool devuelve Error?', /error|tool|webmcp/i],
];

describe('asistente · Día UI generativa', () => {
  it.each(CASOS_GENUI)('encuentra el slide correcto: %s', async (q, re) => {
    const a = await cargar('/genui/');
    const r = a.buscar(q);
    expect(a.esDeLaCharla(r)).toBe(true);
    expect(r.slice(0, 2).map((x) => x.fuente.titulo).join(' | ')).toMatch(re);
  });
  it('no inventa: lo que no es de la charla no tiene fuentes', async () => {
    const a = await cargar('/genui/');
    expect(a.esDeLaCharla(a.buscar('¿Cuál es la mejor cevichería de Miraflores?'))).toBe(false);
    expect(a.respuestaSinModelo('¿Quién ganó el clásico?').fuentes).toHaveLength(0);
  });
  it('arma el prompt con los fragmentos y la pregunta', async () => {
    const a = await cargar('/genui/');
    const q = '¿Qué es NDJSON?';
    const p = a.promptConContexto(q, a.buscar(q));
    expect(p).toMatch(/\[Slide \d+ · /);
    expect(p).toContain('Pregunta del público: ¿Qué es NDJSON?');
    expect(a.SISTEMA()).toContain('Web performance en la era de la UI generativa');
  });
});

describe('asistente · Día DevTools para agentes', () => {
  it.each(CASOS_AGENTES)('encuentra el slide correcto: %s', async (q, re) => {
    const a = await cargar('/agentes/');
    const r = a.buscar(q);
    expect(a.esDeLaCharla(r)).toBe(true);
    expect(r.slice(0, 2).map((x) => x.fuente.titulo).join(' | ')).toMatch(re);
  });
  it('usa el contenido de SU charla', async () => {
    const a = await cargar('/agentes/');
    expect(a.SISTEMA()).toContain('Chrome DevTools para agentes');
    expect(a.corpus().some((f) => /NDJSON/.test(f.texto))).toBe(false);
  });
});

describe('preguntas generales', () => {
  it.each([
    ['/genui/', 'explícame el tema'],
    ['/genui/', '¿De qué trata la charla?'],
    ['/genui/', 'no entendí, resúmelo'],
    ['/agentes/', 'explícame el tema'],
    ['/agentes/', '¿Cuál es la idea principal?'],
  ])('%s · %s → resumen de la charla', async (path, q) => {
    const a = await cargar(path);
    const r = a.buscar(q);
    expect(a.esDeLaCharla(r)).toBe(true);
    expect(r.map((x) => x.fuente.id)).toContain('checklist');
    expect(a.respuestaSinModelo(q).texto).toMatch(/en pocas palabras/);
  });
  it('una pregunta concreta sigue yendo a su slide', async () => {
    const a = await cargar('/genui/');
    expect(a.buscar('explícame el NDJSON')[0].fuente.id).not.toBe('que-es-genui');
  });
});

describe('Gemini Nano', () => {
  it('sin Prompt API: estado sin-api', async () => {
    const a = await cargar('/genui/');
    expect(await a.estadoNano()).toBe('sin-api');
  });
  it('con Prompt API: mismas opciones en availability y create, rol del sistema y streaming', async () => {
    const llamadas: { availability?: object; create?: { initialPrompts: { role: string; content: string }[] }; prompt?: string } = {};
    vi.stubGlobal('LanguageModel', {
      availability: async (o: object) => ((llamadas.availability = o), 'available'),
      create: async (o: never) => {
        llamadas.create = o;
        const sesion = {
          clone: async () => sesion,
          promptStreaming(p: string) {
            llamadas.prompt = p;
            return new ReadableStream({ start(c) { ['Reserva ', 'el espacio.'].forEach((x) => c.enqueue(x)); c.close(); } });
          },
        };
        return sesion;
      },
    });
    const a = await cargar('/genui/');
    expect(await a.estadoNano()).toBe('listo');
    let texto = '';
    let fuentes = 0;
    for await (const x of a.preguntarNano('¿Por qué salta mi página?')) {
      if (x.trozo) texto += x.trozo;
      if (x.fuentes) fuentes = x.fuentes.length;
    }
    expect(texto).toBe('Reserva el espacio.');
    expect(fuentes).toBeGreaterThan(0);
    expect(llamadas.availability).toEqual(a.OPCIONES_NANO);
    expect(llamadas.create!.initialPrompts[0].role).toBe('system');
    expect(llamadas.prompt).toMatch(/Contexto de la charla:[\s\S]*Pregunta del público: ¿Por qué salta mi página\?/);
  });
});
