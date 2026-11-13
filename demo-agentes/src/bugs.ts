// Los 4 bugs de la charla, uno por capítulo. Se prenden y apagan en el Panel del agente.
//  1 · ¿Qué ve?      botón "Reservar" hecho con un div con ícono (sin rol ni nombre)
//  2 · ¿Qué hizo?    la tool devuelve "Error" a secas
//  3 · Carrera       el botón "parece" deshabilitado (gris), pero se puede usar antes de que carguen los horarios
//  4 · IA local      la recomendación corre en el hilo principal, sin streaming ni abort
export type BugId = 'div' | 'error' | 'carrera' | 'ia';
export const BUGS: { id: BugId; n: number; titulo: string; sub: string }[] = [
  { id: 'div', n: 1, titulo: 'Botón sin nombre', sub: 'Un div con ícono en vez de <button>' },
  { id: 'error', n: 2, titulo: 'Error sin explicación', sub: 'La función responde solo "Error"' },
  { id: 'carrera', n: 3, titulo: 'Clic antes de tiempo', sub: 'Se ve gris, pero se puede usar antes de que cargue' },
  { id: 'ia', n: 4, titulo: 'IA que congela', sub: 'Bloquea la página y no cancela la pregunta anterior' },
];

const params = new URLSearchParams(location.search);
const pre = params.get('bugs');
export const bugs: Record<BugId, boolean> = { div: false, error: false, carrera: false, ia: false };
if (pre === 'todos') for (const b of BUGS) bugs[b.id] = true;
else if (pre) for (const id of pre.split(',')) if (id in bugs) bugs[id as BugId] = true;

const listeners = new Set<() => void>();
export const onBugs = (fn: () => void) => listeners.add(fn);
export function setBug(id: BugId, on: boolean) {
  bugs[id] = on;
  listeners.forEach((f) => f());
}
/** Red "lenta" para los horarios: 2,4 s con el bug de carrera (o ?red=lenta), 400 ms si no. */
export const latencia = () => (bugs.carrera || params.get('red') === 'lenta' ? 2400 : 400);
