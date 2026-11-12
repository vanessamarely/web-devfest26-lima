// Día 2 · Chrome DevTools para agentes
//
// UNA idea guía: "Tu web ahora tiene dos tipos de visitantes. DevTools siempre te mostró lo que ve
// una persona; ahora necesitas ver lo que ve, hace y piensa un agente." Cuatro preguntas = cuatro
// capítulos (las cuatro frases del abstract):
//   01 ¿Qué ve el agente?         → árbol de accesibilidad, take_snapshot        (inspeccionar)
//   02 ¿Qué hizo el agente?       → panel WebMCP, errores útiles, consola        (interacciones)
//   03 ¿Y si va más rápido?       → tu agente de código como usuario automatizado (simular)
//   04 ¿Qué piensa la IA local?   → streaming, AbortController, pista propia      (rutinas de IA)
// Cierre: "fácil de razonar" (Lighthouse Agentic Browsing + checklist).
// Misma estructura en cada capítulo: síntoma → por qué → arreglo → prueba en la demo Mesa.
import type { SlideContent, TalkContent } from '../content';

const S0 = 'La idea';
const S1 = '01 · ¿Qué ve el agente?';
const S2 = '02 · ¿Qué hizo el agente?';
const S3 = '03 · Simula al usuario automatizado';
const S4 = '04 · Depura la IA del cliente';
const S5 = 'Para llevar';

export const CODE_MCP = `// .mcp.json (Claude Code, Gemini CLI, Antigravity, Cursor…)
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest", "--categoryExperimentalWebmcp"]
    }
  }
}

# …o la CLI, desde tu terminal
npm i -g chrome-devtools-mcp@latest
chrome-devtools navigate_page 1 --url "https://devfest-lima-mesa.web.app"
chrome-devtools take_snapshot 1
chrome-devtools lighthouse_audit 1 --mode snapshot`;

export const CODE_BOTON = `<!-- ❌ Para el agente esto es "generic": sin rol, sin nombre -->
<div class="btn-reservar" onclick="reservar()">
  <svg>…</svg>
</div>

<!-- ✅ Rol (button), nombre ("Reservar mesa") y estado (disabled) -->
<button type="submit" disabled aria-describedby="resumen">
  <svg aria-hidden="true">…</svg> Reservar mesa
</button>

# Lo que ve tu agente con take_snapshot:
#   uid=4_17 generic                         ← ❌ ¿esto se puede tocar?
#   uid=4_17 button "Reservar mesa" disabled ← ✅ qué es, cómo se llama, si se puede`;

export const CODE_TOOL = `await document.modelContext.registerTool({
  name: 'reservar_mesa',
  description: 'Reserva una mesa. Pide confirmación a la persona.',
  inputSchema: { type: 'object', required: ['restaurante', 'fecha', 'hora', 'personas'],
    properties: {
      hora: { type: 'string', pattern: '^\\\\d{2}:\\\\d{2}$', description: '24 h, ej. 20:00' },
      /* restaurante, fecha, personas… */ } },
  annotations: { consequentialHint: true },       // irreversible: confirma la persona
  async execute({ restaurante, fecha, hora, personas }) {
    const libres = await horarios(restaurante, fecha, personas);
    // ❌ return 'Error';           ← el agente reintenta lo mismo
    if (!libres.includes(hora))
      return \`Error: \${hora} no está libre. Horas libres: \${libres.join(', ')}\`;
    return reservar({ restaurante, fecha, hora, personas });
  },
});`;

export const CODE_LISTO = `// El agente es más rápido que una persona:
// hace clic apenas el botón existe, aunque los horarios no hayan llegado.
const form = document.querySelector('#reserva')!;
const boton = form.querySelector('button')!;

boton.disabled = true;                       // estado real, no solo un color gris
form.setAttribute('aria-busy', 'true');      // "todavía cargando"

const horarios = await cargarHorarios(restaurante);
pintarHorarios(horarios);

form.removeAttribute('aria-busy');
boton.disabled = false;                      // recién ahora se puede usar`;

