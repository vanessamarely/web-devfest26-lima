// Verifica la app publicada contra Firestore real, con una sesión de prueba (no toca las de la charla):
//  · 3 personas entran el día de la primera charla, publican su avatar y una usa "Pregúntale a la charla"
//    y le envía su pregunta a Vanessa (queda en Firestore: sessions/<sesión>-<charla>/questions).
//  · Al día siguiente una vuelve: su apodo se propone primero, su avatar vuelve (+200) y lo edita;
//    una persona nueva también entra. El muro debe mostrar 1 avatar con la insignia "Día 1 + Día 2".
//
//   node scripts/verificar-en-vivo.mjs                 → https://devfest-lima-slides.web.app
//   BASE=http://localhost:5183 node scripts/verificar-en-vivo.mjs
//
// Para borrar los datos de prueba: abre el deck con ?presenter=1&session=<sesión que imprime> →
// Presentar en vivo (GitHub) → menú → Vaciar sesión en vivo… (en cada charla).
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'https://devfest-lima-slides.web.app';
const SES = 'prueba-verificacion-' + Date.now().toString(36);
const LOCAL = BASE.includes('localhost') ? '&local' : '';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errores = [];
let fallos = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) fallos++;
};

const nuevoCelular = async (ctx) => {
  ctx ??= await b.newContext({ viewport: { width: 380, height: 800 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push(e.message));
  return p;
};
const entrar = async (p, talk) => {
  await p.goto(`${BASE}/live/?talk=${talk}&session=${SES}${LOCAL}`, { waitUntil: 'load' });
  await p.waitForSelector('[data-name]', { timeout: 45000 });
  const estado = await p.locator('[data-status]').textContent();
  const opciones = await p.locator('[data-name]').allTextContents();
  await p.click('[data-join]');
  await p.waitForFunction(() => !document.querySelector('[data-me]')?.hidden, null, { timeout: 60000 });
  return { estado, opciones, nombre: await p.locator('[data-me]').textContent() };
};
const avatar = async (p, cambios) => {
  await p.click('.menu-btn');
  await p.click('[data-go="avatar"]');
  await p.waitForSelector('[data-publish]');
  const aviso = (await p.locator('.return-note').count()) ? (await p.locator('.return-note').first().textContent()).trim() : '';
  for (const [k, v] of cambios) await p.click(`[data-opt="${k}"][data-v="${v}"]`);
  const cambio = (await p.locator('[data-diff]').count()) ? await p.locator('[data-diff]').textContent() : '';
  await p.click('[data-publish]');
  await p.waitForFunction(() => /Listo/.test(document.querySelector('.creator [data-msg]')?.textContent ?? ''), null, { timeout: 45000 });
  await p.click('.menu-btn');
  await p.click('[data-go="live"]');
  return { aviso, cambio };
};
const preguntar = async (p, texto) => {
  await p.click('[data-r="ask"]');
  await p.waitForSelector('.asistente-sheet [data-ia-estado][data-estado]:not([data-estado="revisando"])', { timeout: 20000 });
  const estado = (await p.locator('[data-ia-estado]').textContent()).trim();
  await p.fill('#asis-q', texto);
  await p.press('#asis-q', 'Enter');
  await p.waitForSelector('.msg [data-enviar]', { timeout: 30000 });
  const respuesta = (await p.locator('.msg .a').last().innerText()).replace(/\s+/g, ' ');
  await p.locator('.msg [data-enviar]').last().click();
  await p.waitForSelector('.msg .enviada', { timeout: 30000 });
  await p.click('.asistente-sheet [data-close]');
  return { estado, respuesta };
};
const deck = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const muro = async (talk) => {
  await deck.goto(`${BASE}/${talk}/?session=${SES}${LOCAL}`, { waitUntil: 'load' });
  await deck.waitForTimeout(2500);
  await deck.evaluate(() => document.querySelector('deck-stage').goTo([...document.querySelectorAll('deck-stage > section')].findIndex((s) => s.dataset.id === 'muro')));
  await deck.waitForTimeout(5000);
  return deck.evaluate(() => ({ avatares: document.querySelectorAll('.avatar-tile').length, dosCharlas: document.querySelectorAll('.avatar-tile[data-both]').length, enSala: document.querySelector('[data-count="players"]')?.textContent }));
};

console.log(`Sesión de prueba: ${SES} · ${BASE}\n`);
const [primera, segunda] = ['genui', 'agentes'];
// ── Primera charla ──
const ana = await nuevoCelular();
const beto = await nuevoCelular();
const caro = await nuevoCelular();
const a1 = await entrar(ana, primera);
ok(/Conectado/.test(a1.estado), `El celular se conecta en vivo (${a1.estado.trim()})`);
const b1 = await entrar(beto, primera);
const c1 = await entrar(caro, primera);
ok(new Set([a1.nombre, b1.nombre, c1.nombre]).size === 3, `Apodos únicos: ${a1.nombre}, ${b1.nombre}, ${c1.nombre}`);
await avatar(ana, [['pelo', 8], ['rasgos', 3], ['ropa', 3], ['abajo', 3]]);
await avatar(beto, [['pelo', 0], ['rasgos', 5], ['ropa', 2]]);
await avatar(caro, [['pelo', 7], ['ropa', 6]]);
ok(true, '3 avatares publicados en Firestore');
const q1 = await preguntar(beto, '¿Por qué mi página salta mientras la IA responde?');
ok(/espacio|reserva|salta/i.test(q1.respuesta), `El asistente responde con la charla: "${q1.respuesta.slice(0, 90)}…"`);
ok(true, 'La pregunta llegó a Vanessa (Firestore aceptó la escritura)');
const m1 = await muro(primera);
ok(m1.avatares === 3 && m1.dosCharlas === 0, `Muro de la primera charla: ${m1.avatares} avatares, ${m1.enSala} en la sala`);
// ── Segunda charla: Ana vuelve (mismo celular), Dani es nueva ──
const a2 = await entrar(ana, segunda);
ok(a2.opciones[0] === a1.nombre, `Se propone primero el apodo de la otra charla (${a2.opciones[0]})`);
const ed = await avatar(ana, [['gorro', 3], ['accesorio', 6]]);
ok(/volvió \(\+200\)/.test(ed.aviso), 'El avatar de la otra charla vuelve con el aviso +200');
ok(/casco de parapente, lupa/.test(ed.cambio), `Se ve lo que cambió hoy: "${ed.cambio}"`);
const dani = await nuevoCelular();
await entrar(dani, segunda);
await avatar(dani, [['pelo', 2]]);
const q2 = await preguntar(dani, '¿Qué ve un agente de mi página?');
ok(/árbol|accesibilidad|ve|captura/i.test(q2.respuesta), `El asistente de la segunda charla responde con SU contenido: "${q2.respuesta.slice(0, 90)}…"`);
const m2 = await muro(segunda);
ok(m2.avatares === 2 && m2.dosCharlas === 1, `Muro de la segunda charla: ${m2.avatares} avatares, ${m2.dosCharlas} con insignia "Día 1 + Día 2"`);
ok(!errores.length, `Sin errores de JavaScript${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
console.log(`\n${fallos ? `✗ ${fallos} verificaciones fallaron` : '✓ Todo bien'} · sesión ${SES}`);
await b.close();
process.exit(fallos ? 1 : 0);
