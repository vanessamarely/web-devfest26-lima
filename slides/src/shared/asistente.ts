// Asistente de la charla: responde dudas SOLO sobre la charla que estás viendo.
//
//  1. Busca en el contenido de la charla (títulos, ideas clave, código, checklist) los fragmentos
//     más relevantes para la pregunta (búsqueda por palabras, sin red).
//  2. Con Gemini Nano (Prompt API, Chrome 148+ en computadoras de escritorio) le pasa esos
//     fragmentos como contexto y le pide responder en español, breve y sin inventar.
//  3. Sin Gemini Nano (celulares, otros navegadores) responde con los fragmentos de la charla.
//
// Todo corre en el dispositivo: la pregunta solo sale del celular si la persona decide
// enviársela a la presentadora.
import { CHECKLIST, CHECKLIST_TITLE, SLIDES } from './content';
import { META, SPEAKER, TALK } from './config';

export interface Fuente {
  id: string;
  /** número de slide (1…) */
  n: number;
  titulo: string;
  texto: string;
}

const STOP = new Set(
  'a al algo algun alguna como con cual cuales cuando de del el ella ellas ellos en entre es esa ese eso esta este esto estos hay la las le les lo los mas me mi mis muy no nos o para pero por porque puede pueden que se si sin sobre son su sus te tiene tu tus un una uno unos y ya yo hace hacer hago cómo qué cuál cuándo dónde por qué debo debería sirve usar uso mejor charla vanessa ejemplo pagina página web sitio mientras responde respuesta pasa funciona cosa quiero necesito puedo'
    .split(' ')
    .map((w) => norm(w)),
);

/** Sinónimos y siglas: que "saltos" encuentre CLS y "botón" encuentre button. */
/** Sinónimos y siglas (por prefijo): que "salta" encuentre CLS y "botón" encuentre button. */
const SINONIMOS: Record<string, string[]> = {
  salt: ['cls', 'layout', 'reserva', 'espacio', 'plano'],
  cls: ['salt', 'layout', 'espacio', 'reserva'],
  mueve: ['cls', 'salt', 'espacio'],
  congel: ['inp', 'hilo', 'worker', 'frame', 'bloque'],
  lent: ['inp', 'performance', 'frame', 'render'],
  inp: ['clic', 'interaccion', 'worker'],
  lcp: ['carga', 'principal'],
  json: ['ndjson', 'linea', 'parse', 'stream'],
  ndjson: ['linea', 'json', 'stream'],
  stream: ['ndjson', 'trozo', 'linea'],
  dom: ['nodo', 'innerhtml', 'recicl'],
  list: ['pool', 'virtual', 'content-visibility'],
  estado: ['store', 'libreta'],
  store: ['estado', 'libreta'],
  boton: ['button', 'rol', 'nombre'],
  button: ['boton', 'rol'],
  agente: ['agent', 'snapshot', 'devtools'],
  accesib: ['arbol', 'rol', 'nombre', 'aria'],
  arbol: ['accesibilidad', 'snapshot'],
  instal: ['mcp', 'npx', 'config', 'chrome-devtools-mcp'],
  mcp: ['devtools', 'agente', 'npx'],
  webmcp: ['tool', 'registertool', 'panel'],
  error: ['tool', 'hora', 'mensaje'],
  nano: ['prompt', 'languagemodel', 'modelo'],
  carrera: ['disabled', 'busy', 'espera'],
};

export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Palabras de búsqueda: sin tildes, sin palabras vacías, con un "stem" simple (plurales). */
export function palabras(s: string): string[] {
  return norm(s)
    .split(/[^a-z0-9²-]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 ? w.replace(/(es|s)$/, '') : w));
}

let CORPUS: Fuente[] | null = null;
/** El contenido de ESTA charla, un fragmento por slide (más el checklist). */
export function corpus(): Fuente[] {
  if (CORPUS) return CORPUS;
  const out: Fuente[] = SLIDES.map((s, i) => ({ s, n: i + 1 }))
    .filter(({ s }) => s.summary.length && s.kind !== 'join' && s.kind !== 'poll' && s.kind !== 'podium' && s.kind !== 'wall')
    .map(({ s, n }) => ({
      id: s.id,
      n,
      titulo: s.title,
      texto: [s.section ? `${s.section}.` : '', s.summary.join(' '), s.code ? `Código (${s.code.file}): ${s.code.text.split('\n').filter((l) => l.trim()).slice(0, 12).join(' | ')}` : ''].join(' ').trim(),
    }));
  out.push({ id: 'checklist', n: SLIDES.findIndex((s) => s.id === 'checklist') + 1, titulo: CHECKLIST_TITLE, texto: CHECKLIST.map(([h, p], i) => `${i + 1}. ${h}: ${p}`).join(' ') });
  return (CORPUS = out);
}

