"use client";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useStudio } from "./StudioProvider";
import { ModelBar } from "./ModelBar";
import { CopyButton } from "@/components/ui";
import { listChats, saveChat, deleteChat, clearChats, type Chat } from "@/lib/studio/db";
import { SYSTEM_CHAT, trimHistory, chatTitle, type Msg } from "@/lib/studio/prompts";
import { renderMarkdown } from "@/lib/studio/markdown";
import { uid } from "@/lib/builder/templates";

const STARTERS = ["Explain WebGPU in simple terms", "Write a polite follow-up email to a client", "Give me 5 names for a coffee shop", "What's the difference between let and const?"];

export default function ChatApp() {
  const { engines, load } = useStudio();
  const [model, setModel] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [cur, setCur] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const refresh = () => listChats().then(setChats).catch(() => setErr("Browser storage (IndexedDB) is unavailable — chats won't be saved."));
  useEffect(() => { refresh(); }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [streaming, cur?.messages.length]);

  const send = async (text = input) => {
    const q = text.trim(); if (!q || busy) return;
    setErr(""); setInput("");
    const now = Date.now();
    let chat: Chat = cur ?? { id: uid(), title: chatTitle(q), model, createdAt: now, updatedAt: now, messages: [] };
    chat = { ...chat, model, updatedAt: now, messages: [...chat.messages, { role: "user", content: q }] };
    setCur(chat); setBusy(true); setStreaming("");
    const eng = engines[model] ?? await load(model);
    if (!eng) { setBusy(false); setErr("Load a model first (button above)."); await saveChat(chat).catch(() => {}); refresh(); return; }
    abort.current = new AbortController();
    try {
      track("studio_message", { app: "chat" });
      const msgs: Msg[] = trimHistory([{ role: "system", content: SYSTEM_CHAT }, ...chat.messages]);
      const out = await eng.generate(msgs, { onToken: setStreaming, signal: abort.current.signal });
      chat = { ...chat, updatedAt: Date.now(), messages: [...chat.messages, { role: "assistant", content: out.trim() || "(no answer)" }] };
    } catch (e) { setErr("Generation failed: " + (e instanceof Error ? e.message : String(e))); }
    setCur(chat); setStreaming(""); setBusy(false);
    await saveChat(chat).catch(() => {}); refresh();
  };
  const msgs = cur?.messages ?? [];
  return (
    <div className="st-chat">
      <aside className="st-side" aria-label="Chat history">
        <button className="btn btn-dark btn-sm" style={{ width: "100%" }} onClick={() => { setCur(null); setErr(""); }}>+ New chat</button>
        <ul className="st-history">
          {chats.length === 0 && <li className="muted" style={{ fontSize: ".9rem", padding: 8 }}>No saved chats yet. Chats are stored only in this browser.</li>}
          {chats.map((c) => <li key={c.id} className={cur?.id === c.id ? "on" : ""}><button className="st-hbtn" onClick={() => setCur(c)}>{c.title}</button><button className="st-del" aria-label={`Delete chat ${c.title}`} onClick={async () => { await deleteChat(c.id); if (cur?.id === c.id) setCur(null); refresh(); }}>×</button></li>)}
        </ul>
        {chats.length > 0 && <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm("Delete all saved chats in this browser?")) { await clearChats(); setCur(null); refresh(); } }}>Clear history</button>}
      </aside>
      <section className="st-main">
        <ModelBar task="chat" value={model} onChange={setModel} />
        <div className="st-msgs" aria-live="polite">
          {msgs.length === 0 && !busy && <div className="st-empty"><div className="icon-sq" aria-hidden="true">✦</div><h2>What can I help with?</h2><p className="muted">Private AI chat that runs on your device. Nothing you type leaves this browser.</p>
            <div className="st-starters">{STARTERS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div></div>}
          {msgs.map((m, i) => <Bubble key={i} m={m} />)}
          {busy && <Bubble m={{ role: "assistant", content: streaming || "…" }} live />}
          <div ref={end} />
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <form className="st-compose" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <label htmlFor="chat-in" className="sr-only">Message</label>
          <textarea id="chat-in" rows={2} value={input} placeholder="Message GoAI Studio…  (Enter to send, Shift+Enter for a new line)" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          {busy ? <button type="button" className="btn btn-outline" onClick={() => abort.current?.abort()}>Stop</button> : <button className="btn btn-dark" disabled={!input.trim()}>Send</button>}
        </form>
      </section>
    </div>
  );
}
function Bubble({ m, live }: { m: Msg; live?: boolean }) {
  return <div className={`st-bubble ${m.role}`}>{m.role === "assistant" ? <><div className="st-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />{!live && <CopyButton text={m.content} />}</> : <p>{m.content}</p>}</div>;
}
