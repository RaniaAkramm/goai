export type Row = Record<string, unknown>;

function escapeCell(v: string, delim: string) {
  return /["\r\n]/.test(v) || v.includes(delim) || /^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function flatten(obj: unknown, prefix = "", out: Record<string, string> = {}, notes?: Set<string>) {
  if (obj !== null && typeof obj === "object") {
    const entries = Array.isArray(obj) ? obj.map((v, i) => [String(i), v] as const) : Object.entries(obj as object);
    if (entries.length === 0) { out[prefix] = Array.isArray(obj) ? "[]" : "{}"; return out; }
    if (prefix && notes) notes.add(prefix);
    for (const [k, v] of entries) flatten(v, prefix ? `${prefix}.${k}` : k, out, notes);
  } else out[prefix] = obj === null || obj === undefined ? "" : String(obj);
  return out;
}

export function jsonToCsv(text: string, delim = ","): { csv: string; notes: string[] } {
  const data = JSON.parse(text);
  let rows: unknown[];
  if (Array.isArray(data)) rows = data;
  else if (data && typeof data === "object") rows = [data];
  else throw new Error("JSON must be an array of objects (or a single object) to convert to CSV.");
  const notes = new Set<string>();
  const flat = rows.map((r, i) => {
    if (r === null || typeof r !== "object" || Array.isArray(r)) {
      notes.add(`__row${i}`);
      return { value: r === null ? "" : typeof r === "object" ? JSON.stringify(r) : String(r) };
    }
    return flatten(r, "", {}, notes);
  });
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const f of flat) for (const k of Object.keys(f)) if (!seen.has(k)) { seen.add(k); headers.push(k); }
  const lines = [headers.map((h) => escapeCell(h, delim)).join(delim)];
  for (const f of flat) lines.push(headers.map((h) => escapeCell((f as Record<string, string>)[h] ?? "", delim)).join(delim));
  const msgs: string[] = [];
  const nested = [...notes].filter((n) => !n.startsWith("__row"));
  if (nested.length) msgs.push(`Nested objects/arrays were flattened using dot notation (e.g. ${nested.slice(0, 3).join(", ")}).`);
  if ([...notes].some((n) => n.startsWith("__row"))) msgs.push("Some array items were not objects; they were placed in a \"value\" column.");
  return { csv: lines.join("\r\n"), notes: msgs };
}

export function parseCsv(text: string, delim = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", inQ = false, i = 0, quotedCell = false;
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  for (; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += c;
    } else if (c === '"' && cell === "" && !quotedCell) { inQ = true; quotedCell = true; }
    else if (c === delim) { row.push(cell); cell = ""; quotedCell = false; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = ""; quotedCell = false;
    } else cell += c;
  }
  if (inQ) throw new Error("Unterminated quoted field: a cell opened with \" was never closed.");
  if (cell !== "" || row.length || quotedCell) { row.push(cell); rows.push(row); }
  return rows;
}

export function csvToJson(text: string, delim = ",", inferTypes = false): string {
  const rows = parseCsv(text, delim);
  if (!rows.length) return "[]";
  const [head, ...body] = rows;
  const conv = (v: string): unknown => {
    if (!inferTypes) return v;
    if (v === "true") return true; if (v === "false") return false; if (v === "null") return null;
    if (v.trim() !== "" && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(v)) return Number(v);
    return v;
  };
  const out = body.filter((r) => !(r.length === 1 && r[0] === "")).map((r) => {
    const o: Record<string, unknown> = {};
    head.forEach((h, i) => (o[h || `column${i + 1}`] = conv(r[i] ?? "")));
    return o;
  });
  return JSON.stringify(out, null, 2);
}