export interface Resultado {
  fuente: Fuente;
  puntaje: number;
}

/** Fragmentos más relevantes (BM25 simplificado + sinónimos + título con más peso). */
export function buscar(pregunta: string, k = 4): Resultado[] {
  const docs = corpus();
  const q = palabras(pregunta);
  const exp = new Map<string, number>();
  for (const w of q) {
    exp.set(w, Math.max(exp.get(w) ?? 0, 1));
    for (const [clave, sin] of Object.entries(SINONIMOS)) if (w.startsWith(clave)) for (const x of sin) exp.set(x, Math.max(exp.get(x) ?? 0, 0.5));
  }
  if (!exp.size) return [];
  const tok = docs.map((d) => ({ d, cuerpo: palabras(d.texto), titulo: palabras(d.titulo) }));
  // palabras cortas: coincidencia exacta; largas: también por prefijo ("recicl" → reciclar, reciclaje)
  const coincide = (x: string, w: string) => (w.length >= 5 ? x.startsWith(w) : x === w);
  const avg = tok.reduce((s, t) => s + t.cuerpo.length, 0) / tok.length;
  const df = (w: string) => tok.filter((t) => t.cuerpo.some((x) => coincide(x, w)) || t.titulo.some((x) => coincide(x, w))).length;
  const N = tok.length;
  const res = tok.map(({ d, cuerpo, titulo }) => {
    let p = 0;
    for (const [w, peso] of exp) {
      const n = df(w);
      if (!n) continue;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const tf = cuerpo.filter((x) => coincide(x, w)).length;
      const tt = titulo.filter((x) => coincide(x, w)).length;
      p += peso * idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (cuerpo.length / avg))) + tt * 1.5);
    }
    return { fuente: d, puntaje: p };
  });
  // Cobertura: qué parte de la pregunta (sin sinónimos) aparece en la charla. Si es poca, no es de la charla.
  const cobertura = q.length ? q.filter((w) => df(w) > 0).length / q.length : 0;
  const out = res.filter((r) => r.puntaje > 0.4).sort((a, b) => b.puntaje - a.puntaje).slice(0, k);
  return Object.assign(out, { cobertura });
}

/** ¿La pregunta tiene que ver con la charla? (si no encontramos nada relevante, no inventamos) */
export const esDeLaCharla = (r: Resultado[]) => r.length > 0 && r[0].puntaje > 1.2 && ((r as Resultado[] & { cobertura?: number }).cobertura ?? 1) >= 0.5;

export const SISTEMA = () =>
  `Eres el asistente de la charla «${META.title}» de ${SPEAKER} en DevFest Lima 2026. ` +
  'Respondes dudas de las personas del público SOLO con la información de la charla que te doy como contexto. ' +
  'Responde en español, claro y breve (máximo 4 frases o 4 viñetas), con ejemplos de la charla cuando ayuden. ' +
  'Si el contexto no alcanza para responder, dilo con honestidad y sugiere enviar la pregunta a Vanessa. ' +
  'No inventes APIs, cifras ni enlaces. No respondas temas ajenos a la charla.';

/** El prompt de cada pregunta: los fragmentos de la charla + la pregunta. */
export function promptConContexto(pregunta: string, r: Resultado[]): string {
  const ctx = r.map((x) => `[Slide ${x.fuente.n} · ${x.fuente.titulo}] ${x.fuente.texto}`).join('\n');
  return `Contexto de la charla:\n${ctx || '(no hay fragmentos relevantes)'}\n\nPregunta del público: ${pregunta.trim()}`;
}

