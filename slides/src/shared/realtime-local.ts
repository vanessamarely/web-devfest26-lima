import { NS, OTHER_SESSION_ID, SESSION_ID } from './config';
import { nameKey } from './names';
import type { AnswerKey, QuestionId } from './questions';
import { emptySlide, type AudienceQuestion, type AvatarData, type Player, type Reaction, type Realtime, type SlideState, type VoteRecord, type Votes } from './realtime';

interface LocalDb {
  /** versión: sube con cada escritura (la pestaña usa la copia más nueva que conozca) */
  v?: number;
  slide: SlideState;
  players: Record<string, string>;
  /** uid → epoch ms de la primera entrada */
  joinedAt: Record<string, number>;
  /** nameKey → uid */
  names: Record<string, string>;
  votes: Record<string, VoteRecord>;
  avatares: Record<string, AvatarData>;
  questions: Record<string, AudienceQuestion>;
  answers: AnswerKey | null;
}

const keyFor = (sid: string) => `${NS}.local.db.${sid}`;
const KEY = keyFor(SESSION_ID);
const OTHER_KEY = keyFor(OTHER_SESSION_ID);
const empty = (): LocalDb => ({ slide: emptySlide(), players: {}, joinedAt: {}, names: {}, votes: {}, avatares: {}, questions: {}, answers: null });

/** La copia más nueva que llegó por BroadcastChannel (el localStorage de otra pestaña puede ir atrasado). */
let cache: LocalDb | null = null;

function read(key = KEY): LocalDb {
  let db: LocalDb;
  try {
    db = { ...empty(), ...JSON.parse(localStorage.getItem(key) || '{}') } as LocalDb;
  } catch {
    db = empty();
  }
  if (key === KEY && cache && (cache.v ?? 0) > (db.v ?? 0)) db = structuredClone(cache);
  db.slide = { ...emptySlide(), ...db.slide };
  return db;
}

