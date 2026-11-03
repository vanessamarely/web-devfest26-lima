// Crea tu limeñ@: avatar de una persona de la Lima de hoy (malecón, Barranco, cevichería,
// parapente, cowork). Variado a propósito: pelo largo o corto, pestañas, aretes, labios, barba,
// falda, vestido o jean; nadie tiene que verse igual (ni todos masculinos).
//
// Un mismo avatar sirve para LAS DOS charlas: cada charla guarda su propia versión (puedes
// cambiarle la ropa, el gorro o lo que lleva al pasar de un día al otro) y quien lo
// trae de la otra charla suma +200 en el podio.
//
// Todo se dibuja en el dispositivo con SVG (y canvas para el PNG): sin red, sin fotos.
// Al muro solo viajan las opciones (pocos bytes); el deck vuelve a dibujar el SVG.
import { EVENT, SPEAKER, SPEAKER_HANDLE, TALKS, TALK, type TalkId } from './config';

export interface AvatarOptions {
  piel: number;
  pelo: number;
  colorPelo: number;
  ropa: number;
  gorro: number;
  lentes: number;
  expresion: number;
  accesorio: number;
  rasgos: number;
  abajo: number;
}

export const DEFAULT_AVATAR: AvatarOptions = { piel: 2, pelo: 8, colorPelo: 0, ropa: 0, gorro: 0, lentes: 0, expresion: 0, accesorio: 1, rasgos: 3, abajo: 1 };

export const PIELES = ['#f8d9bd', '#eabf98', '#cf9a6e', '#a8714a', '#7a4b2e', '#5a3420'] as const;
export const PELOS = ['Corto', 'Rulos', 'Cola alta', 'Trenza larga', 'Bob', 'Rapado', 'Moño', 'Afro', 'Largo suelto'] as const;
export const RASGOS = ['Ninguno', 'Pestañas', 'Aretes', 'Pestañas y aretes', 'Labios y pestañas', 'Barba', 'Bigote', 'Pecas'] as const;
export const ABAJOS = ['Jean', 'Falda', 'Short', 'Vestido'] as const;
export const COLORES_PELO = [
  { label: 'Negro', c: '#231a14' },
  { label: 'Castaño', c: '#5b3a24' },
  { label: 'Cobre', c: '#a4502a' },
  { label: 'Rubio', c: '#d9a94a' },
  { label: 'Canas', c: '#c9c9c9' },
  { label: 'Fantasía', c: '#7b43e6' },
] as const;
export const ROPAS = ['Hoodie', 'Casaca de jean', 'Camiseta blanquirroja', 'Chaqueta de chef', 'Polo a rayas', 'Blazer', 'Chompa de alpaca', 'Traje de surf'] as const;
export const GORROS = ['Sin gorro', 'Gorra', 'Toque de chef', 'Casco de parapente', 'Audífonos', 'Chullo urbano', 'Sombrero de paja'] as const;
export const LENTES = ['Sin lentes', 'De sol', 'Redondos', 'Visor futurista', 'De lectura'] as const;
export const EXPRESIONES = ['Feliz', 'Sonrisa', 'Guiño', 'Sorpresa', 'Concentrada'] as const;
export const ACCESORIOS = ['Nada', 'Laptop', 'Tabla de surf', 'Ceviche', 'Chicha morada', 'Picarones', 'Lupa', 'Robot agente', 'Cronómetro', 'Café', 'Celular'] as const;

/** Lo que dice el globo de tu avatar: lista cerrada por charla (nada de texto libre llega al proyector). */
export const MENSAJES_BY_TALK: Record<TalkId, readonly string[]> = {
  genui: [
    'Reservo el espacio antes de pintar',
    'Cero saltos: CLS en verde',
    'Parseo cada token una sola vez',
    'Un render por frame',
    'No tiro el DOM: lo reciclo',
    'La IA decide, mi código calcula',
    'Mido en un celular lento',
    'Streaming sin congelar la página',
    'Listas largas, DOM corto',
    'Mi INP está en verde',
    'JSON por líneas, no de golpe',
    'Mi UI generativa vuela',
  ],
  agentes: [
    'Mis botones tienen nombre',
    'El árbol de accesibilidad es mi mapa',
    'Depuro con DevTools para agentes',
    'Mi agente mide y vuelve a medir',
    'Mis tools salen en el panel WebMCP',
    'Errores que el agente entiende',
    'Pruebo como usuario automatizado',
    'Mi IA local no congela la página',
    'Lighthouse: lista para agentes',
    'Nada irreversible sin confirmar',
    'Leo la consola con mi agente',
    'Mi web es fácil de razonar',
  ],
};
export const MENSAJES = MENSAJES_BY_TALK[TALK];

export const LEYENDA =
  'Lima mira al mar: en la Costa Verde conviven surfistas, ciclistas, parapentes y cevicherías, y en Barranco los murales se mezclan con los coworks. Tu avatar es parte de esa Lima moderna, la que construye la web que viene.';

const INK = '#1e1e1e';
let seq = 0;

