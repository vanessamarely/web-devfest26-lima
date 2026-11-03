# Guion · Día 1 · Web performance en la era de la UI generativa

30 minutos. La tabla sale del contenido de los slides (`slides/src/shared/talks/genui.ts`): si cambias el guion allí, regenera este archivo.

## La idea en una frase

```
Una sola idea guía, para que la charla se siga sin perderse: UNA metáfora y CUATRO reglas.

  "Construir un depa mientras te dictan el plano"
  La IA dicta la interfaz por partes (streaming); el navegador es el maestro de obra que
  construye EN VIVO… con la persona ya adentro.
    01 Reserva el espacio      → no muevas las paredes con la gente adentro   (renderizado, CLS)
    02 Lee el plano una vez    → no releas desde la primera página           (streaming JSON/HTML)
    03 Recicla, no demuelas    → para cambiar un mueble no tiras el depa      (reciclaje del DOM)
    04 Una sola libreta de obra→ la IA dicta qué, tu código calcula cuánto    (estado)

Cada capítulo tiene el mismo ritmo: lo que SIENTE la persona → por qué pasa (un diagrama) →
el arreglo (código corto) → la prueba en la demo Nido (clip con números reales).
```

## Antes de empezar

- Deck: `/genui/?presenter=1` → menú → **Presentar en vivo (GitHub)**. Ensayo sin red: `/genui/?presenter&local`.
- Consola en tu laptop: tecla **P** (guion, siguiente slide, cronómetro).
- Demo Nido abierta en otra pestaña con DevTools listo. Los clips de cada capítulo son el plan B.
- Menú → **Vaciar sesión en vivo…** si quedaron datos de ensayo; **Cargar respuestas del podio…** (`slides/answers.json`).
- Ensayo de efectos: en la consola del deck, `deckBurst('fire')`, `deckBurst('mind')`, `deckBurst('heart')`.

