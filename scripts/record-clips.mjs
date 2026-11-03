// Graba los clips de las dos demos (Playwright + el Chrome instalado) y mide los números que
// muestran los slides. Requiere las demos corriendo: npm run dev:genui · npm run dev:agentes
//
//   node scripts/record-clips.mjs            → las dos charlas
//   node scripts/record-clips.mjs genui      → solo Nido (Día 1)
//   node scripts/record-clips.mjs agentes    → solo Mesa (Día 2)
//
// Salida: slides/public/clips/<charla>/<clip>.webm + .png (póster) + metrics.json
import { chromium } from 'playwright-core';
import { mkdir, rename, rm, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const which = process.argv[2];
const GENUI = process.env.GENUI_URL ?? 'http://localhost:5184';
const MESA = process.env.MESA_URL ?? 'http://localhost:5185';
const SIZE = { width: 1280, height: 720 };
const tmp = join(root, '.clips-tmp');

const browser = await chromium.launch({ channel: 'chrome', headless: true });

/** Graba una escena: abre un contexto con video, corre `fn`, guarda webm + póster. */
async function escena(talk, nombre, url, fn) {
  const out = join(root, 'slides/public/clips', talk);
  await mkdir(out, { recursive: true });
  await rm(tmp, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: tmp, size: SIZE }, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.warn(`  [${nombre}] error:`, e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  let poster = null;
  const res = await fn(page, async () => (poster = await page.screenshot()));
  if (!poster) poster = await page.screenshot();
  await ctx.close();
  const [file] = await readdir(tmp);
  await rename(join(tmp, file), join(out, `${nombre}.webm`));
  await writeFile(join(out, `${nombre}.png`), poster);
  console.log(`  ✓ ${talk}/${nombre}.webm`, res ?? '');
  return res;
}

const fmt = (n) => Number(n).toLocaleString('es-PE');

// ── Día 1 · Nido ────────────────────────────────────────────────────────
async function nido() {
  const m = {};
  await escena('genui', 'intro', `${GENUI}/?rayos&tps=90`, async (page, posterNow) => {
    await page.click('button[type=submit]');
    await page.waitForTimeout(6500);
    await posterNow();
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(2500);
  });

  /** Comparador: izquierda regla apagada, derecha prendida. Devuelve las métricas de cada lado. */
  const comparar = async (regla, extra) =>
    escena('genui', ['', 'espacio', 'stream', 'reciclar', 'estado'][regla], `${GENUI}/compare.html?regla=${regla}`, async (page, posterNow) => {
      const cdp = await page.context().newCDPSession(page);
      if (regla === 4) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 3 });
      await page.waitForTimeout(1200);
      const [bad, good] = ['bad', 'good'].map((k) => page.frameLocator(`[data-f="${k}"]`));
      const frames = page.frames().filter((f) => f !== page.mainFrame());
      const fBad = frames.find((f) => f.url().includes(`rules=${[1, 2, 3, 4].map((k) => (k === regla ? 0 : 1)).join('')}`));
      const fGood = frames.find((f) => f !== fBad);
      await page.click('#go');
      await Promise.all([fBad, fGood].map((f) => f.waitForFunction(() => nido.metricas().ms > 0, null, { timeout: 90000 })));
      if (regla === 1) await posterNow();
      if (extra) await extra(page, bad, good, posterNow);
      await page.waitForTimeout(1500);
      if (regla !== 1 && regla !== 4 && !extra) await posterNow();
      return { bad: await fBad.evaluate(() => nido.metricas()), good: await fGood.evaluate(() => nido.metricas()) };
    });

  const r1 = await comparar(1);
  m['espacio.off'] = r1.bad.cls.toFixed(2);
  m['espacio.on'] = r1.good.cls.toFixed(2);
  const r2 = await comparar(2);
  m['stream.off.chars'] = fmt(r2.bad.leidos);
  m['stream.on.chars'] = fmt(r2.good.leidos);
  m['stream.off.renders'] = fmt(r2.bad.renders);
  m['stream.on.renders'] = fmt(r2.good.renders);
  const r3 = await comparar(3, async (page, bad, good, posterNow) => {
    // bajamos a las tarjetas; la IA corrige precios (el comparador lo pide solo)
    for (const f of [bad, good]) await f.locator('.slot-destacados').evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(5500);
    await posterNow();
    for (const f of [bad, good]) await f.locator('.lista-scroll').evaluate((el) => el.scrollBy({ top: 1600, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
  });
  m['reciclar.off'] = fmt(r3.bad.creados);
  m['reciclar.on'] = fmt(r3.good.creados);
  const r4 = await comparar(4, async (page, bad, good, posterNow) => {
    // un clic REAL en cada lado (INP solo cuenta interacciones de verdad)
    for (const f of [bad, good]) await f.locator('.slot-lista').evaluate((el) => el.scrollIntoView({ block: 'end' }));
    await page.waitForTimeout(500);
    await bad.locator('[data-ordenar]').click();
    await page.waitForTimeout(400);
    await good.locator('[data-ordenar]').click();
    await page.waitForTimeout(300);
    await posterNow();
    await page.waitForTimeout(3000);
  });
  m['estado.off'] = `${fmt(r4.bad.inp)} ms`;
  m['estado.on'] = `${fmt(r4.good.inp)} ms`;
  await writeFile(join(root, 'slides/public/clips/genui/metrics.json'), JSON.stringify(m, null, 2));
  console.log('  métricas Nido:', m);
}

// ── Día 2 · Mesa ────────────────────────────────────────────────────────
async function mesa() {
  const m = {};
  const correr = (page, cual) => page.evaluate((c) => mesa.panel.correr(c), cual);
  const arreglar = async (page) => {
    await page.click('[data-todos="0"]');
    await page.waitForTimeout(900);
  };
  await escena('agentes', 'intro', `${MESA}/?autoconfirmar&paso=520`, async (page, posterNow) => {
    await page.locator('#reserva').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const ok = correr(page, 'clics');
    await page.waitForTimeout(3200);
    await posterNow();
    await ok;
    await page.click('[data-tab="tiempo"]');
    await page.waitForTimeout(2200);
  });
  const ve = await escena('agentes', 've', `${MESA}/?bugs=div&autoconfirmar&paso=480`, async (page, posterNow) => {
    await page.locator('#reserva').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const malo = await correr(page, 'clics');
    await posterNow();
    await page.waitForTimeout(1200);
    await arreglar(page);
    const bueno = await correr(page, 'clics');
    await page.waitForTimeout(1500);
    return { malo, bueno };
  });
  m['ve.off'] = ve.malo ? '✓' : '✗ no lo encuentra';
  m['ve.on'] = ve.bueno ? '✓ 1er intento' : '✗';
  const tools = await escena('agentes', 'tools', `${MESA}/?bugs=error&autoconfirmar&paso=600&tab=tools`, async (page, posterNow) => {
    const malo = await correr(page, 'tools');
    await posterNow();
    await page.waitForTimeout(1200);
    await arreglar(page);
    const bueno = await correr(page, 'tools');
    await page.waitForTimeout(1800);
    return { malo, bueno };
  });
  m['tools.off'] = tools.malo ? '✓' : '✗ se rinde';
  m['tools.on'] = tools.bueno ? '✓ 19:30' : '✗';
  const carrera = await escena('agentes', 'carrera', `${MESA}/?bugs=carrera&red=lenta&autoconfirmar&paso=350&tab=tiempo`, async (page, posterNow) => {
    await page.locator('#reserva').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const malo = await correr(page, 'clics');
    await posterNow();
    await page.waitForTimeout(1500);
    await arreglar(page);
    const bueno = await correr(page, 'clics');
    await page.waitForTimeout(1800);
    return { malo, bueno };
  });
  m['carrera.off'] = carrera.malo ? '✓' : '✗ sin hora';
  m['carrera.on'] = carrera.bueno ? '✓ espera' : '✗';
  const ia = await escena('agentes', 'ia', `${MESA}/?bugs=ia&paso=400`, async (page, posterNow) => {
    await page.locator('.asistente').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    await correr(page, 'ia');
    await page.waitForTimeout(4800);
    const malo = await page.evaluate(() => mesa.panel.peorFrame());
    await posterNow();
    await arreglar(page);
    await page.waitForTimeout(3200); // que se "olvide" el peor frame anterior
    await correr(page, 'ia');
    await page.waitForTimeout(3600);
    const bueno = await page.evaluate(() => mesa.panel.peorFrame());
    return { malo, bueno };
  });
  m['ia.off'] = `${fmt(ia.malo)} ms`;
  m['ia.on'] = `${fmt(ia.bueno)} ms`;
  await writeFile(join(root, 'slides/public/clips/agentes/metrics.json'), JSON.stringify(m, null, 2));
  console.log('  métricas Mesa:', m);
}

if (!which || which === 'genui') {
  console.log('Nido (Día 1)…');
  await nido();
}
if (!which || which === 'agentes') {
  console.log('Mesa (Día 2)…');
  await mesa();
}
await rm(tmp, { recursive: true, force: true });
await browser.close();
