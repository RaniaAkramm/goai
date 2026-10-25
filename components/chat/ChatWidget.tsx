"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHAT_SYSTEM, CHAT_MODELS, parseInline } from "@/lib/chatPrompt";
import type { Engine, Progress } from "@/lib/studio/engine";
import type { Msg } from "@/lib/studio/prompts";

type Status = "idle" | "checking" | "loading" | "ready" | "error";
const GREETING = "Hi! I'm the GoAI.foo assistant. Ask me about the developer tools, AI Studio or the Project Builder.";

function Rich({ text }: { text: string }) {
  return <>{text.split("\n").map((line, li) => (
    <p key={li}>{parseInline(line).map((s, i) => s.t === "link" ? (s.href!.startsWith("/") ? <Link key={i} href={s.href!}>{s.v}</Link> : <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">{s.v}</a>) : s.t === "bold" ? <strong key={i}>{s.v}</strong> : s.t === "code" ? <code key={i}>{s.v}</code> : <span key={i}>{s.v}</span>)}</p>
  ))}</>;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<Progress>({ progress: 0, text: "" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const eng = useRef<Engine | null>(null); const abort = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null); const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [msgs, progress]);
  useEffect(() => { if (!open) return; inputRef.current?.focus(); const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [open]);

  async function ensureEngine(): Promise<Engine | null> {
    if (eng.current) return eng.current;
    setStatus("checking");
    try {
      const e = await import("@/lib/studio/engine"); // lazy: engine + model libs load only when chatting
      const gpu = await e.detectWebGPU();
      const id = gpu.ok ? CHAT_MODELS.webgpu : CHAT_MODELS.cpu;
      setNote(gpu.ok ? "Running on your GPU (WebGPU)." : "WebGPU isn't available here, so a smaller CPU model is used. Replies will be slower and simpler.");
      setStatus("loading");
      eng.current = await e.loadEngine(id, setProgress);
      setStatus("ready"); return eng.current;
    } catch (err) {
      setStatus("error"); setNote("Couldn't load the AI model in this browser (" + String((err as Error)?.message ?? err).slice(0, 120) + "). Try a recent Chrome or Edge, or browse the tools directly.");
      return null;
    }
  }

  async function send() {
    const q = input.trim(); if (!q || busy) return;
    setInput(""); const next: Msg[] = [...msgs, { role: "user", content: q }]; setMsgs(next); setBusy(true);
    const e = await ensureEngine(); if (!e) { setBusy(false); return; }
    const { trimHistory } = await import("@/lib/studio/prompts");
    setMsgs([...next, { role: "assistant", content: "" }]);
    abort.current = new AbortController();
    try {
      const out = await e.generate(trimHistory([{ role: "system", content: CHAT_SYSTEM }, ...next], 5000), { maxTokens: 320, temperature: 0.4, signal: abort.current.signal,
        onToken: (full) => setMsgs([...next, { role: "assistant", content: full }]) });
      setMsgs([...next, { role: "assistant", content: out || "(no reply)" }]);
    } catch (err) { setMsgs([...next, { role: "assistant", content: "Sorry, something went wrong: " + String(err).slice(0, 100) }]); }
    finally { setBusy(false); abort.current = null; }
  }
  const clear = () => { abort.current?.abort(); setMsgs([]); };

  return (
    <>
      <button type="button" className={"cw-fab" + (open ? " open" : "")} aria-label={open ? "Close chat" : "Chat with the GoAI assistant"} aria-expanded={open} aria-controls="cw-panel" onClick={() => setOpen((o) => !o)}>
        {open ? <span aria-hidden>✕</span> : <svg aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>}
      </button>
      {open && (
        <section id="cw-panel" className="cw-panel" role="dialog" aria-label="GoAI assistant">
          <header className="cw-head">
            <div><strong>GoAI assistant</strong><span className="cw-sub">Free · runs in your browser</span></div>
            <div className="cw-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={clear} disabled={!msgs.length}>Clear</button>
              <button type="button" className="cw-x" aria-label="Close chat" onClick={() => setOpen(false)}>✕</button>
            </div>
          </header>
          <div className="cw-list" ref={list} aria-live="polite">
            <div className="cw-msg assistant"><Rich text={GREETING} /></div>
            {msgs.map((m, i) => <div key={i} className={"cw-msg " + m.role}>{m.content ? <Rich text={m.content} /> : <span className="cw-dots" aria-label="Thinking"><i/><i/><i/></span>}</div>)}
            {(status === "checking" || status === "loading") && (
              <div className="cw-status"><div>{status === "checking" ? "Checking your browser…" : progress.text || "Preparing model…"}</div>
                <div className="cw-bar"><span style={{ width: Math.round(progress.progress * 100) + "%" }} /></div>
                <small>First time only: the model downloads once and is cached for next visits.</small></div>
            )}
            {note && status !== "loading" && status !== "checking" && <div className={"cw-note" + (status === "error" ? " err" : "")}>{note}</div>}
          </div>
          <form className="cw-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <textarea id="cw-input" ref={inputRef} rows={1} value={input} placeholder="Ask about GoAI.foo…" aria-label="Message" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
            {busy && status === "ready" ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => abort.current?.abort()}>Stop</button>
              : <button type="submit" className="btn btn-dark btn-sm" disabled={!input.trim() || busy}>Send</button>}
          </form>
        </section>
      )}
    </>
  );
}
