import type { Project } from "./types";
export type CheckReport = { errors: string[]; warnings: string[]; passed: string[] };

function cssBalanced(css: string) {
  const s = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "");
  let d = 0; for (const c of s) { if (c === "{") d++; else if (c === "}") { d--; if (d < 0) return false; } } return d === 0;
}

export function checkProject(p: Project, opts: { jsSyntax?: (code: string) => string | null } = {}): CheckReport {
  const r: CheckReport = { errors: [], warnings: [], passed: [] };
  const files = p.files;
  const assetNames = new Set(p.assets.map((a) => `assets/${a.name}`));
  if (files["index.html"] === undefined) r.errors.push("Missing index.html — the site has no homepage.");
  else r.passed.push("index.html homepage exists");
  for (const f of p.pages) if (files[f] === undefined) r.errors.push(`Page list references ${f}, but the file is missing.`);
  let linkIssues = 0, assetIssues = 0, metaIssues = 0;
  for (const [name, html] of Object.entries(files)) {
    if (!name.endsWith(".html")) continue;
    if (!/^\s*<!doctype html>/i.test(html)) { r.warnings.push(`${name}: missing <!DOCTYPE html>.`); metaIssues++; }
    if (!/<title>[^<]+<\/title>/i.test(html)) { r.warnings.push(`${name}: missing or empty <title>.`); metaIssues++; }
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) { r.warnings.push(`${name}: missing viewport meta tag (mobile layout may break).`); metaIssues++; }
    if (!/<html[^>]+lang=/i.test(html)) { r.warnings.push(`${name}: <html> has no lang attribute.`); metaIssues++; }
    for (const m of html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)) { r.warnings.push(`${name}: an image has no alt text (${m[0].slice(0, 60)}…).`); metaIssues++; }
    for (const m of html.matchAll(/\b(href|src)=["']([^"']+)["']/gi)) {
      const url = m[2].split(/[?#]/)[0];
      if (!url || /^(https?:|mailto:|tel:|data:|#|\/\/|javascript:)/i.test(m[2]) || url.startsWith("/")) continue;
      const path = url.replace(/^\.\//, "");
      if (path.startsWith("assets/")) { if (!assetNames.has(decodeURI(path))) { r.errors.push(`${name}: references missing asset ${path}.`); assetIssues++; } }
      else if (files[path] === undefined) { r.warnings.push(`${name}: link/reference to ${path} not found in project.`); linkIssues++; }
    }
    if (/<script\b[^>]*>\s*[^<\s]/i.test(html) && /on\w+=/i.test(html)) r.warnings.push(`${name}: contains inline event handlers; consider moving JS to script.js.`);
  }
  if (!linkIssues) r.passed.push("All local page links point to existing files");
  if (!assetIssues) r.passed.push("All assets/ references exist in the asset library");
  if (!metaIssues) r.passed.push("Every page has doctype, title, viewport, lang and image alt text");
  for (const [name, css] of Object.entries(files)) if (name.endsWith(".css")) {
    if (cssBalanced(css)) r.passed.push(`${name}: braces are balanced`); else r.errors.push(`${name}: unbalanced { } braces — styles after the error may not apply.`);
  }
  if (opts.jsSyntax) for (const [name, js] of Object.entries(files)) if (name.endsWith(".js")) {
    const e = opts.jsSyntax(js);
    if (e) r.errors.push(`${name}: JavaScript syntax error — ${e}`); else r.passed.push(`${name}: JavaScript parses without syntax errors`);
  }
  if (p.backend) r.warnings.push("Backend scaffold (Express + SQLite) is generated on export; it is not run or tested inside GoAI.foo. Follow the README to install and run it.");
  r.warnings.push("These are basic static checks only. They do not test behavior, accessibility in depth, or security.");
  return r;
}

/** Browser-side JS syntax check: compiles without running (Function constructor never executes the body here). */
export function jsSyntaxCheck(code: string): string | null {
  try { new Function(code); return null; } catch (e) { return e instanceof Error ? e.message : String(e); }
}
