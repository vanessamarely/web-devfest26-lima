# Guion · Charla 1 · Web performance en la era de la UI generativa

30 minutos de contenido y 5 de preguntas. La tabla sale de los slides (`slides/src/shared/talks/genui.ts`): si cambias algo allí, regenera este archivo.

## La idea en una frase

Una metáfora y cuatro reglas: **construir una casa mientras te dictan el plano**. La IA dicta la interfaz por partes (streaming), el navegador la construye mientras escucha y la persona ya la está usando.

1. **Reserva el espacio:** guarda el lugar de cada parte antes de que llegue (cómo se dibuja la pantalla, CLS).
2. **Lee cada parte una sola vez:** un JSON por línea (NDJSON) y un dibujo por cuadro (cómo llega la respuesta).
3. **Reutiliza, no rehagas:** un elemento por id y listas con pocas filas (los elementos de la pantalla, el DOM).
4. **Un solo lugar para los datos:** la IA decide qué mostrar; tu código hace las cuentas, y lo pesado va en un Worker (estado, INP).

Cada capítulo tiene el mismo ritmo: lo que siente la persona, por qué pasa (un diagrama), el arreglo (código corto) y la prueba en la demo Nido (clip con números reales).

## Antes de empezar

- Deck: `/genui/?presenter=1` → menú → **Presentar en vivo (GitHub)** → **Cargar respuestas del podio** (`slides/answers.json`). Ensayo sin red: `/genui/?presenter&local`.
- Consola en tu laptop: tecla **P** (notas, siguiente slide, cronómetro).
- Demo Nido abierta en otra pestaña. Los clips de cada capítulo son el plan B.
- Ensayo de efectos en la consola del deck: `deckBurst('fire')`, `deckBurst('mind')`, `deckBurst('heart')`, `deckFiesta()`.

## Minuto a minuto

