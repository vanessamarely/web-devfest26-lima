// Día 1 · Web performance en la era de la UI generativa
//
// Una sola idea guía, para que la charla se siga sin perderse: UNA metáfora y CUATRO reglas.
//
//   "Construir una casa mientras te dictan el plano"
//   La IA dicta la interfaz por partes (streaming); el navegador la construye mientras escucha,
//   y la persona ya la está usando.
//     01 Reserva el espacio            → guarda el lugar antes de que llegue el contenido  (renderizado, CLS)
//     02 Lee cada parte una sola vez   → no releas todo desde el inicio                   (streaming JSON/HTML)
//     03 Reutiliza, no rehagas         → cambia solo lo que cambió                        (reciclaje del DOM)
//     04 Un solo lugar para los datos  → la IA decide qué mostrar; tu código hace cuentas  (estado)
//
// Cada capítulo tiene el mismo ritmo: lo que SIENTE la persona → por qué pasa (un diagrama) →
// el arreglo (código corto) → la prueba en la demo Nido (clip con números reales).
import type { SlideContent, TalkContent } from '../content';

const S0 = 'La idea';
const S1 = '01 · Reserva el espacio';
const S2 = '02 · Lee cada parte una sola vez';
const S3 = '03 · Reutiliza, no rehagas';
const S4 = '04 · Un solo lugar para los datos';
const S5 = 'Para llevar';

export const CODE_PLANO = `// Lo primero que dicta el modelo es el PLANO: qué secciones vienen
{"tipo":"plano","secciones":["resumen","mapa","destacados","grafico","lista"]}
{"tipo":"texto","id":"resumen","delta":"Encontré 99 departamentos…"}
{"tipo":"inmueble","id":"ba-012","precio":2830,"m2":76,…}

// Cada pieza del catálogo declara su tamaño ANTES de llegar
const CATALOGO = {
  resumen:    { alto: 136 },
  mapa:       { aspecto: '21 / 8' },
  destacados: { alto: 40 + filas * 368 },   // 6 tarjetas de 352 px
  grafico:    { alto: 260 },
};

function reservar(id: string, tipo: Tipo) {
  const slot = document.createElement('section');
  slot.className = 'slot esqueleto';          // gris, con su forma final
  const { alto, aspecto } = CATALOGO[tipo];
  if (alto) slot.style.minHeight = alto + 'px';
  if (aspecto) slot.style.aspectRatio = aspecto;
  return slot;                                // el contenido llega después
}`;

export const CODE_PARSER = `// ❌ Releer todo el plano con cada palabra
buffer += trozo;
render(JSON.parse(reparar(buffer)));   // 300 trozos → 300 relecturas y 300 renders

// ✅ Una línea = una pieza (NDJSON): cada carácter se lee UNA vez
let resto = '';
function alLlegar(trozo: string) {
  const lineas = (resto + trozo).split('\\n');
  resto = lineas.pop()!;               // la línea incompleta espera
  for (const l of lineas) if (l) pendientes.push(JSON.parse(l));
  programarRender();
}

// ✅ Un render por frame (60 por segundo como máximo), no uno por trozo
let programado = false;
function programarRender() {
  if (programado) return;
  programado = true;
  requestAnimationFrame(() => {
    programado = false;
    aplicar(pendientes.splice(0));     // todo lo que llegó en este frame
  });
}`;

export const CODE_CLAVES = `// ❌ Demoler: cada cambio de precio recrea TODA la lista
lista.innerHTML = inmuebles.map(tarjetaHTML).join('');

// ✅ Reciclar: un nodo por id; solo cambia lo que cambió
const nodos = new Map<string, HTMLElement>();

function aplicar(inmueble: Inmueble) {
  let el = nodos.get(inmueble.id);
  if (!el) {
    el = crearTarjeta(inmueble);           // solo la primera vez
    nodos.set(inmueble.id, el);
    lista.append(el);
  }
  if (el.dataset.precio !== String(inmueble.precio)) {
    el.dataset.precio = String(inmueble.precio);
    el.querySelector('.precio')!.textContent = soles(inmueble.precio);
  }
}`;

