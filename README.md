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
