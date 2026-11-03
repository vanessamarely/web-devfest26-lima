// Lima detrás de los avatares (capítulos, portada y cierre): lo antiguo y lo moderno juntos.
// Ilustración plana con el trazo del deck (tinta #1e1e1e) y los colores de Google.
// Lienzo 520×720 (proporción del panel en 16:9); el dibujo vive en x 60–460 y los fondos se
// extienden a los lados, así en 4:3 solo se recortan los costados (nunca el cielo ni el suelo).
const INK = '#1e1e1e';
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const svg = (body: string, label: string) =>
  `<svg class="landmark-svg" viewBox="0 0 520 720" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${label}"><title>${label}</title><g transform="translate(60 0)">${body}</g></svg>`;

/** Nube de garúa limeña (gris clarito). */
const cloud = (x: number, y: number, s = 1, c = '#ffffff') =>
  `<g class="lm-cloud" transform="translate(${x} ${y}) scale(${s})"><path d="M0 30 C0 14 16 8 26 14 C30 0 52 -2 60 12 C72 6 88 14 86 30 Z" fill="${c}" ${S}/></g>`;

const sun = (x: number, y: number, r: number) => {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const p = (rr: number) => `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
    return `<path d="M${p(r + 8)} L${p(r + 22)}" stroke="#f9ab00" stroke-width="6" stroke-linecap="round"/>`;
  }).join('');
  return `<g transform="translate(${x} ${y})"><g class="lm-rays">${rays}</g><circle r="${r}" fill="#ffd427" ${S}/></g>`;
};

/** Parapente (Miraflores): vela de colores, cuerdas y piloto. */
const glider = (x: number, y: number, s = 1, c = '#ea4335', c2 = '#ffd427') =>
  `<g class="lm-glider" transform="translate(${x} ${y}) scale(${s})">
    <path d="M-60 0 C-40 -26 40 -26 60 0 C40 -10 -40 -10 -60 0 Z" fill="${c}" ${S}/>
    <path d="M-20 -14 C-18 -20 18 -20 20 -14" fill="none" stroke="${c2}" stroke-width="6"/>
    <path d="M-56 0 L-4 52 M56 0 L4 52 M-20 -8 L-2 52 M20 -8 L2 52" stroke="${INK}" stroke-width="1.5"/>
    <rect x="-7" y="50" width="14" height="18" rx="4" fill="#4285f4" ${S}/><circle cx="0" cy="46" r="6" fill="#f6d3b3" ${S}/></g>`;

/** Gaviota en V. */
const gull = (x: number, y: number, s = 1) =>
  `<path class="lm-gull" d="M${x - 14 * s} ${y} q${7 * s} ${-8 * s} ${14 * s} 0 q${7 * s} ${-8 * s} ${14 * s} 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

const sea = (y: number) =>
  `<rect x="-80" y="${y}" width="680" height="${720 - y}" fill="#57caff" ${S}/>
   ${[0, 1, 2].map((i) => `<path class="lm-wave" d="M-80 ${y + 26 + i * 30} q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>`).join('')}`;

/** Huaca Pucllana: pirámide de adobe escalonada (siglo V) rodeada de edificios de Miraflores. */
export function huaca(): string {
  const steps = Array.from({ length: 6 }, (_, i) => {
    const y = 470 - i * 38;
    const inset = 10 + i * 34;
    return `<rect x="${inset}" y="${y}" width="${400 - inset * 2}" height="40" fill="${i % 2 ? '#d8a070' : '#c98b5e'}" ${S}/>
      <path d="M${inset + 8} ${y + 14} h${400 - inset * 2 - 16} M${inset + 8} ${y + 28} h${400 - inset * 2 - 16}" stroke="#8b5a2b" stroke-width="2" stroke-dasharray="10 6"/>`;
  }).join('');
  const tower = (x: number, w: number, h: number, c: string) =>
    `<rect x="${x}" y="${470 - h}" width="${w}" height="${h}" fill="${c}" ${S}/>${Array.from({ length: Math.floor(h / 30) - 1 }, (_, r) => `<path d="M${x + 8} ${470 - h + 18 + r * 30} h${w - 16}" stroke="#fff" stroke-width="5" opacity=".7"/>`).join('')}`;
  return svg(
    `<rect x="-80" width="680" height="720" fill="#c3ecf6"/>
     ${sun(330, 110, 30)}${cloud(20, 90, 0.9)}${cloud(200, 150, 0.6)}
     ${gull(120, 200)}${gull(160, 180, 0.8)}
     ${tower(-70, 90, 330, '#4285f4')}${tower(30, 70, 260, '#9aa9b8')}${tower(330, 80, 300, '#34a853')}${tower(410, 90, 360, '#9aa9b8')}
     ${steps}
     <rect x="-80" y="508" width="680" height="220" fill="#e8dfcd" ${S}/>
     <path d="M-80 560 H600" stroke="#c9a65a" stroke-width="3" stroke-dasharray="16 10"/>`,
    'Huaca Pucllana entre los edificios de Miraflores',
  );
}

/** Balcones de cajón del Centro de Lima, con sus celosías de madera. */
export function balcones(): string {
  const balcony = (x: number, y: number, c: string) =>
    `<g transform="translate(${x} ${y})">
      <rect x="0" y="0" width="150" height="120" fill="${c}" ${S}/>
      <path d="M0 0 h150 v-14 h-150 z" fill="#5a3420" ${S}/>
      ${[0, 1, 2, 3].map((i) => `<rect x="${10 + i * 35}" y="14" width="28" height="62" fill="#3a2414" ${S}/><path d="M${14 + i * 35} 22 l20 20 M${34 + i * 35} 22 l-20 20 M${14 + i * 35} 46 l20 20 M${34 + i * 35} 46 l-20 20" stroke="#d8a070" stroke-width="2"/>`).join('')}
      <rect x="0" y="86" width="150" height="34" fill="#5a3420" ${S}/>
      <path d="M10 120 L30 150 M140 120 L120 150" ${S}/></g>`;
  return svg(
    `<rect x="-80" width="680" height="720" fill="#ffe7a5"/>
     ${cloud(260, 60, 0.8)}${gull(80, 90)}
     <rect x="-80" y="120" width="680" height="600" fill="#f9ab00" ${S}/>
     ${[-40, 120, 280].map((x) => `<rect x="${x + 30}" y="400" width="90" height="170" rx="45" fill="#8b5a2b" ${S}/>`).join('')}
     ${balcony(-30, 190, '#6b4329')}${balcony(130, 190, '#34a853')}${balcony(290, 190, '#6b4329')}
     <rect x="-80" y="600" width="680" height="130" fill="#d8cdb8" ${S}/>`,
    'Balcones de cajón del Centro de Lima',
  );
}

/** Puente de los Suspiros (Barranco), con casonas de colores y un mural. */
export function puente(): string {
  return svg(
    `<rect x="-80" width="680" height="720" fill="#ff9a8b"/>
     <rect x="-80" y="0" width="680" height="300" fill="#ffd8a8"/>
     ${sun(320, 150, 40)}${cloud(10, 80, 0.8, '#fff4e0')}
     <rect x="-70" y="250" width="140" height="300" fill="#57caff" ${S}/><rect x="-50" y="300" width="40" height="60" fill="#fff" ${S}/><rect x="10" y="300" width="40" height="60" fill="#fff" ${S}/>
     <rect x="330" y="230" width="150" height="320" fill="#ffd427" ${S}/><rect x="350" y="290" width="44" height="64" fill="#fff" ${S}/><rect x="410" y="290" width="44" height="64" fill="#fff" ${S}/>
     <circle cx="405" cy="450" r="34" fill="#ea4335" ${S}/><path d="M392 444 l8 8 16 -18" stroke="#fff" stroke-width="6" fill="none"/>
     <path d="M60 360 L340 360 L340 380 L60 380 Z" fill="#8b5a2b" ${S}/>
     <path d="M70 360 L70 300 M330 360 L330 300 M130 360 V306 M200 360 V310 M270 360 V306" ${S}/>
     <path d="M50 300 L200 250 L350 300 Z" fill="#c5221f" ${S}/>
     <path d="M70 330 h260" stroke="${INK}" stroke-width="3"/>
     <path d="M60 380 C120 470 280 470 340 380" fill="none" ${S}/>
     <path d="M-80 560 C80 520 260 600 600 540 L600 720 L-80 720 Z" fill="#34a853" ${S}/>
     <path d="M100 720 C140 640 220 600 260 560" fill="none" stroke="#e8dfcd" stroke-width="22"/>
     <path d="M100 720 C140 640 220 600 260 560" fill="none" ${S}/>`,
    'Puente de los Suspiros en Barranco',
  );
}

/** Costa Verde: acantilados, el Faro La Marina, el mar y parapentes. */
export function costa(): string {
  return svg(
    `<rect x="-80" width="680" height="720" fill="#c3ecf6"/>
     ${cloud(40, 70, 0.9)}${cloud(250, 40, 0.7)}
     ${glider(120, 150, 0.9, '#ea4335', '#ffd427')}${glider(300, 230, 0.7, '#34a853', '#ffffff')}
     ${gull(220, 120)}
     <path d="M-80 330 C40 320 120 300 240 310 C320 316 380 300 480 310 L600 310 L600 520 L-80 520 Z" fill="#34a853" ${S}/>
     <path d="M-80 380 C60 370 200 400 600 380" fill="none" stroke="#0b8043" stroke-width="3" stroke-dasharray="14 10"/>
     <g transform="translate(330 170)">
       <path d="M-20 140 L-12 0 L12 0 L20 140 Z" fill="#ffffff" ${S}/>
       <path d="M-18 104 L18 104 L19 122 L-19 122 Z M-15 48 L15 48 L16 66 L-16 66 Z" fill="#ea4335" ${S}/>
       <rect x="-16" y="-24" width="32" height="24" fill="#ffd427" ${S}/><path d="M-20 -24 L0 -44 L20 -24 Z" fill="#ea4335" ${S}/>
     </g>
     <path d="M-80 520 L600 520 L600 560 L-80 560 Z" fill="#c9a65a" ${S}/>
     ${sea(560)}`,
    'Costa Verde de Miraflores con el Faro La Marina y parapentes',
  );
}

/** Portada y cierre: el cielo de Lima frente al mar (sol, garúa, parapentes y gaviotas). */
export function coverSky(): string {
  return `<svg class="landmark-svg" viewBox="0 0 520 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g transform="translate(60 0)">
    ${sun(320, 120, 40)}
    ${cloud(20, 80, 0.9)}${cloud(170, 170, 0.6)}
    ${glider(120, 250, 0.8, '#ea4335', '#ffd427')}${glider(330, 300, 0.6, '#4285f4', '#ffffff')}
    ${gull(250, 200)}${gull(290, 180, 0.8)}
  </g></svg>`;
}

export const LANDMARKS: Record<string, () => string> = { huaca, balcones, puente, costa, cover: coverSky };

/** Piezas sueltas para los efectos de reacciones (SVG independientes). */
export const gliderSVG = () => `<svg viewBox="-70 -30 140 110" aria-hidden="true">${glider(0, 0, 1)}</svg>`;
export const sunSVG = () => `<svg viewBox="-80 -80 160 160" aria-hidden="true">${sun(0, 0, 44)}<circle cx="-14" cy="-6" r="5" fill="${INK}"/><circle cx="14" cy="-6" r="5" fill="${INK}"/><path d="M-16 12 Q0 26 16 12" fill="none" ${S}/></svg>`;