export const CODE_ESTADO = `// La IA dicta QUÉ mostrar. Tu código calcula CUÁNTO, en qué orden, si cabe.
const datos = new Map<string, Inmueble>();         // un solo lugar para los datos
const avisos = new Map<string, Set<() => void>>();

function anotar(id: string, cambio: Partial<Inmueble>) {
  datos.set(id, { ...datos.get(id)!, ...cambio });
  avisos.get(id)?.forEach((pintar) => pintar());   // solo a quien lo usa
}

// Ordenar 300 departamentos (precio por m², cercanía al mar…) en paralelo
const orden = new Worker(new URL('./orden.worker.ts', import.meta.url), { type: 'module' });

botonOrdenar.addEventListener('click', () => {
  botonOrdenar.setAttribute('aria-busy', 'true');  // respuesta inmediata al clic
  orden.postMessage([...datos.values()]);
});
orden.onmessage = ({ data: ids }) => reordenar(ids); // mueve nodos, no los recrea`;

export const CODE_PISTA = `// Tu propia pista en el panel Performance de DevTools
const t0 = performance.now();
const piezas = parsear(trozo);
performance.measure('Parser', {
  start: t0,
  detail: { devtools: {
    dataType: 'track-entry',
    track: 'Nido · UI generativa',
    color: 'tertiary',
    tooltipText: \`\${piezas.length} piezas\`,
  } },
});`;

export const CHECKLIST: [string, string][] = [
  ['Mide como tu usuario', 'en DevTools simula un procesador 4× más lento y mira las 3 sensaciones: ¿ya está? (LCP), ¿me hace caso? (INP), ¿se queda quieto? (CLS).'],
  ['Tus componentes, no HTML libre', 'el modelo elige entre tus componentes con un JSON Schema; tú decides cómo se ven y cuánto miden.'],
  ['Primero el plano', 'reserva cada sección con su tamaño final antes de que llegue su contenido.'],
  ['Fotos con aspect-ratio', 'la imagen llega después, pero su espacio ya estaba guardado.'],
  ['Un JSON por línea', 'NDJSON: cada línea es un componente; cada carácter se lee una sola vez.'],
  ['Un dibujo por cuadro', 'junta lo que llegó con requestAnimationFrame: 70 partes por segundo no son 70 dibujos de pantalla.'],
  ['Cada elemento con su id', 'si cambia el precio, cambias el precio, no la tarjeta completa.'],
  ['Listas largas, pocos elementos', 'reutiliza unas pocas filas (o usa content-visibility) aunque haya 300 resultados.'],
  ['Un solo lugar para los datos', 'un store por id; la IA manda cambios y cada parte de la pantalla escucha solo lo suyo.'],
  ['Lo pesado, en paralelo', 'ordenar o filtrar en un Web Worker y mostrar una respuesta inmediata al clic.'],
];
export const CHECKLIST_TITLE = '10 reglas para una UI generativa rápida';

export const ASK_TOPICS = ['UI generativa', 'Respuesta por partes', 'Saltos (CLS)', 'Listas largas', 'Datos y estado', 'La demo Nido'] as const;

const S = (s: SlideContent) => s;

