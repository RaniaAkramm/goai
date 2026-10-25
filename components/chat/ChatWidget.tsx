"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHAT_SYSTEM, CHAT_LOAD_TIMEOUT, CHAT_MODELS, pickChatModel, parseInline } from "@/lib/chatPrompt";
import type { Engine } from "@/lib/studio/engine";
import type { Msg } from "@/lib/studio/prompts";

type Status = "idle" | "loading" | "ready" | "error";
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
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const eng = useRef<Engine | null>(null); const loading = useRef<Promise<Engine | null> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null); const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [msgs, status]);
  useEffect(() => { if (!open) return; inputRef.current?.focus(); const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [open]);
  // Start loading quietly only once the panel is opened (visitors who never open chat download nothing).
  useEffect(() => { if (open) void ensureEngine(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function ensureEngine(): Promise<Engine | null> {
    if (eng.current) return Promise.resolve(eng.current);
    if (loading.current) return loading.current;
    setStatus("loading"); setErr("");
    loading.current = (async () => {
      try {
        const e = await import("@/lib/studio/engine"); // lazy: engine + model libs load only when chatting
        const gpu = await e.detectWebGPU();
        const nav = navigator as Navigator & { deviceMemory?: number; userAgentData?: { mobile?: boolean } };
        const mobile = nav.userAgentData?.mobile ?? /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
        const id = pickChatModel({ webgpu: gpu.ok, mobile, memGB: nav.deviceMemory });
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error("timeout")), CHAT_LOAD_TIMEOUT); });
        const load = async () => {
          try { return await e.loadEngine(id, () => {}); }
          catch (x) {
            if (id === CHAT_MODELS.small) throw x;
            console.warn("[chat] GPU model failed, falling back to the CPU model", x); // quiet fallback, no error shown
            return await e.loadEngine(CHAT_MODELS.small, () => {});
          }
        };
        try { eng.current = await Promise.race([load(), timeout]); } finally { clearTimeout(timer); }
        setStatus("ready"); return eng.current;
      } catch (x) {
        console.warn("[chat] model load failed", x);
        setStatus("error");
        setErr(String((x as Error)?.message) === "timeout" ? "The assistant is taking too long to load on this connection." : "The assistant couldn't load in this browser.");
        return null;
      } finally { loading.current = null; }
    })();
    return loading.current;
  }

  async function answer(next: Msg[]) {
    setBusy(true);
    const e = await ensureEngine(); if (!e) { setBusy(false); return; }
    const { trimHistory } = await import("@/lib/studio/prompts");
    setMsgs([...next, { role: "assistant", content: "" }]);
    abort.current = new AbortController();
    try {
      const out = await e.generate(trimHistory([{ role: "system", content: CHAT_SYSTEM }, ...next], 5000), { maxTokens: 320, temperature: 0.4, signal: abort.current.signal,
        onToken: (full) => setMsgs([...next, { role: "assistant", content: full }]) });
      setMsgs([...next, { role: "assistant", content: out || "(no reply)" }]);
    } catch (x) { setMsgs([...next, { role: "assistant", content: "Sorry, something went wrong: " + String(x).slice(0, 100) }]); }
    finally { setBusy(false); abort.current = null; }
  }
  function send() {
    const q = input.trim(); if (!q || busy) return;
    setInput(""); const next: Msg[] = [...msgs, { role: "user", content: q }]; setMsgs(next); void answer(next); // queued until the model is ready
  }
  function retry() {
    const last = msgs[msgs.length - 1];
    if (last?.role === "user") void answer(msgs); else void ensureEngine();
  }
  const clear = () => { abort.current?.abort(); setMsgs([]); };
  const waiting = busy && status === "loading" && msgs[msgs.length - 1]?.role === "user";

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
            {waiting && <div className="cw-msg assistant"><span className="cw-dots" aria-label="Thinking"><i/><i/><i/></span></div>}
            {status === "loading" && <div className="cw-calm">Runs privately on your device: a small AI model loads once, then it&apos;s instant.</div>}
            {status === "error" && <div className="cw-note err">{err} <button type="button" className="btn btn-ghost btn-sm cw-retry" onClick={retry}>Retry</button></div>}
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
