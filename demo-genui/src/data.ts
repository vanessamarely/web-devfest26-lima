// Catálogo FICTICIO de depas en Lima (semilla fija: siempre los mismos 300).
// Precios, direcciones y edificios son inventados; los distritos y la cercanía al mar son reales
// solo en espíritu (Barranco, Miraflores y Chorrillos miran al Pacífico).

export interface Depa {
  id: string;
  titulo: string;
  distrito: string;
  /** Soles al mes */
  precio: number;
  m2: number;
  dorms: number;
  banos: number;
  piso: number;
  /** Metros al malecón */
  mar: number;
  vista: boolean;
  /** Coordenadas en el mapa (0–100) */
  x: number;
  y: number;
  /** Semilla de la ilustración */
  foto: number;
  etiqueta?: string;
}

export const DISTRITOS = [
  { nombre: 'Barranco', x: 52, y: 70, costa: true, base: 33 },
  { nombre: 'Miraflores', x: 46, y: 56, costa: true, base: 38 },
  { nombre: 'Chorrillos', x: 58, y: 84, costa: true, base: 27 },
  { nombre: 'San Isidro', x: 50, y: 40, costa: false, base: 40 },
  { nombre: 'Magdalena', x: 34, y: 38, costa: true, base: 29 },
  { nombre: 'San Miguel', x: 24, y: 30, costa: true, base: 26 },
  { nombre: 'Surco', x: 70, y: 66, costa: false, base: 30 },
  { nombre: 'Lince', x: 56, y: 28, costa: false, base: 27 },
  { nombre: 'Jesús María', x: 44, y: 22, costa: false, base: 27 },
  { nombre: 'Pueblo Libre', x: 32, y: 20, costa: false, base: 25 },
] as const;

const CALLES = ['Av. Grau', 'Jr. Domeyer', 'Av. Pedro de Osma', 'Calle Colina', 'Malecón Paul Harris', 'Av. Larco', 'Calle Berlín', 'Av. Benavides', 'Malecón Cisneros', 'Calle Alcanfores', 'Av. Huaylas', 'Jr. Batallón Callao', 'Av. Javier Prado', 'Calle Las Flores', 'Av. Brasil', 'Av. Arequipa'];
const ETIQUETAS = ['Pet friendly', 'Amoblado', 'Terraza', 'Con cochera', 'Estreno', 'Cerca al Metropolitano'];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** 300 depas siempre iguales. */
export function generarDepas(n = 300, seed = 2026): Depa[] {
  const r = rng(seed);
  const out: Depa[] = [];
  for (let i = 0; i < n; i++) {
    const d = DISTRITOS[i < 60 ? 0 : Math.floor(r() * DISTRITOS.length)];
    const dorms = 1 + Math.floor(r() * 3) + (i < 60 && r() < 0.6 ? 1 - Math.floor(r() * 2) : 0);
    const m2 = Math.round(38 + dorms * 18 + r() * 34);
    const mar = d.costa ? Math.round(80 + r() * 1400) : Math.round(1800 + r() * 4200);
    const vista = d.costa && mar < 500 && r() < 0.7;
    const precio = Math.round((d.base * m2 * (vista ? 1.18 : 1) * (0.86 + r() * 0.28)) / 10) * 10;
    const prefix = d.nombre.slice(0, 2).toLowerCase().normalize('NFD').replace(/[^a-z]/g, 'x');
    out.push({
      id: `${prefix}-${String(i + 1).padStart(3, '0')}`,
      titulo: `${CALLES[Math.floor(r() * CALLES.length)]} ${100 + Math.floor(r() * 1800)}`,
      distrito: d.nombre,
      precio,
      m2,
      dorms: Math.max(1, Math.min(4, dorms)),
      banos: 1 + Math.floor(r() * 2),
      piso: 1 + Math.floor(r() * 18),
      mar,
      vista,
      x: Math.max(4, Math.min(96, d.x + (r() - 0.5) * 10)),
      y: Math.max(4, Math.min(96, d.y + (r() - 0.5) * 8)),
      foto: Math.floor(r() * 1e6),
      etiqueta: r() < 0.45 ? ETIQUETAS[Math.floor(r() * ETIQUETAS.length)] : undefined,
    });
  }
  return out;
}

export const DEPAS = generarDepas();
export const DEPA_BY_ID = new Map(DEPAS.map((d) => [d.id, d]));

export const soles = (n: number) => `S/ ${n.toLocaleString('es-PE')}`;
export const precioM2 = (d: Depa) => d.precio / d.m2;

export interface Filtro {
  distritos?: string[];
  dorms?: number;
  max?: number;
  vista?: boolean;
}

export function filtrar(list: Depa[], f: Filtro): Depa[] {
  return list.filter((d) => (!f.distritos?.length || f.distritos.includes(d.distrito)) && (!f.dorms || d.dorms >= f.dorms) && (!f.max || d.precio <= f.max) && (!f.vista || d.vista));
}
