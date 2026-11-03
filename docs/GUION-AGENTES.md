# Guion · Día 2 · Chrome DevTools para agentes

30 minutos. La tabla sale del contenido de los slides (`slides/src/shared/talks/agentes.ts`): si cambias el guion allí, regenera este archivo.

## La idea en una frase

```
UNA idea guía: "Tu web ahora tiene dos tipos de visitantes. DevTools siempre te mostró lo que ve
una persona; ahora necesitas ver lo que ve, hace y piensa un agente." Cuatro preguntas = cuatro
capítulos (las cuatro frases del abstract):
  01 ¿Qué ve el agente?         → árbol de accesibilidad, take_snapshot        (inspeccionar)
  02 ¿Qué hizo el agente?       → panel WebMCP, errores útiles, consola        (interacciones)
  03 ¿Y si va más rápido?       → tu agente de código como usuario automatizado (simular)
  04 ¿Qué piensa la IA local?   → streaming, AbortController, pista propia      (rutinas de IA)
Cierre: "fácil de razonar" (Lighthouse Agentic Browsing + checklist).
Misma estructura en cada capítulo: síntoma → por qué → arreglo → prueba en la demo Mesa.
```

## Antes de empezar

- Deck: `/agentes/?presenter=1` → menú → **Presentar en vivo (GitHub)**. Ensayo sin red: `/agentes/?presenter&local`.
- Consola en tu laptop: tecla **P** (guion, siguiente slide, cronómetro).
- Demo Mesa abierta en otra pestaña con DevTools listo. Los clips de cada capítulo son el plan B.
- Menú → **Vaciar sesión en vivo…** si quedaron datos de ensayo; **Cargar respuestas del podio…** (`slides/answers.json`).
- Ensayo de efectos: en la consola del deck, `deckBurst('fire')`, `deckBurst('mind')`, `deckBurst('heart')`.

| Min | Slide | Qué decir / hacer |
|---|---|---|
| 0:00 | Portada | ¡Hola de nuevo, Lima! "Ayer hablamos de interfaces que escribe una IA. Hoy, de IAs que USAN nuestras interfaces… y de cómo depurarlas." |
| 0:40 | Únete | "Quien creó su avatar ayer: ábranlo, cámbienle la ropa o lo que lleva y publíquenlo. Suma +200." Sigue el mismo QR de ayer. |
| 1:20 | Quién soy | 20 segundos. |
| 1:45 | Dos visitantes | Pregunta: "¿Quién ya le pidió a un agente que reserve, compre o llene algo en una web?" (manos). "¿Y funcionó a la primera?" Risas. "Hoy vemos cómo saber POR QUÉ no funcionó." |
| 2:45 | ¿Cómo ve? | De izquierda a derecha: "cada vez menos ruido, cada vez más intención". "Si su página es accesible, ya hicieron la mitad del trabajo para los agentes." |
| 3:45 | DevTools for agents | "No es un Chrome de mentira: es el tuyo, con DevTools de verdad por debajo (CDP y Puppeteer)." Categorías: input, navegación, emulación, performance, red, depuración. Modo foco: config y luego la CLI. |
| 4:45 | Las 4 preguntas | ESTE es el mapa; vuelve aquí al empezar cada capítulo. Léelas despacio. |
| 5:30 | Demo · Mesa | Clip 15 s. "El agente falla. Vamos a averiguar por qué, pregunta por pregunta." |
| 6:00 | 01 ¿Qué ve? | Vuelve al mapa: pregunta 1. |
| 6:15 | El árbol | Diagrama de dos columnas. "Este botón está hecho con un div. Para una persona funciona. Para el agente no existe." |
| 7:00 | Rol, nombre, estado | Modo foco: el div, el button, y lo que imprime take_snapshot. |
| 7:45 | Demo · Lo que ve | Clip: panel "Lo que ve" a la derecha. |
| 8:30 | Pregunta 1 | Espera ~25 s y revela con V. |
| 9:15 | 02 ¿Qué hizo? | Vuelve al mapa: pregunta 2. |
| 9:30 | Panel WebMCP | Recreación del panel con las tools de Mesa. "Si el agente falla, aquí ven si fue él… o su tool." |
| 10:15 | Errores que enseñan | Modo foco en el error. |
| 11:00 | Demo · Tools | Clip con el panel de tools a la derecha. |
| 11:45 | 03 Simular | Vuelve al mapa: pregunta 3. |
| 12:00 | Tu agente prueba | Bucle del diagrama. Ejemplo de prompt: "Abre Mesa, reserva para 4 el sábado a las 20:00 con CPU 4× y red 3G; dime qué falla y por qué." Tools: navigate_page, take_snapshot, fill_form, click, wait_for, list_console_messages, list_network_requests, emulate, performance_start_trace, lighthouse_audit. |
| 13:00 | La carrera | Modo foco. "El gris no es un estado: disabled sí." |
| 14:00 | Demo · Carrera | Clip con la línea de tiempo del agente. |
| 14:45 | Pregunta 2 | Espera ~25 s y revela con V. |
| 15:30 | 04 IA del cliente | Vuelve al mapa: pregunta 4. |
| 15:45 | 3 problemas | Ejemplo de Mesa: "¿Qué pido?" con Gemini Nano (Prompt API) o el modo simulado. Herramientas: Performance con pista propia, consola, chrome://on-device-internals para ver el modelo. |
| 16:30 | Streaming + abort | Modo foco en las 3 partes. |
| 17:30 | Demo · IA local | Clip con el medidor de fluidez. |
| 18:15 | Demo en vivo | Guion (6 min): 1) Mesa con ?bugs=todos, Elements → Accessibility sobre el botón. 2) Application → WebMCP (flag chrome://flags/#enable-webmcp-testing), Run tool reservar_mesa con hora 20:00. 3) Terminal: prompt al agente con chrome-devtools-mcp. 4) Performance: pista "Mesa · IA local". Plan B: clips. |
| 24:30 | Fácil de razonar | Recap de las 4 preguntas sobre esta pirámide. |
| 25:15 | Pregunta 3 | Espera ~25 s y revela con V. |
| 26:00 | Muro de avatares | Señala los que tienen insignia: "estos vinieron ayer y hoy, +200". Clic en uno para ocultarlo. |
| 26:45 | Para llevar | "Están en su memoria y en una guía para su agente de código en el repo." |
| 27:30 | Podio | Lee los 3 primeros y sus códigos. |
| 28:30 | Gracias | "Gracias por estos dos días." Preguntas (tecla Q). |
