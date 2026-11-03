# Code for the 4 questions (from the Mesa demo)

## 1 · Role, name, state
```html
<!-- ❌ snapshot: uid=4_17 generic -->
<div class="btn" onclick="reservar()"><svg>…</svg></div>
<!-- ✅ snapshot: uid=4_17 button "Reservar mesa" disabled -->
<button type="submit" disabled><svg aria-hidden="true">…</svg> Reservar mesa</button>
```

## 2 · Tools with useful errors
```js
await document.modelContext.registerTool({
  name: 'reservar_mesa',
  description: 'Reserva una mesa. Pide confirmación a la persona.',
  inputSchema: { type: 'object', required: ['restaurante', 'fecha', 'hora', 'personas'], properties: { hora: { type: 'string', pattern: '^\\d{2}:\\d{2}$' } } },
  annotations: { consequentialHint: true },
  async execute({ restaurante, fecha, hora, personas }) {
    const libres = await horarios(restaurante, fecha, personas);
    if (!libres.includes(hora)) return `Error: ${hora} no está libre. Horas libres: ${libres.join(', ')}`;
    return reservar({ restaurante, fecha, hora, personas });
  },
});
```

## 3 · Real state while loading
```js
boton.disabled = true;
form.setAttribute('aria-busy', 'true');
pintarHorarios(await cargarHorarios(restaurante));
form.removeAttribute('aria-busy');
boton.disabled = false;
```

## 4 · Client-side AI
```js
let actual = null;
async function recomendar(pregunta) {
  actual?.abort();
  actual = new AbortController();
  const t0 = performance.now();
  const sesion = await LanguageModel.create();
  for await (const trozo of sesion.promptStreaming(pregunta, { signal: actual.signal })) salida.append(trozo);
  performance.measure('Recomendación', { start: t0, detail: { devtools: { dataType: 'track-entry', track: 'Mesa · IA local', color: 'secondary' } } });
}
```
