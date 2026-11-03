// Restaurantes FICTICIOS de Lima (nombres, precios y horarios inventados).
export interface Restaurante {
  id: string;
  nombre: string;
  cocina: 'nikkei' | 'cevichería' | 'criolla' | 'chifa' | 'anticuchería' | 'café';
  distrito: string;
  rating: number;
  resenas: number;
  precio: 1 | 2 | 3 | 4;
  descripcion: string;
  color: string;
  icono: string;
}

export const RESTAURANTES: Restaurante[] = [
  { id: 'kaiyo', nombre: 'Kaiyō Nikkei', cocina: 'nikkei', distrito: 'Barranco', rating: 4.7, resenas: 812, precio: 3, descripcion: 'Tiraditos, makis acevichados y robata frente al mar de Barranco.', color: '#0e7490', icono: '🍣' },
  { id: 'umami', nombre: 'Umami del Puente', cocina: 'nikkei', distrito: 'Barranco', rating: 4.5, resenas: 433, precio: 2, descripcion: 'Nikkei de barrio a dos cuadras del Puente de los Suspiros.', color: '#7c3aed', icono: '🥢' },
  { id: 'punta', nombre: 'La Punta Azul', cocina: 'cevichería', distrito: 'Miraflores', rating: 4.6, resenas: 1290, precio: 2, descripcion: 'Ceviche clásico, leche de tigre y chicharrón de pescado.', color: '#0369a1', icono: '🐟' },
  { id: 'brasa', nombre: 'Brasa & Barrio', cocina: 'anticuchería', distrito: 'Surquillo', rating: 4.4, resenas: 640, precio: 1, descripcion: 'Anticuchos, rachi y picarones hasta la medianoche.', color: '#b45309', icono: '🔥' },
  { id: 'jade', nombre: 'Jardín de Jade', cocina: 'chifa', distrito: 'San Isidro', rating: 4.3, resenas: 588, precio: 2, descripcion: 'Chaufa, wantán frito y kam lu wantán para compartir.', color: '#b91c1c', icono: '🥡' },
  { id: 'tambo', nombre: 'Tambo Criollo', cocina: 'criolla', distrito: 'Miraflores', rating: 4.5, resenas: 902, precio: 2, descripcion: 'Lomo saltado, ají de gallina y causa limeña.', color: '#15803d', icono: '🍲' },
];

export const BY_ID = new Map(RESTAURANTES.map((r) => [r.id, r]));

export const FECHAS = [
  { valor: '2026-11-13', label: 'Vie 13' },
  { valor: '2026-11-14', label: 'Sáb 14' },
  { valor: '2026-11-15', label: 'Dom 15' },
];

const TODAS = ['13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

/** Horarios libres (deterministas): el sábado a las 20:00 Kaiyō está lleno para 4. */
export function horariosLibres(id: string, fecha: string, personas: number): string[] {
  const seed = [...(id + fecha)].reduce((s, c) => s + c.charCodeAt(0), 0) + personas;
  return TODAS.filter((h, i) => (seed + i * 7) % 3 !== 0 && !(id === 'kaiyo' && fecha === '2026-11-14' && h === '20:00' && personas >= 3));
}

export const soles = (n: number) => '$'.repeat(n);