| Min | Slide | Qué decir / hacer |
|---|---|---|
| 0:00 | Portada | ¡Hola, Lima! (sonríe, pausa). "Hoy vamos a hablar de interfaces que escribe una IA… y de por qué a veces se sienten lentas. Prometo una sola metáfora y cuatro reglas. Nada más." |
| 0:40 | Únete | Que escaneen mientras te presentas. "Hay 3 preguntas: quien acierte rápido sube al podio. Creen su avatar: mañana, en la charla de DevTools, lo pueden traer, cambiarle la ropa y suma +200. Sus notas no salen de su celular." |
| 1:20 | Quién soy | 20 segundos. "Trabajo en performance web y en IA en el navegador." |
| 1:45 | ¿Qué es UI generativa? | Explica con el ejemplo de la demo: "Le pido: depa de 2 dormitorios en Barranco con vista al mar. No me contesta un párrafo: me arma tarjetas, un mapa y un gráfico de precios." Señala el diagrama de izquierda a derecha: pedido → modelo → JSON de piezas → tu código pinta. "Fíjense en la última flecha: la pintura es NUESTRA. Ahí está el problema de performance… y la solución." |
| 2:45 | 3 sensaciones | Pregunta: "¿A quién le ha saltado un botón justo cuando iba a tocarlo?" (manos). "Eso tiene nombre: CLS." No entres en fórmulas. "Con UI generativa, las tres sufren a la vez, porque la página se construye mientras la usas." |
| 3:45 | La metáfora | ESTE es el mapa de la charla; vuelve a él al empezar cada capítulo. "Imaginen que construyen un depa en Miraflores mientras el arquitecto les dicta el plano por teléfono, palabra por palabra. Y la familia ya se mudó." Lee las 4 reglas en voz alta, despacio. "Si se quedan con estas 4 frases, la charla valió la pena." |
| 4:45 | Demo · Nido | Deja correr el clip 15 s. "Esta es la versión arreglada. Durante la charla vamos a romperla regla por regla." Rayos X: tecla X en la demo. |
| 5:30 | 01 Reserva el espacio | Vuelve al mapa: "Regla 1, renderizado." Transición corta. |
| 5:45 | Todo salta | Señala la columna roja: "el mapa llega tarde y empuja todo". Luego la verde: "los huecos ya estaban". "En UI generativa el modelo puede mandar el plano primero: qué secciones vienen. Con eso reservamos." |
| 6:30 | Plano + catálogo | Modo foco: 1) el plano, 2) las piezas, 3) el catálogo con medidas, 4) reservar(). "Las fotos llevan aspect-ratio: la imagen llega después, el hueco ya estaba." |
| 7:15 | Demo · Saltos | Clip: izquierda sin reservar (recuadros rojos), derecha con reserva (bordes punteados). Lee los números del panel. |
| 8:00 | Pregunta 1 | Lee la pregunta y espera ~25 s. Revela con V. |
| 8:45 | 02 Lee el plano una vez | Vuelve al mapa: "Regla 2, streaming." |
| 9:00 | ¿Cómo llega? | "El modelo escribe token por token. ¿En qué formato le pedimos que escriba?" Recomienda NDJSON para UI generativa: cada línea es una pieza válida del catálogo. HTML en streaming sirve para contenido, no para piezas interactivas. |
| 10:00 | Releer todo | La imagen del libro: "Es como releer el plano desde la página 1 cada vez que el arquitecto dice una palabra." Señala los contadores: caracteres leídos y renders. No digas O(n²): di "crece al cuadrado: el doble de respuesta, cuatro veces el trabajo". |
| 10:45 | Parser + frame | Modo foco: el antes (2 líneas) y el después. "resto guarda la línea a medias. Y programarRender junta todo lo que llegó en un frame." |
| 11:45 | Demo · Streaming | Clip: el panel "Plano dictado" muestra el stream; mira los contadores bajar. |
| 12:30 | 03 Recicla, no demuelas | Vuelve al mapa: "Regla 3, reciclaje del DOM." |
| 12:45 | Claves estables | Modo foco. "Recrear nodos es caro y además rompe cosas: si la persona estaba escribiendo o tenía el foco en un botón, lo pierde." |
| 13:45 | Listas largas | Diagrama de la cinta: "Como la vitrina de una pastelería: los mismos platos, distinto postre." Menciona que el clip compara nodos. |
| 14:30 | Demo · Reciclar | Clip: llegan correcciones de precio. Rojo/naranja = nodos nuevos; verde = reciclados. |
| 15:15 | Pregunta 2 | Espera ~25 s y revela con V. |
| 16:00 | 04 Una sola libreta | Vuelve al mapa: "Regla 4, estado." |
| 16:15 | La libreta | Diagrama: stream → libreta → piezas. "El error común: pedirle al modelo que vuelva a generar la lista ordenada. Es lento, caro y puede equivocarse. Ordenar es trabajo de tu código." |
| 17:00 | Store + Worker | Modo foco. "aria-busy pinta un spinner en el mismo frame del clic: eso es lo que mide INP." |
| 17:45 | Demo · Estado | Clip: el contador de INP en rojo vs verde. |
| 18:30 | Cómo medirlo | "Mañana, en la charla de DevTools para agentes, vemos cómo un agente de código hace esto por ti." Modo foco en la pista. |
| 19:15 | Demo en vivo | Guion (6 min): 1) Botón "Todo roto", CPU 4× en DevTools, generar "depa 2 dorms Barranco vista al mar". 2) Regla 1 → generar (CLS). 3) Regla 2 → generar (caracteres y renders). 4) Regla 3 → "Actualizar precios" (nodos). 5) "Ordenar por precio/m²" con regla 4 apagada y prendida (INP). Si algo falla: los clips de cada capítulo. |
| 25:15 | Las 4 reglas | Recap lento, una por una, señalando cada estación. |
| 26:00 | Pregunta 3 | Espera ~25 s y revela con V. |
| 26:45 | Muro de avatares | Lee 2–3 mensajes. "Mañana tráiganlo a la charla de DevTools: le cambian la ropa y suma +200." Clic en uno para ocultarlo (moderación). |
| 27:30 | Para llevar | "Están en su memoria en PDF y en una guía para su agente de código en el repo." |
| 28:15 | Podio | Lee los 3 primeros y sus códigos. |
| 29:00 | Gracias | "Descarguen su memoria. Y mañana los espero con su avatar en la charla de DevTools para agentes." Preguntas (tecla Q). |
