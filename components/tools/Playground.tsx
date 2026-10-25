"use client";
import { useEffect, useState } from "react";
import { buildDocument } from "@/lib/playground";
import { CopyButton, download, Chip } from "../ui";
const DEF = {
  html: '<main class="box">\n  <h1>Hello, GoAI.foo</h1>\n  <button id="btn">Click me</button>\n  <p id="out"></p>\n</main>',
  css: "body { font-family: system-ui, sans-serif; background: #f4f5f2; }\n.box { padding: 24px; }\nbutton { background: #c8f135; border: 0; padding: 10px 20px; border-radius: 99px; font-weight: 700; }",
  js: "let n = 0;\ndocument.getElementById('btn').addEventListener('click', () => {\n  document.getElementById('out').textContent = `Clicked ${++n} time(s)`;\n});",
};
type Key = keyof typeof DEF;
export default function Playground() {
  const [code, setCode] = useState(DEF);
  const [tab, setTab] = useState<Key>("html");
  const [doc, setDoc] = useState(() => buildDocument(DEF.html, DEF.css, DEF.js));
  const [auto, setAuto] = useState(true);
  useEffect(() => { if (!auto) return; const t = setTimeout(() => setDoc(buildDocument(code.html, code.css, code.js)), 400); return () => clearTimeout(t); }, [code, auto]);
  const full = buildDocument(code.html, code.css, code.js);
  return (
    <div className="tool-panel">
      <div className="toolbar" role="tablist" aria-label="Editor">
        {(["html", "css", "js"] as Key[]).map((k) => <Chip key={k} on={tab === k} onClick={() => setTab(k)}>{k.toUpperCase()}</Chip>)}
        <label><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-run</label>
        <button className="btn btn-dark btn-sm" onClick={() => setDoc(buildDocument(code.html, code.css, code.js) + `<!-- ${Date.now()} -->`)}>Run ▶</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm("Reset all three editors to the example?")) setCode(DEF); }}>Reset</button>
        <CopyButton text={full} label="Copy HTML" />
        <button className="btn btn-ghost btn-sm" onClick={() => download("playground.html", full, "text/html")}>Download .html</button>
      </div>
      <div className="two-col">
        <div className="field"><label htmlFor="pg-ed">{tab.toUpperCase()} editor</label>
          <textarea id="pg-ed" value={code[tab]} spellCheck={false} style={{ minHeight: 420 }}
            onKeyDown={(e) => { if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); const t = e.currentTarget; const s = t.selectionStart; const v = t.value.slice(0, s) + "  " + t.value.slice(t.selectionEnd); setCode({ ...code, [tab]: v }); requestAnimationFrame(() => t.setSelectionRange(s + 2, s + 2)); } }}
            onChange={(e) => setCode({ ...code, [tab]: e.target.value })} /></div>
        <div className="field"><span className="label">Preview (sandboxed)</span>
          <iframe title="Preview" className="preview-frame" style={{ height: 420 }} sandbox="allow-scripts" srcDoc={doc} referrerPolicy="no-referrer" /></div>
      </div>
      <p className="note">The preview runs in an isolated iframe with <code>sandbox=&quot;allow-scripts&quot;</code> only (no same-origin access) and a Content-Security-Policy that blocks network requests, so your code can’t read this site’s data or call external servers. Press Tab to indent.</p>
    </div>
  );
}
