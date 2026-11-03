---
name: devtools-for-agents
description: Make a web app reliable and easy for AI agents to use, and debug what agents see and do with Chrome DevTools and Chrome DevTools for agents (chrome-devtools-mcp). Use when the user asks why an agent can't click/fill/book something on their site, wants to test their app with their coding agent, mentions accessibility tree, take_snapshot, WebMCP tools, the DevTools WebMCP panel, Lighthouse Agentic Browsing, race conditions with automated users, or client-side AI (Prompt API / Gemini Nano) that freezes or answers stale prompts.
---

# DevTools for agents: 4 questions

From the talk *Chrome DevTools para agentes* (DevFest Lima 2026). Your site has two kinds of visitors now: people and agents. Debug an agent by asking:

1. **What does it see?** → the accessibility tree (role, name, state).
2. **What did it do?** → WebMCP tool calls (input, output, status), console, network.
3. **What if it's faster than a person?** → simulate an automated user with emulation.
4. **What is the in-page AI thinking?** → streaming, cancellation and a custom Performance track.

## Workflow (with Chrome DevTools for agents)
Configure the MCP server (or use the `chrome-devtools` CLI):
```json
{ "mcpServers": { "chrome-devtools": { "command": "npx", "args": ["chrome-devtools-mcp@latest", "--categoryExperimentalWebmcp"] } } }
```
Then loop: `navigate_page` → `take_snapshot` → `fill` / `fill_form` / `click` (by uid) → `wait_for` → `list_console_messages` + `list_network_requests` → `emulate` (CPU / network / viewport) and repeat → `performance_start_trace` / `performance_stop_trace` → `lighthouse_audit` (includes the experimental Agentic Browsing category). With the WebMCP flag: `list_webmcp_tools`, `execute_webmcp_tool`.

## 10 rules
1. Native elements: `<button>`, `<a>`, `<label>`, `<form>`, `<select>`.
2. Every control has an accessible name (visible text or `aria-label`); an icon alone is not a name.
3. Expose state to machines: `disabled`, `aria-busy`, `aria-expanded`, `aria-invalid` — not only colors.
4. Inspect what the agent sees: Elements → Accessibility (full tree) or `take_snapshot`.
5. One WebMCP tool per intent, with clear name, description and JSON Schema; check them in Application → WebMCP (Available / Invoked tools, Run tool).
6. Errors that teach: "20:00 is not free; free: 19:30, 21:00" instead of "Error".
7. Irreversible actions: `annotations.consequentialHint` + human confirmation.
8. Let your coding agent test the site end to end with a real Chrome.
9. Emulate slow CPU/network: agents click as soon as a control exists — don't enable it until data is loaded.
10. Client-side AI: `promptStreaming`, `AbortController` for stale prompts, `performance.measure` with `detail.devtools` (own track), check the model in `chrome://on-device-internals`.

## Anti-patterns to flag
Clickable `div`/`span` without role · icon-only buttons · "disabled" only via CSS · tools that return "Error" · tools without schema descriptions · consequential actions without confirmation · model inference on the main thread · no cancellation of previous prompts.

## Report format
For each issue: question (sees / did / faster / thinks) → evidence (snapshot line, tool call, trace) → file:line → fix → how you verified (rerun the same agent task).

See references/checks.md for code.