export const SLIDES: SlideContent[] = [
  S({
    id: 'portada',
    label: 'Portada',
    kind: 'content',
    title: 'Web performance en la era de la UI generativa',
    summary: [
      'La IA ya no responde solo texto: responde interfaces que se construyen mientras llegan.',
      'Hoy: 4 reglas para que esa interfaz sea rápida, estable y no congele la página.',
    ],
    notes: '¡Hola, Lima! (sonríe, pausa). "Hoy vamos a hablar de interfaces que escribe una IA… y de por qué a veces se sienten lentas. Prometo una sola metáfora y cuatro reglas. Nada más."',
    time: '0:00',
    inSummary: true,
  }),
  S({
    id: 'unete',
    label: 'Únete',
    kind: 'join',
    title: 'Únete a la charla',
    summary: ['Escanea el QR: sigue los slides en tu celular, toma notas, crea tu avatar limeño y juega por el podio.'],
    notes: 'Que escaneen mientras te presentas. "Hay 3 preguntas: quien acierte rápido sube al podio. Creen su avatar: en la otra charla (Chrome DevTools para agentes) lo pueden traer, cambiarle la ropa y suma +200. Y si les queda una duda, el botón Pregunta tiene un asistente con Gemini Nano que conoce esta charla."',
    time: '0:40',
  }),
  S({
    id: 'bio',
    label: 'Quién soy',
    kind: 'content',
    title: 'Vanessa Aristizabal',
    summary: ['Software Engineer · Google Developer Expert en Web Technologies y Angular · GitHub Star.'],
    notes: '20 segundos. "Trabajo en performance web y en IA en el navegador."',
    time: '1:20',
  }),
  S({
    id: 'que-es-genui',
    label: '¿Qué es UI generativa?',
    kind: 'content',
    section: S0,
    title: 'La IA ya no responde texto: responde interfaces',
    summary: [
      'UI generativa: el modelo de IA decide QUÉ mostrar (tarjetas, mapa, gráfico) según lo que pediste.',
      'No inventa HTML: elige entre TUS componentes y los describe en JSON.',
      'Llega por partes (streaming): la página se construye mientras la persona ya la está usando.',
    ],
    notes: 'Explica con el ejemplo de la demo: "Le pido: departamento de 2 dormitorios en Barranco con vista al mar. No me contesta un párrafo: me arma tarjetas, un mapa y un gráfico de precios." Señala el diagrama de izquierda a derecha: pedido → modelo → JSON de piezas → tu código pinta. "Fíjense en la última flecha: la pintura es NUESTRA. Ahí está el problema de performance… y la solución."',
    time: '1:45',
    inSummary: true,
  }),
  S({
    id: 'tres-sensaciones',
    label: '3 sensaciones',
    kind: 'content',
    section: S0,
    title: 'La persona no ve métricas: siente tres cosas',
    summary: [
      '¿Ya está? → LCP: lo principal aparece en menos de 2,5 s.',
      '¿Me hace caso? → INP: cada clic responde en menos de 200 ms.',
      '¿Se queda quieto? → CLS: nada salta (menos de 0,1).',
    ],
    notes: 'Pregunta: "¿A quién le ha saltado un botón justo cuando iba a tocarlo?" (manos). "Eso tiene nombre: CLS." No entres en fórmulas. "Con UI generativa, las tres sufren a la vez, porque la página se construye mientras la usas."',
    time: '2:45',
    inSummary: true,
  }),
  S({
    id: 'la-obra',
    label: 'La metáfora',
    kind: 'content',
    section: S0,
    title: 'Construir una casa mientras te dictan el plano',
    summary: [
      'La IA dicta la interfaz por partes; el navegador la construye mientras escucha, y la persona ya la está usando.',
      '4 reglas: reserva el espacio · lee cada parte una sola vez · reutiliza, no rehagas · un solo lugar para los datos.',
      'Cada regla corresponde a un tema de la charla: cómo se dibuja (renderizado), cómo llega (streaming), reutilizar la pantalla (DOM) y los datos (estado).',
    ],
    notes: 'ESTE es el mapa de la charla; vuelve a él al empezar cada capítulo. "Imaginen que construyen una casa mientras el arquitecto les dicta el plano por teléfono, palabra por palabra. Y la familia ya vive adentro." Lee las 4 reglas en voz alta, despacio. "Si se quedan con estas 4 frases, la charla valió la pena."',
    time: '3:45',
    inSummary: true,
  }),
  S({
    id: 'demo-nido',
    label: 'Demo · Nido',
    kind: 'demo',
    section: S0,
    title: 'Nido: un buscador de departamentos con IA',
    summary: [
      'Describes el departamento que buscas y Nido arma resultados, mapa y gráfico mientras llega la respuesta.',
      'Tiene "rayos X": cada regla se puede apagar y prender para ver la diferencia.',
      'Precios y departamentos ficticios. Ábrela en tu laptop con el QR.',
    ],
    notes: 'Deja correr el clip 15 s. "Esta es la versión arreglada. Durante la charla vamos a romperla regla por regla." Rayos X: tecla X en la demo.',
    time: '4:45',
  }),
  // ── 01 ──
  S({
    id: 'sec-espacio',
    label: '01 Reserva el espacio',
    kind: 'content',
    section: S1,
    title: 'Regla 1: reserva el espacio',
    summary: ['Guarda el lugar de cada parte antes de que llegue: así nada se mueve mientras la persona lee.'],
    notes: 'Vuelve al mapa: "Regla 1, cómo se dibuja la pantalla." Transición corta.',
    time: '5:30',
  }),
  S({
    id: 'espacio-problema',
    label: 'Todo salta',
    kind: 'content',
    section: S1,
    title: 'Si no reservas, todo salta',
    summary: [
      'Sin reserva: cada componente que llega empuja a los de abajo. La persona pierde lo que estaba leyendo (CLS).',
      'Con reserva: el plano llega primero, cada sección ocupa su tamaño final y el contenido solo "rellena".',
      'Es la forma más barata de mejorar cómo se dibuja la página: no necesita JavaScript extra.',
    ],
    notes: 'Señala la columna roja: "el mapa llega tarde y empuja todo". Luego la verde: "los huecos ya estaban". "En UI generativa el modelo puede mandar el plano primero: qué secciones vienen. Con eso reservamos."',
    time: '5:45',
    inSummary: true,
  }),
  S({
    id: 'espacio-codigo',
    label: 'Plano primero',
    kind: 'content',
    section: S1,
    title: 'El plano primero; cada pieza con su tamaño',
    summary: [
      'Lo primero que envía el modelo es el plano: qué secciones vienen.',
      'Cada componente declara su alto o su proporción (aspect-ratio): el espacio ya tiene su forma final.',
    ],
    code: { file: 'demo-genui/src/genui/catalogo.ts', text: CODE_PLANO },
    notes: 'Modo foco: 1) el plano, 2) los componentes, 3) las medidas de cada componente, 4) reservar(). "Las fotos llevan aspect-ratio: la imagen llega después, pero su espacio ya estaba guardado."',
    time: '6:30',
    inSummary: true,
  }),
  S({
    id: 'clip-espacio',
    label: 'Demo · Saltos',
    kind: 'demo',
    section: S1,
    title: 'Demo: los saltos, con y sin reserva',
    summary: ['Rayos X marca en rojo cada salto. Con el plano primero, el CLS baja a casi cero.'],
    notes: 'Clip: izquierda sin reservar (recuadros rojos), derecha con reserva (bordes punteados). Lee los números del panel.',
    time: '7:15',
  }),
  S({
    id: 'q1',
    label: 'Pregunta 1',
    kind: 'poll',
    qid: 'q1',
    section: S1,
    title: 'Pregunta 1 · Reserva el espacio',
    summary: [],
    notes: 'Lee la pregunta y espera ~25 s. Revela con V.',
    time: '8:00',
  }),
  // ── 02 ──
  S({
    id: 'sec-stream',
    label: '02 Lee cada parte una vez',
    kind: 'content',
    section: S2,
    title: 'Regla 2: lee cada parte una sola vez',
    summary: ['No vuelvas a leer toda la respuesta desde el inicio cada vez que llega una parte nueva.'],
    notes: 'Vuelve al mapa: "Regla 2, la respuesta que llega por partes."',
    time: '8:45',
  }),
  S({
    id: 'stream-formatos',
    label: '¿Cómo llega?',
    kind: 'content',
    section: S2,
    title: '¿Cómo llega la respuesta?',
    summary: [
      'JSON completo: hay que esperar al final (o intentar "arreglar" el JSON incompleto).',
      'JSON por líneas (NDJSON): cada línea es un componente completo; se dibuja apenas llega.',
      'HTML por partes: el navegador lo dibuja solo, pero no controlas qué componentes se usan.',
    ],
    notes: '"El modelo escribe token por token. ¿En qué formato le pedimos que escriba?" Recomienda NDJSON para UI generativa: cada línea es un componente completo. HTML por partes sirve para texto, no para componentes interactivos.',
    time: '9:00',
    inSummary: true,
  }),
  S({
    id: 'stream-releer',
    label: 'Releer todo',
    kind: 'content',
    section: S2,
    title: 'El error típico: releer todo con cada parte',
    summary: [
      'Si con cada parte haces JSON.parse de TODO lo recibido, lees el inicio cientos de veces.',
      'Y si dibujas la pantalla con cada parte, la dibujas cientos de veces sin que nadie lo note.',
      'La pantalla solo se actualiza unas 60 veces por segundo: basta con dibujar una vez por cuadro (frame).',
    ],
    notes: 'La imagen del libro: "Es como releer el plano desde la página 1 cada vez que el arquitecto dice una palabra." Señala los contadores: caracteres leídos y veces que se dibuja. No digas O(n²): di "crece al cuadrado: el doble de respuesta, cuatro veces el trabajo".',
    time: '10:00',
    inSummary: true,
  }),
  S({
    id: 'stream-codigo',
    label: 'Parser + frame',
    kind: 'content',
    section: S2,
    title: 'Cada línea, una vez. Un dibujo por cuadro.',
    summary: [
      'Separa por saltos de línea y guarda la línea incompleta para cuando llegue la siguiente parte.',
      'Junta los componentes que llegaron y dibújalos de una vez con requestAnimationFrame.',
    ],
    code: { file: 'demo-genui/src/genui/stream.ts', text: CODE_PARSER },
    notes: 'Modo foco: el antes (2 líneas) y el después. "resto guarda la línea incompleta. Y programarRender junta todo lo que llegó y dibuja una vez por cuadro."',
    time: '10:45',
    inSummary: true,
  }),
  S({
    id: 'clip-stream',
    label: 'Demo · Leer una vez',
    kind: 'demo',
    section: S2,
    title: 'Demo: la misma respuesta, leída una sola vez',
    summary: ['Misma respuesta, mismos departamentos: muchísimos menos caracteres leídos y veces que se dibuja.'],
    notes: 'Clip: el panel "Lo que envía la IA" muestra la respuesta en crudo; mira los contadores bajar.',
    time: '11:45',
  }),
  // ── 03 ──
  S({
    id: 'sec-reciclar',
    label: '03 Reutiliza, no rehagas',
    kind: 'content',
    section: S3,
    title: 'Regla 3: reutiliza, no rehagas',
    summary: ['Para cambiar un precio no hace falta volver a crear toda la lista.'],
    notes: 'Vuelve al mapa: "Regla 3, reutilizar lo que ya está en pantalla."',
    time: '12:30',
  }),
  S({
    id: 'reciclar-claves',
    label: 'Claves estables',
    kind: 'content',
    section: S3,
    title: 'Cada elemento tiene su id: cambia solo lo que cambió',
    summary: [
      'La IA corrige mientras escribe ("el precio real es S/ 2.790"). Con innerHTML vuelves a crear toda la lista.',
      'Con un elemento por id, solo cambia el texto del precio: menos trabajo, y no se pierde el foco ni el scroll.',
    ],
    code: { file: 'demo-genui/src/genui/render.ts', text: CODE_CLAVES },
    notes: 'Modo foco. "Recrear nodos es caro y además rompe cosas: si la persona estaba escribiendo o tenía el foco en un botón, lo pierde."',
    time: '12:45',
    inSummary: true,
  }),
  S({
    id: 'reciclar-listas',
    label: 'Listas largas',
    kind: 'content',
    section: S3,
    title: 'Listas largas, pocos elementos en pantalla',
    summary: [
      '300 resultados no son 300 tarjetas en pantalla: reutiliza unas pocas filas y cambia su contenido al hacer scroll.',
      'Alternativa simple: content-visibility: auto con contain-intrinsic-size (el navegador no dibuja lo que no se ve).',
    ],
    notes: 'Diagrama de la cinta: "Como la vitrina de una pastelería: los mismos platos, distinto postre." Menciona que el clip compara nodos.',
    time: '13:45',
    inSummary: true,
  }),
  S({
    id: 'clip-reciclar',
    label: 'Demo · Reutilizar',
    kind: 'demo',
    section: S3,
    title: 'Demo: rehacer todo vs. reutilizar',
    summary: ['Rayos X marca en naranja lo que se crea y en verde lo que se reutiliza.'],
    notes: 'Clip: llegan correcciones de precio. Naranja = elementos nuevos; verde = reutilizados.',
    time: '14:30',
  }),
  S({
    id: 'q2',
    label: 'Pregunta 2',
    kind: 'poll',
    qid: 'q2',
    section: S3,
    title: 'Pregunta 2 · Leer y reutilizar',
    summary: [],
    notes: 'Espera ~25 s y revela con V.',
    time: '15:15',
  }),
  // ── 04 ──
  S({
    id: 'sec-estado',
    label: '04 Un solo lugar para los datos',
    kind: 'content',
    section: S4,
    title: 'Regla 4: un solo lugar para los datos',
    summary: ['La IA decide qué mostrar; tu código hace las cuentas.'],
    notes: 'Vuelve al mapa: "Regla 4, dónde viven los datos."',
    time: '16:00',
  }),
  S({
    id: 'estado-libreta',
    label: 'Los datos',
    kind: 'content',
    section: S4,
    title: 'La IA decide qué mostrar; tu código hace las cuentas',
    summary: [
      'Todo lo que llega se guarda en un solo lugar (store), ordenado por id.',
      'Cada tarjeta escucha solo su id: si cambia un precio, se actualiza esa tarjeta, no la página entera.',
      'Lo que se calcula (ordenar, filtrar, totales) no se le pide al modelo: lo hace tu código, y si es pesado, en un Web Worker (en paralelo, sin congelar la página).',
    ],
    notes: 'Diagrama: lo que llega → los datos en un solo lugar → la pantalla. "El error común: pedirle al modelo que vuelva a generar la lista ordenada. Es lento, caro y puede equivocarse. Ordenar es trabajo de tu código."',
    time: '16:15',
    inSummary: true,
  }),
  S({
    id: 'estado-codigo',
    label: 'Store + Worker',
    kind: 'content',
    section: S4,
    title: 'Datos por id + Worker para lo pesado',
    summary: [
      'anotar(id, cambio) actualiza el dato y avisa solo a quien usa ese id.',
      'Al hacer clic: respuesta inmediata en pantalla (aria-busy) y el cálculo pesado en un Worker. Así el INP se queda en verde.',
    ],
    code: { file: 'demo-genui/src/genui/estado.ts', text: CODE_ESTADO },
    notes: 'Modo foco. "aria-busy muestra el indicador de carga en el mismo instante del clic: eso es lo que mide INP."',
    time: '17:00',
    inSummary: true,
  }),
  S({
    id: 'clip-estado',
    label: 'Demo · Estado',
    kind: 'demo',
    section: S4,
    title: 'Demo: ordenar mientras la IA escribe',
    summary: ['Ordenar 300 departamentos en el hilo principal congela la página; en un Worker, el clic responde al instante.'],
    notes: 'Clip: el contador de INP en rojo vs verde.',
    time: '17:45',
  }),
  S({
    id: 'medir',
    label: 'Cómo medirlo',
    kind: 'content',
    section: S5,
    title: 'Cómo comprobarlo en tu app (sin enredarte)',
    summary: [
      'En DevTools → Performance: simula un procesador 4× más lento, graba, pide una respuesta y detén.',
      'Insights te dice qué saltó (Layout shift culprits) y qué clic tardó (INP breakdown).',
      'Ponle nombre a tu trabajo: con performance.measure aparece tu propia línea ("Nido · UI generativa") en el panel.',
    ],
    code: { file: 'demo-genui/src/lab/pistas.ts', text: CODE_PISTA },
    notes: '"En la otra charla, Chrome DevTools para agentes, vemos cómo un agente de código hace esto por ti." Modo foco en la pista.',
    time: '18:30',
    inSummary: true,
  }),
  S({
    id: 'demo-vivo',
    label: 'Demo en vivo',
    kind: 'demo',
    section: S5,
    title: 'Demo en vivo: rompe y arregla Nido',
    summary: [
      'Prende rayos X (tecla X), apaga las 4 reglas y genera: mira saltos, contadores y el INP.',
      'Prende una regla a la vez y vuelve a generar con el mismo pedido.',
    ],
    notes: 'Guion (6 min): 1) Rayos X (tecla X), botón "Todo roto", generar "departamento de 2 dormitorios en Barranco con vista al mar". 2) Regla 1 → generar (CLS). 3) Regla 2 → generar (caracteres y veces que dibuja). 4) Regla 3 → "Actualizar precios" (elementos creados). 5) "Ordenar por precio/m²" con regla 4 apagada y prendida (INP). Si algo falla: los clips de cada capítulo.',
    time: '19:15',
  }),
  S({
    id: 'reglas-obra',
    label: 'Las 4 reglas',
    kind: 'content',
    section: S5,
    title: 'Las 4 reglas',
    summary: [
      'Reserva el espacio: el plano primero, cada componente con su tamaño.',
      'Lee cada parte una vez: un JSON por línea y un dibujo por cuadro.',
      'Reutiliza, no rehagas: un elemento por id; listas con pocas filas.',
      'Un solo lugar para los datos: guardados por id; lo pesado en un Worker.',
    ],
    notes: 'Recap lento, una por una, señalando cada estación.',
    time: '25:15',
    inSummary: true,
  }),
  S({
    id: 'q3',
    label: 'Pregunta 3',
    kind: 'poll',
    qid: 'q3',
    section: S5,
    title: 'Pregunta 3 · Los datos',
    summary: [],
    notes: 'Espera ~25 s y revela con V.',
    time: '26:00',
  }),
  S({
    id: 'muro',
    label: 'Muro de avatares',
    kind: 'wall',
    section: S5,
    title: 'El muro de avatares limeños',
    summary: ['Los avatares de la sala, con lo que cada persona se lleva de la charla.'],
    notes: 'Lee 2–3 mensajes. "Tráiganlo a la otra charla (DevTools para agentes): le cambian la ropa y suma +200." Clic en uno para ocultarlo (moderación).',
    time: '26:45',
  }),
  S({
    id: 'checklist',
    label: 'Para llevar',
    kind: 'content',
    section: S5,
    title: CHECKLIST_TITLE,
    summary: CHECKLIST.map(([h, p]) => `${h}: ${p}`),
    notes: '"Están en su memoria en PDF y en una guía para su agente de código en el repo."',
    time: '27:30',
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
    time: '28:15',
  }),
  S({
    id: 'gracias',
    label: 'Gracias',
    kind: 'end',
    section: S5,
    title: '¡Gracias, Lima!',
    summary: ['Descarga tu memoria (PDF) desde el celular. La otra charla: Chrome DevTools para agentes.'],
    notes: '"Descarguen su memoria. Y los espero con su avatar en la otra charla, DevTools para agentes (si es después de esta)." Preguntas (tecla Q).',
    time: '29:00',
  }),
];

export const genui: TalkContent = { SLIDES, CHECKLIST, CHECKLIST_TITLE, ASK_TOPICS, CODE: { plano: CODE_PLANO, parser: CODE_PARSER, claves: CODE_CLAVES, estado: CODE_ESTADO, pista: CODE_PISTA }, CODE_LANG: {} };
