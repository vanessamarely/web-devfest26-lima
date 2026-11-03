# DevFest Lima 2026 · dos charlas, un avatar limeño

Charlas técnicas de [Vanessa Aristizabal](https://github.com/vanessamarely) en **DevFest Lima 2026** (30 min cada una, un día cada una).

| Día | Charla | Demo |
|---|---|---|
| **Día 1** | **Web performance en la era de la UI generativa** — 4 reglas para que una interfaz que escribe una IA sea rápida, estable y no congele la página. | **Nido**: buscador de depas con IA y panel **Rayos X** |
| **Día 2** | **Chrome DevTools para agentes** — ver lo que un agente ve, hace y piensa en tu web, y depurarlo. | **Mesa**: reservas de restaurantes con **Panel del agente** |

## En vivo

| Qué | URL |
|---|---|
| Portada (elige la charla) | https://devfest-lima-slides.web.app |
| Deck Día 1 (proyector) | https://devfest-lima-slides.web.app/genui/?presenter=1 |
| Deck Día 2 (proyector) | https://devfest-lima-slides.web.app/agentes/?presenter=1 |
| App de asistentes (QR) | https://devfest-lima-slides.web.app/live/?talk=genui · `?talk=agentes` |
| Consola de la presentadora | https://devfest-lima-slides.web.app/presenter/?talk=genui · `?talk=agentes` |
| Demo Nido · comparador | https://devfest-lima-nido.web.app · https://devfest-lima-nido.web.app/compare |
| Demo Mesa | https://devfest-lima-mesa.web.app |

Proyecto Firebase: `devfest-lima-2026` (Hosting ×3 + Firestore con [reglas](firestore.rules)).

## Cómo está armada cada charla (para no perderse)

Una sola metáfora y **4 capítulos**. Cada capítulo tiene el mismo ritmo: *lo que siente la persona → por qué pasa (un diagrama) → el arreglo (código corto) → la prueba en la demo (clip con números reales)*.

- **Día 1 · "Construir un depa mientras te dictan el plano"**: 01 Reserva el espacio (renderizado) · 02 Lee el plano una vez (streaming) · 03 Recicla, no demuelas (reciclaje del DOM) · 04 Una sola libreta (estado).
- **Día 2 · "4 preguntas para depurar a un agente"**: 01 ¿Qué ve? (árbol de accesibilidad) · 02 ¿Qué hizo? (panel WebMCP) · 03 ¿Y si va más rápido que una persona? (simular usuarios) · 04 ¿Qué piensa la IA de tu página? (IA en el cliente).

Guion minuto a minuto: [docs/GUION-GENUI.md](docs/GUION-GENUI.md) y [docs/GUION-AGENTES.md](docs/GUION-AGENTES.md). Fuentes verificadas: [docs/FUENTES.md](docs/FUENTES.md).

## Carpetas

| Carpeta | Qué es |
|---|---|
| [`slides/`](slides) | Portada `/`, deck Día 1 `/genui/` (34 slides), deck Día 2 `/agentes/` (33 slides), app de asistentes `/live/?talk=…`, consola `/presenter/`. Proporciones 4:3 · 16:10 · 16:9 · 21:9 · extendida (**A**/**E**), claro/oscuro (**L**), alto contraste (**H**). |
| [`demo-genui/`](demo-genui) | **Nido** (`/`) y el comparador lado a lado (`/compare.html?regla=1..4`). |
| [`demo-agentes/`](demo-agentes) | **Mesa** con el Panel del agente (Lo que ve · Tools · Línea de tiempo · Fluidez) y 4 bugs. |
| [`scripts/record-clips.mjs`](scripts/record-clips.mjs) | Graba los clips de las dos demos y mide los números que muestran los slides. |
| [`skills/`](skills) | Guías para tu agente de código: [`genui-performance`](skills/genui-performance/SKILL.md) y [`devtools-for-agents`](skills/devtools-for-agents/SKILL.md). |

## Interacción con el público (las dos charlas)

| Qué | Cómo funciona |
|---|---|
| **Unirse** | QR en el slide 2 y uno pequeño “Únete” en cada slide (tecla **J**). Apodo limeño único (“Garúa Bacán”); si se repite, se numera. El Día 2 se propone primero el apodo del Día 1. |
| **Avatar limeño** | Persona de la Lima de hoy, variada a propósito: piel, 9 peinados y colores, pestañas, aretes, labios, barba o bigote, ropa (hoodie, camiseta blanquirroja, chaqueta de chef, chompa de alpaca, traje de surf…), jean, falda, short o vestido, gorro, lentes y lo que lleva (ceviche, chicha morada, picarones, laptop, lupa…). PNG 1080×1350 para compartir. |
| **Muro compartido** | El mismo muro en las dos charlas. **Cada charla guarda su propia versión del avatar**: al pasar del Día 1 al Día 2, tu avatar vuelve y le cambias la ropa, el gorro o lo que lleva (“Hoy cambiaste: casco de parapente, lupa”). En el muro lleva la insignia **Día 1 + Día 2**. |
| **Podio** | 3 preguntas por charla: 500 por acierto + hasta 500 por rapidez. Bonos: **+200 por traer tu avatar de la otra charla**, +100 avatar, +100 a tiempo, +100 pregunta, hasta +100 reacciones. Para entrar al podio hay que acertar al menos una. |
| **Reacciones con efecto** | 🔥 un avatar cruza corriendo · 🤯 pasa un parapente · ❤️ sale el sol de Lima. Ensayo: `deckBurst('fire')` en la consola del deck. |
| **Preguntas** | Solo sobre el tema; no se proyectan; la presentadora las ve con **Q**. |
| **Memoria** | PDF, HTML o Markdown con el resumen, las notas (nunca salen del celular) y el avatar. |

## Las demos

### Nido (Día 1)
Escribes *“Depa de 2 dormitorios en Barranco con vista al mar, menos de S/ 3.000”* y la IA (simulada y determinista: mismo stream siempre) arma resumen, mapa, 6 destacados, gráfico y una lista de 300. **Rayos X** (tecla **X**) prende y apaga cada regla y mide CLS, INP, frames largos, caracteres leídos, renders y nodos creados; dibuja los saltos en rojo, los nodos nuevos en naranja y los reciclados en verde. `?preset=roto`, `?rules=0111`, `?tps=70`, `?auto`.

Números medidos al grabar (mismo stream): CLS **0,39 → 0,00** · caracteres leídos **1.052.640 → 2.514** · renders **390 → 17** · nodos creados **74.499 → 1.187** · INP al ordenar (CPU 3×) **1.496 ms → 16 ms**.

### Mesa (Día 2)
Un agente intenta *“mesa para 4 el sábado a las 20:00 en un nikkei de Barranco”*. Bugs: **1** botón hecho con un div (el agente ve `generic`), **2** la tool responde “Error” a secas, **3** botón “gris” por CSS pero usable antes de que carguen los horarios, **4** IA local en el hilo principal sin streaming ni abort. `?bugs=todos|div,error,carrera,ia`, `?red=lenta`, `?tab=ve|tools|tiempo`, `?engine=nano` (Gemini Nano si está disponible).

Con WebMCP nativo (Chrome con `chrome://flags/#enable-webmcp-testing`) las tools aparecen en **DevTools → Application → WebMCP**; sin el flag quedan en un registro local que muestra el Panel del agente. La búsqueda del encabezado es la tool declarativa `buscar_restaurantes`.

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
1. Abre el deck con `?presenter=1` → menú → **Presentar en vivo (GitHub)**.
2. Menú → **Vaciar sesión en vivo…** si quedaron datos de ensayo → **Cargar respuestas del podio…**.
3. ⚠️ El Día 2 **no** vacíes la sesión del Día 1: de ahí sale el bono +200.

## Guías para tu agente de código

```bash
git clone --depth 1 https://github.com/vanessamarely/web-devfest26-lima /tmp/dflima && mkdir -p ~/.claude/skills && cp -R /tmp/dflima/skills/* ~/.claude/skills/
```

Luego pídele a tu agente: *“revisa la performance de mi UI generativa”* o *“revisa si mi web es fácil de usar para agentes”*.
