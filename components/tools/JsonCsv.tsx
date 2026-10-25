"use client";
import { useState } from "react";
import { jsonToCsv, csvToJson } from "@/lib/csv";
import { CopyButton, download, Chip } from "../ui";
const SAMPLE_J = '[\n  {"id": 1, "name": "Ada, Countess", "note": "said \\"hi\\"", "address": {"city": "London"}},\n  {"id": 2, "name": "Linus", "note": "multi\\nline"}\n]';
export default function JsonCsv() {
  const [dir, setDir] = useState<"j2c" | "c2j">("j2c");
  const [input, setInput] = useState(SAMPLE_J);
  const [delim, setDelim] = useState(",");
  const [infer, setInfer] = useState(true);
  let output = "", error = "", notes: string[] = [];
  if (input.trim()) {
    try {
      if (dir === "j2c") { const r = jsonToCsv(input, delim); output = r.csv; notes = r.notes; }
      else output = csvToJson(input, delim, infer);
    } catch (e) { error = e instanceof Error ? e.message : String(e); }
  }
  const swap = (d: "j2c" | "c2j") => { if (d !== dir) { setDir(d); setInput(output || ""); } };
  return (
    <div className="tool-panel">
      <div className="toolbar">
        <Chip on={dir === "j2c"} onClick={() => swap("j2c")}>JSON → CSV</Chip><Chip on={dir === "c2j"} onClick={() => swap("c2j")}>CSV → JSON</Chip>
        <label className="label" style={{ display: "flex", gap: 6, alignItems: "center" }}>Delimiter
          <select value={delim} onChange={(e) => setDelim(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}><option value=",">Comma</option><option value=";">Semicolon</option><option value={"\t"}>Tab</option></select></label>
        {dir === "c2j" && <label><input type="checkbox" checked={infer} onChange={(e) => setInfer(e.target.checked)} /> Detect numbers & booleans</label>}
        <button className="btn btn-ghost btn-sm" onClick={() => setInput("")}>Clear</button>
      </div>
      <div className="two-col">
        <div className="field"><label htmlFor="cv-in">{dir === "j2c" ? "JSON input" : "CSV input"}</label><textarea id="cv-in" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} /></div>
        <div className="field"><span className="label">{dir === "j2c" ? "CSV output" : "JSON output"}</span><pre className="output" style={{ minHeight: 240 }}>{output}</pre>
          <div className="toolbar"><CopyButton text={output} /><button className="btn btn-ghost btn-sm" disabled={!output} onClick={() => dir === "j2c" ? download("data.csv", "\ufeff" + output, "text/csv") : download("data.json", output, "application/json")}>Download</button></div></div>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notes.map((n) => <div key={n} className="alert alert-info">{n}</div>)}
      <p className="note">JSON → CSV expects an array of objects. Nested objects and arrays are flattened into dot-notation columns (e.g. <code>address.city</code>, <code>tags.0</code>). Cells containing the delimiter, quotes or line breaks are quoted per RFC 4180. CSV → JSON uses the first row as headers.</p>
    </div>
  );
}
