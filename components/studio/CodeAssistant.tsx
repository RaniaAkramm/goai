"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useStudio } from "./StudioProvider";
import { ModelBar } from "./ModelBar";
import { Chip, CopyButton } from "@/components/ui";
import { CODE_ACTIONS, codeMessages, extractCode, type CodeAction } from "@/lib/studio/prompts";
import { renderMarkdown } from "@/lib/studio/markdown";
const CodeEditor = dynamic(() => import("@/components/builder/CodeEditor"), { ssr: false, loading: () => <div className="cm-host" aria-busy="true" /> });

const LANGS: [string, string][] = [["JavaScript", "js"], ["TypeScript", "ts"], ["Python", "js"], ["HTML", "html"], ["CSS", "css"], ["JSON", "json"], ["SQL", "js"], ["Java", "js"], ["Go", "js"], ["PHP", "js"]];
const SAMPLE = `function average(nums) {\n  let total = 0;\n  for (let i = 0; i <= nums.length; i++) {\n    total += nums[i];\n  }\n  return total / nums.length;\n}`;

export default function CodeAssistant() {
  const { engines, load } = useStudio();
  const [model, setModel] = useState("");
  const [action, setAction] = useState<CodeAction>("explain");
  const [lang, setLang] = useState("JavaScript");
  const [target, setTarget] = useState("Python");
  const [code, setCode] = useState(SAMPLE);
  const [rev, setRev] = useState(0);
  const [instr, setInstr] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const abort = useRef<AbortController | null>(null);
  const ext = LANGS.find((l) => l[0] === lang)?.[1] ?? "js";
  const run = async () => {
    setErr(""); setOut(""); setBusy(true);
    const eng = engines[model] ?? await load(model);
    if (!eng) { setBusy(false); setErr("Load a model first."); return; }
    abort.current = new AbortController();
    try { track("studio_message", { app: "code", action }); await eng.generate(codeMessages(action, lang, action === "write" ? "" : code, instr, target), { onToken: setOut, signal: abort.current.signal, temperature: 0.2 }); }
    catch (e) { setErr("Generation failed: " + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  };
  const result = extractCode(out);
  const hasCode = /```/.test(out);
  return (
    <div className="st-two">
      <section className="tool-panel">
        <ModelBar task="code" value={model} onChange={setModel} />
        <div className="chips" role="group" aria-label="Action" style={{ margin: "12px 0" }}>{CODE_ACTIONS.map((a) => <Chip key={a.id} on={action === a.id} onClick={() => setAction(a.id)}>{a.label}</Chip>)}</div>
        <p className="st-hint">{CODE_ACTIONS.find((a) => a.id === action)?.hint}</p>
        <div className="st-row">
          <div className="field"><label htmlFor="code-lang">Language</label><select id="code-lang" value={lang} onChange={(e) => { setLang(e.target.value); setRev((r) => r + 1); }}>{LANGS.map(([l]) => <option key={l}>{l}</option>)}</select></div>
          {action === "convert" && <div className="field"><label htmlFor="code-target">Convert to</label><select id="code-target" value={target} onChange={(e) => setTarget(e.target.value)}>{LANGS.map(([l]) => <option key={l}>{l}</option>)}</select></div>}
        </div>
        {action !== "write" && <div className="field" style={{ marginTop: 10 }}><span className="label">Your code</span><CodeEditor key={ext} file={`snippet.${ext}`} value={code} onChange={setCode} revision={rev} /></div>}
        <div className="field" style={{ marginTop: 10 }}><label htmlFor="code-instr">{action === "write" ? "Describe what the code should do" : "Extra instructions (optional)"}</label><textarea id="code-instr" rows={action === "write" ? 4 : 2} value={instr} onChange={(e) => setInstr(e.target.value)} placeholder={action === "write" ? "e.g. A function that validates an email address and returns true/false" : "e.g. Keep it ES5 compatible"} /></div>
        <div className="toolbar">
          {busy ? <button className="btn btn-outline" onClick={() => abort.current?.abort()}>Stop</button> : <button className="btn btn-dark" onClick={run} disabled={action === "write" ? !instr.trim() : !code.trim()}>Run {CODE_ACTIONS.find((a) => a.id === action)?.label}</button>}
          <button className="btn btn-ghost btn-sm" onClick={() => { setCode(SAMPLE); setRev((r) => r + 1); }}>Load buggy sample</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
      </section>
      <section className="tool-panel st-output" aria-live="polite">
        <div className="toolbar" style={{ marginTop: 0, justifyContent: "space-between" }}><h2 style={{ fontSize: "1.2rem", margin: 0 }}>Result</h2>
          <div className="toolbar" style={{ margin: 0 }}><CopyButton text={out} label="Copy answer" />{hasCode && <CopyButton text={result} label="Copy code" />}{hasCode && action !== "explain" && action !== "review" && <button className="btn btn-ghost btn-sm" onClick={() => { setCode(result); setRev((r) => r + 1); }}>Use in editor</button>}</div></div>
        {out ? <div className="st-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(out) }} /> : <p className="muted">{busy ? "Thinking…" : "Your answer will stream here. Code never leaves your device."}</p>}
      </section>
    </div>
  );
}
