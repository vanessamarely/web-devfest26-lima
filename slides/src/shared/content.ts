// Fuente única del contenido "de bolsillo" de cada slide, para LAS DOS charlas.
//  · El deck solo transmite { index, id }: el celular busca aquí el título y los puntos clave.
//  · La consola de la presentadora lee `notes` (guion) y `time`.
//  · La memoria descargable usa `summary` de TODOS los slides, aunque alguien llegue tarde.
//  · El contenido de cada charla vive en talks/genui.ts (Día 1) y talks/agentes.ts (Día 2).
import { BREVE, TALK } from './config';
import type { QuestionId } from './questions';
import { genui } from './talks/genui';
import { agentes } from './talks/agentes';
import { armarBreve } from './talks/agentes-breve';

export type LiveKind = 'content' | 'join' | 'demo' | 'poll' | 'wall' | 'podium' | 'end';

export interface SlideContent {
  id: string;
  label: string;
  kind: LiveKind;
  /** Pregunta del podio (solo kind 'poll') */
  qid?: QuestionId;
  /** Título que ve el público en el celular y en la memoria */
  title: string;
  /** Sección (para agrupar la memoria) */
  section?: string;
  /** Lo más importante del slide: 1–4 frases cortas */
  summary: string[];
  /** Código de referencia (se muestra en el celular y entra a la memoria) */
  code?: { file: string; text: string };
  /** Guion de la presentadora (solo consola) */
  notes: string;
  /** Minuto aproximado en que empieza (charla de 30 min) */
  time: string;
  /** Este slide entra a la memoria descargable */
  inSummary?: boolean;
}

export interface TalkContent {
  SLIDES: SlideContent[];
  CHECKLIST: [string, string][];
  CHECKLIST_TITLE: string;
  ASK_TOPICS: readonly string[];
  /** Código que el deck inyecta en [data-code="clave"] */
  CODE: Record<string, string>;
  /** Lenguaje para resaltar (por defecto js) */
  CODE_LANG: Record<string, 'js' | 'html'>;
}

export const CONTENT_BY_TALK = { genui, agentes } as const;
/** La versión breve de la charla 2 (/agentes-breve/) usa un subconjunto de sus slides. */
const C = BREVE ? armarBreve(agentes) : CONTENT_BY_TALK[TALK];

export const SLIDES = C.SLIDES;
export const CHECKLIST = C.CHECKLIST;
export const CHECKLIST_TITLE = C.CHECKLIST_TITLE;
export const ASK_TOPICS = C.ASK_TOPICS;
export const CODE = C.CODE;
export const CODE_LANG = C.CODE_LANG;
export const SLIDE_BY_ID = new Map(SLIDES.map((s) => [s.id, s]));
