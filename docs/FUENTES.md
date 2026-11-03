# Fuentes verificadas (noviembre 2026)

| Dato en los slides | Fuente |
|---|---|
| Chrome DevTools for agents = servidor MCP `chrome-devtools-mcp` + CLI `chrome-devtools` + skills | https://github.com/ChromeDevTools/chrome-devtools-mcp · docs/cli.md |
| Tools: navigate_page, take_snapshot (árbol de accesibilidad con uids), click, fill, fill_form, wait_for, emulate, list_console_messages, list_network_requests, performance_start_trace/stop/analyze_insight, lighthouse_audit, take_screenshot… | docs/tool-reference.md del mismo repo |
| `--categoryExperimentalWebmcp` activa `list_webmcp_tools` y `execute_webmcp_tool` | https://developer.chrome.com/docs/devtools/application/webmcp |
| Panel Application → WebMCP: Available tools, Invoked tools (Completed/Canceled/In Progress/Error), Run tool | https://developer.chrome.com/docs/devtools/application/webmcp |
| Lighthouse: categoría Agentic Browsing (experimental), basada en accesibilidad, WebMCP y estabilidad | https://developer.chrome.com/docs/lighthouse/agentic-browsing |
| Pistas propias en Performance: `performance.measure(…, { detail: { devtools: { dataType: 'track-entry', track } } })` | Extensibility API de DevTools (developer.chrome.com/docs/devtools/performance/extension) |
| Umbrales: LCP < 2,5 s · INP < 200 ms · CLS < 0,1 | web.dev/articles/vitals |
| Prompt API: `LanguageModel.create()` y `promptStreaming(…, { signal })` | developer.chrome.com/docs/ai/prompt-api |

Los números de los slides de demo salen de `scripts/record-clips.mjs` (mismo stream, CPU 3× para el INP) y se guardan en `slides/public/clips/<charla>/metrics.json`.
