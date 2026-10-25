export type JsonResult =
  | { ok: true; output: string }
  | { ok: false; error: string; line?: number; column?: number; position?: number };

export function positionToLineCol(text: string, pos: number) {
  let line = 1, col = 1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === "\n") { line++; col = 1; } else col++;
  }
  return { line, column: col };
}

function extractPos(msg: string, text: string): number | undefined {
  const m = /position (\d+)/i.exec(msg);
  if (m) return Number(m[1]);
  const lc = /line (\d+) column (\d+)/i.exec(msg);
  if (lc) {
    const lines = text.split("\n");
    let p = 0;
    for (let i = 0; i < Number(lc[1]) - 1; i++) p += lines[i].length + 1;
    return p + Number(lc[2]) - 1;
  }
  return locateError(text);
}

/** Minimal JSON scanner that returns the index of the first syntax error (engine messages differ across browsers). */
export function locateError(t: string): number | undefined {
  let i = 0;
  const ws = () => { while (i < t.length && " \t\n\r".includes(t[i])) i++; };
  const fail = (): never => { throw i; };
  const value = (): void => {
    ws();
    const c = t[i];
    if (c === "{") { i++; ws(); if (t[i] === "}") { i++; return; }
      for (;;) { ws(); if (t[i] !== '"') fail(); str(); ws(); if (t[i] !== ":") fail(); i++; value(); ws();
        if (t[i] === ",") { i++; continue; } if (t[i] === "}") { i++; return; } fail(); } }
    if (c === "[") { i++; ws(); if (t[i] === "]") { i++; return; }
      for (;;) { value(); ws(); if (t[i] === ",") { i++; continue; } if (t[i] === "]") { i++; return; } fail(); } }
    if (c === '"') return str();
    for (const lit of ["true", "false", "null"]) if (t.startsWith(lit, i)) { i += lit.length; return; }
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(t.slice(i, i + 400));
    if (m && m[0]) { i += m[0].length; return; }
    fail();
  };
  const str = () => { i++; while (i < t.length) { const c = t[i];
      if (c === '"') { i++; return; }
      if (c === "\\") { i++; if (t[i] === "u") { if (!/^[0-9a-fA-F]{4}$/.test(t.slice(i + 1, i + 5))) fail(); i += 5; continue; }
        if (!'"\\/bfnrt'.includes(t[i] ?? "x")) fail(); i++; continue; }
      if (c < " ") fail(); i++; }
    fail(); };
  try { value(); ws(); if (i < t.length) return i; return undefined; } catch (p) { return typeof p === "number" ? Math.min(p, t.length) : undefined; }
}

export function processJson(text: string, mode: "format" | "minify", indent: number | string = 2): JsonResult {
  if (!text.trim()) return { ok: false, error: "Input is empty." };
  try {
    const v = JSON.parse(text);
    return { ok: true, output: mode === "minify" ? JSON.stringify(v) : JSON.stringify(v, null, indent) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const pos = extractPos(msg, text);
    if (pos === undefined) return { ok: false, error: msg };
    const { line, column } = positionToLineCol(text, pos);
    return { ok: false, error: `${msg} (line ${line}, column ${column})`, line, column, position: pos };
  }
}
