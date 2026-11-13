// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const llamadas: { prompt: string; system: string }[] = [];
let falla: Error | null = null;
vi.mock('./firebase', () => ({ getFirebaseApp: async () => ({}) }));
vi.mock('firebase/ai', () => ({
  GoogleAIBackend: class {},
  getAI: () => ({}),
  getGenerativeModel: (_ai: unknown, o: { systemInstruction: string }) => ({
    async generateContentStream(prompt: string) {
      if (falla) throw falla;
      llamadas.push({ prompt, system: o.systemInstruction });
      return { stream: (async function* () { yield { text: () => 'Reserva ' }; yield { text: () => 'el espacio.' }; })() };
    },
  }),
}));
vi.mock('./config', async (orig) => ({ ...(await orig<typeof import('./config')>()), hasFirebase: true }));

async function cargar() {
  vi.resetModules();
  history.replaceState(null, '', '/genui/');
  return import('./asistente-nube');
}
const texto = async (gen: AsyncGenerator<{ trozo?: string }>) => {
  let t = '';
  for await (const x of gen) t += x.trozo ?? '';
  return t;
};

beforeEach(() => {
  localStorage.clear();
  llamadas.length = 0;
  falla = null;
});

describe('Gemini en la nube (celulares)', () => {
  it('responde en trozos con los slides de la charla como contexto', async () => {
    const n = await cargar();
    expect(await texto(n.preguntarNube('¿Por qué mi página salta mientras la IA responde?'))).toBe('Reserva el espacio.');
    expect(llamadas[0].prompt).toMatch(/\[Slide \d+ · /);
    expect(llamadas[0].system).toContain('SOLO con la información de la charla');
  });
  it('máximo 5 preguntas con IA por persona y charla', async () => {
    const n = await cargar();
    for (let i = 0; i < 5; i++) await texto(n.preguntarNube('¿Qué es NDJSON?'));
    expect(n.quedanNube()).toBe(0);
    expect(n.nubeDisponible()).toBe(false);
  });
  it('si la API no está activada, se apaga y no insiste', async () => {
    const n = await cargar();
    falla = new Error("requires the Firebase AI API ('firebasevertexai.googleapis.com') to be enabled");
    await expect(texto(n.preguntarNube('¿Qué es NDJSON?'))).rejects.toThrow();
    expect(n.nubeDisponible()).toBe(false);
  });
});
