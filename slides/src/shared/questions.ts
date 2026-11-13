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
        { id: 'a', label: 'El INP; se evita guardando las respuestas del modelo' },
        { id: 'b', label: 'El CLS; se evita reservando su espacio con el tamaño final antes de que llegue' },
        { id: 'c', label: 'El LCP; se evita quitando todas las imágenes' },
        { id: 'd', label: 'Nada: los saltos no se pueden medir' },
      ],
    },
    q2: {
      id: 'q2',
      topic: 'Leer y reutilizar',
      text: 'Mientras la IA responde, corrige el precio de 1 de los 300 departamentos. ¿Qué hace una interfaz rápida?',
      options: [
        { id: 'a', label: 'Vuelve a leer toda la respuesta y recrea la lista completa con innerHTML' },
        { id: 'b', label: 'Lee solo la línea nueva y cambia únicamente el precio de esa tarjeta' },
        { id: 'c', label: 'Espera a que termine la respuesta y recarga la página' },
        { id: 'd', label: 'Le pide al modelo que vuelva a escribir la lista completa' },
      ],
    },
    q3: {
      id: 'q3',
      topic: 'Los datos',
      text: 'Ya llegaron 300 departamentos. ¿Quién debería ordenarlos por precio?',
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
      text: '¿Qué usa un agente como su mapa principal para entender los botones y campos de tu página?',
      options: [
        { id: 'a', label: 'Los colores del sitio' },
        { id: 'b', label: 'El árbol de accesibilidad: qué es cada elemento, cómo se llama y si se puede usar' },
        { id: 'c', label: 'Los comentarios del HTML' },
        { id: 'd', label: 'El archivo CSS' },
      ],
    },
    q2: {
      id: 'q2',
      topic: 'El agente es más rápido',
      text: 'Un agente hace clic en «Reservar» antes de que carguen los horarios. ¿Qué lo evita?',
      options: [
        { id: 'a', label: 'Pintar el botón de gris con CSS mientras carga' },
        { id: 'b', label: 'Desactivarlo de verdad (disabled y aria-busy) hasta que todo cargue' },
        { id: 'c', label: 'Agregar una espera fija de 5 segundos antes de mostrar el botón' },
        { id: 'd', label: 'Pedirle al agente que vaya más lento' },
      ],
    },
    q3: {
      id: 'q3',
      topic: 'La IA de tu página',
      text: 'Tu asistente con IA local responde una pregunta vieja cuando la persona ya hizo otra. ¿Qué lo arregla?',
      options: [
        { id: 'a', label: 'Esperar más tiempo a que responda' },
        { id: 'b', label: 'Recargar la página después de cada pregunta' },
        { id: 'c', label: 'Usar un modelo más grande' },
        { id: 'd', label: 'Cancelar la pregunta anterior (AbortController) y responder por partes' },
      ],
    },
  },
};

export const QUESTIONS: Record<QuestionId, Question> = BY_TALK[TALK];
