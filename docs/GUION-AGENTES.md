# Guion · Charla 2 · Chrome DevTools para agentes

30 minutos de contenido y 5 de preguntas. La tabla sale de los slides (`slides/src/shared/talks/agentes.ts`): si cambias algo allí, regenera este archivo.

## La idea en una frase

Tu web ahora tiene dos tipos de visitantes. DevTools siempre te mostró lo que ve una persona; ahora necesitas ver lo que ve, hace y piensa un agente. Cuatro preguntas, cuatro capítulos:

1. **¿Qué ve el agente?** Árbol de accesibilidad y take_snapshot: rol, nombre y estado.
2. **¿Qué hizo el agente?** Application → WebMCP: cada función que usó, con sus datos y su respuesta; errores que explican qué hacer.
3. **¿Qué pasa si va más rápido que una persona?** Tu agente de código prueba tu web con Chrome DevTools for agents; disabled y aria-busy de verdad.
4. **¿Qué piensa la IA de tu página?** Respuesta por partes, cancelar la pregunta anterior y medir en el panel Performance.

Cierre: una web legible, accionable y estable para agentes, y Lighthouse → Agentic Browsing.

## Antes de empezar

- Deck: `/agentes/?presenter=1` → menú → **Presentar en vivo (GitHub)** → **Cargar respuestas del podio** (`slides/answers.json`). No vacíes la sesión de la charla 1: de ahí sale el bono de +200.
- Chrome con `chrome://flags/#enable-webmcp-testing` para ver Application → WebMCP.
- Demo Mesa abierta en otra pestaña con DevTools. Los clips y el slide «Así se ve en Chrome DevTools» son el plan B.

## Minuto a minuto

| Min | Slide | Qué decir / hacer |
|---|---|---|
| 0:00 | Chrome DevTools para agentes | ¡Hola de nuevo, Lima! "En la otra charla hablamos de interfaces que escribe una IA. Hoy, de IAs que USAN nuestras interfaces… y de cómo depurarlas." |
| 0:40 | Únete a la charla | Si esta es la segunda charla: "Quien creó su avatar en la charla de UI generativa: ábranlo, cámbienle la ropa o lo que lleva y publíquenlo. Suma +200." Si es la primera: "Creen su avatar: en la otra charla lo pueden traer y suma +200." El QR es el mismo sitio para las dos. |
| 1:20 | Vanessa Aristizabal | 20 segundos. |
| 1:45 | Tu web ahora tiene dos tipos de visitantes | Pregunta: "¿Quién ya le pidió a un agente que reserve, compre o llene algo en una web?" (manos). "¿Y funcionó a la primera?" Risas. "Hoy vemos cómo saber POR QUÉ no funcionó." |
| 2:45 | Un agente "ve" tu página de cuatro formas | De izquierda a derecha: "cada vez menos ruido, cada vez más intención". "Si su página es accesible, ya hicieron la mitad del trabajo para los agentes." |
| 3:45 | Chrome DevTools for agents: tu agente de código controla un Chrome real | "No es un Chrome de mentira: es el tuyo, con DevTools de verdad por debajo (CDP y Puppeteer)." Categorías: input, navegación, emulación, performance, red, depuración. Modo foco: config y luego la CLI. |
| 4:45 | Hoy: 4 preguntas para depurar a un agente | ESTE es el mapa; vuelve aquí al empezar cada capítulo. Léelas despacio. |
| 5:30 | Mesa: reservas de restaurantes en Lima | Clip 15 s. "El agente falla. Vamos a averiguar por qué, pregunta por pregunta." |
| 6:00 | 01 · ¿Qué ve el agente? | Vuelve al mapa: pregunta 1. |
| 6:15 | Lo que tú ves vs. lo que ve el agente | Diagrama de dos columnas. "Este botón está hecho con un div. Para una persona funciona. Para el agente no existe." |
| 7:00 | Rol, nombre y estado | Modo foco: el div, el button, y lo que imprime take_snapshot. |
| 7:45 | Demo: el agente no encuentra el botón | Clip: panel "Lo que ve" a la derecha. |
| 8:30 | Pregunta 1 · ¿Qué ve el agente? | Espera ~25 s y revela con V. |
| 9:15 | 02 · ¿Qué hizo el agente? | Vuelve al mapa: pregunta 2. |
| 9:30 | Application → WebMCP: qué funciones vio y cuáles usó | Recreación del panel con las tools de Mesa. "Si el agente falla, aquí ven si fue él… o su tool." |
| 10:15 | Errores que el agente entiende | Modo foco en el error. |
| 11:00 | Demo: de "Error" a un error útil | Clip con el panel de tools a la derecha. |
| 11:45 | 03 · Simula a un usuario automático | Vuelve al mapa: pregunta 3. |
| 12:00 | Tu agente de código prueba tu web como un usuario | Bucle del diagrama. Ejemplo de prompt: "Abre Mesa, reserva para 4 el sábado a las 20:00 con CPU 4× y red 3G; dime qué falla y por qué." Tools: navigate_page, take_snapshot, fill_form, click, wait_for, list_console_messages, list_network_requests, emulate, performance_start_trace, lighthouse_audit. |
| 13:00 | El agente hace clic antes de que la página esté lista | Modo foco. "El gris no es un estado: disabled sí." |
| 14:00 | Demo: internet lento + agente rápido | Clip con la línea de tiempo del agente. |
| 14:45 | Pregunta 2 · El agente es más rápido | Espera ~25 s y revela con V. |
| 15:30 | 04 · Depura la IA de tu página | Vuelve al mapa: pregunta 4. |
| 15:45 | Tres bugs típicos de la IA en el navegador | Ejemplo de Mesa: "¿Qué pido?" con Gemini Nano (Prompt API) o el modo simulado. Herramientas: Performance con pista propia, consola, chrome://on-device-internals para ver el modelo. |
| 16:30 | Responder por partes, cancelar y medir | Modo foco en las 3 partes. |
| 17:30 | Demo: la recomendación que congelaba la página | Clip con el medidor de fluidez. |
| 18:15 | Demo en vivo: DevTools de verdad | Guion (6 min): 1) Mesa con ?bugs=todos, Elements → Accessibility sobre el botón. 2) Application → WebMCP (flag chrome://flags/#enable-webmcp-testing), Run tool reservar_mesa con hora 20:00. 3) Terminal: prompt al agente con chrome-devtools-mcp. 4) Performance: pista "Mesa · IA local". Plan B: clips. |
| 23:45 | Así se ve en Chrome DevTools | Clips grabados con DevTools real sobre Mesa. Úsalos si la demo en vivo falla, o para repasar rápido (1 min). Si sobra tiempo al final, vuelve aquí mientras la gente responde o mientras se arma el podio. |
| 24:30 | Una web fácil de entender para agentes | Recap de las 4 preguntas sobre esta pirámide. |
| 25:15 | Pregunta 3 · La IA de tu página | Espera ~25 s y revela con V. |
| 26:00 | El muro de avatares limeños | Señala los que tienen insignia: "estos estuvieron en las dos charlas, +200". Clic en uno para ocultarlo. |
| 26:45 | 10 reglas para una web que los agentes entienden | "Están en su memoria y en una guía para su agente de código en el repo." |
| 27:30 | El podio | Lee los 3 primeros y sus códigos. |
| 28:30 | ¡Gracias, Lima! | "Gracias por estos dos días." Preguntas (tecla Q). |
