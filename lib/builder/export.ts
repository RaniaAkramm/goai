import { zipSync, strToU8 } from "fflate";
import type { Project } from "./types";

export const safeSegment = (s: string) => s.replace(/\\/g, "/").split("/").pop()!.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^\.+/, "").slice(0, 100) || "file";
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "project";

const SERVER_JS = `'use strict';
require('dotenv').config();
const path = require('path');
const express = require('express');
const { openDb } = require('./db/init');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const db = openDb(process.env.DATABASE_FILE || path.join(__dirname, 'data', 'app.db'));

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const insertMessage = db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)');
const listMessages = db.prepare('SELECT id, name, email, message, created_at FROM messages ORDER BY id DESC LIMIT ?');

function clean(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }

app.post('/api/messages', (req, res) => {
  const name = clean(req.body && req.body.name, 100);
  const email = clean(req.body && req.body.email, 200);
  const message = clean(req.body && req.body.message, 5000);
  if (!name || !message || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'name, a valid email and message are required' });
  }
  const info = insertMessage.run(name, email, message); // parameterized query
  res.status(201).json({ id: info.lastInsertRowid });
});

// Read messages: protected by ADMIN_TOKEN from .env (send header "Authorization: Bearer <token>").
app.get('/api/messages', (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  if (!token || token.startsWith('replace-with') || req.get('authorization') !== 'Bearer ' + token) return res.status(401).json({ error: 'unauthorized' });
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
  res.json(listMessages.all(limit));
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
`;
const DB_INIT = `'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  return db;
}

if (require.main === module) {
  require('dotenv').config();
  const file = process.env.DATABASE_FILE || path.join(__dirname, '..', 'data', 'app.db');
  openDb(file).close();
  console.log('Database initialized at ' + file);
}

module.exports = { openDb };
`;
const SCHEMA = `CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function readme(p: Project, backend: boolean) {
  const title = p.name;
  if (!backend) return `# ${title}

Static website exported from GoAI.foo.

## Run locally
Open \`index.html\` in a browser, or serve the folder (recommended, so links and scripts behave like on a real host):

\`\`\`bash
npx serve .
# or
python3 -m http.server 8080
\`\`\`

## Files
- \`*.html\` — pages (\`index.html\` is the homepage)
- \`styles.css\` — styles; theme variables are in \`:root\`
- \`script.js\` — client-side JavaScript
- \`assets/\` — images and other uploaded files

## Deploy
Upload the folder to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.).

## Notes
Generated code was checked only with GoAI.foo's basic static checks. Review and test it before publishing.
`;
  return `# ${title}

Website exported from GoAI.foo with an optional Node.js backend (Express + SQLite).

## Requirements
- Node.js 18 or newer
- Build tools for the native \`better-sqlite3\` module may be needed on some systems (see https://github.com/WiseLibs/better-sqlite3).

## Setup
\`\`\`bash
npm install
cp .env.example .env      # then edit .env and set your own values
npm run db:init           # creates data/app.db using db/schema.sql
npm start                 # http://localhost:3000
\`\`\`

## Structure
- \`public/\` — the frontend (HTML, CSS, JS, assets), served by Express
- \`server.js\` — Express server with \`POST /api/messages\` (contact form) and \`GET /api/messages\` (requires \`ADMIN_TOKEN\`)
- \`db/schema.sql\` — database schema
- \`db/init.js\` — database initialization
- \`.env.example\` — configuration template (no real secrets)

## Security notes
- All SQL uses parameterized queries via \`better-sqlite3\` prepared statements.
- Set a long random \`ADMIN_TOKEN\` in \`.env\` (the placeholder value is rejected); never commit \`.env\`.
- No package-lock.json is included: run \`npm install\` to generate one, then commit it.
- This scaffold was generated but not executed or tested by GoAI.foo. Review it before deploying.
`;
}

export function buildExportFiles(p: Project, assets: { name: string; data: Uint8Array }[], backend = p.backend): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const pre = backend ? "public/" : "";
  for (const [path, content] of Object.entries(p.files)) {
    const parts = path.split("/").map(safeSegment);
    if (path.includes("..")) continue; // never allow path traversal
    out[pre + parts.join("/")] = strToU8(content);
  }
  for (const a of assets) out[`${pre}assets/${safeSegment(a.name)}`] = a.data;
  out["README.md"] = strToU8(readme(p, backend));
  out[".gitignore"] = strToU8(backend ? "node_modules/\n.env\ndata/\n*.db\n.DS_Store\n" : ".DS_Store\n");
  if (backend) {
    out["package.json"] = strToU8(JSON.stringify({
      name: slugify(p.name), version: "1.0.0", private: true, description: `${p.name} — exported from GoAI.foo`,
      main: "server.js", engines: { node: ">=18" },
      scripts: { start: "node server.js", "db:init": "node db/init.js" },
      dependencies: { "better-sqlite3": "^11.3.0", dotenv: "^16.4.5", express: "^4.21.1" },
    }, null, 2) + "\n");
    out["server.js"] = strToU8(SERVER_JS);
    out["db/init.js"] = strToU8(DB_INIT);
    out["db/schema.sql"] = strToU8(SCHEMA);
    out[".env.example"] = strToU8("# Copy to .env and fill in your own values. Do not commit .env.\nPORT=3000\nDATABASE_FILE=./data/app.db\nADMIN_TOKEN=replace-with-a-long-random-string\n");
  }
  return out;
}

export function zipProject(p: Project, assets: { name: string; data: Uint8Array }[], backend = p.backend): Uint8Array {
  const files = buildExportFiles(p, assets, backend);
  const root = slugify(p.name);
  const tree: Record<string, Uint8Array> = {};
  for (const [k, v] of Object.entries(files)) tree[`${root}/${k}`] = Uint8Array.from(v); // normalize realm/typed array
  return zipSync(tree, { level: 6 });
}
