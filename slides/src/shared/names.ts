// Apodos generados (sin texto libre: nada inapropiado llega al proyector).
//  · Sabor limeño + vocabulario de las dos charlas, con concordancia de género ("Brisa Limeña", "Pelícano Limeño").
//  · 48 sustantivos × 36 adjetivos ≈ 1.700 combinaciones: de sobra para 300+ asistentes.
//  · Aun así, si dos personas eligen el mismo apodo, la segunda recibe una numeración
//    ("Pelícano Veloz 2"): ver claimUniqueName. Firestore (o el modo local) garantiza la reserva.

type G = 'm' | 'f';

/** [sustantivo, género] */
export const NOUNS: readonly (readonly [string, G])[] = [
  // Lima y la Costa Verde
  ['Pelícano', 'm'], ['Colibrí', 'm'], ['Malecón', 'm'], ['Faro', 'm'], ['Parapente', 'm'], ['Ceviche', 'm'],
  ['Mural', 'm'], ['Velero', 'm'], ['Balcón', 'm'], ['Puerto', 'm'], ['Cajón', 'm'], ['Acantilado', 'm'],
  ['Lobo Marino', 'm'], ['Surfista', 'm'], ['Mirador', 'm'], ['Puente', 'm'], ['Jardín', 'm'], ['Mar', 'm'],
  ['Brisa', 'f'], ['Gaviota', 'f'], ['Huaca', 'f'], ['Ola', 'f'], ['Playa', 'f'], ['Marinera', 'f'],
  ['Estrella', 'f'], ['Lúcuma', 'f'], ['Costa', 'f'], ['Bicicleta', 'f'], ['Tabla', 'f'], ['Quinua', 'f'],
  // Las dos charlas
  ['Token', 'm'], ['Prompt', 'm'], ['Agente', 'm'], ['Schema', 'm'], ['Frame', 'm'], ['Pixel', 'm'],
  ['Render', 'm'], ['Stream', 'm'], ['Snapshot', 'm'], ['Parser', 'm'], ['Worker', 'm'], ['Navegador', 'm'],
  ['Tool', 'f'], ['API', 'f'], ['Promesa', 'f'], ['Señal', 'f'], ['Consola', 'f'], ['Traza', 'f'],
];

/** [masculino, femenino] (iguales si el adjetivo no cambia) */
export const ADJS: readonly (readonly [string, string])[] = [
  ['Veloz', 'Veloz'], ['Limeño', 'Limeña'], ['Valiente', 'Valiente'], ['Curioso', 'Curiosa'], ['Brillante', 'Brillante'],
  ['Sereno', 'Serena'], ['Épico', 'Épica'], ['Ninja', 'Ninja'], ['Cósmico', 'Cósmica'], ['Ágil', 'Ágil'],
  ['Sabio', 'Sabia'], ['Audaz', 'Audaz'], ['Feliz', 'Feliz'], ['Turbo', 'Turbo'], ['Estelar', 'Estelar'],
  ['Asíncrono', 'Asíncrona'], ['Reactivo', 'Reactiva'], ['Eléctrico', 'Eléctrica'], ['Dorado', 'Dorada'], ['Zen', 'Zen'],
  ['Pro', 'Pro'], ['Galáctico', 'Galáctica'], ['Atómico', 'Atómica'], ['Legendario', 'Legendaria'], ['Imparable', 'Imparable'],
  ['Costeño', 'Costeña'], ['Alegre', 'Alegre'], ['Amable', 'Amable'], ['Agéntico', 'Agéntica'], ['Fluido', 'Fluida'],
  ['Generativo', 'Generativa'], ['Creativo', 'Creativa'], ['Luminoso', 'Luminosa'], ['Mágico', 'Mágica'], ['Tranquilo', 'Tranquila'],
  ['Neón', 'Neón'],
];

export const TOTAL_COMBINATIONS = NOUNS.length * ADJS.length;

const pick = <T>(a: readonly T[], r = Math.random) => a[Math.floor(r() * a.length)];

export function randomName(r: () => number = Math.random): string {
  const [noun, g] = pick(NOUNS, r);
  const [m, f] = pick(ADJS, r);
  return `${noun} ${g === 'f' ? f : m}`;
}

/** Todas las combinaciones (para tests y para el contador de "apodos disponibles"). */
export function allNames(): string[] {
  return NOUNS.flatMap(([noun, g]) => ADJS.map(([m, f]) => `${noun} ${g === 'f' ? f : m}`));
}

const BANNED = /(put[ao]|mierd|cul[oa]|pend[ae]j|verga|coñ|carajo|fuck|shit|sex|nazi|cojud|huev[oó]n|conchatu)/i;
/** Limpia un nombre escrito a mano (avatar): si es ofensivo o está vacío, propone uno generado. */
export const cleanName = (s: string) => (BANNED.test(s) ? randomName() : s.trim().slice(0, 18)) || randomName();

/** Clave de un apodo: sin tildes ni mayúsculas ("Pelícano Ágil 2" → "pelicano-agil-2"). */
export const nameKey = (n: string) =>
  n
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

/** "Pelícano Veloz" → "Pelícano Veloz", "Pelícano Veloz 2"… */
export const numbered = (base: string, n: number) => (n <= 1 ? base : `${base} ${n}`);

/**
 * Reserva un apodo único. Intenta el apodo base y, si alguien ya lo tiene, le agrega una
 * numeración (2, 3, …). `tryReserve` debe ser atómico (Firestore: create sin overwrite).
 * Devuelve el apodo que quedó reservado para esta persona.
 */
export async function claimUniqueName(base: string, tryReserve: (name: string) => Promise<boolean>, max = 999): Promise<string> {
  for (let n = 1; n <= max; n++) {
    const candidate = numbered(base, n);
    if (await tryReserve(candidate)) return candidate;
  }
  throw new Error('No hay apodos libres');
}
