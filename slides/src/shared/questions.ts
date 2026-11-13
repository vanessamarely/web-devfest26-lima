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
      text: 'La IA todavía está respondiendo. El mapa llega tarde y empuja hacia abajo lo que la persona estaba leyendo. ¿Cómo se evita ese salto?',
      options: [
        { id: 'a', label: 'Guardar las respuestas de la IA para la próxima vez' },
        { id: 'b', label: 'Reservar el espacio del mapa con su tamaño final antes de que llegue' },
        { id: 'c', label: 'Quitar todas las imágenes de la página' },
        { id: 'd', label: 'No se puede evitar: la IA siempre responde por partes' },
      ],
    },
    q2: {
      id: 'q2',
      topic: 'Leer y reutilizar',
      text: 'La página ya muestra 300 departamentos. La IA envía una línea más: un departamento bajó de precio. ¿Qué debería hacer la página?',
      options: [
        { id: 'a', label: 'Leer otra vez toda la respuesta y volver a dibujar la lista completa' },
        { id: 'b', label: 'Leer solo esa línea nueva y cambiar únicamente ese precio' },
        { id: 'c', label: 'Esperar a que la IA termine y recargar la página' },
        { id: 'd', label: 'Pedirle a la IA que vuelva a enviar los 300 departamentos' },
      ],
    },
    q3: {
      id: 'q3',
      topic: 'Los datos',
      text: 'Ya llegaron los 300 departamentos y la persona toca «Ordenar por precio». ¿Quién debería ordenarlos?',
      options: [
        { id: 'a', label: 'La IA, escribiendo otra vez toda la lista' },
        { id: 'b', label: 'Tu código, con los datos en un solo lugar (y si es pesado, en un Worker)' },
        { id: 'c', label: 'El CSS de la página' },
        { id: 'd', label: 'Nadie: es mejor recargar la página' },
      ],
    },
  },
  agentes: {
    q1: {
      id: 'q1',
      topic: '¿Qué ve el agente?',
      text: 'El botón «Reservar» de tu página es un div con un ícono. Cuando el agente mira la página, ¿qué encuentra en ese lugar?',
      options: [
        { id: 'a', label: 'Un botón llamado «Reservar», igual que una persona' },
        { id: 'b', label: 'Algo sin nombre («generic») que no sabe que se puede tocar' },
        { id: 'c', label: 'La imagen del ícono, y entiende qué significa' },
        { id: 'd', label: 'Nada: los agentes solo leen el texto de la página' },
      ],
    },
    q2: {
      id: 'q2',
      topic: 'El agente es más rápido',
      text: 'Los horarios todavía están cargando. El botón «Reservar» se ve gris, pero solo por CSS, y el agente hace clic igual. ¿Qué lo evita?',
      options: [
        { id: 'a', label: 'Usar un gris más oscuro' },
        { id: 'b', label: 'Desactivarlo de verdad (disabled y aria-busy) hasta que carguen los horarios' },
        { id: 'c', label: 'Esperar siempre 5 segundos antes de mostrar el botón' },
        { id: 'd', label: 'Pedirle al agente que vaya más lento' },
      ],
    },
    q3: {
      id: 'q3',
      topic: 'La IA de tu página',
      text: 'Alguien le pregunta a la IA de tu página «¿Qué pedimos para 4?». La página se congela y, cuando cambia la pregunta, aparece la respuesta vieja. ¿Qué lo arregla?',
      options: [
        { id: 'a', label: 'Usar un modelo más grande' },
        { id: 'b', label: 'Recargar la página después de cada pregunta' },
        { id: 'c', label: 'Mostrar la respuesta por partes y cancelar la pregunta anterior' },
        { id: 'd', label: 'Esperar más tiempo a que termine' },
      ],
    },
  },
};

export const QUESTIONS: Record<QuestionId, Question> = BY_TALK[TALK];