/** Aclara (+) u oscurece (−) un color hex en puntos de luminosidad (0–255). */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}
export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
export const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
const S = (w = 2.5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const clampIdx = (n: number, len: number) => (Number.isInteger(n) && n >= 0 && n < len ? n : 0);

const LISTS: Record<keyof AvatarOptions, number> = {
  piel: PIELES.length,
  pelo: PELOS.length,
  colorPelo: COLORES_PELO.length,
  ropa: ROPAS.length,
  gorro: GORROS.length,
  lentes: LENTES.length,
  expresion: EXPRESIONES.length,
  accesorio: ACCESORIOS.length,
  rasgos: RASGOS.length,
  abajo: ABAJOS.length,
};
export const AVATAR_KEYS = Object.keys(LISTS) as (keyof AvatarOptions)[];

export function normalizeAvatar(o: Partial<AvatarOptions> | null | undefined): AvatarOptions {
  const out = {} as AvatarOptions;
  for (const k of AVATAR_KEYS) out[k] = clampIdx(o?.[k] ?? (k === 'piel' ? 2 : 0), LISTS[k]);
  return out;
}

export function randomAvatar(r: () => number = Math.random): AvatarOptions {
  const out = {} as AvatarOptions;
  for (const k of AVATAR_KEYS) out[k] = Math.floor(r() * LISTS[k]);
  return out;
}

/** Qué cambió entre dos versiones del avatar (para "tu avatar de ayer volvió con…"). */
export function diffAvatar(a: AvatarOptions, b: AvatarOptions): string[] {
  const out: string[] = [];
  if (a.ropa !== b.ropa) out.push(ROPAS[b.ropa].toLowerCase());
  if (a.gorro !== b.gorro) out.push(GORROS[b.gorro].toLowerCase());
  if (a.accesorio !== b.accesorio) out.push(ACCESORIOS[b.accesorio].toLowerCase());
  if (a.lentes !== b.lentes) out.push(LENTES[b.lentes].toLowerCase());
  if (a.pelo !== b.pelo || a.colorPelo !== b.colorPelo) out.push(`peinado ${PELOS[b.pelo].toLowerCase()}`);
  if (a.abajo !== b.abajo) out.push(ABAJOS[b.abajo].toLowerCase());
  if (a.expresion !== b.expresion) out.push(`cara ${EXPRESIONES[b.expresion].toLowerCase()}`);
  return out;
}

// ── Geometría (viewBox 0 -14 208 344): la persona centrada en x = 104 ──
const HX = 104; // centro de la cabeza
const HY = 92;
const HR = 46;
const TORSO = 'M64 162 C78 148 130 148 144 162 L156 254 C128 264 80 264 52 254 Z';

function hairBack(n: number, c: string): string {
  switch (n) {
    case 1: // rulos: volumen a los lados
      return `<g fill="${c}" ${S(2.2)}>${[[56, 100], [54, 122], [152, 100], [154, 122], [62, 140], [146, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14"/>`).join('')}</g>`;
    case 2: // cola alta
      return `<path d="M140 52 C176 42 186 86 170 118 C164 98 156 80 138 70 Z" fill="${c}" ${S()}/>`;
    case 3: // trenza larga
      return `<g fill="${c}" ${S(2.2)}>${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${146 + i * 2}" cy="${116 + i * 20}" rx="10" ry="13"/>`).join('')}</g><circle cx="158" cy="234" r="6" fill="#ea4335" ${S(2)}/>`;
    case 4: // bob
      return `<path d="M54 98 C50 40 158 40 154 98 L156 136 C140 140 132 132 134 116 L74 116 C76 132 68 140 52 136 Z" fill="${c}" ${S()}/>`;
    case 6: // moño
      return `<circle cx="${HX}" cy="38" r="17" fill="${c}" ${S()}/><path d="M92 44 C100 50 108 50 116 44" fill="none" stroke="#ea4335" stroke-width="4"/>`;
    case 8: // largo suelto: cae sobre los hombros
      return `<path d="M52 96 C46 36 162 36 156 96 L164 178 C150 190 136 184 134 170 L74 170 C72 184 58 190 44 178 Z" fill="${c}" ${S()}/><path d="M60 120 C58 146 60 160 54 176 M148 120 C150 146 148 160 154 176" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>`;
    case 7: // afro
      return `<circle cx="${HX}" cy="78" r="64" fill="${c}" ${S()}/><g fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="3">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${64 + i * 13}" cy="${36 + (i % 2) * 10}" r="6"/>`).join('')}</g>`;
    default:
      return '';
  }
}

function hairFront(n: number, c: string): string {
  const shine = `<path d="M74 70 C84 56 100 50 116 50" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="4" stroke-linecap="round"/>`;
  switch (n) {
    case 1: // rulos
      return `<g fill="${c}" ${S(2.2)}>${[[66, 76], [80, 58], [98, 50], [116, 50], [134, 58], [146, 74], [90, 66], [124, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13"/>`).join('')}</g>`;
    case 3: // trenza: raya al lado
      return `<path d="M58 96 C54 48 92 40 110 42 C136 42 158 58 150 96 C142 76 124 64 104 64 C92 66 76 76 58 96 Z" fill="${c}" ${S()}/>${shine}`;
    case 8: // largo suelto: raya al medio
      return `<path d="M58 98 C52 46 156 46 150 98 C140 74 118 62 104 58 C90 62 68 74 58 98 Z" fill="${c}" ${S()}/><path d="M104 58 V70" stroke="${INK}" stroke-opacity=".35" stroke-width="2"/>${shine}`;
    case 4: // bob con flequillo
      return `<path d="M58 92 C60 50 150 50 150 92 C140 80 126 76 112 82 C96 76 72 78 58 92 Z" fill="${c}" ${S()}/>${shine}`;
    case 5: // rapado
      return `<path d="M60 86 C60 48 148 48 148 86 C134 70 74 70 60 86 Z" fill="${c}" opacity=".85" ${S(2)}/>`;
    case 7: // afro: línea de nacimiento
      return `<path d="M60 92 C62 56 146 56 148 92 C134 76 74 76 60 92 Z" fill="${c}" ${S(2)}/>`;
    default: // corto / cola / moño: peinado hacia atrás
      return `<path d="M58 94 C52 48 90 38 108 40 C134 40 160 54 150 94 C144 78 130 66 114 66 C96 68 80 64 58 94 Z" fill="${c}" ${S()}/>${shine}`;
  }
}

function face(e: number, hair: string, rasgos = 0): string {
  const L = [86, 98];
  const R = [122, 98];
  const eye = ([x, y]: number[]) =>
    `<ellipse cx="${x}" cy="${y}" rx="7" ry="8.4" fill="#fff" ${S(2)}/><circle cx="${x + 0.8}" cy="${y + 1}" r="5" fill="#4b3621"/><circle cx="${x + 0.8}" cy="${y + 1}" r="2.6" fill="${INK}"/><circle cx="${x - 1.4}" cy="${y - 1.8}" r="1.6" fill="#fff"/>${lash([x, y])}`;
  const lashes = rasgos === 1 || rasgos === 3 || rasgos === 4;
  const lash = ([x, y]: number[], up = 8.4) => (lashes ? `<path d="M${x + 5} ${y - up + 1} l5 -4 M${x + 7} ${y - up + 4} l5 -2" fill="none" ${S(2.2)}/>` : '');
  const happy = ([x, y]: number[]) => `<path d="M${x - 7} ${y + 2} Q${x} ${y - 7} ${x + 7} ${y + 2}" fill="none" ${S(3)}/>${lashes ? `<path d="M${x + 6} ${y} l5 -3" fill="none" ${S(2.2)}/>` : ''}`;
  const brows = (dy = 0, tilt = 0) => `<path d="M${L[0] - 8} ${82 + dy + tilt} Q${L[0]} ${77 + dy} ${L[0] + 8} ${82 + dy - tilt} M${R[0] - 8} ${82 + dy - tilt} Q${R[0]} ${77 + dy} ${R[0] + 8} ${82 + dy + tilt}" fill="none" stroke="${hair}" stroke-width="3.6" stroke-linecap="round"/>`;
  const blush = `<ellipse cx="74" cy="114" rx="8" ry="5" fill="#ff7daf" opacity=".45"/><ellipse cx="134" cy="114" rx="8" ry="5" fill="#ff7daf" opacity=".45"/>`;
  const nose = `<path d="M104 104 Q100 112 106 113" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>`;
  const lips = rasgos === 4;
  const openSmile = `<path d="M92 120 Q104 136 118 120 Z" fill="#7a2730" ${S(2.2)}/><path d="M97 126 Q104 131 112 126" fill="none" stroke="#ff8a8a" stroke-width="3"/>${lips ? `<path d="M92 120 Q104 116 118 120" fill="none" stroke="#c2185b" stroke-width="3.4" stroke-linecap="round"/>` : ''}`;
  switch (e) {
    case 1:
      return `${brows()}${eye(L)}${eye(R)}${nose}${blush}<path d="M92 120 Q104 130 118 120" fill="none" ${lips ? 'stroke="#c2185b" stroke-width="4.4" stroke-linecap="round"' : S(2.8)}/>`;
    case 2:
      return `${brows()}${eye(L)}${happy(R)}${nose}${blush}${openSmile}`;
    case 3:
      return `${brows(-5)}${eye(L)}${eye(R)}${nose}<ellipse cx="105" cy="124" rx="6" ry="7.5" fill="#7a2730" ${S(2.2)}/>`;
    case 4:
      return `${brows(2, 3)}${eye(L)}${eye(R)}${nose}<path d="M95 123 H115" fill="none" ${S(2.8)}/>`;
    default:
      return `${brows()}${happy(L)}${happy(R)}${nose}${blush}${openSmile}`;
  }
}

/** Pecas o barba van debajo de la boca; aretes, sobre las orejas. */
function rasgosBajo(n: number): string {
  if (n === 7) return `<g fill="#8b5a2b" opacity=".55">${[[76, 106], [82, 112], [70, 112], [132, 106], [126, 112], [138, 112]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join('')}</g>`;
  return '';
}
function rasgosSobre(n: number, hair: string): string {
  const aretes = `<g ${S(2)}><circle cx="${HX - HR - 2}" cy="${HY + 18}" r="5" fill="#f9ab00"/><circle cx="${HX + HR + 2}" cy="${HY + 18}" r="5" fill="#f9ab00"/></g><circle cx="${HX - HR - 3}" cy="${HY + 16.5}" r="1.4" fill="#fff"/><circle cx="${HX + HR + 1}" cy="${HY + 16.5}" r="1.4" fill="#fff"/>`;
  if (n === 2 || n === 3) return aretes;
  if (n === 5) return `<path d="M62 104 C64 140 84 142 104 142 C124 142 144 140 146 104 C140 120 128 130 118 132 C110 128 98 128 90 132 C80 130 68 120 62 104 Z" fill="${hair}" ${S(2.2)}/><path d="M94 120 Q104 126 114 120" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>`;
  if (n === 6) return `<path d="M88 116 C94 108 102 110 104 114 C106 110 114 108 120 116 C112 118 104 116 104 116 C104 116 96 118 88 116 Z" fill="${hair}" ${S(2)}/>`;
  return '';
}

/** Parte de abajo: jean, falda, short o vestido (continúa el color de la ropa). */
function abajo(n: number, dress: string, skin: string): string {
  const shoes = `<path d="M66 300 h38 a8 8 0 0 1 0 16 h-38 a7 7 0 0 1 0 -16 z M106 300 h38 a8 8 0 0 1 0 16 h-38 a7 7 0 0 1 0 -16 z" fill="#ffffff" ${S()}/><path d="M70 308 h30 M110 308 h30" stroke="#ea4335" stroke-width="3" stroke-linecap="round"/>`;
  const legs = `<path d="M76 250 h24 v52 h-24 z M108 250 h24 v52 h-24 z" fill="${skin}" ${S()}/>`;
  switch (n) {
    case 1: // falda
      return `${legs}<path d="M58 246 L150 246 L162 286 C126 296 82 296 46 286 Z" fill="#ea4335" ${S()}/><path d="M76 252 L68 290 M104 252 V294 M132 252 L140 290" fill="none" stroke="#c5221f" stroke-width="2"/>${shoes}`;
    case 2: // short
      return `${legs}<path d="M66 248 h40 l-2 30 h-36 z M104 248 h40 l-2 30 h-36 z" fill="#5fa3d6" ${S()}/>${shoes}`;
    case 3: // vestido
      return `${legs}<path d="M60 240 L148 240 L166 290 C126 300 82 300 42 290 Z" fill="${dress}" ${S()}/><path d="M50 284 C86 292 122 292 158 284" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>${shoes}`;
    default: // jean
      return `<g ${S()}><path d="M72 252 h30 v50 h-30 z M108 252 h30 v50 h-30 z" fill="#2c4f86"/></g><path d="M104 256 v40" stroke="#1e3a66" stroke-width="2"/>${shoes}`;
  }
}

function lentes(n: number, id: string): string {
  const L = [86, 98];
  const R = [122, 98];
  switch (n) {
    case 1:
      return `<defs><linearGradient id="${id}-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f4b"/><stop offset="1" stop-color="#0d1015"/></linearGradient></defs>
        <g ${S(2.4)}><rect x="${L[0] - 14}" y="88" width="28" height="20" rx="8" fill="url(#${id}-sun)"/><rect x="${R[0] - 14}" y="88" width="28" height="20" rx="8" fill="url(#${id}-sun)"/><path d="M100 96 Q104 92 108 96 M72 96 L60 92 M136 96 L148 92" fill="none"/></g>
        <path d="M${L[0] - 8} 93 l8 -2 M${R[0] - 8} 93 l8 -2" stroke="#fff" stroke-width="2.2" opacity=".7" stroke-linecap="round"/>`;
    case 2:
      return `<g ${S(2.6)} fill="rgba(255,255,255,.15)"><circle cx="${L[0]}" cy="${L[1]}" r="13"/><circle cx="${R[0]}" cy="${R[1]}" r="13"/><path d="M99 96 Q104 92 109 96 M73 96 L60 92 M135 96 L148 92" fill="none"/></g>`;
    case 3:
      return `<defs><linearGradient id="${id}-vis" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#57caff"/><stop offset=".5" stop-color="#b48cff"/><stop offset="1" stop-color="#ff7daf"/></linearGradient></defs>
        <path d="M62 90 C90 82 120 82 146 90 L146 106 C120 100 90 100 62 108 Z" fill="url(#${id}-vis)" opacity=".9" ${S(2.4)}/><path d="M70 92 C92 86 116 86 138 91" fill="none" stroke="#fff" stroke-width="2.4" opacity=".7" stroke-linecap="round"/>`;
    case 4:
      return `<g ${S(2.4)} fill="rgba(255,255,255,.12)"><path d="M${L[0] - 12} 96 h24 v8 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 z M${R[0] - 12} 96 h24 v8 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 z"/><path d="M98 98 h12" fill="none"/></g>`;
    default:
      return '';
  }
}

function gorro(n: number, id: string): string {
  switch (n) {
    case 1:
      return `<g ${S()}><path d="M54 70 C54 26 154 26 154 70 Z" fill="#ea4335"/><path d="M150 66 C172 62 190 68 196 76 C176 80 160 76 148 72 Z" fill="#c5221f"/><circle cx="${HX}" cy="30" r="4" fill="#c5221f"/></g><path d="M66 56 C76 42 92 36 106 34" stroke="#fff" stroke-width="3" opacity=".45" fill="none" stroke-linecap="round"/>`;
    case 2:
      return `<g ${S()} fill="#fff"><circle cx="80" cy="30" r="18"/><circle cx="128" cy="30" r="18"/><circle cx="104" cy="18" r="22"/><path d="M68 40 h72 v22 h-72 z"/></g><path d="M80 48 v10 M96 48 v10 M112 48 v10 M128 48 v10" stroke="#d6d6d6" stroke-width="2"/>`;
    case 3:
      return `<defs><linearGradient id="${id}-hel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd427"/><stop offset="1" stop-color="#f9ab00"/></linearGradient></defs>
        <g ${S()}><path d="M52 84 C46 22 162 22 156 84 C140 70 68 70 52 84 Z" fill="url(#${id}-hel)"/><path d="M60 58 C86 48 122 48 148 58" fill="none"/><path d="M84 36 l4 12 M104 30 v12 M124 36 l-4 12" fill="none" stroke-width="2"/></g><path d="M64 50 C76 38 90 32 102 32" stroke="#fff" stroke-width="3.4" opacity=".6" fill="none" stroke-linecap="round"/>`;
    case 4:
      return `<path d="M52 96 C46 26 162 26 156 96" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M52 96 C46 26 162 26 156 96" fill="none" stroke="#4285f4" stroke-width="5" stroke-linecap="round"/><g ${S()}><rect x="40" y="82" width="22" height="34" rx="10" fill="#4285f4"/><rect x="146" y="82" width="22" height="34" rx="10" fill="#4285f4"/></g><circle cx="51" cy="99" r="5" fill="#c3ecf6"/><circle cx="157" cy="99" r="5" fill="#c3ecf6"/>`;
    case 5:
      return `<defs><pattern id="${id}-knit" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#34a853"/><path d="M0 5 L5 0 L10 5" fill="none" stroke="#5cdb6d" stroke-width="2.4"/></pattern></defs>
        <g ${S()}><path d="M56 70 C50 22 158 22 152 70 Z" fill="url(#${id}-knit)"/><rect x="52" y="62" width="104" height="16" rx="8" fill="#0b8043"/><circle cx="${HX}" cy="22" r="11" fill="#ffd427"/></g>`;
    case 6:
      return `<g ${S()}><ellipse cx="${HX}" cy="60" rx="70" ry="13" fill="#e8c77a"/><path d="M72 60 C72 26 136 26 136 60 Z" fill="#f0d590"/><path d="M73 52 C90 58 118 58 135 52 L135 44 C118 50 90 50 73 44 Z" fill="#ea4335"/></g><path d="M44 62 C70 68 138 68 164 62" fill="none" stroke="#c9a65a" stroke-width="1.6" stroke-dasharray="3 4"/>`;
    default:
      return '';
  }
}

/** Ropa: [torso, mangas, detalles encima] */
function ropa(n: number, id: string, skin: string): { torso: string; sleeve: string; extra: string; back?: string; dress: string } {
  const clip = `url(#${id}-torso)`;
  switch (n) {
    case 1: // casaca de jean
      return {
        torso: `<g clip-path="${clip}"><rect x="40" y="140" width="130" height="130" fill="#4f7cc4"/><path d="M90 150 L104 196 L118 150 Z" fill="#ffffff"/><path d="M104 196 V262" stroke="#2c4f86" stroke-width="2.4"/><rect x="66" y="196" width="22" height="16" rx="3" fill="none" stroke="#2c4f86" stroke-width="2"/><rect x="120" y="196" width="22" height="16" rx="3" fill="none" stroke="#2c4f86" stroke-width="2"/></g>`,
        sleeve: '#4f7cc4',
        dress: '#4f7cc4',
        extra: `<path d="M84 152 L96 176 L104 160 M124 152 L112 176 L104 160" fill="#3a65a8" ${S(2)}/>`,
      };
    case 2: // camiseta blanquirroja
      return {
        torso: `<g clip-path="${clip}"><rect x="40" y="140" width="130" height="130" fill="#ffffff"/><path d="M40 168 L70 150 L170 236 L170 270 Z" fill="#d91e2a"/></g>`,
        sleeve: '#ffffff',
        dress: '#ffffff',
        extra: `<path d="M92 152 Q104 162 116 152" fill="none" stroke="#d91e2a" stroke-width="4"/>`,
      };
    case 3: // chaqueta de chef
      return {
        torso: `<g clip-path="${clip}"><rect x="40" y="140" width="130" height="130" fill="#fbfbfb"/><path d="M86 150 C96 190 112 190 130 152" fill="none" stroke="#d6d6d6" stroke-width="2"/></g>`,
        sleeve: '#fbfbfb',
        dress: '#fbfbfb',
        extra: `<g fill="#1e1e1e">${[180, 202, 224].map((y) => `<circle cx="92" cy="${y}" r="3.4"/><circle cx="118" cy="${y}" r="3.4"/>`).join('')}</g><path d="M88 152 h32" stroke="#ea4335" stroke-width="5"/>`,
      };
    case 4: // polo a rayas
      return {
        torso: `<defs><pattern id="${id}-str" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#ffffff"/><rect width="16" height="8" fill="#1d4b74"/></pattern></defs><g clip-path="${clip}"><rect x="40" y="140" width="130" height="130" fill="url(#${id}-str)"/></g>`,
        sleeve: '#1d4b74',
        dress: '#1d4b74',
        extra: '',
      };
    case 5: // blazer
      return {
        torso: `<g clip-path="${clip}"><rect x="40" y="140" width="130" height="130" fill="#2f3a4f"/><path d="M84 148 L104 230 L124 148 Z" fill="#f9ab00"/></g>`,
        sleeve: '#2f3a4f',
        dress: '#2f3a4f',
        extra: `<path d="M84 150 L98 196 L88 200 L76 160 Z M124 150 L110 196 L120 200 L132 160 Z" fill="#253042" ${S(2)}/><circle cx="104" cy="240" r="3" fill="#fff"/>`,
      };
    case 6: // chompa de alpaca
      return {
        torso: `<defs><pattern id="${id}-alp" width="22" height="20" patternUnits="userSpaceOnUse"><rect width="22" height="20" fill="#c0392b"/><path d="M0 10 L5.5 4 L11 10 L16.5 4 L22 10" fill="none" stroke="#ffd427" stroke-width="2.6"/><circle cx="11" cy="16" r="2" fill="#fff"/></pattern></defs>
          <g clip-path="${clip}"><rect x="40" y="140" width="130" height="130" fill="#a93226"/><rect x="40" y="186" width="130" height="36" fill="url(#${id}-alp)"/><rect x="40" y="168" width="130" height="7" fill="#ffd427"/><rect x="40" y="232" width="130" height="7" fill="#ffd427"/></g>`,
        sleeve: '#a93226',
        dress: '#a93226',
        extra: '',
      };
    case 7: // traje de surf
      return {
        torso: `<g clip-path="${clip}"><rect x="40" y="140" width="130" height="130" fill="#1f2937"/><path d="M40 196 L170 176 L170 190 L40 210 Z" fill="#57caff"/><path d="M40 214 L170 194 L170 200 L40 220 Z" fill="#ffd427"/></g>`,
        sleeve: '#1f2937',
        dress: '#1f2937',
        extra: `<path d="M104 152 V200" stroke="#9aa3ad" stroke-width="2.4"/>`,
      };
    default: // hoodie
      return {
        back: `<path d="M66 152 C62 124 146 124 142 152 C128 162 80 162 66 152 Z" fill="#6b7682" ${S()}/>`,
        torso: `<g clip-path="${clip}"><rect x="40" y="140" width="130" height="130" fill="#7b8794"/><path d="M76 212 h56 l-6 30 h-44 z" fill="#6b7682" stroke="${INK}" stroke-width="2"/></g>`,
        sleeve: '#7b8794',
        dress: '#7b8794',
        extra: `<path d="M94 156 v26 M114 156 v26" stroke="#f0f0f0" stroke-width="2.6" stroke-linecap="round"/><circle cx="94" cy="184" r="3" fill="#f0f0f0"/><circle cx="114" cy="184" r="3" fill="#f0f0f0"/>`,
      };
  }
}

/** Lo que lleva: casi todo va en la mano izquierda. */
function accesorio(n: number, id: string): { back: string; front: string } {
  switch (n) {
    case 1: // laptop
      return {
        back: '',
        front: `<defs><linearGradient id="${id}-lap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5f5f5"/><stop offset="1" stop-color="#c9ccd1"/></linearGradient></defs>
          <g ${S()}><rect x="64" y="198" width="80" height="52" rx="6" fill="url(#${id}-lap)"/><path d="M56 250 H152 L146 260 H62 Z" fill="#b5b8bd"/></g>
          <circle cx="90" cy="220" r="7" fill="#4285f4" ${S(1.8)}/><rect x="104" y="214" width="24" height="11" rx="5.5" fill="#ffd427" ${S(1.8)}/><path d="M78 236 h16" stroke="#ea4335" stroke-width="4" stroke-linecap="round"/>`,
      };
    case 2: // tabla de surf (detrás, a la izquierda)
      return {
        back: `<defs><linearGradient id="${id}-surf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#57caff"/><stop offset="1" stop-color="#4285f4"/></linearGradient></defs>
          <g ${S()}><path d="M30 70 C54 100 58 260 38 318 C18 260 14 110 30 70 Z" fill="url(#${id}-surf)"/><path d="M32 84 C42 140 44 250 38 306" fill="none" stroke="#fff" stroke-width="3"/></g>
          <path d="M22 170 c10 -5 22 -5 30 0" fill="none" stroke="#ffd427" stroke-width="6" stroke-linecap="round"/>`,
        front: '',
      };
    case 3: // ceviche
      return {
        back: '',
        front: `<g ${S()}><path d="M14 214 H82 C82 242 62 254 48 254 C34 254 14 242 14 214 Z" fill="#fdfdfd"/><ellipse cx="48" cy="214" rx="34" ry="8" fill="#fff4e0"/></g>
          <g ${S(1.6)}><rect x="28" y="205" width="10" height="9" rx="2" fill="#fff"/><rect x="42" y="203" width="10" height="9" rx="2" fill="#fff"/><rect x="56" y="206" width="10" height="9" rx="2" fill="#fff"/>
          <path d="M32 206 q7 -9 16 -2 M52 204 q9 -7 16 2" fill="none" stroke="#b5179e" stroke-width="2.4"/><circle cx="72" cy="208" r="6" fill="#5cdb6d"/><circle cx="22" cy="210" r="4.5" fill="#ffd427"/><ellipse cx="64" cy="212" rx="6" ry="4" fill="#f97316"/></g>
          <path d="M20 228 C32 244 62 246 76 232" fill="none" stroke="#4285f4" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>`,
      };
    case 4: // chicha morada
      return {
        back: '',
        front: `<defs><linearGradient id="${id}-chi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9b4dca"/><stop offset="1" stop-color="#4a1a6e"/></linearGradient></defs>
          <path d="M50 182 l14 -30" stroke="#ea4335" stroke-width="4" stroke-linecap="round"/>
          <g ${S()}><path d="M30 186 H68 L62 250 H36 Z" fill="url(#${id}-chi)"/><circle cx="66" cy="188" r="10" fill="#ccf6c5"/></g><path d="M36 198 h26" stroke="#fff" stroke-width="2" opacity=".5"/>`,
      };
    case 5: {
      const ring = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="10" fill="#d9822b" ${S(2)}/><ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="#fff4e0" ${S(1.6)}/>`;
      return {
        back: '',
        front: `<ellipse cx="46" cy="248" rx="40" ry="11" fill="#ffffff" ${S()}/>${ring(30, 238)}${ring(62, 236)}${ring(46, 224)}<path d="M26 224 C38 232 54 218 70 228" fill="none" stroke="#5a2d0c" stroke-width="3.4" stroke-linecap="round"/>`,
      };
    }
    case 6: // lupa
      return {
        back: '',
        front: `<defs><radialGradient id="${id}-lens" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c3ecf6"/></radialGradient></defs>
          <path d="M44 214 L54 246" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M44 214 L54 246" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
          <circle cx="38" cy="190" r="26" fill="url(#${id}-lens)" stroke="${INK}" stroke-width="5"/>
          <g ${S(1.6)}><ellipse cx="38" cy="192" rx="7" ry="9" fill="#ea4335"/><path d="M38 183 v18 M29 188 l-5 -2 M47 188 l5 -2 M29 197 l-5 2 M47 197 l5 2" fill="none"/><circle cx="38" cy="181" r="3.6" fill="${INK}"/></g>`,
      };
    case 7: // robot agente (a los pies)
      return {
        back: '',
        front: `<g ${S()}><path d="M30 262 v-12" fill="none"/><circle cx="30" cy="246" r="4.4" fill="#ea4335"/><rect x="12" y="262" width="36" height="26" rx="9" fill="#f0f0f0"/><rect x="8" y="288" width="44" height="26" rx="7" fill="#4285f4"/></g>
          <rect x="17" y="268" width="26" height="12" rx="6" fill="#1e1e1e"/><circle cx="24" cy="274" r="2.8" fill="#57caff"/><circle cx="36" cy="274" r="2.8" fill="#57caff"/><path d="M20 300 h20" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
      };
    case 8: // cronómetro
      return {
        back: '',
        front: `<g ${S()}><rect x="34" y="174" width="14" height="9" rx="2" fill="#c4c4c4"/><circle cx="41" cy="210" r="27" fill="#ffffff"/><circle cx="41" cy="210" r="20" fill="none" stroke="#34a853" stroke-width="4"/></g>
          <path d="M41 210 L41 194 M41 210 L52 217" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M41 190 A20 20 0 0 1 60 204" fill="none" stroke="#ea4335" stroke-width="4"/>`,
      };
    case 9: // café
      return {
        back: '',
        front: `<g ${S()}><path d="M24 206 H62 L58 248 H28 Z" fill="#fff"/><path d="M62 214 C76 214 76 232 60 232" fill="none"/><rect x="24" y="218" width="38" height="11" fill="#8b5a2b"/></g><path d="M36 198 c-4 -6 4 -8 0 -14 M50 198 c-4 -6 4 -8 0 -14" fill="none" stroke="#9a9a9a" stroke-width="2" stroke-linecap="round"/>`,
      };
    case 10: // celular
      return {
        back: '',
        front: `<g ${S()}><rect x="30" y="190" width="30" height="52" rx="6" fill="#1e1e1e"/><rect x="34" y="196" width="22" height="38" rx="3" fill="#57caff"/></g><path d="M38 204 h14 M38 212 h10 M38 220 h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
      };
    default:
      return { back: '', front: '' };
  }
}

/** SVG del avatar (viewBox 208×344). `title` da nombre accesible. */
export function avatarSVG(opts: AvatarOptions, title = 'Avatar limeño'): string {
  const o = normalizeAvatar(opts);
  const id = `av${++seq}`;
  const skin = PIELES[o.piel];
  const hair = COLORES_PELO[o.colorPelo].c;
  const r = ropa(o.ropa, id, skin);
  const acc = accesorio(o.accesorio, id);
  const holdsLeft = o.accesorio > 0 && o.accesorio !== 2 && o.accesorio !== 7 && o.accesorio !== 1;
  const holdsBoth = o.accesorio === 1;
  // Brazo izquierdo: levantado si lleva algo en la mano; si no, relajado.
  const armL = holdsLeft
    ? `<path d="M68 166 C50 176 40 196 38 214 L56 220 C58 204 66 190 78 180 Z" fill="${r.sleeve}" ${S()}/><circle cx="46" cy="222" r="10" fill="${skin}" ${S(2.2)}/>`
    : holdsBoth
      ? `<path d="M68 166 C56 182 54 204 60 224 L76 222 C72 204 74 188 80 178 Z" fill="${r.sleeve}" ${S()}/>`
      : `<path d="M66 166 C52 180 44 206 42 232 L60 236 C62 210 68 190 78 178 Z" fill="${r.sleeve}" ${S()}/><circle cx="50" cy="240" r="10" fill="${skin}" ${S(2.2)}/>`;
  const armR = holdsBoth
    ? `<path d="M140 166 C152 182 154 204 148 224 L132 222 C136 204 134 188 128 178 Z" fill="${r.sleeve}" ${S()}/>`
    : `<path d="M142 166 C156 180 164 206 166 232 L148 236 C146 210 140 190 130 178 Z" fill="${r.sleeve}" ${S()}/><circle cx="158" cy="240" r="10" fill="${skin}" ${S(2.2)}/>`;
  const laptopHands = holdsBoth ? `<circle cx="68" cy="230" r="10" fill="${skin}" ${S(2.2)}/><circle cx="140" cy="230" r="10" fill="${skin}" ${S(2.2)}/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -14 208 344" role="img" aria-label="${escapeXml(title)}">
  <title>${escapeXml(title)}</title>
  <defs>
    <radialGradient id="${id}-skin" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${shade(skin, 18)}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -22)}"/></radialGradient>
    <linearGradient id="${id}-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
    <clipPath id="${id}-torso"><path d="${TORSO}"/></clipPath>
  </defs>
  <ellipse cx="104" cy="318" rx="84" ry="9" fill="#000" opacity=".13"/>
  ${acc.back}
  ${hairBack(o.pelo, hair)}
  ${abajo(o.abajo, r.dress, skin)}
  ${r.back ?? ''}
  <!-- Cuello y torso -->
  <rect x="92" y="130" width="24" height="24" rx="6" fill="${shade(skin, -14)}" ${S()}/>
  <path d="${TORSO}" fill="#ffffff" ${S()}/>
  ${r.torso}
  <path d="${TORSO}" fill="url(#${id}-shade)"/>
  <path d="${TORSO}" fill="none" ${S()}/>
  ${r.extra}
  ${armL}${armR}
  <!-- Cabeza -->
  <circle cx="${HX - HR}" cy="${HY + 4}" r="9" fill="${skin}" ${S(2.2)}/><circle cx="${HX + HR}" cy="${HY + 4}" r="9" fill="${skin}" ${S(2.2)}/>
  <circle cx="${HX}" cy="${HY}" r="${HR}" fill="url(#${id}-skin)" ${S()}/>
  ${hairFront(o.pelo, hair)}
  ${rasgosBajo(o.rasgos)}
  ${face(o.expresion, hair, o.rasgos)}
  ${rasgosSobre(o.rasgos, hair)}
  ${lentes(o.lentes, id)}
  ${gorro(o.gorro, id)}
  ${acc.front}
  ${laptopHands}
</svg>`;
}

/** Silueta para quien no publicó su avatar (podio). */
export function avatarSilhouette(title = 'Sin avatar'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -14 208 344" role="img" aria-label="${escapeXml(title)}"><title>${escapeXml(title)}</title>
  <g fill="#c4c7c5" stroke="#8a8d8b" stroke-width="3" stroke-linejoin="round">
    <path d="${TORSO}"/><path d="M72 252 h30 v56 h-30 z M108 252 h30 v56 h-30 z"/><circle cx="${HX}" cy="${HY}" r="${HR}"/>
  </g>
  <text x="${HX}" y="${HY + 20}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="56" font-weight="700" fill="#8a8d8b">?</text></svg>`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export interface AvatarCard {
  name: string;
  mensaje: number;
  opts: AvatarOptions;
  /** también estuvo en la otra charla */
  both?: boolean;
}

/** Escena del PNG: atardecer en Barranco (Día 1) o parapentes sobre Miraflores (Día 2). */
function scene(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, talk: TalkId) {
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  if (talk === 'genui') {
    g.addColorStop(0, '#ffd8a8');
    g.addColorStop(0.55, '#ff9a8b');
    g.addColorStop(1, '#8e7dd8');
  } else {
    g.addColorStop(0, '#c3ecf6');
    g.addColorStop(0.6, '#e8f6fb');
    g.addColorStop(1, '#bfe3f0');
  }
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = talk === 'genui' ? '#ffe7a5' : '#ffffff';
  ctx.beginPath();
  ctx.arc(x0 + w * 0.8, y0 + h * 0.26, talk === 'genui' ? 110 : 60, 0, Math.PI * 2);
  ctx.fill();
  const bases = [0.02, 0.12, 0.2, 0.31, 0.41, 0.54, 0.63, 0.74, 0.84, 0.92];
  bases.forEach((bx, i) => {
    const bw = 64 + (i % 3) * 18;
    const bh = 160 + ((i * 53) % 150);
    ctx.fillStyle = talk === 'genui' ? (i % 2 ? '#5d4a8a' : '#6e5aa0') : i % 2 ? '#9fb7c6' : '#b5cad6';
    ctx.fillRect(x0 + bx * w, y0 + h * 0.74 - bh, bw, bh);
    ctx.fillStyle = talk === 'genui' ? '#ffd27a' : '#ffffff';
    for (let r = 0; r < bh / 26 - 1; r++) for (let c = 0; c < 3; c++) if ((r + c + i) % 3) ctx.fillRect(x0 + bx * w + 10 + c * (bw / 3.4), y0 + h * 0.74 - bh + 14 + r * 26, 10, 12);
  });
  ctx.fillStyle = '#34a853';
  ctx.beginPath();
  ctx.moveTo(x0, y0 + h * 0.74);
  ctx.bezierCurveTo(x0 + w * 0.3, y0 + h * 0.7, x0 + w * 0.6, y0 + h * 0.78, x0 + w, y0 + h * 0.72);
  ctx.lineTo(x0 + w, y0 + h * 0.82);
  ctx.lineTo(x0, y0 + h * 0.84);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = talk === 'genui' ? '#4a5aa8' : '#4285f4';
  ctx.fillRect(x0, y0 + h * 0.82, w, h * 0.18);
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 40) ctx.lineTo(x0 + x, y0 + h * (0.86 + i * 0.035) + Math.sin(x / 40 + i) * 5);
    ctx.stroke();
  }
  if (talk === 'agentes') {
    (
      [
        [0.18, 0.16, '#ea4335'],
        [0.44, 0.08, '#f9ab00'],
        [0.62, 0.22, '#34a853'],
      ] as const
    ).forEach(([px, py, c]) => {
      const cx = x0 + px * w;
      const cy = y0 + py * h;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 58, 18, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 56, cy);
      ctx.lineTo(cx, cy + 58);
      ctx.lineTo(cx + 56, cy);
      ctx.stroke();
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(cx - 5, cy + 56, 10, 12);
    });
  }
}