/** Modo ensayo: sin red. Cada pestaña es un asistente distinto. */
export function createLocalRealtime(): Realtime {
  const channel = new BroadcastChannel(`${NS}-live-${SESSION_ID}`);
  const otherChannel = new BroadcastChannel(`${NS}-live-${OTHER_SESSION_ID}`);
  const listeners = new Set<(db: LocalDb) => void>();
  const reactionListeners = new Set<(r: Reaction, uid: string) => void>();

  let uid: string | null;
  try {
    uid = sessionStorage.getItem(`${NS}.uid`);
    if (!uid) sessionStorage.setItem(`${NS}.uid`, (uid = 'local-' + crypto.randomUUID().slice(0, 8)));
  } catch {
    uid = 'local-' + Math.random().toString(36).slice(2, 10);
  }
  const me = uid;

  const emit = () => {
    const db = read();
    listeners.forEach((l) => l(db));
  };
  const write = (fn: (db: LocalDb) => void) => {
    const db = read();
    fn(db);
    db.v = (db.v ?? 0) + 1;
    cache = structuredClone(db);
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* cuota llena */
    }
    // El mensaje lleva la base completa: el localStorage de otras pestañas puede llegar tarde.
    channel.postMessage({ type: 'db', db });
    emit();
  };
  channel.onmessage = (e) => {
    if (e.data?.type === 'db') {
      const db = e.data.db as LocalDb | undefined;
      if (db && (db.v ?? 0) >= (cache?.v ?? 0)) cache = db;
      emit();
    }
    if (e.data?.type === 'reaction') reactionListeners.forEach((l) => l(e.data.r, e.data.uid));
  };
  const sub = (fn: (db: LocalDb) => void) => {
    listeners.add(fn);
    queueMicrotask(() => fn(read()));
    return () => {
      listeners.delete(fn);
    };
  };
  // En ensayo local "presentadora" = quien abre el deck con ?presenter.
  const isPresenter = () => new URLSearchParams(location.search).has('presenter');

  return {
    mode: 'local',
    uid: () => me,

    async patchSlide(s) {
      write((db) => (db.slide = { ...db.slide, ...s }));
    },
    async openQuestion(q: QuestionId) {
      write((db) => (db.slide.openedAt = { ...db.slide.openedAt, [q]: Date.now() }));
    },
    async markEarlyEnd() {
      write((db) => (db.slide.earlyUntil ??= Date.now()));
    },
    onSlide: (cb) => sub((db) => cb(db.slide)),

    async reserveName(name) {
      const k = nameKey(name);
      let ok = false;
      write((db) => {
        const owner = db.names[k];
        if (!owner || owner === me) {
          db.names[k] = me;
          ok = true;
        }
      });
      return ok;
    },
    async takenNames(names) {
      const db = read();
      return new Set(names.filter((n) => db.names[nameKey(n)] && db.names[nameKey(n)] !== me));
    },
    async join(name) {
      write((db) => {
        db.players[me] = name;
        db.joinedAt ??= {};
        db.joinedAt[me] ??= Date.now();
      });
    },
    async vote(q, option) {
      write((db) => {
        const rec = db.votes[me] ?? { uid: me, votes: {}, at: {} };
        if (rec.votes[q]) return; // una respuesta por pregunta
        rec.votes[q] = option;
        rec.at[q] = Date.now();
        db.votes[me] = rec;
      });
    },
    onMyVotes: (cb) => sub((db) => cb((db.votes[me]?.votes ?? {}) as Votes)),
    async react(r) {
      channel.postMessage({ type: 'reaction', r, uid: me });
      reactionListeners.forEach((l) => l(r, me));
    },
    async ask(q) {
      const id = crypto.randomUUID().slice(0, 8);
      write((db) => (db.questions[id] = { ...q, id, uid: me, at: Date.now() }));
    },
    async publishAvatar(d) {
      write((db) => (db.avatares[me] = { ...d, id: me, createdAt: db.avatares[me]?.createdAt ?? Date.now(), hidden: db.avatares[me]?.hidden ?? false }));
    },
    async myOtherAvatar() {
      return read(OTHER_KEY).avatares[me] ?? null;
    },

    onPlayers: (cb) => sub((db) => cb(Object.entries(db.players).map(([id, name]): Player => ({ id, name, at: db.joinedAt?.[id] })))),
    onVotes: (cb) => sub((db) => cb(Object.values(db.votes))),
    onReaction(cb) {
      reactionListeners.add(cb);
      return () => {
        reactionListeners.delete(cb);
      };
    },
    onAvatars: (cb) => sub((db) => cb(Object.values(db.avatares).sort((a, b) => b.createdAt - a.createdAt))),
    onOtherAvatars(cb) {
      const emitOther = () => cb(new Map(Object.values(read(OTHER_KEY).avatares).filter((p) => !p.hidden).map((p) => [p.id, p.opts])));
      const h = (e: MessageEvent) => {
        if (e.data?.type !== 'db') return;
        const db = e.data.db as LocalDb | undefined;
        if (db) cb(new Map(Object.values(db.avatares ?? {}).filter((p) => !p.hidden).map((p) => [p.id, p.opts])));
        else emitOther();
      };
      otherChannel.addEventListener('message', h);
      queueMicrotask(emitOther);
      return () => otherChannel.removeEventListener('message', h);
    },
    onQuestions: (cb) => sub((db) => cb(Object.values(db.questions).sort((a, b) => a.at - b.at))),
    async removeQuestion(id) {
      write((db) => delete db.questions[id]);
    },
    async setAvatarHidden(id, hidden) {
      write((db) => {
        if (db.avatares[id]) db.avatares[id].hidden = hidden;
      });
    },
    async resetSession() {
      const db = read();
      const n = Object.keys(db.players).length + Object.keys(db.avatares).length + Object.keys(db.questions).length + Object.keys(db.votes).length;
      write((d) => Object.assign(d, { ...empty(), answers: d.answers }));
      return n;
    },

    onAgenda(cb) {
      // En ensayo la agenda vive en localStorage; otras pestañas se enteran por el evento storage.
      const leer = () => {
        const v = localStorage.getItem(`${NS}.agenda.primera`);
        cb(v === 'genui' || v === 'agentes' ? v : null);
      };
      const h = (e: StorageEvent) => e.key === `${NS}.agenda.primera` && leer();
      addEventListener('storage', h);
      queueMicrotask(leer);
      return () => removeEventListener('storage', h);
    },
    async setAgenda(primera) {
      localStorage.setItem(`${NS}.agenda.primera`, primera);
    },

    async loadAnswers() {
      return isPresenter() ? read().answers : null;
    },
    async saveAnswers(a) {
      write((db) => (db.answers = a));
    },

    async signInPresenter() {
      return true;
    },
    isPresenterSession: isPresenter,
  };
}
