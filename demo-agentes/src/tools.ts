// Tools de WebMCP de Mesa. Si el navegador tiene WebMCP (document.modelContext, Chrome 149+ con
// #enable-webmcp-testing) se registran de verdad y aparecen en DevTools → Application → WebMCP.
// Si no, quedan en un registro local que el Panel del agente muestra igual.
// Bug 2 (error opaco): con el bug, reservar_mesa devuelve "Error" a secas.
import { BY_ID, FECHAS, RESTAURANTES, horariosLibres } from './data';
import { bugs } from './bugs';
import { crearReserva, reservas } from './ui/reserva';

export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  annotations?: { readOnlyHint?: boolean; consequentialHint?: boolean; untrustedContentHint?: boolean };
  tipo: 'Declarative' | 'Imperative';
  execute: (input: Record<string, unknown>) => Promise<string>;
}
export interface Llamada {
  tool: string;
  input: Record<string, unknown>;
  output: string;
  estado: 'Completed' | 'Error' | 'In progress' | 'Canceled';
  t: number;
}

export const llamadas: Llamada[] = [];
export const conteo = new Map<string, number>();
const onLog = new Set<() => void>();
export const alLlamar = (fn: () => void) => onLog.add(fn);

/** La persona confirma lo irreversible (consequentialHint). La demo muestra un diálogo. */
export let confirmar: (texto: string) => Promise<boolean> = async () => true;
export const setConfirmar = (fn: typeof confirmar) => (confirmar = fn);

const fechaLabel = (f: string) => FECHAS.find((x) => x.valor === f)?.label ?? f;

export const TOOLS: Tool[] = [
  {
    name: 'buscar_restaurantes',
    tipo: 'Declarative',
    description: 'Busca restaurantes en Lima por distrito y tipo de cocina.',
    inputSchema: { type: 'object', properties: { distrito: { type: 'string' }, cocina: { type: 'string', enum: ['nikkei', 'cevichería', 'criolla', 'chifa', 'anticuchería'] } } },
    annotations: { readOnlyHint: true },
    async execute({ distrito, cocina }) {
      const res = RESTAURANTES.filter((r) => (!distrito || r.distrito === distrito) && (!cocina || r.cocina === cocina));
      return JSON.stringify({ total: res.length, resultados: res.map(({ id, nombre, distrito, rating }) => ({ id, nombre, distrito, rating })) });
    },
  },
  {
    name: 'ver_horarios',
    tipo: 'Imperative',
    description: 'Horarios libres de un restaurante para una fecha y número de personas.',
    inputSchema: { type: 'object', required: ['restaurante', 'fecha', 'personas'], properties: { restaurante: { type: 'string' }, fecha: { type: 'string', format: 'date' }, personas: { type: 'integer', minimum: 1, maximum: 12 } } },
    annotations: { readOnlyHint: true },
    async execute({ restaurante, fecha, personas }) {
      return JSON.stringify(horariosLibres(String(restaurante), String(fecha), Number(personas)));
    },
  },
  {
    name: 'reservar_mesa',
    tipo: 'Imperative',
    description: 'Reserva una mesa. Pide confirmación a la persona.',
    inputSchema: {
      type: 'object',
      required: ['restaurante', 'fecha', 'hora', 'personas'],
      properties: {
        restaurante: { type: 'string', description: 'id que devuelve buscar_restaurantes' },
        fecha: { type: 'string', format: 'date' },
        hora: { type: 'string', pattern: '^\\d{2}:\\d{2}$', description: '24 h, ej. 20:00' },
        personas: { type: 'integer', minimum: 1, maximum: 12 },
        titular: { type: 'string' },
      },
    },
    annotations: { consequentialHint: true },
    async execute({ restaurante, fecha, hora, personas, titular }) {
      const r = BY_ID.get(String(restaurante));
      if (!r) return bugs.error ? 'Error' : `Error: no conozco "${restaurante}". Usa un id de buscar_restaurantes.`;
      const libres = horariosLibres(r.id, String(fecha), Number(personas));
      // ❌ return 'Error';  → el agente reintenta lo mismo
      if (!libres.includes(String(hora))) return bugs.error ? 'Error' : `Error: ${hora} no está libre. Horas libres: ${libres.filter((h) => h >= '19:00').join(', ')}`;
      const ok = await confirmar(`${r.nombre} · ${fechaLabel(String(fecha))} ${hora} · ${personas} personas`);
      if (!ok) return 'La persona canceló la reserva.';
      const res = crearReserva({ restaurante: r.id, fecha: String(fecha), hora: String(hora), personas: Number(personas), titular: String(titular ?? 'Invitado') });
      return `Reserva ${res.codigo} confirmada: ${r.nombre}, ${fechaLabel(res.fecha)} ${res.hora}, ${res.personas} personas.`;
    },
  },
  {
    name: 'cancelar_reserva',
    tipo: 'Imperative',
    description: 'Cancela una reserva por su código. Pide confirmación a la persona.',
    inputSchema: { type: 'object', required: ['codigo'], properties: { codigo: { type: 'string' } } },
    annotations: { consequentialHint: true },
    async execute({ codigo }) {
      const i = reservas.findIndex((r) => r.codigo === codigo);
      if (i < 0) return bugs.error ? 'Error' : `Error: no existe la reserva ${codigo}. Reservas activas: ${reservas.map((r) => r.codigo).join(', ') || 'ninguna'}.`;
      if (!(await confirmar(`Cancelar ${codigo}`))) return 'La persona no confirmó.';
      reservas.splice(i, 1);
      return `Reserva ${codigo} cancelada.`;
    },
  },
];

