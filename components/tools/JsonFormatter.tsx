"use client";
import { useEffect, useRef, useState } from "react";
import type { JsonResult } from "@/lib/json";
import { CopyButton, download } from "../ui";

const SAMPLE = '{"name":"GoAI.foo","tools":8,"local":true,"tags":["json","csv"],"nested":{"ok":null}}';
export default function JsonFormatter() {
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [indent, setIndent] = useState("2");
  const [res, setRes] = useState<JsonResult | null>(null);
  const [busy, setBusy] = useState(false);
  const w = useRef<Worker | null>(null); const idRef = useRef(0); const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    w.current = new Worker(new URL("../../workers/json.worker.ts", import.meta.url));
    w.current.onmessage = (e) => { if (e.data.id === idRef.current) { setRes(e.data.result); setBusy(false); } };
    return () => w.current?.terminate();
  }, []);
  useEffect(() => {
    if (!input.trim()) { setRes(null); return; }
    const t = setTimeout(() => { setBusy(true); w.current?.postMessage({ id: ++idRef.current, text: input, mode, indent: indent === "tab" ? "\t" : Number(indent) }); }, input.length > 200000 ? 600 : 200);
    return () => clearTimeout(t);
  }, [input, mode, indent]);
  const jump = () => { if (res && !res.ok && res.position !== undefined && ta.current) { ta.current.focus(); ta.current.setSelectionRange(res.position, res.position + 1); } };
  const out = res?.ok ? res.output : "";
  return (
    <div className="tool-panel">
      <div className="toolbar" role="group" aria-label="Mode">
        <button className="chip" aria-pressed={mode === "format"} onClick={() => setMode("format")}>Format</button>
        <button className="chip" aria-pressed={mode === "minify"} onClick={() => setMode("minify")}>Minify</button>
        {mode === "format" && <label className="label" style={{ display: "flex", gap: 6, alignItems: "center" }}>Indent
          <select value={indent} onChange={(e) => setIndent(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option></select></label>}
        <button className="btn btn-ghost btn-sm" onClick={() => setInput("")}>Clear</button>
      </div>
      <div className="two-col">
        <div className="field"><label htmlFor="json-in">Input JSON</label><textarea id="json-in" ref={ta} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} aria-invalid={res ? !res.ok : undefined} /></div>
        <div className="field"><span className="label">Output {busy && <span className="muted">(processing…)</span>}</span><pre className="output" style={{ minHeight: 240 }} aria-live="polite">{out}</pre>
          <div className="toolbar"><CopyButton text={out} /><button className="btn btn-ghost btn-sm" disabled={!out} onClick={() => download("formatted.json", out, "application/json")}>Download</button></div></div>
      </div>
      {res && !res.ok && <div className="alert alert-error" role="alert">Invalid JSON: {res.error} {res.position !== undefined && <button className="btn btn-sm btn-ghost" onClick={jump}>Jump to error</button>}</div>}
      {res?.ok && <div className="alert alert-ok">Valid JSON · {out.length.toLocaleString()} characters</div>}
      <p className="note">Parsing runs in a background Web Worker so large inputs don’t freeze the page.</p>
    </div>
  );
}
