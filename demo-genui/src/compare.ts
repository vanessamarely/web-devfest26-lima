// Comparador: el MISMO pedido, el MISMO stream, en dos iframes. Izquierda: la regla apagada
// (las demás prendidas). Derecha: todas prendidas. Arriba, la métrica que mide esa regla.
const params = new URLSearchParams(location.search);
const sel = document.querySelector<HTMLSelectElement>('#regla')!;
sel.value = params.get('regla') ?? '1';
const NOMBRES = ['', 'Reserva el espacio', 'Lee el plano una vez', 'Recicla, no demuelas', 'Una sola libreta'];
const ifr = { bad: document.querySelector<HTMLIFrameElement>('[data-f="bad"]')!, good: document.querySelector<HTMLIFrameElement>('[data-f="good"]')! };
const tps = params.get('tps') ?? '70';
type M = { cls: number; inp: number; leidos: number; renders: number; creados: number; loafMax: number };
const listos = new Set<string>();

function metrica(n: number, m: M) {
  if (n === 1) return `CLS <b>${m.cls.toFixed(3)}</b>`;
  if (n === 2) return `leídos <b>${m.leidos.toLocaleString('es-PE')}</b> · renders <b>${m.renders}</b>`;
  if (n === 3) return `nodos creados <b>${m.creados.toLocaleString('es-PE')}</b>`;
  return `INP <b>${m.inp ? `${m.inp} ms` : '—'}</b>`;
}

function cargar() {
  const n = Number(sel.value);
  const bits = (on: boolean) => [1, 2, 3, 4].map((k) => (k === n && !on ? '0' : '1')).join('');
  listos.clear();
  for (const [k, on] of [['bad', false], ['good', true]] as const) {
    ifr[k].src = `/?embed&rules=${bits(on)}&tps=${tps}&focus=${n}&rayos=0`;
    document.querySelector(`[data-l="${k}"]`)!.textContent = `${on ? '✓' : '✗'} Regla ${n} · ${NOMBRES[n]} ${on ? 'PRENDIDA' : 'APAGADA'}`;
    document.querySelector(`[data-m="${k}"]`)!.innerHTML = '';
  }
}
const send = (cmd: string) => Object.values(ifr).forEach((f) => f.contentWindow?.postMessage({ type: 'nido-cmd', cmd }, location.origin));

addEventListener('message', (e) => {
  if (e.data?.type !== 'nido') return;
  const k = e.source === ifr.bad.contentWindow ? 'bad' : 'good';
  document.querySelector(`[data-m="${k}"]`)!.innerHTML = metrica(Number(sel.value), e.data.m as M);
  if (e.data.tipo === 'listo') {
    listos.add(k);
    // regla 3: después de generar, la IA corrige precios; regla 4: se ordena la lista
    if (listos.size === 2 && sel.value === '3' && !listos.has('precios')) {
      listos.add('precios');
      setTimeout(() => send('precios'), 600);
    }
    // regla 4: el clic en "Ordenar" se hace a mano en cada lado (INP solo mide clics reales)
  }
});

document.querySelector('#go')!.addEventListener('click', () => {
  listos.clear();
  send('generar');
});
sel.addEventListener('change', cargar);
cargar();
if (params.has('auto')) setTimeout(() => send('generar'), 1500);
Object.assign(window, { comparar: { send, cargar } });
export {};