export const CODE_IA = `let actual: AbortController | null = null;

async function recomendar(pregunta: string) {
  actual?.abort();                           // la pregunta vieja ya no importa
  actual = new AbortController();
  const t0 = performance.now();
  const sesion = await LanguageModel.create();          // Gemini Nano (Prompt API)
  const stream = sesion.promptStreaming(pregunta, { signal: actual.signal });
  for await (const trozo of stream) salida.append(trozo); // pinta mientras piensa
  performance.measure('Recomendación', {
    start: t0,
    detail: { devtools: { dataType: 'track-entry', track: 'Mesa · IA local',
      color: 'secondary', tooltipText: pregunta } },
  });
}`;

export const CHECKLIST: [string, string][] = [
  ['Elementos nativos', '<button>, <a>, <label>, <form>, <select>: traen rol, foco y teclado gratis.'],
  ['Todo control con nombre', 'texto visible o aria-label; un ícono solo no es un nombre.'],
  ['Estado visible para máquinas', 'disabled, aria-busy, aria-expanded, aria-invalid: no solo colores.'],
  ['Mira con los ojos del agente', 'Elements → Accessibility (árbol completo) o take_snapshot con tu agente.'],
  ['Una tool por intención', 'WebMCP con nombre, descripción y JSON Schema claros; revísalas en Application → WebMCP.'],
  ['Errores que enseñan', '"20:00 no está libre; libres: 19:30, 21:00" en vez de "Error".'],
  ['Lo irreversible se confirma', 'consequentialHint y confirmación de la persona antes de reservar o pagar.'],
  ['Tu agente prueba tu web', 'Chrome DevTools for agents: navega, llena, lee consola y red, graba trazas.'],
  ['Emula lo lento', 'CPU y red lentas: el agente encuentra las carreras antes que tus usuarios.'],
  ['IA local con rienda', 'streaming, AbortController y una pista propia en Performance.'],
];
export const CHECKLIST_TITLE = '10 reglas para una web que los agentes entienden';

export const ASK_TOPICS = ['DevTools for agents', 'Accesibilidad', 'WebMCP', 'Simular usuarios', 'IA en el navegador', 'La demo Mesa'] as const;

const S = (s: SlideContent) => s;

