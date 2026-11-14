// Versión breve de «Chrome DevTools para agentes» (unos 10 minutos de contenido).
// Reutiliza los slides de la charla completa (mismo texto para el celular y la memoria),
// en otro orden, con su propio minuto y notas cortas. Sin preguntas ni podio; el muro se queda.
import type { SlideContent, TalkContent } from '../content';

/** Slides de la versión breve, en orden, con el minuto en que empiezan y la nota para la consola. */
export const BREVE: { id: string; time: string; notes: string; summary?: string[]; title?: string }[] = [
  {
    id: 'portada',
    time: '0:00',
    notes: '"Hola, Lima. Soy Vanessa Aristizabal. En 10 minutos: cómo ver lo que un agente ve, hace y piensa en tu web, con Chrome DevTools." Pasa rápido.',
    summary: ['Los agentes ya navegan, leen y hacen clic en tu web. Chrome DevTools ahora te deja ver lo que ven, hacen y piensan.'],
  },
  {
    id: 'unete',
    time: '0:30',
    title: 'Únete a la charla',
    notes: 'Deja el QR 20 segundos mientras hablas: "Escaneen: ven cada slide en el celular, toman notas y al final descargan la memoria en PDF. Si quieren, creen su avatar: al final lo vemos en el muro."',
    summary: ['Escanea el QR: sigue los slides en tu celular, toma notas y crea tu avatar para el muro.'],
  },
  {
    id: 'dos-visitantes',
    time: '1:00',
    notes: '"Su web ahora tiene dos visitantes: personas y agentes. DevTools siempre nos mostró lo que ve una persona; ahora necesitamos ver lo que ve un agente." Una frase por columna.',
  },
  {
    id: 'como-ve',
    time: '1:45',
    notes: '"Un agente ve su página de cuatro formas. La que más usa es el árbol de accesibilidad: qué es cada control, cómo se llama y si se puede usar. Si su página es accesible, ya hicieron la mitad del trabajo."',
  },
  {
    id: 'devtools-agentes',
    time: '2:45',
    notes: '"Chrome DevTools for agents: un servidor MCP que conectan a su agente de código (Claude Code, Gemini CLI, Cursor). Su agente controla un Chrome real: navega, llena formularios, lee la consola y la red, mide y corre Lighthouse." No entres al código.',
  },
  {
    id: 'clip-ve',
    time: '3:45',
    notes: '"Ejemplo con la demo Mesa: el botón de reservar es un div con un ícono. Para el agente es generic, no sabe que se puede tocar. Con un button de verdad, lo encuentra al primer intento." Deja correr el clip.',
  },
  {
    id: 'hizo-webmcp',
    time: '4:45',
    notes: '"Lo nuevo: en Application hay un panel WebMCP. Ven las funciones que su página ofrece al agente y cada vez que las usó: con qué datos y qué respondió. Si el agente falla, aquí ven si fue él o su función."',
  },
  {
    id: 'simular-bucle',
    time: '5:45',
    notes: '"Y su agente de código puede probar su web como un usuario: navega, mira, hace clic, espera y mide, incluso con CPU o red lentas. Así encuentran lo que solo falla cuando el agente va más rápido que una persona." Lee el prompt de ejemplo.',
  },
  {
    id: 'devtools-real',
    time: '6:45',
    notes: '"Así se ve en DevTools de verdad." Toca 1 o 2 clips para agrandarlos (árbol de accesibilidad y WebMCP). Menciona Lighthouse Agentic browsing. Máximo 1 minuto.',
  },
  {
    id: 'razonar',
    time: '7:45',
    notes: 'Cierre del contenido: "Una web fácil para agentes es legible (elementos nativos con nombre y estado), accionable (funciones claras con errores que explican) y estable (nada se mueve ni se adelanta). Lighthouse lo revisa por ustedes."',
  },
  {
    id: 'muro',
    time: '8:45',
    notes: '"Miren el muro." Toma tu captura. Lee 1 o 2 mensajes. Clic en un avatar para ocultarlo si hace falta.',
    summary: ['Los avatares de la sala, con lo que cada persona se lleva de la charla.'],
  },
  {
    id: 'gracias',
    time: '9:30',
    notes: '"Gracias, Lima. Descarguen la memoria en PDF desde el celular: tiene todo lo de hoy y una guía para su agente de código en el repositorio."',
    summary: ['Descarga tu memoria (PDF) desde el celular.'],
  },
];

/** Contenido de la versión breve, armado desde la charla completa. */
export function armarBreve(completa: TalkContent): TalkContent {
  const porId = new Map(completa.SLIDES.map((s) => [s.id, s]));
  const SLIDES: SlideContent[] = BREVE.map((b) => {
    const s = porId.get(b.id);
    if (!s) throw new Error(`La versión breve usa un slide que no existe: ${b.id}`);
    return { ...s, time: b.time, notes: b.notes, summary: b.summary ?? s.summary, title: b.title ?? s.title };
  });
  return { ...completa, SLIDES };
}
