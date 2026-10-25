"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { diffLines, unifiedText, type Op } from "@/lib/diff";
import { CopyButton, Chip } from "../ui";
const Inline = ({ ops, kind }: { ops: Op[]; kind: "del" | "ins" }) => <>{ops.map((o, i) => o.type === "equal" ? <span key={i}>{o.value}</span> : kind === "del" ? <del key={i}>{o.value}</del> : <ins key={i}>{o.value}</ins>)}</>;
export default function DiffTool() {
  const [a, setA] = useState("function greet(name) {\n  return 'Hello ' + name;\n}\n\ngreet('world');");
  const [b, setB] = useState("function greet(name, punct = '!') {\n  return `Hello ${name}${punct}`;\n}\n\ngreet('world');\ngreet('GoAI');");
  const [view, setView] = useState<"split" | "unified">("split");
  const da = useDeferredValue(a), db = useDeferredValue(b);
  const tooBig = da.length + db.length > 2_000_000;
  const r = useMemo(() => (tooBig ? null : diffLines(da, db)), [da, db, tooBig]);
  return (
    <div className="tool-panel">
      <div className="two-col">
        <div className="field"><label htmlFor="d-a">Original</label><textarea id="d-a" value={a} onChange={(e) => setA(e.target.value)} spellCheck={false} style={{ minHeight: 180 }} /></div>
        <div className="field"><label htmlFor="d-b">Changed</label><textarea id="d-b" value={b} onChange={(e) => setB(e.target.value)} spellCheck={false} style={{ minHeight: 180 }} /></div>
      </div>
      <div className="toolbar">
        <Chip on={view === "split"} onClick={() => setView("split")}>Side by side</Chip><Chip on={view === "unified"} onClick={() => setView("unified")}>Unified</Chip>
        <button className="btn btn-ghost btn-sm" onClick={() => { setA(""); setB(""); }}>Clear</button>
        {r && <CopyButton text={unifiedText(r.rows)} label="Copy diff" />}
        {r && <span className="legend" aria-live="polite"><span style={{ color: "#2e7d32" }}>+{r.added} added</span><span style={{ color: "#c62828" }}>−{r.removed} removed</span></span>}
      </div>
      {tooBig && <div className="alert alert-error">Input is too large to diff in the browser (over 2 million characters).</div>}
      {r && (r.added + r.removed === 0 ? <div className="alert alert-ok">The texts are identical.</div> :
        <div className="diff-wrap"><table className="diff-table"><tbody>
          {view === "split" ? r.rows.map((x, i) => (
            <tr key={i}>
              <td className="n">{x.leftNo ?? ""}</td>
              <td className={x.type === "delete" || x.type === "change" ? "d-del" : ""}>{x.inline ? <Inline ops={x.inline.left} kind="del" /> : x.left}</td>
              <td className="n">{x.rightNo ?? ""}</td>
              <td className={x.type === "insert" || x.type === "change" ? "d-ins" : ""}>{x.inline ? <Inline ops={x.inline.right} kind="ins" /> : x.right}</td>
            </tr>)) :
            r.rows.flatMap((x, i) => {
              const L = (k: string, cls: string, sign: string, n: number | undefined, body: React.ReactNode) => <tr key={k} className={cls}><td className="n">{n ?? ""}</td><td style={{ width: "1.4em" }}>{sign}</td><td>{body}</td></tr>;
              if (x.type === "equal") return [L(`${i}`, "", " ", x.leftNo, x.left)];
              if (x.type === "delete") return [L(`${i}`, "d-del", "−", x.leftNo, x.left)];
              if (x.type === "insert") return [L(`${i}`, "d-ins", "+", x.rightNo, x.right)];
              return [L(`${i}a`, "d-del", "−", x.leftNo, <Inline ops={x.inline!.left} kind="del" />), L(`${i}b`, "d-ins", "+", x.rightNo, <Inline ops={x.inline!.right} kind="ins" />)];
            })}
        </tbody></table></div>)}
      <p className="note">Line-level diff (Myers algorithm) with word-level highlights inside changed lines. On small screens, use Unified view.</p>
    </div>
  );
}