export const SLIDES: SlideContent[] = [
  S({
    id: 'portada',
    label: 'Portada',
    kind: 'content',
    title: 'Chrome DevTools para agentes',
    summary: [
      'Los agentes ya navegan, leen y hacen clic en tu web. DevTools ahora te deja ver lo que ven, hacen y piensan.',
      'Hoy: 4 preguntas para depurar a un agente, con una demo de reservas en Lima.',
    ],
    notes: '¡Hola de nuevo, Lima! "En la otra charla hablamos de interfaces que escribe una IA. Hoy, de IAs que USAN nuestras interfaces… y de cómo depurarlas."',
    time: '0:00',
    inSummary: true,
  }),
  S({
    id: 'unete',
    label: 'Únete',
    kind: 'join',
    title: 'Únete a la charla',
    summary: ['Escanea el QR. Si estuviste en la otra charla, tu avatar vuelve: cámbiale la ropa para hoy y suma +200 al podio.'],
    notes: 'Si esta es la segunda charla: "Quien creó su avatar en la charla de UI generativa: ábranlo, cámbienle la ropa o lo que lleva y publíquenlo. Suma +200." Si es la primera: "Creen su avatar: en la otra charla lo pueden traer y suma +200." El QR es el mismo sitio para las dos.',
    time: '0:40',
  }),
  S({
    id: 'bio',
    label: 'Quién soy',
    kind: 'content',
    title: 'Vanessa Aristizabal',
    summary: ['Software Engineer · Google Developer Expert en Web Technologies y Angular · GitHub Star.'],
    notes: '20 segundos.',
    time: '1:20',
  }),
  S({
    id: 'dos-visitantes',
    label: 'Dos visitantes',
    kind: 'content',
    section: S0,
    title: 'Tu web ahora tiene dos tipos de visitantes',
    summary: [
      'Personas: miran, leen y hacen clic.',
      'Agentes: el agente del navegador, el asistente de tu propia página y tu agente de código que prueba tu web.',
      'DevTools siempre te mostró lo que ve una persona. Ahora necesitas ver lo que ve, hace y piensa un agente.',
    ],
    notes: 'Pregunta: "¿Quién ya le pidió a un agente que reserve, compre o llene algo en una web?" (manos). "¿Y funcionó a la primera?" Risas. "Hoy vemos cómo saber POR QUÉ no funcionó."',
    time: '1:45',
    inSummary: true,
  }),
  S({
    id: 'como-ve',
    label: '¿Cómo ve?',
    kind: 'content',
    section: S0,
    title: 'Un agente "ve" tu página de cuatro formas',
    summary: [
      'Captura de pantalla: píxeles. Caro y frágil.',
      'DOM: todo el HTML. Miles de tokens y mucho ruido.',
      'Árbol de accesibilidad: rol, nombre y estado de cada control. El mapa que más usan.',
      'Tools de WebMCP: funciones con nombre y JSON Schema que tu página publica.',
    ],
    notes: 'De izquierda a derecha: "cada vez menos ruido, cada vez más intención". "Si su página es accesible, ya hicieron la mitad del trabajo para los agentes."',
    time: '2:45',
    inSummary: true,
  }),
  S({
    id: 'devtools-agentes',
    label: 'DevTools for agents',
    kind: 'content',
    section: S0,
    title: 'Chrome DevTools for agents: tu agente de código controla un Chrome real',
    summary: [
      'Servidor MCP (chrome-devtools-mcp) + CLI (chrome-devtools) + skills: lo instalas en Claude Code, Gemini CLI, Antigravity o Cursor.',
      'Tu agente navega, llena formularios, toma el árbol de accesibilidad, lee consola y red, graba trazas y corre Lighthouse.',
      'Con --categoryExperimentalWebmcp también lista y ejecuta tus tools de WebMCP.',
    ],
    code: { file: '.mcp.json', text: CODE_MCP },
    notes: '"No es un Chrome de mentira: es el tuyo, con DevTools de verdad por debajo (CDP y Puppeteer)." Categorías: input, navegación, emulación, performance, red, depuración. Modo foco: config y luego la CLI.',
    time: '3:45',
    inSummary: true,
  }),
  S({
    id: 'cuatro-preguntas',
    label: 'Las 4 preguntas',
    kind: 'content',
    section: S0,
    title: 'Hoy: 4 preguntas para depurar a un agente',
    summary: [
      '01 ¿Qué ve? · 02 ¿Qué hizo? · 03 ¿Qué pasa si va más rápido que una persona? · 04 ¿Qué piensa la IA de mi página?',
      'Cada pregunta tiene su herramienta en DevTools y un bug en la demo.',
    ],
    notes: 'ESTE es el mapa; vuelve aquí al empezar cada capítulo. Léelas despacio.',
    time: '4:45',
    inSummary: true,
  }),
  S({
    id: 'demo-mesa',
    label: 'Demo · Mesa',
    kind: 'demo',
    section: S0,
    title: 'Mesa: reservas de restaurantes en Lima',
    summary: [
      'Una app de reservas con un agente que intenta reservar "mesa para 4 el sábado a las 20:00 en un nikkei de Barranco".',
      'Panel del agente: lo que ve, lo que hace y lo que piensa. Cuatro bugs que se prenden y apagan.',
      'Restaurantes y precios ficticios. Ábrela en tu laptop con el QR.',
    ],
    notes: 'Clip 15 s. "El agente falla. Vamos a averiguar por qué, pregunta por pregunta."',
    time: '5:30',
  }),
  // ── 01 ──
  S({
    id: 'sec-ve',
    label: '01 ¿Qué ve?',
    kind: 'content',
    section: S1,
    title: '01 · ¿Qué ve el agente?',
    summary: ['El árbol de accesibilidad es su mapa.'],
    notes: 'Vuelve al mapa: pregunta 1.',
    time: '6:00',
  }),
  S({
    id: 've-arbol',
    label: 'El árbol',
    kind: 'content',
    section: S1,
    title: 'Lo que tú ves vs. lo que ve el agente',
    summary: [
      'Tú ves un botón rosado con un ícono. El agente ve "generic": no sabe que se puede tocar ni para qué sirve.',
      'Míralo igual que él: Elements → Accessibility (árbol completo) o take_snapshot con tu agente.',
    ],
    notes: 'Diagrama de dos columnas. "Este botón está hecho con un div. Para una persona funciona. Para el agente no existe."',
    time: '6:15',
    inSummary: true,
  }),
  S({
    id: 've-codigo',
    label: 'Rol, nombre, estado',
    kind: 'content',
    section: S1,
    title: 'Rol, nombre y estado',
    summary: [
      'Usa el elemento nativo (button) y dale un nombre con texto visible.',
      'Expón el estado: disabled mientras no se pueda usar.',
    ],
    code: { file: 'demo-agentes/src/ui/reserva.ts', text: CODE_BOTON },
    notes: 'Modo foco: el div, el button, y lo que imprime take_snapshot.',
    time: '7:00',
    inSummary: true,
  }),
  S({
    id: 'clip-ve',
    label: 'Demo · Lo que ve',
    kind: 'demo',
    section: S1,
    title: 'Demo: el agente no encuentra el botón',
    summary: ['Con el div, el agente se queda dando vueltas. Con el button, lo encuentra al primer intento.'],
    notes: 'Clip: panel "Lo que ve" a la derecha.',
    time: '7:45',
  }),
  S({
    id: 'q1',
    label: 'Pregunta 1',
    kind: 'poll',
    qid: 'q1',
    section: S1,
    title: 'Pregunta 1 · ¿Qué ve el agente?',
    summary: [],
    notes: 'Espera ~25 s y revela con V.',
    time: '8:30',
  }),
  // ── 02 ──
  S({
    id: 'sec-hizo',
    label: '02 ¿Qué hizo?',
    kind: 'content',
    section: S2,
    title: '02 · ¿Qué hizo el agente?',
    summary: ['Cada llamada deja huella: tool, entrada, salida y estado.'],
    notes: 'Vuelve al mapa: pregunta 2.',
    time: '9:15',
  }),
  S({
    id: 'hizo-webmcp',
    label: 'Panel WebMCP',
    kind: 'content',
    section: S2,
    title: 'Application → WebMCP: qué tools vio y cuáles llamó',
    summary: [
      'Available tools: lo que el agente puede usar, con nombre, descripción y cuántas veces se llamó.',
      'Invoked tools: cada llamada con estado (Completed, Error, Canceled), entrada y salida.',
      'Run tool: ejecútala a mano, sin agente, con los mismos parámetros.',
    ],
    notes: 'Recreación del panel con las tools de Mesa. "Si el agente falla, aquí ven si fue él… o su tool."',
    time: '9:30',
    inSummary: true,
  }),
  S({
    id: 'hizo-errores',
    label: 'Errores que enseñan',
    kind: 'content',
    section: S2,
    title: 'Errores que el agente entiende',
    summary: [
      '"Error" a secas: el agente reintenta lo mismo.',
      '"20:00 no está libre; libres: 19:30, 21:00": el agente se corrige solo.',
      'consequentialHint: reservar es irreversible, así que la persona confirma.',
    ],
    code: { file: 'demo-agentes/src/tools.ts', text: CODE_TOOL },
    notes: 'Modo foco en el error.',
    time: '10:15',
    inSummary: true,
  }),
  S({
    id: 'clip-hizo',
    label: 'Demo · Tools',
    kind: 'demo',
    section: S2,
    title: 'Demo: de "Error" a un error útil',
    summary: ['Mismo pedido: con el error opaco el agente se rinde; con el error útil elige otra hora.'],
    notes: 'Clip con el panel de tools a la derecha.',
    time: '11:00',
  }),
  // ── 03 ──
  S({
    id: 'sec-simular',
    label: '03 Simular',
    kind: 'content',
    section: S3,
    title: '03 · Simula al usuario automatizado',
    summary: ['¿Qué pasa si quien usa tu web va más rápido que una persona?'],
    notes: 'Vuelve al mapa: pregunta 3.',
    time: '11:45',
  }),
  S({
    id: 'simular-bucle',
    label: 'Tu agente prueba',
    kind: 'content',
    section: S3,
    title: 'Tu agente de código como usuario automatizado',
    summary: [
      'Navega → toma el árbol → llena y hace clic → espera un texto → lee consola y red.',
      'Emula CPU, red y pantalla de un celular: encuentra lo que solo falla cuando todo va lento… o muy rápido.',
      'Graba una traza de performance y corre Lighthouse (incluye la categoría Agentic Browsing, experimental).',
    ],
    notes: 'Bucle del diagrama. Ejemplo de prompt: "Abre Mesa, reserva para 4 el sábado a las 20:00 con CPU 4× y red 3G; dime qué falla y por qué." Tools: navigate_page, take_snapshot, fill_form, click, wait_for, list_console_messages, list_network_requests, emulate, performance_start_trace, lighthouse_audit.',
    time: '12:00',
    inSummary: true,
  }),
  S({
    id: 'simular-carrera',
    label: 'La carrera',
    kind: 'content',
    section: S3,
    title: 'El agente hace clic antes de que la página esté lista',
    summary: [
      'Una persona espera a ver los horarios. Un agente hace clic apenas existe el botón.',
      'Si el botón "parece" deshabilitado pero no lo está, el agente reserva con datos vacíos.',
      'Arreglo: estado real (disabled, aria-busy) hasta que todo cargó.',
    ],
    code: { file: 'demo-agentes/src/ui/reserva.ts', text: CODE_LISTO },
    notes: 'Modo foco. "El gris no es un estado: disabled sí."',
    time: '13:00',
    inSummary: true,
  }),
  S({
    id: 'clip-simular',
    label: 'Demo · Carrera',
    kind: 'demo',
    section: S3,
    title: 'Demo: red lenta + agente rápido',
    summary: ['Con red lenta, el agente reserva sin horario. Con aria-busy y disabled, espera y reserva bien.'],
    notes: 'Clip con la línea de tiempo del agente.',
    time: '14:00',
  }),
  S({
    id: 'q2',
    label: 'Pregunta 2',
    kind: 'poll',
    qid: 'q2',
    section: S3,
    title: 'Pregunta 2 · DevTools for agents',
    summary: [],
    notes: 'Espera ~25 s y revela con V.',
    time: '14:45',
  }),
  // ── 04 ──
  S({
    id: 'sec-ia',
    label: '04 IA del cliente',
    kind: 'content',
    section: S4,
    title: '04 · Depura la IA del cliente',
    summary: ['¿Qué está pensando la IA que corre en tu página?'],
    notes: 'Vuelve al mapa: pregunta 4.',
    time: '15:30',
  }),
  S({
    id: 'ia-rutinas',
    label: '3 problemas',
    kind: 'content',
    section: S4,
    title: 'Tres bugs típicos de la IA en el navegador',
    summary: [
      'Congela: esperas la respuesta completa y la página no responde.',
      'Responde tarde a lo viejo: la persona cambió la pregunta y llega la respuesta anterior.',
      'Nadie sabe cuánto tarda: no aparece en ninguna herramienta.',
    ],
    notes: 'Ejemplo de Mesa: "¿Qué pido?" con Gemini Nano (Prompt API) o el modo simulado. Herramientas: Performance con pista propia, consola, chrome://on-device-internals para ver el modelo.',
    time: '15:45',
    inSummary: true,
  }),
  S({
    id: 'ia-codigo',
    label: 'Streaming + abort',
    kind: 'content',
    section: S4,
    title: 'Streaming, AbortController y una pista propia',
    summary: [
      'promptStreaming pinta mientras el modelo piensa.',
      'abort() cancela la pregunta vieja.',
      'performance.measure con detail.devtools: tu IA aparece como pista en Performance.',
    ],
    code: { file: 'demo-agentes/src/ia.ts', text: CODE_IA },
    notes: 'Modo foco en las 3 partes.',
    time: '16:30',
    inSummary: true,
  }),
  S({
    id: 'clip-ia',
    label: 'Demo · IA local',
    kind: 'demo',
    section: S4,
    title: 'Demo: la recomendación que congelaba la página',
    summary: ['Sin streaming, el contador de frames se detiene. Con streaming y abort, sigue fluido y responde a la última pregunta.'],
    notes: 'Clip con el medidor de fluidez.',
    time: '17:30',
  }),
  S({
    id: 'demo-vivo',
    label: 'Demo en vivo',
    kind: 'demo',
    section: S5,
    title: 'Demo en vivo: DevTools de verdad',
    summary: [
      'Elements → Accessibility: el botón antes y después.',
      'Application → WebMCP: las tools de Mesa, una llamada con error y Run tool.',
      'Tu agente de código con Chrome DevTools for agents: reserva con CPU 4× y explica qué falló.',
    ],
    notes: 'Guion (6 min): 1) Mesa con ?bugs=todos, Elements → Accessibility sobre el botón. 2) Application → WebMCP (flag chrome://flags/#enable-webmcp-testing), Run tool reservar_mesa con hora 20:00. 3) Terminal: prompt al agente con chrome-devtools-mcp. 4) Performance: pista "Mesa · IA local". Plan B: clips.',
    time: '18:15',
  }),
  S({
    id: 'razonar',
    label: 'Fácil de razonar',
    kind: 'content',
    section: S5,
    title: 'Una web fácil de razonar para agentes',
    summary: [
      'Legible: HTML nativo, nombres y estados (lo que sirve a un lector de pantalla, sirve a un agente).',
      'Accionable: tools de WebMCP por intención, con errores que enseñan.',
      'Estable: sin saltos ni carreras; lo irreversible se confirma.',
      'Lighthouse → Agentic Browsing (experimental) lo revisa por ti.',
    ],
    notes: 'Recap de las 4 preguntas sobre esta pirámide.',
    time: '24:30',
    inSummary: true,
  }),
  S({
    id: 'q3',
    label: 'Pregunta 3',
    kind: 'poll',
    qid: 'q3',
    section: S5,
    title: 'Pregunta 3 · IA del cliente',
    summary: [],
    notes: 'Espera ~25 s y revela con V.',
    time: '25:15',
  }),
  S({
    id: 'muro',
    label: 'Muro de avatares',
    kind: 'wall',
    section: S5,
    title: 'El muro de avatares limeños',
    summary: ['Los avatares de la sala; los que vinieron los dos días llevan la insignia "Día 1 + Día 2".'],
    notes: 'Señala los que tienen insignia: "estos estuvieron en las dos charlas, +200". Clic en uno para ocultarlo.',
    time: '26:00',
  }),
  S({
    id: 'checklist',
    label: 'Para llevar',
    kind: 'content',
    section: S5,
    title: CHECKLIST_TITLE,
    summary: CHECKLIST.map(([h, p]) => `${h}: ${p}`),
    notes: '"Están en su memoria y en una guía para su agente de código en el repo."',
    time: '26:45',
    inSummary: true,
  }),
  S({
    id: 'podio',
    label: 'Podio',
    kind: 'podium',
    section: S5,
    title: 'El podio',
    summary: [],
    notes: 'Lee los 3 primeros y sus códigos.',
    time: '27:30',
  }),
  S({
    id: 'gracias',
    label: 'Gracias',
    kind: 'end',
    section: S5,
    title: '¡Gracias, Lima!',
    summary: ['Descarga tu memoria (PDF) desde el celular.'],
    notes: '"Gracias por estos dos días." Preguntas (tecla Q).',
    time: '28:30',
  }),
];

export const agentes: TalkContent = { SLIDES, CHECKLIST, CHECKLIST_TITLE, ASK_TOPICS, CODE: { mcp: CODE_MCP, boton: CODE_BOTON, tool: CODE_TOOL, listo: CODE_LISTO, ia: CODE_IA }, CODE_LANG: { mcp: 'js', boton: 'html' } };
