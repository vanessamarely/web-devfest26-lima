// Gemini en la nube para los celulares (Firebase AI Logic, capa gratuita de la Gemini Developer API).
//
// Chrome para Android e iOS no trae Gemini Nano. En esos dispositivos el asistente usa Gemini en la
// nube con el MISMO contexto (los slides relevantes) y las mismas reglas: solo temas de la charla.
// No hay clave en el código: Firebase AI Logic la guarda en el proyecto.
//
// Para no gastar la cuota gratuita: hasta LIMITE_NUBE preguntas por persona y charla. Si la API
// no responde (no activada, cuota llena, sin red), se apaga en esta visita y se responde con los slides.
import type { GenerativeModel } from 'firebase/ai';
import { NS, TALK, hasFirebase } from './config';
import { SISTEMA, buscar, promptConContexto, type Fuente } from './asistente';

export const MODELO_NUBE = 'gemini-2.5-flash-lite';
export const LIMITE_NUBE = 5;

const clave = () => `${NS}.nube.${TALK}`;
export function usadasNube(): number {
  try {
    return Number(localStorage.getItem(clave())) || 0;
  } catch {
    return 0;
  }
}
const sumarUso = () => {
  try {
    localStorage.setItem(clave(), String(usadasNube() + 1));
  } catch {
    /* noop */
  }
};
export const quedanNube = () => Math.max(0, LIMITE_NUBE - usadasNube());

let apagada = false;
/** ¿Se puede preguntar a Gemini en la nube ahora? */
export const nubeDisponible = () => hasFirebase && !apagada && quedanNube() > 0;

let modelo: Promise<GenerativeModel> | null = null;
async function crearModelo(): Promise<GenerativeModel> {
  const [{ getAI, getGenerativeModel, GoogleAIBackend }, { getFirebaseApp }] = await Promise.all([import('firebase/ai'), import('./firebase')]);
  const ai = getAI(await getFirebaseApp(), { backend: new GoogleAIBackend() });
  return getGenerativeModel(ai, { model: MODELO_NUBE, systemInstruction: SISTEMA(), generationConfig: { maxOutputTokens: 400, temperature: 0.3 } });
}

/** Pregunta a Gemini en la nube con los slides relevantes como contexto (en trozos, se puede cancelar). */
export async function* preguntarNube(pregunta: string, signal?: AbortSignal): AsyncGenerator<{ trozo?: string; fuentes?: Fuente[] }> {
  const r = buscar(pregunta, 4);
  yield { fuentes: r.map((x) => x.fuente) };
  try {
    const m = await (modelo ??= crearModelo().catch((e) => {
      modelo = null;
      throw e;
    }));
    const res = await m.generateContentStream(promptConContexto(pregunta, r), { signal });
    sumarUso(); // solo cuenta si Gemini respondió
    for await (const c of res.stream) {
      if (signal?.aborted) return;
      const t = c.text();
      if (t) yield { trozo: t };
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    // API sin activar, cuota llena o sin permiso: no insistimos en esta visita.
    if (/firebasevertexai|api-not-enabled|permission|403|429|quota|resource_exhausted|app-check|fetch-error/i.test(String((err as Error)?.message ?? err))) apagada = true;
    throw err;
  }
}
