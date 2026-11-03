// Mesa · reservas de restaurantes en Lima (restaurantes y precios FICTICIOS).
// La app es "real"; el Panel del agente (a la derecha) muestra lo que un agente ve, hace y piensa,
// y prende/apaga los 4 bugs de la charla. Parámetros: ?bugs=todos|div,error,carrera,ia ·
// ?red=lenta · ?panel=0 · ?tab=ve|tools|tiempo · ?paso=420 (ms entre pasos del agente) · ?engine=nano
import './styles.css';
import { BY_ID, RESTAURANTES, soles } from './data';
import { crearPanel } from './panel';
import { conectarFormulario, formularioHTML } from './ui/reserva';
import { recomendar } from './ia';
import { registrar, setConfirmar, ejecutar } from './tools';
import { esc } from './ui/esc';

const params = new URLSearchParams(location.search);
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s)!;
let actual = 'kaiyo';

function lista() {
  $('[data-lista]').innerHTML = RESTAURANTES.map(
    (r) => `<li><a href="#${r.id}" class="resto ${r.id === actual ? 'on' : ''}" data-id="${r.id}" ${r.id === actual ? 'aria-current="page"' : ''}>
      <span class="thumb" style="--c:${r.color}" aria-hidden="true">${r.icono}</span>
      <span class="info"><b>${esc(r.nombre)}</b><small>${esc(r.cocina)} · ${esc(r.distrito)} · ${soles(r.precio)}</small></span>
      <span class="rating" aria-label="${r.rating} de 5">★ ${r.rating}</span></a></li>`,
  ).join('');
}

function detalle() {
  const r = BY_ID.get(actual)!;
  $('[data-detalle]').innerHTML = `<div class="hero" style="--c:${r.color}"><span aria-hidden="true">${r.icono}</span></div>
    <div class="det-head"><h1>${esc(r.nombre)}</h1><p>${esc(r.cocina)} · ${esc(r.distrito)} · ${soles(r.precio)} · ★ ${r.rating} (${r.resenas} reseñas)</p><p class="desc">${esc(r.descripcion)}</p></div>
    <div class="det-grid">
      ${formularioHTML(r.id)}
      <section class="asistente" aria-labelledby="ia-t">
        <h2 id="ia-t">¿Qué pido? <span class="ia-chip">IA en tu navegador</span></h2>
        <form class="pregunta" data-pregunta><label class="sr" for="q">Pregunta</label><input id="q" value="¿Qué pedimos para 4?" autocomplete="off" /><button type="submit">Preguntar</button></form>
        <p class="q-t" data-q-t></p>
        <p class="q-r" data-q-r aria-live="polite">Pregúntale qué pedir: el modelo corre en tu dispositivo.</p>
      </section>
    </div>`;
  conectarFormulario($<HTMLFormElement>('#reserva'), r.id);
  $('[data-pregunta]').addEventListener('submit', (e) => {
    e.preventDefault();
    void recomendar($<HTMLInputElement>('#q').value, $('[data-q-r]'), $('[data-q-t]'));
  });
}

function reconstruir() {
  lista();
  detalle();
}

$('[data-lista]').addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-id]');
  if (!a) return;
  e.preventDefault();
  actual = a.dataset.id!;
  reconstruir();
});

// Búsqueda: también es la tool declarativa buscar_restaurantes (toolname en el HTML).
$<HTMLFormElement>('[data-buscar]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target as HTMLFormElement);
  const out = await ejecutar('buscar_restaurantes', { distrito: fd.get('distrito') || undefined, cocina: fd.get('cocina') || undefined });
  const ev = e as SubmitEvent & { agentInvoked?: boolean; respondWith?: (p: Promise<string> | string) => void };
  if (ev.agentInvoked) ev.respondWith?.(out); // lo pidió un agente: la respuesta vuelve al modelo
  const ids = (JSON.parse(out) as { resultados: { id: string }[] }).resultados.map((r) => r.id);
  document.querySelectorAll<HTMLElement>('.resto').forEach((a) => (a.parentElement!.hidden = !ids.includes(a.dataset.id!)));
});

// Confirmación humana de lo irreversible (consequentialHint).
const dlg = $<HTMLDialogElement>('[data-confirmar]');
setConfirmar(
  (texto) =>
    new Promise((resolve) => {
      $('[data-c-texto]', dlg).textContent = texto;
      dlg.showModal();
      const fin = (ok: boolean) => {
        dlg.close();
        resolve(ok);
      };
      $('[data-c-ok]', dlg).onclick = () => fin(true);
      $('[data-c-no]', dlg).onclick = () => fin(false);
      // en la demo grabada, "la persona" confirma sola
      if (params.has('autoconfirmar')) setTimeout(() => dlg.open && fin(true), 1400);
    }),
);

reconstruir();
const panelHost = $('[data-agent-ui]');
const panel = crearPanel(panelHost, reconstruir, () => {
  const q = $<HTMLInputElement>('#q');
  q.value = '¿Qué pedimos para 4?';
  $('[data-pregunta]').dispatchEvent(new Event('submit', { cancelable: true }));
  setTimeout(() => {
    q.value = '¿Y si alguien no come mariscos?';
    $('[data-pregunta]').dispatchEvent(new Event('submit', { cancelable: true }));
  }, 600);
});
if (params.get('panel') === '0') panelHost.hidden = true;
document.documentElement.toggleAttribute('data-panel', !panelHost.hidden);
$('[data-panel-btn]').addEventListener('click', () => {
  panelHost.hidden = !panelHost.hidden;
  document.documentElement.toggleAttribute('data-panel', !panelHost.hidden);
});
void registrar().then((ok) => ($('[data-webmcp]').textContent = ok ? 'WebMCP nativo' : 'WebMCP (simulado)'));
Object.assign(window, { mesa: { panel, ejecutar } });
