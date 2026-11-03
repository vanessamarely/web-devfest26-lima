---
name: genui-performance
description: Audit and fix the performance of generative UI (interfaces an LLM streams as components) — layout shifts while content streams in, main-thread jank from re-parsing partial JSON, DOM churn from innerHTML re-renders, slow interactions from sorting/filtering in the main thread. Use when the user builds AI-generated or streamed UI (chat with components, AI search results, agent dashboards) and mentions CLS, INP, LCP, streaming, NDJSON, partial JSON, skeletons, virtualization, DOM recycling, state stores or "the page freezes while the AI answers".
---

# Fast generative UI: 4 rules

From the talk *Web performance en la era de la UI generativa* (DevFest Lima 2026). Metaphor: **building an apartment while the architect dictates the plan over the phone** — the browser builds live, with people already inside.

## Workflow
1. **Measure first** (never optimize blind): Chrome DevTools → Performance, CPU 4× slowdown, record one full AI response, stop. Read Insights: *Layout shift culprits*, *INP breakdown*, long animation frames. If Chrome DevTools for agents (chrome-devtools-mcp) is available, use `performance_start_trace` / `performance_stop_trace` / `performance_analyze_insight`.
2. Map each finding to one rule below; fix the biggest first.
3. Re-measure with the SAME prompt and stream (make the model or a fixture deterministic) and report before → after.

## Rule 1 · Reserve the space (rendering, CLS)
- The model chooses pieces from YOUR component catalog (JSON Schema), never free HTML.
- Stream a **plan** first (which sections are coming); create every section's skeleton with its final size (`min-height`, `aspect-ratio`) before content arrives.
- Images: `width`/`height` attributes or `aspect-ratio`; late banners get a reserved slot.
- Text that grows while streaming gets a min-height sized for its typical length on the narrowest layout.

## Rule 2 · Read the plan once (streaming JSON/HTML)
- Prefer **NDJSON** (one complete piece per line). Keep the incomplete tail in a buffer; parse only complete lines. Each character is read once.
- Never `JSON.parse(repair(buffer))` on every chunk — that is quadratic.
- Batch DOM updates: one render per `requestAnimationFrame`, not one per token/chunk.
- Streaming HTML is fine for prose; not for interactive catalog pieces.

## Rule 3 · Recycle, don't demolish (DOM recycling)
- One node per stable id (`Map<id, Element>`); update only changed text/attributes. Never re-render whole lists with `innerHTML`.
- Long lists: a pool of ~viewport+2 rows that change content on scroll, or `content-visibility: auto` + `contain-intrinsic-size`.
- Reordering moves existing nodes (optionally inside a View Transition).

## Rule 4 · One ledger (state)
- One store keyed by id; the stream sends patches; each component subscribes only to its id.
- The model decides WHAT to show (filters, ids); your code computes how much/which order (sort, filter, totals). Don't ask the model to regenerate a sorted list.
- Heavy work (scoring, sorting hundreds of items) in a Web Worker; give feedback in the same frame as the click (`aria-busy`, spinner) so INP stays < 200 ms.

## Name your work in DevTools
```js
performance.measure('Parser', { start: t0, detail: { devtools: { dataType: 'track-entry', track: 'My app · GenUI', color: 'tertiary' } } });
```

## Anti-patterns to flag
`innerHTML` of the whole result per chunk · `JSON.parse` of the full buffer per chunk · rendering per token · images without dimensions · inserting a section above content that already rendered · sorting inside a comparator that recomputes expensive scores · asking the LLM to re-sort/re-filter data you already have.

## Report format
For each issue: symptom (what the person feels) → rule → file:line → fix → before/after metric (CLS, INP, chars parsed, renders, nodes created).

See references/patterns.md for complete code.
