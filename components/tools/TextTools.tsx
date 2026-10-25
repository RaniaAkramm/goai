"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { stats, transforms, type TransformKey } from "@/lib/text";
import { CopyButton } from "../ui";
const ACTIONS: [TransformKey, string][] = [["upper", "UPPERCASE"], ["lower", "lowercase"], ["title", "Title Case"], ["sentence", "Sentence case"], ["camel", "camelCase"], ["pascal", "PascalCase"], ["snake", "snake_case"], ["kebab", "kebab-case"], ["collapseSpaces", "Remove extra spaces"], ["trimLines", "Trim lines"], ["removeEmptyLines", "Remove empty lines"], ["reverse", "Reverse"]];
export default function TextTools() {
  const [t, setT] = useState("  Hello   world!  This is   GoAI.foo.\n\n\n  Unicode-safe: café, 東京, 👩‍💻  ");
  const [hist, setHist] = useState<string[]>([]);
  const dt = useDeferredValue(t);
  const s = useMemo(() => stats(dt), [dt]);
  const apply = (k: TransformKey) => { setHist((h) => [...h.slice(-49), t]); setT(transforms[k](t)); };
  return (
    <div className="tool-panel">
      <div className="stat-grid" aria-live="polite">
        {[["Words", s.words], ["Characters", s.characters], ["No spaces", s.charactersNoSpaces], ["Lines", s.lines], ["UTF-8 bytes", s.bytes]].map(([l, v]) => <div key={l as string} className="stat"><b>{(v as number).toLocaleString()}</b><span>{l}</span></div>)}
      </div>
      <div className="toolbar">{ACTIONS.map(([k, l]) => <button key={k} className="chip" onClick={() => apply(k)}>{l}</button>)}</div>
      <div className="field"><label htmlFor="tt">Text</label><textarea id="tt" value={t} onChange={(e) => setT(e.target.value)} /></div>
      <div className="toolbar"><CopyButton text={t} /><button className="btn btn-ghost btn-sm" disabled={!hist.length} onClick={() => { setT(hist[hist.length - 1]); setHist((h) => h.slice(0, -1)); }}>Undo</button><button className="btn btn-ghost btn-sm" onClick={() => { setHist((h) => [...h, t]); setT(""); }}>Clear</button></div>
      <p className="note">Characters are counted as user-perceived characters (grapheme clusters), so 👩‍💻 counts as one.</p>
    </div>
  );
}
