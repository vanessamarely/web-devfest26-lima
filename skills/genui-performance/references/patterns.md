# Patterns with code (from the Nido demo)

## Plan + catalog reservation
```ts
const CATALOGO = { resumen: { alto: 136 }, mapa: { aspecto: '21 / 8' }, grafico: { alto: 260 } };
function reservar(id: string, tipo: keyof typeof CATALOGO) {
  const slot = document.createElement('section');
  slot.className = 'slot esqueleto';
  const { alto, aspecto } = CATALOGO[tipo] as { alto?: number; aspecto?: string };
  if (alto) slot.style.minHeight = `${alto}px`;
  if (aspecto) slot.style.aspectRatio = aspecto;
  return slot;
}
```

## NDJSON reader + one render per frame
```ts
let resto = '';
function alLlegar(trozo: string) {
  const lineas = (resto + trozo).split('\n');
  resto = lineas.pop()!;
  for (const l of lineas) if (l) pendientes.push(JSON.parse(l));
  programarRender();
}
let programado = false;
function programarRender() {
  if (programado) return;
  programado = true;
  requestAnimationFrame(() => { programado = false; aplicar(pendientes.splice(0)); });
}
```

## Keyed updates
```ts
const nodos = new Map<string, HTMLElement>();
function aplicar(d: { id: string; precio: number }) {
  let el = nodos.get(d.id);
  if (!el) { el = crearTarjeta(d); nodos.set(d.id, el); lista.append(el); }
  if (el.dataset.precio !== String(d.precio)) { el.dataset.precio = String(d.precio); el.querySelector('.precio')!.textContent = soles(d.precio); }
}
```

## Store + Worker
```ts
boton.addEventListener('click', () => {
  boton.setAttribute('aria-busy', 'true');           // same frame as the click
  worker.postMessage([...datos.values()]);
});
worker.onmessage = ({ data: ids }) => reordenar(ids); // moves nodes
```

Measured in the demo (same stream, CPU 3–4×): CLS 0.39 → 0.00 · characters parsed 1,052,640 → 2,514 · renders 390 → 17 · nodes created 74,499 → 1,187 · INP 1,496 ms → 16 ms.
