// Regla 1 · Reserva el espacio.
// El modelo NO inventa HTML: elige piezas de este catálogo. Y como el PLANO llega primero
// (qué secciones vienen), cada sección se reserva con su tamaño final ANTES de que llegue
// su contenido. El esqueleto ya tiene la forma; el contenido solo "rellena".
import type { TipoPieza } from '../ia';

/** Cada tarjeta mide 352 px; las filas dependen de cuántas columnas caben (3, 2 o 1). */
export const TARJETA = 352;
const columnas = () => (matchMedia('(max-width: 560px)').matches ? 1 : matchMedia('(max-width: 900px)').matches ? 2 : 3);
const altoDestacados = (n = 6) => 40 + Math.ceil(n / columnas()) * (TARJETA + 16);

export const CATALOGO: Record<TipoPieza, { alto?: number; aspecto?: string; titulo: string }> = {
  resumen: { alto: 136, titulo: 'Resumen' },
  mapa: { aspecto: '21 / 8', titulo: 'Mapa' },
  get destacados() {
    return { alto: altoDestacados(), titulo: 'Destacados' };
  },
  grafico: { alto: 260, titulo: 'Precio por m²' },
  lista: { alto: 560 + 56, titulo: 'Todos los resultados' },
};

/** El esqueleto de una sección: gris, punteado en rayos X, con su forma final. */
export function reservar(id: string, tipo: TipoPieza): HTMLElement {
  const slot = document.createElement('section');
  slot.className = `slot slot-${tipo} esqueleto`;
  slot.dataset.seccion = id;
  slot.dataset.medida = medida(tipo);
  const { alto, aspecto } = CATALOGO[tipo];
  if (alto) slot.style.minHeight = `${alto}px`;
  if (aspecto) slot.style.aspectRatio = aspecto;
  return slot;
}

export const medida = (tipo: TipoPieza) => {
  const { alto, aspecto } = CATALOGO[tipo];
  return `${CATALOGO[tipo].titulo} · ${alto ? `${alto}px` : aspecto}`;
};

/** La misma reserva como atributo style (para el render que arma HTML). */
export const estiloReserva = (tipo: TipoPieza) => {
  const { alto, aspecto } = CATALOGO[tipo];
  return `${alto ? `min-height:${alto}px;` : ''}${aspecto ? `aspect-ratio:${aspecto};` : ''}`;
};
