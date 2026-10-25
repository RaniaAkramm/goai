"use client";
import { useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useStudio } from "./StudioProvider";
import { ModelBar } from "./ModelBar";
import { Chip, CopyButton } from "@/components/ui";
import { TONES, textMessages, type TextAction } from "@/lib/studio/prompts";

const ACTIONS: { id: TextAction; label: string }[] = [{ id: "summarize", label: "Summarize" }, { id: "rewrite", label: "Rewrite" }, { id: "translate", label: "Translate to English" }, { id: "grammar", label: "Fix grammar" }, { id: "bullets", label: "Bullet notes" }];
const SAMPLE = "Remote work has changed how teams collaborate. Many companies now combine office days with flexible home days, which can improve focus and reduce commuting time. However, it also makes spontaneous conversations rarer, so teams need deliberate rituals like weekly demos and written updates to stay aligned.";

export default function TextTools() {
  const { engines, load, gpu } = useStudio();
  const [model, setModel] = useState("");
  const [action, setAction] = useState<TextAction>("summarize");
  const [tone, setTone] = useState<string>("Professional");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [useDedicated, setUseDedicated] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const dedicatedId = action === "summarize" ? "Xenova/distilbart-cnn-6-6" : action === "translate" ? "Xenova/opus-mt-mul-en" : "";
  const run = async () => {
    setErr(""); setOut(""); setBusy(true);
    try {
      track("studio_message", { app: "text", action });
      if (useDedicated && dedicatedId) {
        const eng = engines[dedicatedId] ?? await load(dedicatedId); if (!eng?.task) throw new Error("model not loaded");
        setOut(await eng.task(action === "summarize" ? "summarize" : "translate", text));
      } else {
        const eng = engines[model] ?? await load(model); if (!eng) throw new Error("load a model first");
        abort.current = new AbortController();
        await eng.generate(textMessages(action, text, tone), { onToken: setOut, signal: abort.current.signal, temperature: 0.3 });
      }
    } catch (e) { setErr("Failed: " + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  };
  const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
  return (
    <div className="st-two">
      <section className="tool-panel">
        {!useDedicated && <ModelBar task="text" value={model} onChange={setModel} />}
        <div className="chips" role="group" aria-label="Action" style={{ margin: "12px 0" }}>{ACTIONS.map((a) => <Chip key={a.id} on={action === a.id} onClick={() => setAction(a.id)}>{a.label}</Chip>)}</div>
        {action === "rewrite" && <div className="chips" role="group" aria-label="Tone" style={{ marginBottom: 10 }}>{TONES.map((t) => <Chip key={t} on={tone === t} onClick={() => setTone(t)}>{t}</Chip>)}</div>}
        {dedicatedId && <label className="st-check"><input type="checkbox" checked={useDedicated} onChange={(e) => setUseDedicated(e.target.checked)} /> Use the dedicated {action === "summarize" ? "summarization" : "translation"} model (CPU, ~300 MB{gpu && !gpu.ok ? ", recommended without WebGPU" : ""})</label>}
        <div className="field" style={{ marginTop: 10 }}><label htmlFor="txt-in">Your text <span className="muted">({words(text)} words)</span></label><textarea id="txt-in" rows={10} value={text} maxLength={8000} onChange={(e) => setText(e.target.value)} placeholder="Paste text in any language…" /></div>
        <div className="toolbar">
          {busy && !useDedicated ? <button className="btn btn-outline" onClick={() => abort.current?.abort()}>Stop</button> : <button className="btn btn-dark" onClick={run} disabled={!text.trim() || busy}>{busy ? "Working…" : ACTIONS.find((a) => a.id === action)?.label}</button>}
          <button className="btn btn-ghost btn-sm" onClick={() => setText(SAMPLE)}>Try a sample</button>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
      </section>
      <section className="tool-panel st-output" aria-live="polite">
        <div className="toolbar" style={{ marginTop: 0, justifyContent: "space-between" }}><h2 style={{ fontSize: "1.2rem", margin: 0 }}>Result {out && <span className="muted" style={{ fontSize: ".85rem", fontWeight: 500 }}>({words(out)} words)</span>}</h2><CopyButton text={out} /></div>
        {out ? <div className="st-plain">{out}</div> : <p className="muted">{busy ? "Working…" : "The result appears here."}</p>}
      </section>
    </div>
  );
}
