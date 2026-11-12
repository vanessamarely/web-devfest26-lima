// Preguntas del público: solo sobre los temas de las dos charlas (performance, UI generativa,
// streaming, DOM, estado, DevTools, agentes, accesibilidad, WebMCP, IA en el navegador, las demos). Filtro en el celular, antes de enviar: no llega texto fuera de tema.
const ON_TOPIC =
  /(mcp|webmcp|agent|agént|agentic|\btools?\b|herramienta|model ?context|registertool|modelcontext|toolname|declarativ|imperativ|schema|json|formulario|\bform|\bapis?\b|navegador|browser|chrome|origin trial|\bflag|gemini|\bnano\b|prompt|\bllm|modelo|\bia\b|\bai\b|inteligencia artificial|\bweb\b|sitio|página|pagina|frontend|angular|react|\bvue\b|javascript|typescript|\bdemo\b|avatar|nido|depa|mesa|restaurant|reserv|perform|rendimiento|lento|rápid|rapid|render|pintar|cls|inp|lcp|core web vitals|vitals|layout|salto|stream|ndjson|parse|dom|nodo|recicl|virtual|lista|scroll|estado|store|state|worker|hilo|thread|frame|requestanimationframe|generativ|genui|componente|catálog|catalog|skeleton|esqueleto|lighthouse|accesib|aria|snapshot|puppeteer|playwright|recorder|traza|trace|consola|console|network|red |emula|abort|abortcontroller|on-device|prompt api|languagemodel|\bclics?\b|click|\bdom\b|scraping|segur|injection|inyecci|confirmaci|consequential|untrusted|readonly|permis|iframe|origen|servidor|server|cliente|client|backend|stdio|\bhttp|extensi|accesib|\bvoz\b|\bevals?\b|testing|debug|devtools|token|abortsignal|\bsignal\b)/i;
const OFF_TOPIC = /(put[ao]|mierd|pend[ae]j|verga|coñ|carajo|fuck|shit|sex|nazi|cojud|huev[oó]n)/i;

/** ¿La pregunta es sobre la charla? (mínimo 8 caracteres, sin groserías, con algún término del tema) */
export const isOnTopic = (text: string) => text.trim().length >= 8 && !OFF_TOPIC.test(text) && ON_TOPIC.test(text);

/** ¿Tiene groserías? (nada ofensivo le llega a la presentadora) */
export const esOfensiva = (text: string) => OFF_TOPIC.test(text);
