import type { Project } from "./types";
import { pageHtml, navHtml } from "./templates";

export const SAFE_NAME = /^[a-z0-9][a-z0-9-_]{0,60}\.html$/;
export function normalizePageName(input: string): string {
  let s = input.trim().toLowerCase().replace(/\.html?$/, "").replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
  if (!s) throw new Error("Page name must contain letters or numbers.");
  s = s.slice(0, 60) + ".html";
  if (!SAFE_NAME.test(s)) throw new Error("Invalid page name.");
  return s;
}
const touch = (p: Project): Project => ({ ...p, updatedAt: Date.now() });
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Rewrite href="old" / href='old' (optionally with #hash or ?query) in all html files. */
export function rewriteLinks(files: Record<string, string>, from: string, to: string) {
  const re = new RegExp(`(href=["'])(\\./)?${escRe(from)}(?=["'#?])`, "g");
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) out[k] = k.endsWith(".html") ? v.replace(re, `$1$2${to}`) : v;
  return out;
}
const titleOf = (html: string) => (/<title>([^<·]*)/.exec(html)?.[1] ?? "").trim();
const siteNameOf = (p: Project) => p.name;

/** Rebuild the <ul class="nav"> list in every page to match page order. */
export function syncNav(p: Project): Project {
  const items = p.pages.map((f) => ({ file: f, title: titleOf(p.files[f] ?? "") || f.replace(".html", "") }));
  const list = items.map((i) => `      <li><a href="${i.file}">${i.title.replace(/</g, "&lt;")}</a></li>`).join("\n");
  const files = { ...p.files };
  for (const f of p.pages) files[f] = (files[f] ?? "").replace(/(<ul class="nav"[^>]*>)[\s\S]*?(\s*<\/ul>)/, `$1\n${list}$2`);
  return { ...p, files };
}

export function addPage(p: Project, name: string, title?: string): Project {
  const file = normalizePageName(name);
  if (p.files[file] !== undefined) throw new Error(`A file named ${file} already exists.`);
  const t = title?.trim() || file.replace(".html", "").replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const nav = navHtml(siteNameOf(p), [...p.pages.map((f) => ({ file: f, title: titleOf(p.files[f]) || f })), { file, title: t }]);
  const html = pageHtml(siteNameOf(p), t, nav, `<section class="section">\n  <div class="container">\n    <h1>${t.replace(/</g, "&lt;")}</h1>\n    <p>New page.</p>\n  </div>\n</section>`);
  return touch(syncNav({ ...p, pages: [...p.pages, file], files: { ...p.files, [file]: html } }));
}

export function renamePage(p: Project, from: string, toName: string): Project {
  const to = normalizePageName(toName);
  if (from === to) return p;
  if (from === "index.html") throw new Error("The homepage must stay index.html. Set another page as homepage first.");
  if (p.files[to] !== undefined) throw new Error(`A file named ${to} already exists.`);
  const files = rewriteLinks({ ...p.files }, from, to);
  files[to] = files[from]; delete files[from];
  return touch({ ...p, files, pages: p.pages.map((x) => (x === from ? to : x)) });
}

export function setPageTitle(p: Project, file: string, title: string): Project {
  const files = { ...p.files, [file]: p.files[file].replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/</g, "&lt;")} · ${p.name.replace(/</g, "&lt;")}</title>`) };
  return touch(syncNav({ ...p, files }));
}

export function duplicatePage(p: Project, file: string): Project {
  const base = file.replace(".html", "");
  let n = 2, name = `${base}-copy.html`;
  while (p.files[name] !== undefined) name = `${base}-copy-${n++}.html`;
  const pages = [...p.pages]; pages.splice(pages.indexOf(file) + 1, 0, name);
  return touch(syncNav({ ...p, pages, files: { ...p.files, [name]: p.files[file] } }));
}

export function deletePage(p: Project, file: string): Project {
  if (p.pages.length <= 1) throw new Error("A project needs at least one page.");
  if (file === "index.html") throw new Error("You can’t delete the homepage. Set another page as homepage first.");
  const files = { ...p.files }; delete files[file];
  return touch(syncNav({ ...p, files, pages: p.pages.filter((x) => x !== file) }));
}

export function movePage(p: Project, file: string, dir: -1 | 1): Project {
  const pages = [...p.pages]; const i = pages.indexOf(file); const j = i + dir;
  if (i < 0 || j < 0 || j >= pages.length) return p;
  [pages[i], pages[j]] = [pages[j], pages[i]];
  return touch(syncNav({ ...p, pages }));
}

/** Make `file` the homepage: it becomes index.html, and the old index.html takes its name. Links are updated. */
export function setHomepage(p: Project, file: string): Project {
  if (file === "index.html") return p;
  const tmp = "__goai_tmp__.html";
  let files = rewriteLinks({ ...p.files }, "index.html", tmp);
  files = rewriteLinks(files, file, "index.html");
  files = rewriteLinks(files, tmp, file);
  const oldIndex = files["index.html"]; files["index.html"] = files[file]; files[file] = oldIndex;
  const pages = p.pages.map((x) => (x === file ? "index.html" : x === "index.html" ? file : x));
  const hi = pages.indexOf("index.html"); pages.splice(hi, 1); pages.unshift("index.html");
  return touch(syncNav({ ...p, files, pages }));
}

/* ---- Theme variables in styles.css ---- */
export const THEME_KEYS = ["primary", "bg", "text", "surface", "font", "radius", "space"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];
export function readTheme(css: string): Partial<Record<ThemeKey, string>> {
  const root = /:root\s*{([^}]*)}/.exec(css)?.[1] ?? "";
  const out: Partial<Record<ThemeKey, string>> = {};
  for (const k of THEME_KEYS) { const m = new RegExp(`--${k}\\s*:\\s*([^;]+);`).exec(root); if (m) out[k] = m[1].trim(); }
  return out;
}
export function writeTheme(css: string, key: ThemeKey, value: string): string {
  const v = value.replace(/[;{}<>]/g, "").trim();
  if (!/:root\s*{/.test(css)) return `:root {\n  --${key}: ${v};\n}\n` + css;
  return css.replace(/:root\s*{([^}]*)}/, (all, body: string) => {
    const re = new RegExp(`(--${key}\\s*:\\s*)([^;]+)(;)`);
    return re.test(body) ? `:root {${body.replace(re, `$1${v}$3`)}}` : `:root {${body.replace(/\s*$/, "")}\n  --${key}: ${v};\n}`;
  });
}

/* ---- Bounded undo/redo ---- */
export class History<T> {
  private past: T[] = []; private future: T[] = [];
  constructor(private limit = 50) {}
  push(prev: T) { this.past.push(prev); if (this.past.length > this.limit) this.past.shift(); this.future = []; }
  undo(cur: T): T | undefined { const p = this.past.pop(); if (p !== undefined) this.future.push(cur); return p; }
  redo(cur: T): T | undefined { const f = this.future.pop(); if (f !== undefined) this.past.push(cur); return f; }
  get canUndo() { return this.past.length > 0; } get canRedo() { return this.future.length > 0; }
  get size() { return this.past.length; }
}