/** Ejecuta una tool y deja huella (como Invoked tools en DevTools). */
export async function ejecutar(name: string, input: Record<string, unknown>): Promise<string> {
  const tool = TOOLS.find((t) => t.name === name);
  const ll: Llamada = { tool: name, input, output: '', estado: 'In progress', t: performance.now() };
  llamadas.unshift(ll);
  conteo.set(name, (conteo.get(name) ?? 0) + 1);
  onLog.forEach((f) => f());
  const t0 = performance.now();
  ll.output = tool ? await tool.execute(input) : `Error: no existe la tool ${name}`;
  ll.estado = ll.output.startsWith('Error') ? 'Error' : ll.output.includes('canceló') ? 'Canceled' : 'Completed';
  try {
    performance.measure(`tool ${name}`, { start: t0, detail: { devtools: { dataType: 'track-entry', track: 'Mesa · Agente', color: ll.estado === 'Error' ? 'error' : 'primary', tooltipText: ll.output.slice(0, 80) } } });
  } catch {
    /* sin extensibility API */
  }
  onLog.forEach((f) => f());
  return ll.output;
}

type ToolNativa = { name: string };
type ModelContext = {
  registerTool(t: object, o?: { signal?: AbortSignal }): Promise<void> | void;
  getTools?(): Promise<ToolNativa[]>;
  executeTool?(t: ToolNativa, input: object): Promise<unknown>;
};
export const nativo = () => (document as Document & { modelContext?: ModelContext }).modelContext;

/** Registra las tools en WebMCP nativo (si existe). buscar_restaurantes es el formulario declarativo. */
export async function registrar() {
  const mc = nativo();
  if (!mc) return false;
  for (const t of TOOLS) {
    if (t.tipo === 'Declarative') continue;
    await mc.registerTool({ name: t.name, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations, execute: (input: Record<string, unknown>) => ejecutar(t.name, input) });
  }
  registradas = true;
  return true;
}
let registradas = false;

/**
 * Cómo llama el agente a una tool. Con WebMCP nativo pasa por el navegador
 * (document.modelContext.executeTool): así cada llamada aparece en DevTools → Application → WebMCP → Tool activity.
 * Sin WebMCP nativo (o si falla), llama directo. La tool declarativa (el formulario) siempre va directo.
 */
export async function llamar(name: string, input: Record<string, unknown>): Promise<string> {
  const mc = nativo();
  const t = TOOLS.find((x) => x.name === name);
  if (registradas && mc?.getTools && mc.executeTool && t && t.tipo !== 'Declarative') {
    try {
      const tool = (await mc.getTools()).find((x) => x.name === name);
      if (tool) {
        const r = await mc.executeTool(tool, input);
        return typeof r === 'string' ? r : JSON.stringify(r);
      }
    } catch (err) {
      console.warn('[webmcp] executeTool falló, llamo directo', err);
    }
  }
  return ejecutar(name, input);
}
