"use client";
import { useEffect, useState } from "react";
import { ALGOS, hashText, hashBytes, type Algo } from "@/lib/hash";
import { CopyButton, Chip } from "../ui";
const MAX = 200 * 1024 * 1024;
export default function HashTool() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("hello world");
  const [upper, setUpper] = useState(false);
  const [out, setOut] = useState<Record<string, string>>({});
  const [err, setErr] = useState(""); const [fname, setFname] = useState("");
  useEffect(() => {
    if (mode !== "text") return;
    let live = true;
    Promise.all(ALGOS.map(async (a) => [a, await hashText(text, a)] as const)).then((r) => live && setOut(Object.fromEntries(r))).catch((e) => setErr(String(e)));
    return () => { live = false; };
  }, [text, mode]);
  const onFile = async (f?: File) => {
    setErr(""); setOut({}); if (!f) return;
    if (f.size > MAX) { setErr("File is larger than 200 MB; hashing it in the browser may run out of memory."); return; }
    setFname(`${f.name} (${f.size.toLocaleString()} bytes)`);
    const buf = await f.arrayBuffer();
    setOut(Object.fromEntries(await Promise.all(ALGOS.map(async (a: Algo) => [a, await hashBytes(buf, a)] as const))));
  };
  return (
    <div className="tool-panel">
      <div className="toolbar"><Chip on={mode === "text"} onClick={() => setMode("text")}>Text</Chip><Chip on={mode === "file"} onClick={() => { setMode("file"); setOut({}); }}>File</Chip>
        <label><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Uppercase hex</label></div>
      {mode === "text" ? <div className="field"><label htmlFor="h-in">Text (UTF-8)</label><textarea id="h-in" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 140 }} /></div>
        : <div className="field"><label htmlFor="h-f">Choose a file (read locally, never uploaded)</label><input id="h-f" type="file" onChange={(e) => onFile(e.target.files?.[0])} />{fname && <span className="muted">{fname}</span>}</div>}
      {err && <div className="alert alert-error">{err}</div>}
      <div style={{ marginTop: 12 }}>{ALGOS.map((a) => { const v = out[a] ? (upper ? out[a].toUpperCase() : out[a]) : ""; return <div key={a} className="hash-row"><b>{a}</b><code>{v || "—"}</code><CopyButton text={v} /></div>; })}</div>
      <p className="note">Computed with the browser’s built-in Web Crypto API (<code>crypto.subtle.digest</code>); no network requests. <strong>Hashing is not encryption</strong>: it is one-way, and plain SHA hashes are not suitable for storing passwords.</p>
    </div>
  );
}
