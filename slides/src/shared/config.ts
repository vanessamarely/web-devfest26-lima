// Configuración de las DOS charlas de DevFest Lima 2026 (un día cada una).
// Un solo sitio de slides sirve ambos decks (/genui/ y /agentes/), la app de asistentes (/live/)
// y la consola (/presenter/). Cada charla tiene su propia sesión en vivo; el muro de pelícanos
// es el mismo componente y quien ya publicó su pelícano en la OTRA charla suma +200.
export const REPO_OWNER = 'vanessamarely';
export const REPO_NAME = 'web-devfest26-lima';
export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
export const PRESENTER_GITHUB_ID = '4331491';

export const EVENT = 'DevFest Lima 2026';
export const SPEAKER = 'Vanessa Aristizabal';
export const SPEAKER_HANDLE = '@vanessamarelycode';
/** Prefijo de claves de localStorage / BroadcastChannel (no chocar con otras charlas en el mismo origen). */
export const NS = 'dflima';

export type TalkId = 'genui' | 'agentes';
export const TALK_IDS: TalkId[] = ['genui', 'agentes'];

export interface TalkMeta {
  id: TalkId;
  day: string;
  title: string;
  titleEs: string;
  /** Texto corto para chips y menús */
  short: string;
  deckPath: string;
  demoName: string;
  demoTagline: string;
  skillName: string;
  skillLabel: string;
  /** Variables de entorno de la demo publicada */
  demoEnv?: string;
  demoFallback: string;
  demoDevPort: number;
}

export const TALKS: Record<TalkId, TalkMeta> = {
  genui: {
    id: 'genui',
    day: 'Día 1',
    title: 'Web performance en la era de la UI generativa',
    titleEs: 'Optimizing Web Performance in the Era of Generative UI',
    short: 'UI generativa rápida',
    deckPath: '/genui/',
    demoName: 'Nido',
    demoTagline: 'Buscador de depas con IA',
    skillName: 'genui-performance',
    skillLabel: 'Guía de performance para UI generativa (para tu agente de código)',
    demoEnv: import.meta.env.VITE_DEMO_GENUI_URL as string | undefined,
    demoFallback: 'https://devfest-lima-nido.web.app',
    demoDevPort: 5184,
  },
  agentes: {
    id: 'agentes',
    day: 'Día 2',
    title: 'Chrome DevTools para agentes',
    titleEs: 'Chrome DevTools for Agents',
    short: 'DevTools para agentes',
    deckPath: '/agentes/',
    demoName: 'Mesa',
    demoTagline: 'Reservas de restaurantes en Lima',
    skillName: 'devtools-for-agents',
    skillLabel: 'Guía de DevTools para agentes (para tu agente de código)',
    demoEnv: import.meta.env.VITE_DEMO_AGENTES_URL as string | undefined,
    demoFallback: 'https://devfest-lima-mesa.web.app',
    demoDevPort: 5185,
  },
};

const params = new URLSearchParams(location.search);
const LAST_TALK_KEY = `${NS}.lastTalk`;

/** ¿Qué charla es? ?talk= gana; luego la ruta (/genui/, /agentes/); luego la última usada. */
function detectTalk(): TalkId {
  const p = params.get('talk');
  if (p === 'genui' || p === 'agentes') return remember(p);
  if (location.pathname.startsWith('/agentes')) return remember('agentes');
  if (location.pathname.startsWith('/genui')) return remember('genui');
  try {
    const last = localStorage.getItem(LAST_TALK_KEY);
    if (last === 'genui' || last === 'agentes') return last;
  } catch {
    /* noop */
  }
  return 'genui';
}
function remember(t: TalkId): TalkId {
  try {
    localStorage.setItem(LAST_TALK_KEY, t);
  } catch {
    /* noop */
  }
  return t;
}

export const TALK: TalkId = detectTalk();
export const OTHER_TALK: TalkId = TALK === 'genui' ? 'agentes' : 'genui';
export const META = TALKS[TALK];
export const TALK_TITLE = META.title;
export const TALK_TITLE_ES = META.titleEs;

/** ?session=ensayo1 usa una sesión aparte (ideal para ensayar sin ensuciar la de la charla). */
export const SESSION_PARAM = params.get('session');
const sessionBase = SESSION_PARAM || (import.meta.env.VITE_SESSION_BASE as string | undefined) || 'devfest-lima-2026';
export const sessionFor = (t: TalkId) => `${sessionBase}-${t}`;
export const SESSION_ID = sessionFor(TALK);
/** La sesión de la otra charla: de ahí sale el bono +200 por traer tu pelícano. */
export const OTHER_SESSION_ID = sessionFor(OTHER_TALK);

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** ?local fuerza el modo ensayo (BroadcastChannel) aunque haya config de Firebase. */
export const hasFirebase = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId) && !params.has('local');

export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Skill (guía para agentes de código) de cada charla. */
export const skillUrl = (t: TalkId) => `${REPO_URL}/tree/main/skills/${TALKS[t].skillName}`;
export const SKILL_URL = skillUrl(TALK);
export const SKILL_LABEL = META.skillLabel;

/** URLs públicas: los slides enlazan a la demo y viceversa (en local, los puertos de Vite). */
export const SLIDES_URL = import.meta.env.DEV ? 'http://localhost:5183' : (import.meta.env.VITE_SLIDES_URL as string) || location.origin;
export const demoUrlFor = (t: TalkId) => (import.meta.env.DEV ? `http://localhost:${TALKS[t].demoDevPort}` : TALKS[t].demoEnv || TALKS[t].demoFallback);
export const DEMO_URL = demoUrlFor(TALK);

/** URLs públicas para lo que la gente se lleva (memoria PDF/HTML/Markdown): nunca localhost. */
export const PUBLIC_SLIDES_ROOT = ((import.meta.env.VITE_SLIDES_URL as string) || 'https://devfest-lima-slides.web.app').replace(/\/$/, '');
export const PUBLIC_SLIDES_URL = PUBLIC_SLIDES_ROOT + META.deckPath;
export const PUBLIC_DEMO_URL = META.demoEnv || META.demoFallback;

/** Conserva ?local, ?session y la charla al construir enlaces entre deck, consola y app de asistentes. */
export function withSessionParams(path: string): string {
  const url = new URL(path, location.origin);
  url.searchParams.set('talk', TALK);
  if (SESSION_PARAM) url.searchParams.set('session', SESSION_PARAM);
  if (params.has('local')) url.searchParams.set('local', '');
  return url.toString();
}

/**
 * URL de la app de asistentes para el QR y el texto en pantalla. Los celulares no pueden abrir
 * "localhost": si presentas desde tu máquina, apuntamos a la versión publicada (VITE_SLIDES_URL).
 * Con ?local (ensayo en una sola máquina, BroadcastChannel) se queda en este mismo origen.
 */
export function publicLiveUrl(): string {
  const published = import.meta.env.VITE_SLIDES_URL as string | undefined;
  const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const origin = isLocalHost && !params.has('local') && published ? published : location.origin;
  const url = new URL('/live/', origin);
  url.searchParams.set('talk', TALK);
  if (SESSION_PARAM) url.searchParams.set('session', SESSION_PARAM);
  if (params.has('local')) url.searchParams.set('local', '');
  return url.toString();
}

/** Texto corto de una URL para mostrarla en pantalla (sin https:// ni barra final). */
export const prettyUrl = (u: string) => u.replace(/^https?:\/\//, '').replace(/\?$/, '').replace(/\/$/, '');
