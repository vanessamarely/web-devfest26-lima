// Plantillas de cada pieza del catálogo. Las usan los dos renders (demoler y reciclar):
// lo que cambia entre "roto" y "arreglado" es CÓMO se ponen en la página, no cómo se ven.
import { DISTRITOS, soles, type Depa } from '../data';

export const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

type DepaLite = Pick<Depa, 'id' | 'titulo' | 'distrito' | 'precio' | 'm2' | 'dorms' | 'banos' | 'mar' | 'vista' | 'foto' | 'etiqueta'>;

const cielos = [
  ['#9fd3f2', '#e7f4fb'],
  ['#ffb88c', '#ffe3c2'],
  ['#c6b5ff', '#ffd4e5'],
  ['#8ecae6', '#fdfcdc'],
];
const fachadas = ['#f4efe6', '#e9e4dc', '#d8e2dc', '#f2d0a9', '#cbd5e1', '#e5d4c0'];

/** "Foto" ilustrada del depa (SVG): cielo, mar si tiene vista, edificio y ventanas. */
export function fotoURL(d: Pick<Depa, 'foto' | 'vista'>): string {
  const s = d.foto;
  const [c1, c2] = cielos[s % cielos.length];
  const fach = fachadas[(s >> 3) % fachadas.length];
  const floors = 5 + ((s >> 5) % 5);
  const cols = 3 + ((s >> 8) % 2);
  const bw = 150 + ((s >> 10) % 60);
  const bx = 200 - bw / 2 + (((s >> 12) % 40) - 20);
  const fh = 30;
  const by = 300 - floors * fh - 26;
  let win = '';
  for (let f = 0; f < floors; f++)
    for (let c = 0; c < cols; c++) {
      const lit = (s >> ((f + c) % 16)) & 1;
      win += `<rect x="${bx + 14 + c * ((bw - 28) / cols)}" y="${by + 10 + f * fh}" width="${(bw - 28) / cols - 10}" height="${fh - 12}" rx="3" fill="${lit ? '#fff3c4' : '#9fb4c7'}"/>`;
    }
  const sea = d.vista ? `<rect y="200" width="400" height="100" fill="#3b82c4"/><path d="M0 214 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#bfe3ff" stroke-width="4"/>` : `<rect y="230" width="400" height="70" fill="#7aa874"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="${320 - (s % 200)}" cy="70" r="26" fill="#fff6d6" opacity=".9"/>${sea}<rect x="${bx}" y="${by}" width="${bw}" height="${floors * fh + 26}" fill="${fach}" stroke="#334155" stroke-width="2"/>${win}<rect x="${bx - 6}" y="${by - 8}" width="${bw + 12}" height="10" fill="#334155"/><rect x="0" y="292" width="400" height="8" fill="#94a3b8"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Tarjeta de un depa. Con reserva, la foto tiene aspect-ratio y medidas (el hueco ya está). */
export function tarjetaHTML(d: DepaLite, reserva: boolean): string {
  return `<article class="card" data-id="${esc(d.id)}" data-precio="${d.precio}">
    <div class="foto"${reserva ? ' style="aspect-ratio:4/3"' : ''}><img alt="" data-src="${fotoURL(d)}"${reserva ? ' width="400" height="300"' : ''} /></div>
    ${d.vista ? '<span class="badge-vista">Vista al mar</span>' : ''}
    <button class="fav" type="button" aria-label="Guardar ${esc(d.titulo)}">♡</button>
    <div class="card-body">
      <p class="precio"><span>${soles(d.precio)}</span><small>/mes</small></p>
      <h3>${esc(d.titulo)}</h3>
      <p class="meta">${esc(d.distrito)} · ${d.m2} m² · ${d.dorms} dorm · ${d.banos} baño${d.banos > 1 ? 's' : ''}</p>
      <p class="mar">🌊 a ${d.mar.toLocaleString('es-PE')} m del malecón</p>
      ${d.etiqueta ? `<span class="chip">${esc(d.etiqueta)}</span>` : ''}
    </div>
  </article>`;
}

/** Fila de la lista completa (alto fijo: 84 px). */
export function filaHTML(d: DepaLite, i: number): string {
  return `<div class="fila" data-id="${esc(d.id)}" data-precio="${d.precio}" role="listitem">
    <span class="fila-n">${i + 1}</span>
    <span class="fila-img" style="background:${fachadas[d.foto % fachadas.length]}"></span>
    <span class="fila-t"><b>${esc(d.titulo)}</b><small>${esc(d.distrito)} · ${d.m2} m² · ${d.dorms} dorm</small></span>
    <span class="fila-mar">${d.mar.toLocaleString('es-PE')} m del mar</span>
    <span class="precio">${soles(d.precio)}</span>
  </div>`;
}

/** Mapa ilustrado de la costa de Lima con los distritos y los pines de los destacados. */
export function mapaHTML(pins: DepaLite[], coords: Map<string, { x: number; y: number }>): string {
  const labels = DISTRITOS.map((d) => `<text x="${d.x * 9}" y="${d.y * 3.4}" class="m-lbl">${esc(d.nombre)}</text>`).join('');
  const ps = pins
    .map((d, i) => {
      const c = coords.get(d.id) ?? { x: 50, y: 50 };
      return `<g class="pin" transform="translate(${c.x * 9} ${c.y * 3.4})"><path d="M0 0 C-12 -16 -12 -30 0 -30 C12 -30 12 -16 0 0 Z" fill="#0f766e" stroke="#fff" stroke-width="2"/><text y="-17" text-anchor="middle">${i + 1}</text></g>`;
    })
    .join('');
  return `<div class="mapa"><svg viewBox="0 0 900 343" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa de Lima con ${pins.length} depas">
    <rect width="900" height="343" fill="#e8efe6"/>
    <path d="M0 0 L120 0 C150 60 250 120 330 150 C420 190 470 250 520 290 C560 320 600 343 640 343 L0 343 Z" fill="#a9d4f0"/>
    <path d="M120 0 C150 60 250 120 330 150 C420 190 470 250 520 290 C560 320 600 343 640 343" fill="none" stroke="#5aa7d6" stroke-width="4"/>
    <path d="M300 40 L880 120 M420 0 L520 343 M600 0 L700 343" stroke="#fff" stroke-width="6" opacity=".8"/>
    ${labels}${ps}
    <text x="40" y="250" class="m-sea">Océano Pacífico</text></svg></div>`;
}

export function graficoHTML(g: { titulo: string; barras: { distrito: string; valor: number }[] }): string {
  const max = Math.max(...g.barras.map((b) => b.valor));
  return `<div class="grafico"><h2>${esc(g.titulo)}</h2>${g.barras
    .map((b) => `<div class="g-row"><span>${esc(b.distrito)}</span><i style="--v:${(b.valor / max).toFixed(3)}"></i><b>S/ ${b.valor}</b></div>`)
    .join('')}</div>`;
}
