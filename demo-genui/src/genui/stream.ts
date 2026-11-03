// Regla 2 · Lee el plano una sola vez.
//  ❌ LectorCompleto: el modelo escribe UN JSON ({"piezas":[…]}). Con cada trozo releemos TODO lo
//     recibido para "repararlo" y hacer JSON.parse: el trabajo crece al cuadrado.
//  ✅ LectorPorLineas: el modelo escribe NDJSON (una pieza por línea). Cada carácter se lee una vez
//     y la línea incompleta espera al siguiente trozo. Además se pinta una vez por frame (rAF).
import type { Pieza } from '../ia';

export interface Lector {
  /** Caracteres leídos en total (el contador de rayos X). */
  leidos: number;
  alLlegar(trozo: string): Pieza[];
}

/** ❌ Relee todo el buffer con cada trozo y devuelve TODAS las piezas completas hasta ahora. */
export class LectorCompleto implements Lector {
  buffer = '';
  leidos = 0;
  alLlegar(trozo: string): Pieza[] {
    this.buffer += trozo;
    const reparado = reparar(this.buffer); // recorre el buffer completo…
    this.leidos += this.buffer.length + reparado.length; // …y JSON.parse lo vuelve a leer
    try {
      return (JSON.parse(reparado) as { piezas: Pieza[] }).piezas;
    } catch {
      return [];
    }
  }
}

/**
 * Corta el JSON a medias en la última pieza COMPLETA y lo cierra: '{"piezas":[{…},{…' → '{"piezas":[{…}]}'.
 * Tiene que recorrer todo el texto (comillas, escapes, llaves): por eso es caro hacerlo en cada trozo.
 */
export function reparar(texto: string): string {
  let depth = 0;
  let inStr = false;
  let esc = false;
  let ultimo = -1;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (c === '}' && depth === 2) ultimo = i; // terminó una pieza dentro de "piezas":[ … ]
    }
  }
  return ultimo < 0 ? '{"piezas":[]}' : texto.slice(0, ultimo + 1) + ']}';
}

/** ✅ Una línea = una pieza (NDJSON). Devuelve solo las piezas NUEVAS. */
export class LectorPorLineas implements Lector {
  resto = '';
  leidos = 0;
  alLlegar(trozo: string): Pieza[] {
    this.leidos += trozo.length;
    const lineas = (this.resto + trozo).split('\n');
    this.resto = lineas.pop()!; // la línea incompleta espera
    const nuevas: Pieza[] = [];
    for (const l of lineas) if (l) nuevas.push(JSON.parse(l) as Pieza);
    return nuevas;
  }
}

/** ✅ Un render por frame: junta todo lo que llegó en este frame y lo aplica de una vez. */
export function crearProgramador(aplicar: (piezas: Pieza[]) => void) {
  const pendientes: Pieza[] = [];
  let programado = false;
  return {
    pendientes,
    agregar(piezas: Pieza[]) {
      pendientes.push(...piezas);
      if (programado || !pendientes.length) return;
      programado = true;
      requestAnimationFrame(() => {
        programado = false;
        aplicar(pendientes.splice(0)); // todo lo que llegó en este frame
      });
    },
  };
}