| Min | Slide | Qué decir / hacer |
|---|---|---|
| 0:00 | Web performance en la era de la UI generativa | ¡Hola, Lima! (sonríe, pausa). "Hoy vamos a hablar de interfaces que escribe una IA… y de por qué a veces se sienten lentas. Prometo una sola metáfora y cuatro reglas. Nada más." |
| 0:40 | Únete a la charla | Que escaneen mientras te presentas. "Hay 3 preguntas: quien acierte rápido sube al podio. Creen su avatar: en la otra charla (Chrome DevTools para agentes) lo pueden traer, cambiarle la ropa y suma +200. Y si les queda una duda, el botón Pregúntale tiene un asistente que conoce esta charla." |
| 1:20 | Vanessa Aristizabal | 20 segundos. "Trabajo en performance web y en IA en el navegador." |
| 1:45 | La IA ya no responde texto: responde interfaces | Explica con el ejemplo de la demo: "Le pido: departamento de 2 dormitorios en Barranco con vista al mar. No me contesta un párrafo: me arma tarjetas, un mapa y un gráfico de precios." Señala el diagrama de izquierda a derecha: pedido → modelo → JSON de piezas → tu código pinta. "Fíjense en la última flecha: la pintura es NUESTRA. Ahí está el problema de performance… y la solución." |
| 2:45 | La persona no ve métricas: siente tres cosas | Pregunta: "¿A quién le ha saltado un botón justo cuando iba a tocarlo?" (manos). "Eso tiene nombre: CLS." No entres en fórmulas. "Con UI generativa, las tres sufren a la vez, porque la página se construye mientras la usas." |
| 3:45 | Construir una casa mientras te dictan el plano | ESTE es el mapa de la charla; vuelve a él al empezar cada capítulo. "Imaginen que construyen una casa mientras el arquitecto les dicta el plano por teléfono, palabra por palabra. Y la familia ya vive adentro." Lee las 4 reglas en voz alta, despacio. "Si se quedan con estas 4 frases, la charla valió la pena." |
| 4:45 | Nido: un buscador de departamentos con IA | Deja correr el clip 15 s. "Esta es la versión arreglada. Durante la charla vamos a romperla regla por regla." Rayos X: tecla X en la demo. |
| 5:30 | Regla 1: reserva el espacio | Vuelve al mapa: "Regla 1, cómo se dibuja la pantalla." Transición corta. |
| 5:45 | Si no reservas, todo salta | Señala la columna roja: "el mapa llega tarde y empuja todo". Luego la verde: "los huecos ya estaban". "En UI generativa el modelo puede mandar el plano primero: qué secciones vienen. Con eso reservamos." |
| 6:30 | El plano primero; cada pieza con su tamaño | Modo foco: 1) el plano, 2) los componentes, 3) las medidas de cada componente, 4) reservar(). "Las fotos llevan aspect-ratio: la imagen llega después, pero su espacio ya estaba guardado." |
| 7:15 | Demo: los saltos, con y sin reserva | Clip: izquierda sin reservar (recuadros rojos), derecha con reserva (bordes punteados). Lee los números del panel. |
| 8:00 | Pregunta 1 · Reserva el espacio | Lee la pregunta y espera ~25 s. Revela con V. |
| 8:45 | Regla 2: lee cada parte una sola vez | Vuelve al mapa: "Regla 2, la respuesta que llega por partes." |
| 9:00 | ¿Cómo llega la respuesta? | "El modelo escribe token por token. ¿En qué formato le pedimos que escriba?" Recomienda NDJSON para UI generativa: cada línea es un componente completo. HTML por partes sirve para texto, no para componentes interactivos. |
| 10:00 | El error típico: releer todo con cada parte | La imagen del libro: "Es como releer el plano desde la página 1 cada vez que el arquitecto dice una palabra." Señala los contadores: caracteres leídos y veces que se dibuja. No digas O(n²): di "crece al cuadrado: el doble de respuesta, cuatro veces el trabajo". |
| 10:45 | Cada línea, una vez. Un dibujo por cuadro. | Modo foco: el antes (2 líneas) y el después. "resto guarda la línea incompleta. Y programarRender junta todo lo que llegó y dibuja una vez por cuadro." |
| 11:45 | Demo: la misma respuesta, leída una sola vez | Clip: el panel "Lo que envía la IA" muestra la respuesta en crudo; mira los contadores bajar. |
| 12:30 | Regla 3: reutiliza, no rehagas | Vuelve al mapa: "Regla 3, reutilizar lo que ya está en pantalla." |
| 12:45 | Cada elemento tiene su id: cambia solo lo que cambió | Modo foco. "Recrear nodos es caro y además rompe cosas: si la persona estaba escribiendo o tenía el foco en un botón, lo pierde." |
| 13:45 | Listas largas, pocos elementos en pantalla | Diagrama de la cinta: "Como la vitrina de una pastelería: los mismos platos, distinto postre." Menciona que el clip compara nodos. |
| 14:30 | Demo: rehacer todo vs. reutilizar | Clip: llegan correcciones de precio. Naranja = elementos nuevos; verde = reutilizados. |
| 15:15 | Pregunta 2 · Leer y reutilizar | Espera ~25 s y revela con V. |
| 16:00 | Regla 4: un solo lugar para los datos | Vuelve al mapa: "Regla 4, dónde viven los datos." |
| 16:15 | La IA decide qué mostrar; tu código hace las cuentas | Diagrama: lo que llega → los datos en un solo lugar → la pantalla. "El error común: pedirle al modelo que vuelva a generar la lista ordenada. Es lento, caro y puede equivocarse. Ordenar es trabajo de tu código." |
| 17:00 | Datos por id + Worker para lo pesado | Modo foco. "aria-busy muestra el indicador de carga en el mismo instante del clic: eso es lo que mide INP." |
| 17:45 | Demo: ordenar mientras la IA escribe | Clip: el contador de INP en rojo vs verde. |
| 18:30 | Cómo comprobarlo en tu app (sin enredarte) | "En la otra charla, Chrome DevTools para agentes, vemos cómo un agente de código hace esto por ti." Modo foco en la pista. |
| 19:15 | Demo en vivo: rompe y arregla Nido | Guion (6 min): 1) Rayos X (tecla X), botón "Todo roto", generar "departamento de 2 dormitorios en Barranco con vista al mar". 2) Regla 1 → generar (CLS). 3) Regla 2 → generar (caracteres y veces que dibuja). 4) Regla 3 → "Actualizar precios" (elementos creados). 5) "Ordenar por precio/m²" con regla 4 apagada y prendida (INP). Si algo falla: los clips de cada capítulo. |
| 25:15 | Las 4 reglas | Recap lento, una por una, señalando cada estación. |
| 26:00 | Pregunta 3 · Los datos | Espera ~25 s y revela con V. |
| 26:45 | El muro de avatares limeños | Lee 2–3 mensajes. "Tráiganlo a la otra charla (DevTools para agentes): le cambian la ropa y suma +200." Clic en uno para ocultarlo (moderación). |
| 27:30 | 10 reglas para una UI generativa rápida | "Están en su memoria en PDF y en una guía para su agente de código en el repo." |
| 28:15 | El podio | Lee los 3 primeros y sus códigos. |
| 29:00 | ¡Gracias, Lima! | "Descarguen su memoria. Y los espero con su avatar en la otra charla, DevTools para agentes (si es después de esta)." Preguntas (tecla Q). |