/** PNG 1080×1350 para compartir: el avatar, su nombre, su mensaje y la leyenda. */
export async function avatarPNG(card: AvatarCard, talk: TalkId = TALK): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const o = normalizeAvatar(card.opts);
  const sans = "'Google Sans', system-ui, sans-serif";
  const mono = "'Roboto Mono', ui-monospace, monospace";

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(48, 48, W - 96, H - 96, 56);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  scene(ctx, 48, 48, W - 96, 860, talk);
  ctx.restore();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1e1e1e';
  ctx.beginPath();
  ctx.roundRect(48, 48, W - 96, H - 96, 56);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(48, 908);
  ctx.lineTo(W - 48, 908);
  ctx.stroke();

  ctx.fillStyle = '#1e1e1e';
  ctx.font = `500 28px ${mono}`;
  ctx.fillText(`// MI AVATAR · ${EVENT.toUpperCase()} · ${TALKS[talk].day.toUpperCase()}`, 104, 124, W - 208);

  const img = await loadImage(svgDataUrl(avatarSVG(o, card.name)));
  ctx.drawImage(img, W / 2 - 230, 160, 460, 760); // viewBox 208×344

  if (card.both) {
    ctx.beginPath();
    ctx.roundRect(W - 360, 150, 260, 60, 30);
    ctx.fillStyle = '#ffd427';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#1e1e1e';
    ctx.font = `700 27px ${sans}`;
    ctx.textAlign = 'center';
    ctx.fillText('Día 1 + Día 2', W - 230, 190);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#1e1e1e';
  ctx.textAlign = 'center';
  ctx.font = `700 74px ${sans}`;
  ctx.fillText(card.name || 'Mi avatar', W / 2, 1000, W - 200);
  const list = MENSAJES_BY_TALK[talk];
  ctx.font = `500 34px ${sans}`;
  const text = `“${list[clampIdx(card.mensaje, list.length)]}”`;
  const pw = Math.min(ctx.measureText(text).width + 64, W - 160);
  ctx.beginPath();
  ctx.roundRect(W / 2 - pw / 2, 1028, pw, 70, 35);
  ctx.fillStyle = '#c3ecf6';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#1e1e1e';
  ctx.fillText(text, W / 2, 1075, W - 200);
  ctx.font = `400 24px ${sans}`;
  ctx.fillStyle = '#4b4b4b';
  wrap(ctx, LEYENDA, W - 240)
    .slice(0, 3)
    .forEach((l, i) => ctx.fillText(l, W / 2, 1140 + i * 31));
  ctx.textAlign = 'left';
  ctx.font = `400 22px ${mono}`;
  ctx.fillStyle = '#1e1e1e';
  ctx.fillText(TALKS[talk].title, 104, H - 92, W - 400);
  ctx.fillStyle = '#4b4b4b';
  ctx.fillText(`${SPEAKER} · ${SPEAKER_HANDLE}`, 104, H - 62);
  ['#4285f4', '#ea4335', '#f9ab00', '#34a853'].forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(W - 120 - (3 - i) * 34, H - 80, 12, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}

/** Data URL PNG pequeña para incrustar en la memoria PDF. */
export async function avatarPNGDataUrl(opts: AvatarOptions, size = 360): Promise<string> {
  const img = await loadImage(svgDataUrl(avatarSVG(opts)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((size * 208) / 344);
  canvas.height = size;
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
