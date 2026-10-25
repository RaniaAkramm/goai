"use client";
import { useEffect, useRef, useState } from "react";
import type { RegexResult } from "@/lib/regex";
const TIMEOUT = 1500;
export default function RegexTester() {
  const [pattern, setPattern] = useState("(?<user>[\\w.]+)@(?<domain>[\\w-]+\\.\\w+)");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("Contact ada@example.com or linus@kernel.org for details.");
  const [res, setRes] = useState<RegexResult | null>(null);
  const [status, setStatus] = useState("");
  const w = useRef<Worker | null>(null); const id = useRef(0); const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const spawn = () => {
    w.current?.terminate();
    w.current = new Worker(new URL("../../workers/regex.worker.ts", import.meta.url));
    w.current.onmessage = (e) => { if (e.data.id === id.current) { clearTimeout(timer.current); setRes(e.data.result); setStatus(""); } };
  };
  useEffect(() => { spawn(); return () => w.current?.terminate(); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!pattern) { setRes(null); return; }
      const my = ++id.current; setStatus("Running…");
      w.current?.postMessage({ id: my, pattern, flags, text });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { if (id.current === my) { spawn(); setRes(null); setStatus(`Stopped after ${TIMEOUT / 1000}s — the pattern is probably causing catastrophic backtracking. Try a less ambiguous pattern.`); } }, TIMEOUT);
    }, 200);
    return () => clearTimeout(t);
  }, [pattern, flags, text]);
  const toggle = (f: string) => setFlags((x) => (x.includes(f) ? x.replace(f, "") : x + f));
  const parts: React.ReactNode[] = [];
  if (res?.ok) { let last = 0; res.matches.forEach((m, i) => { if (m.index < last) return; parts.push(text.slice(last, m.index)); parts.push(<mark key={i} className={`m${i % 2 ? " alt" : ""}`}>{m.text || "\u200b"}</mark>); last = m.end; }); parts.push(text.slice(last)); }
  return (
    <div className="tool-panel">
      <div className="field"><label htmlFor="rx">Pattern</label>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)" }}>/<input id="rx" type="text" value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} style={{ fontFamily: "var(--mono)" }} />/{flags}</div></div>
      <div className="toolbar" aria-label="Flags">
        {[["g", "global"], ["i", "ignore case"], ["m", "multiline"], ["s", "dotAll"], ["u", "unicode"], ["y", "sticky"]].map(([f, l]) => <button key={f} className="chip" aria-pressed={flags.includes(f)} onClick={() => toggle(f)}><code>{f}</code> {l}</button>)}
      </div>
      <div className="field"><label htmlFor="rx-t">Test text</label><textarea id="rx-t" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 160 }} /></div>
      {status && <div className={`alert ${status.startsWith("Stopped") ? "alert-error" : "alert-info"}`} role="status">{status}</div>}
      {res && !res.ok && <div className="alert alert-error" role="alert">Invalid pattern: {res.error}</div>}
      {res?.ok && <>
        <p className="label" style={{ marginTop: 14 }}>{res.matches.length} match{res.matches.length === 1 ? "" : "es"}{res.truncated ? " (showing first 5,000)" : ""}</p>
        <pre className="output">{parts}</pre>
        {res.matches.length > 0 && <div className="diff-wrap" style={{ marginTop: 12 }}><table className="diff-table"><thead><tr><td className="n">#</td><td>Match</td><td>Index</td><td>Groups</td></tr></thead><tbody>
          {res.matches.slice(0, 200).map((m, i) => <tr key={i}><td className="n">{i + 1}</td><td>{m.text}</td><td>{m.index}</td><td>{m.groups.map((g, j) => <div key={j}>${j + 1}{m.named && Object.entries(m.named).find(([, v]) => v === g) ? ` (${Object.entries(m.named).find(([, v]) => v === g)![0]})` : ""}: {g ?? <em className="muted">undefined</em>}</div>)}</td></tr>)}
        </tbody></table></div>}
      </>}
      <p className="note">Uses your browser’s JavaScript RegExp engine in a Web Worker. If a pattern runs longer than {TIMEOUT / 1000}s, the worker is stopped so the page stays responsive.</p>
    </div>
  );
}
