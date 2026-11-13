// Panel del agente: lo que DevTools te deja ver, dentro de la demo para que se vea en el proyector.
//  · Lo que ve   → el árbol de accesibilidad (como take_snapshot / Elements → Accessibility)
//  · Tools       → Available + Invoked tools (como Application → WebMCP)
//  · Línea de tiempo → cada paso del agente (y la pista "Mesa · Agente" en Performance)
//  · Fluidez     → el frame más lento de los últimos segundos (si la IA congela, se ve)
import { BUGS, bugs, onBugs, setBug, type BugId } from './bugs';
import { agenteClics, agenteTools, type Paso } from './agente';
import { snapshotTexto, tomarSnapshot, type Nodo } from './snapshot';
import { TOOLS, alLlamar, conteo, llamadas } from './tools';
import { esc } from './ui/esc';

type Tab = 've' | 'tools' | 'tiempo';

export function crearPanel(host: HTMLElement, reconstruir: () => void, preguntarDosVeces: () => void) {
  let tab: Tab = (new URLSearchParams(location.search).get('tab') as Tab) || 've';
  const pasos: Paso[] = [];
  let t0 = performance.now();
  let foco: Nodo | undefined;
  let nodos: Nodo[] = [];
  let corriendo = false;

  host.innerHTML = `<header><h2>Panel del agente</h2><span class="fluidez" data-fluidez><span class="pista"><i data-bola></i></span><b data-fps>-</b></span></header>
    <div class="bugs">${BUGS.map((b) => `<label class="bug-t"><span class="n">${b.n}</span><span><b>${esc(b.titulo)}</b><small>${esc(b.sub)}</small></span><input type="checkbox" role="switch" data-bug="${b.id}" ${bugs[b.id] ? 'checked' : ''} aria-label="Bug ${b.n}: ${b.titulo}" /></label>`).join('')}</div>
    <div class="presets"><button type="button" data-todos="1">Prender los 4 bugs</button><button type="button" data-todos="0">Arreglar todo</button></div>
    <div class="run"><button type="button" data-run="clics">▶ Agente de clics</button><button type="button" data-run="tools">▶ Agente con tools</button><button type="button" data-run="ia">▶ Preguntar 2 veces</button></div>
    <p class="tarea">Tarea: <i>“Mesa para 4 el sábado a las 20:00 en un nikkei de Barranco”</i></p>
    <nav class="tabs" role="tablist">${(
      [
        ['ve', 'Lo que ve'],
        ['tools', 'Funciones (WebMCP)'],
        ['tiempo', 'Línea de tiempo'],
      ] as [Tab, string][]
    )
      .map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === tab}">${l}</button>`)
      .join('')}</nav>
    <div class="tab-body" data-body></div>`;

  const body = host.querySelector<HTMLElement>('[data-body]')!;
  function pintar() {
    host.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String((b as HTMLElement).dataset.tab === tab)));
    if (tab === 've') {
      if (!nodos.length) nodos = tomarSnapshot();
      const txt = snapshotTexto(nodos)
        .split('\n')
        .map((l, i) => {
          const n = nodos[i];
          const cls = n === foco ? 'foco' : n.rol === 'generic' ? 'gen' : n.estado.includes('busy') || n.estado.includes('disabled') ? 'est' : '';
          return `<span class="${cls}">${esc(l)}</span>`;
        })
        .join('\n');
      body.innerHTML = `<p class="hint">take_snapshot · ${nodos.length} elementos · <button type="button" class="link" data-refresh>actualizar</button></p><pre class="arbol">${txt}</pre>`;
      body.querySelector('.foco')?.scrollIntoView({ block: 'center' });
    } else if (tab === 'tools') {
      body.innerHTML = `<p class="dt-h">Invoked tools</p><ol class="dt-log">${
        llamadas
          .slice(0, 8)
          .map((l) => `<li><span class="st ${l.estado.replace(' ', '-').toLowerCase()}">${l.estado}</span><code>${esc(l.tool)}</code><span class="io">${esc(JSON.stringify(l.input))}</span><span class="io out">${esc(l.output)}</span></li>`)
          .join('') || '<li class="vacio">Aún no hay llamadas</li>'
      }</ol><p class="dt-h">Available tools <small>${TOOLS.length}</small></p><ul class="dt-tools">${TOOLS.map((t) => `<li><code>${t.name}</code><span class="ty">${t.tipo}</span>${t.annotations?.consequentialHint ? '<span class="cq">confirma</span>' : ''}<span class="ct">${conteo.get(t.name) ?? 0}</span></li>`).join('')}</ul>`;
    } else {
      body.innerHTML = `<ol class="pasos">${pasos.map((p) => `<li class="${p.tipo}"><span class="ms">${(p.t / 1000).toFixed(2)} s</span><code>${esc(p.accion)}</code><span>${esc(p.detalle)}</span></li>`).join('') || '<li class="vacio">Corre un agente ▶</li>'}</ol>`;
      body.scrollTop = body.scrollHeight;
    }
  }

  const log = (p: Omit<Paso, 't'>) => {
    pasos.push({ ...p, t: performance.now() - t0 });
    try {
      performance.mark(`agente: ${p.accion}`, { detail: { devtools: { dataType: 'marker', color: p.tipo === 'mal' ? 'error' : 'primary', tooltipText: p.detalle } } });
    } catch {
      /* noop */
    }
    if (tab === 'tiempo') pintar();
  };
  const ojos = {
    ver(n: Nodo[], f?: Nodo) {
      nodos = n;
      foco = f;
      document.querySelectorAll('.agente-foco').forEach((e) => e.classList.remove('agente-foco'));
      f?.el.classList.add('agente-foco');
      if (tab === 've') pintar();
    },
  };

  host.addEventListener('change', (e) => {
    const i = (e.target as HTMLElement).closest<HTMLInputElement>('[data-bug]');
    if (i) setBug(i.dataset.bug as BugId, i.checked);
  });
  host.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const tb = t.closest<HTMLElement>('[data-tab]')?.dataset.tab as Tab | undefined;
    if (tb) ((tab = tb), pintar());
    if (t.closest('[data-refresh]')) ((nodos = tomarSnapshot()), pintar());
    const todos = t.closest<HTMLElement>('[data-todos]')?.dataset.todos;
    if (todos) {
      for (const b of BUGS) setBug(b.id, todos === '1');
      host.querySelectorAll<HTMLInputElement>('[data-bug]').forEach((i) => (i.checked = bugs[i.dataset.bug as BugId]));
    }
    const run = t.closest<HTMLElement>('[data-run]')?.dataset.run;
    if (run) await correr(run as 'clics' | 'tools' | 'ia');
  });
  onBugs(() => {
    reconstruir();
    nodos = tomarSnapshot();
    pintar();
  });
  alLlamar(() => tab === 'tools' && pintar());

  async function correr(cual: 'clics' | 'tools' | 'ia') {
    if (corriendo) return false;
    corriendo = true;
    pasos.length = 0;
    t0 = performance.now();
    let ok = true;
    if (cual === 'clics') {
      reconstruir();
      await new Promise((r) => setTimeout(r, 50));
      tab = 've';
      pintar();
      ok = await agenteClics(log, ojos);
    } else if (cual === 'tools') {
      tab = 'tools';
      pintar();
      ok = await agenteTools(log);
    } else preguntarDosVeces();
    log({ accion: 'resultado', detalle: ok ? '✓ Tarea cumplida' : '✗ Tarea fallida', tipo: ok ? 'ok' : 'mal' });
    document.dispatchEvent(new CustomEvent('mesa:agente', { detail: { cual, ok } }));
    corriendo = false;
    return ok;
  }

  // Fluidez: un punto movido por requestAnimationFrame (si el hilo principal se congela, se detiene)
  const bola = host.querySelector<HTMLElement>('[data-bola]')!;
  const fps = host.querySelector<HTMLElement>('[data-fps]')!;
  const caja = host.querySelector<HTMLElement>('[data-fluidez]')!;
  let last = performance.now();
  let peor = 0;
  let peorT = 0;
  const frame = (now: number) => {
    const dt = now - last;
    last = now;
    if (dt > peor || now - peorT > 3000) ((peor = dt), (peorT = now));
    bola.style.transform = `translateX(${(Math.sin(now / 220) + 1) * 26}px)`;
    fps.textContent = `pausa más larga ${Math.round(peor)} ms`;
    caja.dataset.mal = String(peor > 100);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  pintar();
  return { correr, pintar, peorFrame: () => Math.round(peor), get tab() { return tab; }, set tab(v: Tab) { tab = v; pintar(); } };
}
