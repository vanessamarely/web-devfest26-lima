// "Lo que ve el agente": un árbol de accesibilidad simplificado, con el mismo formato que
// take_snapshot de Chrome DevTools for agents (uid=… rol "nombre" estado).
// Solo usa lo que expone la página: rol (nativo o ARIA), nombre accesible y estado.
// Un div con onclick NO tiene rol: aparece como "generic" (o ni aparece).
export interface Nodo {
  uid: string;
  rol: string;
  nombre: string;
  estado: string[];
  el: Element;
  nivel: number;
}

const ROLES: Record<string, string> = { BUTTON: 'button', A: 'link', SELECT: 'combobox', TEXTAREA: 'textbox', H1: 'heading', H2: 'heading', H3: 'heading', FORM: 'form', DIALOG: 'dialog', NAV: 'navigation', MAIN: 'main', ARTICLE: 'article' };

function rol(el: Element): string | null {
  const aria = el.getAttribute('role');
  if (aria) return aria;
  if (el instanceof HTMLInputElement) return el.type === 'number' ? 'spinbutton' : el.type === 'checkbox' ? 'checkbox' : el.type === 'radio' ? 'radio' : 'textbox';
  if (el.tagName === 'FORM' && !el.getAttribute('aria-label')) return null;
  return ROLES[el.tagName] ?? null;
}

function nombre(el: Element): string {
  const label = el.getAttribute('aria-label');
  if (label) return label;
  const by = el.getAttribute('aria-labelledby');
  if (by) return by.split(' ').map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ');
  if (el.id) {
    const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (l) return l.textContent!.trim();
  }
  if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) return el.closest('label')?.childNodes[0]?.textContent?.trim() ?? '';
  // texto visible, sin lo que está aria-hidden
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll('[aria-hidden="true"], svg').forEach((n) => n.remove());
  return clone.textContent!.replace(/\s+/g, ' ').trim().slice(0, 60);
}

function estado(el: Element): string[] {
  const s: string[] = [];
  if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') s.push('disabled');
  if (el.getAttribute('aria-busy') === 'true') s.push('busy');
  if (el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-checked') === 'true') s.push('pressed');
  if (el instanceof HTMLSelectElement) s.push(`value="${el.selectedOptions[0]?.textContent ?? ''}"`);
  else if (el instanceof HTMLInputElement && el.value) s.push(`value="${el.value}"`);
  if (el.getAttribute('aria-invalid') === 'true') s.push('invalid');
  return s;
}

const visible = (el: Element) => {
  const h = el as HTMLElement;
  if (el === document.body) return true;
  return !h.hidden && !el.closest('[hidden], [aria-hidden="true"], [inert]') && el.getClientRects().length > 0;
};

/** Recorre la página (sin el panel del agente) y devuelve el árbol. */
export function tomarSnapshot(root: Element = document.body, pagina = 1): Nodo[] {
  const out: Nodo[] = [];
  let n = 0;
  const walk = (el: Element, nivel: number) => {
    if (el.closest('[data-agent-ui]')) return;
    if (!visible(el)) return;
    const r = rol(el);
    // un div "clicable" sin rol: el agente solo ve un contenedor genérico
    const generic = !r && el.hasAttribute('data-clickable');
    if (r || generic) {
      n++;
      out.push({ uid: `${pagina}_${n}`, rol: r ?? 'generic', nombre: r ? nombre(el) : '', estado: r ? estado(el) : [], el, nivel });
    }
    for (const c of el.children) walk(c, r || generic ? nivel + 1 : nivel);
  };
  walk(root, 0);
  return out;
}

export function snapshotTexto(nodos: Nodo[]): string {
  return nodos.map((x) => `${'  '.repeat(Math.min(x.nivel, 4))}uid=${x.uid} ${x.rol}${x.nombre ? ` "${x.nombre}"` : ''}${x.estado.length ? ' ' + x.estado.join(' ') : ''}`).join('\n');
}
