# GoAI.foo

Free, English-only, local-first developer platform. No account, no paid APIs; everything runs in the browser.

## Features (built so far)
- 8 developer tools (`/tools`): JSON formatter/validator, JSON ⇄ CSV, Base64, text/code diff, HTML/CSS/JS playground, text utilities, regex tester (Web Worker + timeout), SHA hash generator (Web Crypto).
- Project Builder (`/builder`): 5 templates + blank, pages management, visual editor, CodeMirror code editor, theme variables, asset library (IndexedDB), responsive sandboxed preview, bounded undo/redo, autosave, My Projects, Check Project, ZIP export (static or Express + SQLite).
- Not built: AI Studio / AI-assisted generation; ads (none, no ad code).

## Develop
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest unit tests
npm run build && npm start
```
Browser end-to-end scripts used for verification are in `e2e/` (Playwright; expect a server on port 3311).

## AI Studio (`/studio`) — branch `studio`
- Chat, code assistant, text tools, AI site generator and model manager. Models run in the browser: WebLLM (WebGPU) and Transformers.js (WASM/CPU fallback). No server, no API keys.
- Chats are stored in IndexedDB (`goai-studio`). Models are cached by the browser (Cache API).
- Test mode: `localStorage.setItem("goai-studio-mock","1")` (or `?mock=1`) swaps in a mock engine; `goai-studio-mock-gpu=0` simulates no WebGPU.
- Tests: `npm test` (vitest), `NODE_PATH=/workspace/pw/node_modules node e2e/studio.js` and `e2e/builder-v2.js` against `next start -p 3311`.
- Analytics: `@vercel/analytics` with custom events `tool_used`, `builder_export`, `studio_model_loaded`, `studio_message`. Enable Web Analytics in the Vercel project dashboard on deploy.
