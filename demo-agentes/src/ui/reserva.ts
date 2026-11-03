// Formulario de reserva. Aquí viven dos bugs de la charla:
//  1 · Botón sin nombre: un div con ícono (para el agente es "generic").
//  3 · Carrera: con el bug, el botón solo se ve gris (CSS) mientras cargan los horarios, pero se puede
//      usar; arreglado, tiene estado REAL (disabled + aria-busy) hasta que todo cargó.
import { BY_ID, FECHAS, horariosLibres } from '../data';
import { bugs, latencia } from '../bugs';
import { esc } from './esc';

export interface Reserva {
  codigo: string;
  restaurante: string;
  fecha: string;
  hora: string | null;
  personas: number;
  titular: string;
}
export const reservas: Reserva[] = [];
let seq = 4820;

export function crearReserva(r: Omit<Reserva, 'codigo'>): Reserva {
  const res = { ...r, codigo: `MSA-${++seq}` };
  reservas.push(res);
  document.dispatchEvent(new CustomEvent('mesa:reserva', { detail: res }));
  return res;
}

/** Carga los horarios desde el "servidor" (latencia simulada). */
export async function cargarHorarios(id: string, fecha: string, personas: number): Promise<string[]> {
  await new Promise((r) => setTimeout(r, latencia()));
  return horariosLibres(id, fecha, personas);
}

const ICONO = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function formularioHTML(id: string): string {
  const r = BY_ID.get(id)!;
  const boton = bugs.div
    ? `<div class="btn-reservar solo-icono" data-clickable data-reservar title="Reservar">${ICONO}</div>` // ❌ sin rol ni nombre
    : `<button type="submit" class="btn-reservar" data-reservar aria-describedby="resumen">${ICONO} Reservar mesa</button>`; // ✅
  return `<form id="reserva" class="reserva" aria-label="Reservar en ${esc(r.nombre)}" novalidate>
    <h2 id="reserva-titulo">Reserva tu mesa</h2>
    <div class="row">
      <label>Fecha <select id="fecha" name="fecha">${FECHAS.map((f) => `<option value="${f.valor}">${f.label}</option>`).join('')}</select></label>
      <label>Personas <input id="personas" name="personas" type="number" min="1" max="12" value="2" /></label>
    </div>
    <fieldset class="horas-box"><legend>Hora</legend><div class="horas" role="group" aria-label="Hora" data-horas></div></fieldset>
    <label>A nombre de <input id="titular" name="titular" value="Vanessa" autocomplete="off" /></label>
    ${boton}
    <p id="resumen" class="resumen" role="status"></p>
  </form>`;
}

/** Conecta el formulario: carga horarios, maneja el estado (bug 3) y la reserva. */
export function conectarFormulario(form: HTMLFormElement, id: string) {
  const fecha = form.querySelector<HTMLSelectElement>('#fecha')!;
  const personas = form.querySelector<HTMLInputElement>('#personas')!;
  const horas = form.querySelector<HTMLElement>('[data-horas]')!;
  const boton = form.querySelector<HTMLElement>('[data-reservar]')!;
  const resumen = form.querySelector<HTMLElement>('#resumen')!;
  let hora: string | null = null;
  let pedido = 0;

  const cargando = (on: boolean) => {
    horas.toggleAttribute('data-loading', on);
    if (bugs.carrera) {
      boton.classList.toggle('se-ve-gris', on); // ❌ solo CSS: sigue siendo clicable
    } else {
      // ✅ estado real que el agente ve en el árbol: disabled + aria-busy
      if (boton instanceof HTMLButtonElement) boton.disabled = on;
      else boton.setAttribute('aria-disabled', String(on));
      if (on) form.setAttribute('aria-busy', 'true');
      else form.removeAttribute('aria-busy');
    }
  };

  async function recargar() {
    const n = ++pedido;
    hora = null;
    cargando(true);
    horas.innerHTML = '<span class="cargando">Cargando horarios…</span>';
    const libres = await cargarHorarios(id, fecha.value, Number(personas.value) || 1);
    if (n !== pedido) return;
    horas.innerHTML = libres.map((h) => `<button type="button" class="hora" aria-pressed="false" data-hora="${h}">${h}</button>`).join('');
    cargando(false);
  }
  horas.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-hora]');
    if (!b) return;
    hora = b.dataset.hora!;
    horas.querySelectorAll('[data-hora]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
  fecha.addEventListener('change', recargar);
  personas.addEventListener('change', recargar);

  const reservar = (e?: Event) => {
    e?.preventDefault();
    if (boton.getAttribute('aria-disabled') === 'true' || (boton as HTMLButtonElement).disabled) return;
    if (!hora && !bugs.carrera) {
      horas.setAttribute('aria-invalid', 'true');
      resumen.className = 'resumen error';
      resumen.textContent = 'Elige una hora para reservar.';
      return;
    }
    const r = crearReserva({ restaurante: id, fecha: fecha.value, hora, personas: Number(personas.value), titular: form.querySelector<HTMLInputElement>('#titular')!.value });
    resumen.className = r.hora ? 'resumen ok' : 'resumen error';
    resumen.textContent = r.hora
      ? `Reserva confirmada: ${r.codigo} · ${FECHAS.find((f) => f.valor === r.fecha)?.label} ${r.hora} · ${r.personas} personas`
      : `Reserva ${r.codigo} creada SIN hora (los horarios aún no habían cargado)`;
  };
  form.addEventListener('submit', reservar);
  if (!(boton instanceof HTMLButtonElement)) boton.addEventListener('click', reservar);
  void recargar();
}
