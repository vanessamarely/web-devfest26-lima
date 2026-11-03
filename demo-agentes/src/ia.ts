// "¿Qué pido?": la IA de la propia página. Bug 4 de la charla:
//  ❌ El modelo corre en el hilo principal (como WASM sin Worker), sin streaming y sin abort:
//     la página se congela a ratos y, si cambias la pregunta, puede llegar la respuesta VIEJA.
//  ✅ promptStreaming + AbortController + una pista propia en Performance ("Mesa · IA local").
// Con ?engine=nano y Gemini Nano disponible (Prompt API) usa el modelo real; si no, un modelo
// simulado con los mismos tiempos (determinista, para que la demo siempre se vea igual).
import { bugs } from './bugs';

interface Sesion {
  promptStreaming(texto: string, o?: { signal?: AbortSignal }): AsyncIterable<string>;
}
declare const LanguageModel: { create(o?: object): Promise<Sesion>; availability?(): Promise<string> } | undefined;

const RESPUESTAS: [RegExp, string][] = [
  [/mariscos|alerg/i, 'Sin mariscos: pidan el pollo nikkei a la robata, makis de palta y camote, y gyozas de cerdo para compartir. De postre, suspiro limeño.'],
  [/vegetari|vegano/i, 'Para vegetarianos: tiradito de palta, maki de verduras tempura y arroz chaufa nikkei sin carne.'],
  [/4|cuatro|grupo|compartir/i, 'Para 4 personas: un tiradito acevichado, dos rolls de la casa, pulpo a la parrilla y un arroz nikkei al centro. Unos S/ 70 por persona.'],
];
const responder = (p: string) => RESPUESTAS.find(([re]) => re.test(p))?.[1] ?? 'Empieza por el tiradito acevichado y el maki de la casa; si tienes hambre, el arroz nikkei.';

/** Modelo simulado: "piensa" (latencia) y luego entrega palabras. */
function simulado(pesado: boolean): Sesion {
  return {
    async *promptStreaming(texto, o) {
      const palabras = responder(texto).split(/(?<= )/);
      const espera = /mariscos/.test(texto) ? 500 : 1300; // la primera pregunta es más "difícil"
      await dormir(espera, o?.signal);
      for (const w of palabras) {
        if (o?.signal?.aborted) return;
        if (pesado) bloquear(70); // ❌ inferencia en el hilo principal: cada token congela ~70 ms
        else await dormir(28, o?.signal);
        yield w;
      }
    },
  };
}
const dormir = (ms: number, signal?: AbortSignal) => new Promise<void>((r) => { const t = setTimeout(r, ms); signal?.addEventListener('abort', () => (clearTimeout(t), r())); });
function bloquear(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    /* trabajo del modelo en el hilo principal */
  }
}

async function sesion(): Promise<Sesion> {
  if (!bugs.ia && new URLSearchParams(location.search).get('engine') === 'nano' && typeof LanguageModel !== 'undefined') {
    try {
      return await LanguageModel.create({ initialPrompts: [{ role: 'system', content: 'Eres el asistente de un restaurante nikkei en Barranco, Lima. Responde en español, en 2 frases.' }] });
    } catch {
      /* sin Nano: simulado */
    }
  }
  return simulado(bugs.ia);
}

let actual: AbortController | null = null;
let n = 0;

/** Recomienda. `salida` recibe el texto (con streaming o de golpe según el bug). */
export async function recomendar(pregunta: string, salida: HTMLElement, titulo: HTMLElement) {
  const yo = ++n;
  titulo.textContent = `“${pregunta}”`;
  if (bugs.ia) {
    // ❌ sin abort, sin streaming: se escribe TODO al final… aunque ya sea otra pregunta
    salida.textContent = 'Pensando…';
    let texto = '';
    for await (const w of (await sesion()).promptStreaming(pregunta)) texto += w;
    salida.textContent = texto;
    salida.dataset.para = pregunta;
    marcar(pregunta, yo);
    return;
  }
  // ✅ la pregunta vieja ya no importa
  actual?.abort();
  actual = new AbortController();
  const t0 = performance.now();
  salida.textContent = '';
  try {
    for await (const w of (await sesion()).promptStreaming(pregunta, { signal: actual.signal })) {
      if (actual.signal.aborted) return;
      salida.append(w); // pinta mientras piensa
    }
  } catch {
    return; // abortada
  }
  salida.dataset.para = pregunta;
  performance.measure('Recomendación', { start: t0, detail: { devtools: { dataType: 'track-entry', track: 'Mesa · IA local', color: 'secondary', tooltipText: pregunta } } });
  marcar(pregunta, yo);
}

function marcar(pregunta: string, yo: number) {
  document.dispatchEvent(new CustomEvent('mesa:respuesta', { detail: { pregunta, vieja: yo !== n } }));
}
