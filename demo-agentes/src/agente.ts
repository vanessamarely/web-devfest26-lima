// Un agente SIMULADO y determinista que usa Mesa como lo haría uno real:
//  · "clics": toma el árbol de accesibilidad (take_snapshot), llena y hace clic por rol y nombre.
//  · "tools": lista y ejecuta las tools de WebMCP.
// Cada paso queda en la línea de tiempo del Panel del agente (y en la pista "Mesa · Agente").
import { snapshotTexto, tomarSnapshot, type Nodo } from './snapshot';
import { TOOLS, ejecutar } from './tools';

export interface Paso {
  t: number;
  accion: string;
  detalle: string;
  tipo: 'ok' | 'mal' | 'info' | 'espera';
}
type Log = (p: Omit<Paso, 't'>) => void;

const params = new URLSearchParams(location.search);
const PASO = Number(params.get('paso')) || 420;
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Ojos {
  ver: (nodos: Nodo[], foco?: Nodo) => void;
}

const buscar = (nodos: Nodo[], rol: string, nombre: RegExp) => nodos.find((n) => n.rol === rol && nombre.test(n.nombre));

/** Reserva "para 4, sábado, a las 20:00 (o lo más cerca)" a punta de clics. */
export async function agenteClics(log: Log, ojos: Ojos): Promise<boolean> {
  log({ accion: 'navigate_page', detalle: 'Mesa · Kaiyō Nikkei (Barranco)', tipo: 'info' });
  await dormir(PASO);
  let nodos = tomarSnapshot();
  ojos.ver(nodos);
  log({ accion: 'take_snapshot', detalle: `${nodos.length} elementos en el árbol`, tipo: 'info' });
  await dormir(PASO);
  const fecha = buscar(nodos, 'combobox', /fecha/i);
  if (fecha) {
    ojos.ver(nodos, fecha);
    const sel = fecha.el as HTMLSelectElement;
    sel.value = '2026-11-14';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    log({ accion: 'fill', detalle: `uid=${fecha.uid} combobox "Fecha" → Sáb 14`, tipo: 'ok' });
    await dormir(PASO);
  }
  const pers = buscar(tomarSnapshot(), 'spinbutton', /personas/i);
  if (pers) {
    ojos.ver(tomarSnapshot(), pers);
    const inp = pers.el as HTMLInputElement;
    inp.value = '4';
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    log({ accion: 'fill', detalle: `uid=${pers.uid} spinbutton "Personas" → 4`, tipo: 'ok' });
    await dormir(PASO);
  }
  // ¿la página dice que está cargando? Un agente SOLO lo sabe si el estado está en el árbol.
  for (let i = 0; i < 12; i++) {
    nodos = tomarSnapshot();
    const ocupado = nodos.some((n) => n.estado.includes('busy'));
    if (!ocupado) break;
    log({ accion: 'wait_for', detalle: 'form "Reservar…" busy → espero a que cargue', tipo: 'espera' });
    await dormir(400);
  }
  nodos = tomarSnapshot();
  ojos.ver(nodos);
  log({ accion: 'take_snapshot', detalle: `${nodos.length} elementos`, tipo: 'info' });
  await dormir(PASO);
  const horas = nodos.filter((n) => n.rol === 'button' && /^\d{2}:\d{2}$/.test(n.nombre));
  if (horas.length) {
    const h = horas.find((n) => n.nombre === '20:00') ?? horas.sort((a, b) => Math.abs(min(a.nombre) - 1200) - Math.abs(min(b.nombre) - 1200))[0];
    ojos.ver(nodos, h);
    (h.el as HTMLElement).click();
    log({ accion: 'click', detalle: `uid=${h.uid} button "${h.nombre}"${h.nombre !== '20:00' ? ' (20:00 no está libre)' : ''}`, tipo: 'ok' });
    await dormir(PASO);
  } else {
    log({ accion: 'take_snapshot', detalle: 'No veo horarios… sigo con la reserva', tipo: 'mal' });
  }
  for (let intento = 1; intento <= 3; intento++) {
    nodos = tomarSnapshot();
    const btn = buscar(nodos, 'button', /reserv/i);
    if (btn) {
      ojos.ver(nodos, btn);
      if (btn.estado.includes('disabled')) {
        log({ accion: 'wait_for', detalle: `uid=${btn.uid} button "${btn.nombre}" disabled → espero`, tipo: 'espera' });
        await dormir(400);
        continue;
      }
      (btn.el as HTMLElement).click();
      log({ accion: 'click', detalle: `uid=${btn.uid} button "${btn.nombre}"`, tipo: 'ok' });
      await dormir(PASO);
      const st = document.querySelector('#resumen')?.textContent ?? '';
      const ok = st.startsWith('Reserva confirmada');
      log({ accion: 'wait_for', detalle: st || '(sin mensaje)', tipo: ok ? 'ok' : 'mal' });
      return ok;
    }
    const gen = nodos.filter((n) => n.rol === 'generic');
    ojos.ver(nodos, gen[0]);
    log({ accion: 'take_snapshot', detalle: `No encuentro un botón para reservar (intento ${intento}). Veo: ${gen.map((g) => `uid=${g.uid} generic`).join(', ') || 'nada'}`, tipo: 'mal' });
    await dormir(PASO);
  }
  log({ accion: 'fin', detalle: 'No pude reservar: no hay ningún control con nombre "Reservar".', tipo: 'mal' });
  return false;
}
const min = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));

/** Reserva con las tools de WebMCP. */
export async function agenteTools(log: Log): Promise<boolean> {
  log({ accion: 'list_webmcp_tools', detalle: TOOLS.map((t) => t.name).join(', '), tipo: 'info' });
  await dormir(PASO);
  const busq = await ejecutar('buscar_restaurantes', { distrito: 'Barranco', cocina: 'nikkei' });
  log({ accion: 'execute_webmcp_tool', detalle: `buscar_restaurantes → ${JSON.parse(busq).total} resultados`, tipo: 'ok' });
  await dormir(PASO);
  const base = { restaurante: 'kaiyo', fecha: '2026-11-14', personas: 4, titular: 'Vanessa' };
  let hora = '20:00';
  for (let intento = 1; intento <= 3; intento++) {
    const out = await ejecutar('reservar_mesa', { ...base, hora });
    if (!out.startsWith('Error')) {
      log({ accion: 'execute_webmcp_tool', detalle: `reservar_mesa (${hora}) → ${out}`, tipo: 'ok' });
      return true;
    }
    const libres = out.match(/\d{2}:\d{2}/g)?.filter((h) => h !== hora) ?? [];
    if (!libres.length) {
      log({ accion: 'execute_webmcp_tool', detalle: `reservar_mesa (${hora}) → "${out}". No sé qué falló; reintento igual.`, tipo: 'mal' });
      await dormir(PASO);
      if (intento === 3) log({ accion: 'fin', detalle: 'Me rindo: la tool solo dice "Error".', tipo: 'mal' });
      continue;
    }
    hora = libres.sort((a, b) => Math.abs(min(a) - 1200) - Math.abs(min(b) - 1200) || (a > b ? -1 : 1))[0];
    log({ accion: 'execute_webmcp_tool', detalle: `reservar_mesa → "${out}" → pruebo ${hora}`, tipo: 'espera' });
    await dormir(PASO);
  }
  return false;
}

export { snapshotTexto };
