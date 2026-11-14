# DevFest Lima 2026 · dos charlas, un avatar limeño

Charlas técnicas de [Vanessa Aristizabal](https://github.com/vanessamarely) en **DevFest Lima 2026** (30 min cada una, un día cada una).

| Día | Charla | Demo |
|---|---|---|
| **Día 1** | **Web performance en la era de la UI generativa**: 4 reglas para que una interfaz que escribe una IA sea rápida, estable y no congele la página. | **Nido**: buscador de departamentos con IA y panel **Rayos X** |
| **Día 2** | **Chrome DevTools para agentes**: ver lo que un agente ve, hace y piensa en tu web, y depurarlo. | **Mesa**: reservas de restaurantes con **Panel del agente** |

## En vivo

| Qué | URL |
|---|---|
| Portada (elige la charla) | https://devfest-lima-slides.web.app |
| Deck Día 1 (proyector) | https://devfest-lima-slides.web.app/genui/?presenter=1 |
| Deck Día 2 (proyector) | https://devfest-lima-slides.web.app/agentes/?presenter=1 |
| Deck Día 2, versión breve (10 min, sin preguntas ni podio) | https://devfest-lima-slides.web.app/agentes-breve/?presenter=1 · consola: `/presenter/?talk=agentes&breve=1` |
| App de asistentes (QR) | https://devfest-lima-slides.web.app/live/?talk=genui · `?talk=agentes` |
| Consola de la presentadora | https://devfest-lima-slides.web.app/presenter/?talk=genui · `?talk=agentes` |
| Demo Nido · comparador | https://devfest-lima-nido.web.app · https://devfest-lima-nido.web.app/compare |
| Demo Mesa | https://devfest-lima-mesa.web.app |

Proyecto Firebase: `devfest-lima-2026` (Hosting ×3 + Firestore con [reglas](firestore.rules)).

## Cómo está armada cada charla (para no perderse)

Una sola metáfora y **4 capítulos**. Cada capítulo tiene el mismo ritmo: *lo que siente la persona → por qué pasa (un diagrama) → el arreglo (código corto) → la prueba en la demo (clip con números reales)*.

- **Día 1 · "Construir una casa mientras te dictan el plano"**: 01 Reserva el espacio (cómo se dibuja la pantalla) · 02 Lee cada parte una sola vez (cómo llega la respuesta) · 03 Reutiliza, no rehagas (los elementos de la pantalla) · 04 Un solo lugar para los datos (estado).
- **Día 2 · "4 preguntas para depurar a un agente"**: 01 ¿Qué ve? (árbol de accesibilidad) · 02 ¿Qué hizo? (panel WebMCP) · 03 ¿Y si va más rápido que una persona? (simular usuarios) · 04 ¿Qué piensa la IA de tu página? (IA en el cliente).

Guion minuto a minuto (se genera desde los slides): [docs/GUION-GENUI.md](docs/GUION-GENUI.md) y [docs/GUION-AGENTES.md](docs/GUION-AGENTES.md). Fuentes verificadas: [docs/FUENTES.md](docs/FUENTES.md).

## Carpetas

| Carpeta | Qué es |
|---|---|
| [`slides/`](slides) | Portada `/`, deck Día 1 `/genui/` (34 slides), deck Día 2 `/agentes/` (34 slides), app de asistentes `/live/?talk=…`, consola `/presenter/`. Proporciones 4:3 · 16:10 · 16:9 · 21:9 · extendida (**A**/**E**), claro/oscuro (**L**), alto contraste (**H**). |
| [`demo-genui/`](demo-genui) | **Nido** (`/`) y el comparador lado a lado (`/compare.html?regla=1..4`). |
| [`demo-agentes/`](demo-agentes) | **Mesa** con el Panel del agente (Lo que ve · Tools · Línea de tiempo · Fluidez) y 4 bugs. |
| [`scripts/record-clips.mjs`](scripts/record-clips.mjs) | Graba los clips de las dos demos y mide los números que muestran los slides. |
| [`skills/`](skills) | Guías para tu agente de código: [`genui-performance`](skills/genui-performance/SKILL.md) y [`devtools-for-agents`](skills/devtools-for-agents/SKILL.md). |

## Interacción con el público (las dos charlas)

| Qué | Cómo funciona |
|---|---|
| **Unirse** | QR en el slide 2 y, en la vista de la presentadora, uno pequeño “Únete” en cada slide (tecla **J**). Apodo único con palabras de Lima (“Brisa Limeña”); si se repite, se numera. El Día 2 se propone primero el apodo del Día 1. |
| **Avatar limeño** | Persona de la Lima de hoy, variada a propósito: piel, 9 peinados y colores, pestañas, aretes, labios, barba o bigote, ropa (sudadera, camiseta de Perú, chaqueta de chef, suéter de alpaca, traje de surf…), jean, falda, short o vestido, gorro, lentes y lo que lleva (ceviche, chicha morada, picarones, laptop, lupa, robot agente…). PNG 1080×1350 para compartir. |
| **Muro compartido** | El mismo muro en las dos charlas. **Cada charla guarda su propia versión del avatar**: al pasar del Día 1 al Día 2, tu avatar vuelve y le cambias la ropa, el gorro o lo que lleva (“Hoy cambiaste: casco de parapente, lupa”). En el muro lleva la insignia **Día 1 + Día 2**. |
| **Podio** | 3 preguntas por charla: 500 por acierto + hasta 500 por rapidez. Bonos: **+200 por traer tu avatar de la otra charla**, +100 avatar, +100 a tiempo, +100 pregunta, hasta +100 reacciones. Para entrar al podio hay que acertar al menos una. |
| **Reacciones con efecto** | 🔥 un avatar cruza corriendo · 🤯 pasa un parapente · ❤️ sale el sol de Lima. Si la sala sigue reaccionando (o salen los tres seguidos): **¡Fiesta en la Costa Verde!**, con avatares de la sala bailando con pañuelo y un surfista sobre la ola. Ensayo: `deckBurst('fire')` o `deckFiesta()` en la consola del deck. |
| **Pregúntale a la charla** | Botón *Pregúntale*: un asistente responde dudas **solo con el contenido de esa charla**. En computadoras con Chrome 148+ usa **Gemini Nano** (Prompt API, en el dispositivo). En celulares (Nano no existe en Android ni iOS) usa **Gemini en la nube** con Firebase AI Logic, hasta 5 preguntas por persona. Si no hay IA disponible o se acaba la cuota, responde con lo que dicen los slides. Si no le sirvió, la persona envía su pregunta a Vanessa (+100): no se proyecta, la presentadora la ve con **Q**. |
| **Agenda** | Confirmada: Día 1 UI generativa, Día 2 DevTools para agentes. Si cambiara, en el deck de la presentadora: menú → **Agenda** (con sesión de GitHub); cambia “Día 1/Día 2” y los textos de “mañana” en decks, celulares y portada. |
| **Deck público** | La URL sin `?presenter` tiene un menú simple (app, demo, repo, claro/oscuro, pantalla completa, miniaturas). Consola, otra charla, agenda, proporción, alto contraste y QR por slide son solo para la presentadora. |
| **Memoria** | PDF, HTML o Markdown con el resumen, las notas (nunca salen del celular) y el avatar. |

## Las demos

### Nido (Día 1)
Escribes *“Departamento de 2 dormitorios en Barranco con vista al mar, menos de S/ 3.000”* y la IA (simulada a propósito: siempre la misma respuesta, para que lo único que cambie entre reglas sea el código) arma resumen, mapa, 6 destacados, gráfico y una lista de 300. Mientras escribe, se ve qué parte llegó (resumen, mapa, tarjetas, gráfico, lista). **Rayos X** (tecla **X**) prende y apaga cada regla y mide CLS, INP, pausas largas, caracteres leídos, veces que dibuja y elementos creados; marca los saltos en rojo, los elementos nuevos con contorno naranja y los reutilizados en verde. `?preset=roto`, `?rules=0111`, `?tps=70`, `?auto`.

Números medidos al grabar (misma respuesta): CLS **0,39 → 0,00** · caracteres leídos **1.087.742 → 2.551** · veces que dibuja **397 → 17** · elementos creados **74.499 → 1.187** · INP al ordenar (CPU 3×) **1.504 ms → 16 ms**.

### Mesa (Día 2)
Un agente intenta *“mesa para 4 el sábado a las 20:00 en un nikkei de Barranco”*. Bugs: **1** botón hecho con un div (el agente ve `generic`), **2** la tool responde “Error” a secas, **3** botón “gris” por CSS pero usable antes de que carguen los horarios, **4** IA local en el hilo principal sin streaming ni abort. `?bugs=todos|div,error,carrera,ia`, `?red=lenta`, `?tab=ve|tools|tiempo`, `?engine=nano` (Gemini Nano si está disponible).

Con WebMCP nativo (Chrome con `chrome://flags/#enable-webmcp-testing`) las tools aparecen en **DevTools → Application → WebMCP**, y el agente las llama con `document.modelContext.executeTool`, así cada uso queda en *Tool activity*; sin el flag quedan en un registro local que muestra el Panel del agente. La búsqueda del encabezado es la tool declarativa `buscar_restaurantes`.

## Local

```bash
npm install
```

```bash
npm run dev:slides   # http://localhost:5183  ·  /genui/?presenter&local  ·  /agentes/?presenter&local  ·  /live/?talk=genui&local
```

```bash
npm run dev:genui    # http://localhost:5184  ·  /compare.html
```

```bash
npm run dev:agentes  # http://localhost:5185
```

```bash
npm run clips        # con las demos corriendo: regraba videos y metrics.json
```

```bash
npm test
```

Las respuestas del podio viven en `slides/answers.json` (no versionado; formato `{ "genui": {…}, "agentes": {…} }`). En ensayo local se cargan solas; en vivo: menú → **Cargar respuestas del podio**.

## Publicar (Firebase)

Ya está creado y publicado: proyecto `devfest-lima-2026` con los sitios `devfest-lima-slides`, `devfest-lima-nido` y `devfest-lima-mesa`, la app web, Firestore y sus reglas. `slides/.env.local` (no versionado) tiene la config web; para volver a publicar: `npm run deploy`.

### Pasos en la consola (solo tú puedes hacerlos)
Mientras no estén, los celulares funcionan en "modo local" y no se sincronizan con el deck.

1. [Authentication](https://console.firebase.google.com/project/devfest-lima-2026/authentication) → **Comenzar** → *Sign-in method* → **Anónimo** → habilitar.
2. **GitHub** (para presentar): crea una OAuth App en https://github.com/settings/developers con *Authorization callback URL* `https://devfest-lima-2026.firebaseapp.com/__/auth/handler` y pega el Client ID y el Client secret en el proveedor GitHub de Firebase.
3. *Authentication → Settings → Authorized domains*: agrega `devfest-lima-slides.web.app`, `devfest-lima-nido.web.app` y `devfest-lima-mesa.web.app`.
4. Prueba: abre `https://devfest-lima-slides.web.app/live/?talk=genui&session=prueba-verificacion` en el celular; debe decir **Conectado** (no "modo ensayo"). Sesiones en vivo: `devfest-lima-2026-genui` y `devfest-lima-2026-agentes`; para ensayar usa `?session=ensayo1` (no toca las reales).

### Antes de cada charla
0. Prueba todo en vivo (crea una sesión de prueba, no toca la real): `node scripts/verificar-en-vivo.mjs`.
1. Abre el deck con `?presenter=1` → menú → **Presentar en vivo (GitHub)** → menú → **Agenda** (qué charla va primero).
2. Menú → **Vaciar sesión en vivo…** si quedaron datos de ensayo → **Cargar respuestas del podio…**.
3. ⚠️ El Día 2 **no** vacíes la sesión del Día 1: de ahí sale el bono +200.

## Guías para tu agente de código

```bash
git clone --depth 1 https://github.com/vanessamarely/web-devfest26-lima /tmp/dflima && mkdir -p ~/.claude/skills && cp -R /tmp/dflima/skills/* ~/.claude/skills/
```

Luego pídele a tu agente: *“revisa la performance de mi UI generativa”* o *“revisa si mi web es fácil de usar para agentes”*.
