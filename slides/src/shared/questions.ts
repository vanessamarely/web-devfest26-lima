// Las 3 preguntas del podio (estilo Kahoot) de cada charla.
// Aquí solo van el texto y las opciones: las respuestas correctas NO viven en el código
// (el bundle es público). Están en Firestore en un documento que solo la presentadora
// puede leer; al revelar, el deck publica únicamente la respuesta de esa pregunta.

import { TALK, type TalkId } from './config';

export type QuestionId = 'q1' | 'q2' | 'q3';
export type OptionId = 'a' | 'b' | 'c' | 'd';
export const QUESTION_IDS: QuestionId[] = ['q1', 'q2', 'q3'];

export interface Question {
  id: QuestionId;
  /** bloque de la charla que evalúa */
  topic: string;
  text: string;
  options: { id: OptionId; label: string }[];
}

export type AnswerKey = Partial<Record<QuestionId, { correct: OptionId; explain: string }>>;

/** Acepta { q1, q2, q3 } o { genui: {…}, agentes: {…} } (se toma la charla actual). */
export function parseAnswerKey(raw: unknown, talk: TalkId = TALK): AnswerKey {
  const out: AnswerKey = {};
  if (!raw || typeof raw !== 'object') throw new Error('El archivo no es un JSON de respuestas');
  const nested = (raw as Record<string, unknown>)[talk];
  if (nested && typeof nested === 'object') raw = nested;
  for (const q of QUESTION_IDS) {
    const a = (raw as Record<string, { correct?: string; explain?: string }>)[q];
    if (!a) continue;
    if (!['a', 'b', 'c', 'd'].includes(a.correct ?? '')) throw new Error(`${q}: "correct" debe ser a, b, c o d`);
    out[q] = { correct: a.correct as OptionId, explain: String(a.explain ?? '').slice(0, 400) };
  }
  if (!Object.keys(out).length) throw new Error('No encontré q1, q2 ni q3');
  return out;
}

const BY_TALK: Record<TalkId, Record<QuestionId, Question>> = {
  genui: {
    q1: {
      id: 'q1',
      topic: 'Reserva el espacio',
      text: 'Una tarjeta generada llega tarde y empuja todo hacia abajo. ¿Qué empeora y cómo se evita?',
      options: [
        { id: 'a', label: 'El INP; guardando en caché las respuestas del modelo' },
        { id: 'b', label: 'El CLS; reservando su espacio con medidas finales antes de que llegue' },
        { id: 'c', label: 'El LCP; quitando todas las imágenes' },
        { id: 'd', label: 'Nada: los saltos no se pueden medir' },
      ],
    },
    q2: {
      id: 'q2',
      topic: 'Streaming y DOM',
      text: 'Llegan 300 trozos de la respuesta. ¿Qué evita releer todo desde el inicio y pintar 300 veces?',
      options: [
        { id: 'a', label: 'JSON.parse de todo el texto recibido en cada trozo' },
        { id: 'b', label: 'innerHTML de toda la vista en cada trozo' },
        { id: 'c', label: 'JSON por líneas (cada carácter se lee una vez) y un render por frame' },
        { id: 'd', label: 'Esperar 5 segundos y pintar todo junto' },
      ],
    },
    q3: {
      id: 'q3',
      topic: 'Estado',
      text: 'En una UI generativa rápida, ¿quién ordena por precio los 300 depas que ya llegaron?',
      options: [
        { id: 'a', label: 'El modelo de IA, generando otra vez la lista' },
        { id: 'b', label: 'Tu código, desde un store por id (y si pesa, en un Worker)' },
        { id: 'c', label: 'El CSS, con order: price' },
        { id: 'd', label: 'Nadie: se recarga la página' },
      ],
    },
  },
  agentes: {
    q1: {
      id: 'q1',
      topic: '¿Qué ve el agente?',
      text: '¿Qué usa un agente como su mapa principal para entender los controles de tu página?',
      options: [
        { id: 'a', label: 'La paleta de colores del sitio' },
        { id: 'b', label: 'El árbol de accesibilidad: rol, nombre y estado de cada elemento' },
        { id: 'c', label: 'Los comentarios del HTML' },
        { id: 'd', label: 'El archivo CSS' },
      ],
    },
    q2: {
      id: 'q2',
      topic: 'DevTools for agents',
      text: 'Con Chrome DevTools for agents, ¿qué puede hacer tu agente de código?',
      options: [
        { id: 'a', label: 'Solo leer el código fuente del repo' },
        { id: 'b', label: 'Controlar un Chrome real: navegar, hacer clic, leer consola y red, grabar trazas' },
        { id: 'c', label: 'Reemplazar a Chrome por otro navegador' },
        { id: 'd', label: 'Publicar tu web en producción' },
      ],
    },
    q3: {
      id: 'q3',
      topic: 'IA del cliente',
      text: 'Tu asistente con IA local responde una pregunta vieja cuando la persona ya hizo otra. ¿Qué lo arregla?',
      options: [
        { id: 'a', label: 'Subir el tiempo de espera' },
        { id: 'b', label: 'Recargar la página después de cada pregunta' },
        { id: 'c', label: 'Usar un modelo más grande' },
        { id: 'd', label: 'Cancelar la anterior con AbortController y responder en streaming' },
      ],
    },
  },
};

export const QUESTIONS: Record<QuestionId, Question> = BY_TALK[TALK];