/** Respuesta sin modelo: lo que dice la charla sobre eso, citando los slides. */
export function respuestaSinModelo(pregunta: string): { texto: string; fuentes: Fuente[] } {
  const r = buscar(pregunta, 3);
  if (!esDeLaCharla(r)) return { texto: 'No encontré eso en esta charla. Puedes enviarle la pregunta a Vanessa y la responde al final.', fuentes: [] };
  const s = SLIDES.find((x) => x.id === r[0].fuente.id);
  const puntos = (s?.summary ?? [r[0].fuente.texto]).slice(0, 3);
  const extra = r.slice(1, 2).map((x) => `También se habla de esto en «${x.fuente.titulo}».`);
  return { texto: [`Esto dice la charla en «${r[0].fuente.titulo}»:`, ...puntos.map((p) => `• ${p}`), ...extra].join('\n'), fuentes: r.map((x) => x.fuente) };
}

// ── Gemini Nano (Prompt API) ───────────────────────────────────────────────
interface Sesion {
  promptStreaming(input: string, o?: { signal?: AbortSignal }): AsyncIterable<string> | ReadableStream<string>;
  clone?(o?: { signal?: AbortSignal }): Promise<Sesion>;
  destroy?(): void;
}
interface LM {
  availability(o?: object): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
  create(o?: object): Promise<Sesion>;
}
const lm = () => (globalThis as unknown as { LanguageModel?: LM }).LanguageModel;

/** Mismas opciones para availability() y create() (lo pide la documentación). */
export const OPCIONES_NANO = { expectedInputs: [{ type: 'text', languages: ['es'] }], expectedOutputs: [{ type: 'text', languages: ['es'] }] };

export type EstadoNano = 'listo' | 'descargable' | 'descargando' | 'no-disponible' | 'sin-api';

export async function estadoNano(): Promise<EstadoNano> {
  const L = lm();
  if (!L) return 'sin-api';
  try {
    const a = await L.availability(OPCIONES_NANO);
    return a === 'available' ? 'listo' : a === 'downloadable' ? 'descargable' : a === 'downloading' ? 'descargando' : 'no-disponible';
  } catch {
    return 'no-disponible';
  }
}

let base: Promise<Sesion> | null = null;

/** Crea (una vez) la sesión con el rol del asistente. Si hay que descargar el modelo, informa el progreso. */
export function prepararNano(onProgreso?: (p: number) => void): Promise<Sesion> {
  const L = lm();
  if (!L) return Promise.reject(new Error('Sin Prompt API'));
  base ??= L.create({
    ...OPCIONES_NANO,
    initialPrompts: [{ role: 'system', content: SISTEMA() }],
    monitor(m: EventTarget) {
      m.addEventListener('downloadprogress', (e) => onProgreso?.((e as unknown as { loaded: number }).loaded));
    },
  }).catch((err) => {
    base = null;
    throw err;
  });
  return base;
}

async function* iterar(s: AsyncIterable<string> | ReadableStream<string>): AsyncGenerator<string> {
  if (Symbol.asyncIterator in s) {
    yield* s as AsyncIterable<string>;
    return;
  }
  const reader = (s as ReadableStream<string>).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    yield value;
  }
}

/**
 * Pregunta a Gemini Nano con el contexto de la charla. Cada pregunta usa un clon de la sesión
 * base (solo el rol del asistente): las respuestas no se mezclan y el contexto no se llena.
 */
export async function* preguntarNano(pregunta: string, signal?: AbortSignal): AsyncGenerator<{ trozo?: string; fuentes?: Fuente[] }> {
  const r = buscar(pregunta, 4);
  yield { fuentes: r.map((x) => x.fuente) };
  const b = await prepararNano();
  const s = b.clone ? await b.clone({ signal }) : b;
  try {
    for await (const trozo of iterar(s.promptStreaming(promptConContexto(pregunta, r), { signal }))) yield { trozo };
  } finally {
    if (s !== b) s.destroy?.();
  }
}

/** Preguntas sugeridas para empezar (una por capítulo). */
export const SUGERENCIAS: Record<string, string[]> = {
  genui: ['¿Por qué mi página salta mientras la IA responde?', '¿Por qué NDJSON y no un JSON completo?', '¿Cuándo conviene usar un Worker?'],
  agentes: ['¿Qué ve un agente de mi página?', '¿Cómo instalo Chrome DevTools for agents?', '¿Cómo evito que la IA local congele la página?'],
};
export const sugerencias = () => SUGERENCIAS[TALK] ?? [];
