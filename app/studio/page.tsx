import type { Metadata } from "next";
import Link from "next/link";
import { MODELS, formatSize } from "@/lib/studio/models";
export const metadata: Metadata = {
  title: "AI Studio — Free Local AI Chat, Code Assistant & Text Tools (No Sign-up)",
  description: "GoAI Studio runs open AI models directly in your browser with WebGPU: private AI chat, AI code assistant, summarizer, rewriter, English translator and AI website generator. Free, no account, no paid APIs.",
  keywords: ["AI Studio", "free AI tools", "local AI", "in-browser AI", "private AI chat", "AI code assistant", "AI summarizer", "WebGPU", "WebLLM", "Transformers.js", "no sign-up AI"],
  alternates: { canonical: "/studio" }, openGraph: { title: "GoAI AI Studio — private AI in your browser", url: "/studio" },
};
const APPS = [
  { href: "/studio/chat", icon: "✦", title: "AI Chat", text: "Streaming chat with saved history. Ask questions, draft emails, brainstorm ideas.", cta: "Start chatting" },
  { href: "/studio/code", icon: "</>", title: "Code assistant", text: "Explain, fix, review, comment, convert or write code in 10 languages with a coding model.", cta: "Open code assistant" },
  { href: "/studio/text", icon: "Aa", title: "Text tools", text: "Summarize, rewrite in five tones, fix grammar, make bullet notes and translate to English.", cta: "Open text tools" },
  { href: "/studio/site", icon: "▦", title: "AI site generator", text: "Describe a business and get a full multi-page website with AI-written copy — then edit it in the Builder.", cta: "Generate a site" },
];
const FAQ = [
  ["Is it really free?", "Yes. The models are open-source and run on your own device, so there are no API costs to pass on. No account is needed."],
  ["Does my data leave the browser?", "No. Prompts, code and chats are processed locally. The only network traffic is the one-time model download from Hugging Face's public CDN."],
  ["Why does the first load take a while?", "Models are 0.3–2.2 GB. They download once and are cached by your browser, so later visits start in seconds and also work offline."],
  ["What if my browser has no WebGPU?", "Studio detects it automatically and offers smaller CPU models (Transformers.js). They are slower and simpler, but they work in any modern browser."],
  ["How good are the answers?", "Small local models are great for drafts, explanations and everyday tasks, but they can be wrong. Always check important facts and code."],
];
export default function StudioHome() {
  return (<>
    <section className="hero">
      <div className="hero-grid">
        <div>
          <span className="badge">Free · Private · No account</span>
          <h1 style={{ marginTop: 18 }}>AI that runs <span className="mark">on your device.</span></h1>
          <p className="lead">GoAI Studio brings open AI models into your browser with WebGPU. Chat, code, write and generate websites — without sending a single word to a server.</p>
          <div className="cta-row"><Link href="/studio/chat" className="btn btn-dark">Open AI chat</Link><Link href="/studio/site" className="btn btn-outline">Generate a website</Link></div>
          <ul className="pill-list"><li>{MODELS.length} open models</li><li>Works offline after download</li><li>No API keys</li><li>History stays local</li></ul>
        </div>
        <div className="st-hero-card card-dark card" aria-hidden="true">
          <div className="st-fake"><span className="st-dot" /><span className="st-dot" /><span className="st-dot" /></div>
          <div className="st-bubble user"><p>Explain this regex: ^\d{"{3}"}-\d{"{4}"}$</p></div>
          <div className="st-bubble assistant"><p>It matches exactly <b>3 digits</b>, a dash, then <b>4 digits</b> — like <code>555-0142</code>. The ^ and $ anchor the whole string.</p></div>
          <div className="st-progress"><i style={{ width: "100%" }} /><span>Qwen2.5 0.5B · running locally · 38 tok/s</span></div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="apps"><div className="section-head"><h2 id="apps">Four AI apps, one private studio</h2><p className="muted">Each app picks a sensible model automatically. Switch any time in the model picker.</p></div>
      <div className="grid grid-2">{APPS.map((a, i) => <article key={a.href} className={`card${i === 0 ? " card-dark" : ""}`}><div className="icon-sq" aria-hidden="true">{a.icon}</div><h3>{a.title}</h3><p className="muted">{a.text}</p><Link href={a.href} className={`btn btn-sm ${i === 0 ? "btn-lime" : "btn-dark"}`}>{a.cta}</Link></article>)}</div>
    </section>
    <section className="section"><div className="dark-band"><span className="badge badge-lime">How it works</span><h2 style={{ marginTop: 16 }}>From click to answer, all on your machine.</h2>
      <ol className="steps">{[["DETECT", "Studio checks for WebGPU and picks GPU or CPU models."], ["DOWNLOAD", "The model downloads once from Hugging Face’s public CDN."], ["CACHE", "Your browser stores it for instant, offline reuse."], ["RUN", "Answers stream token by token from your GPU or CPU."], ["KEEP", "Chats are saved in IndexedDB — only on this device."]].map(([t, d], i) => <li key={t}><small>0{i + 1} / 05</small><b>{t}</b><span>{d}</span></li>)}</ol></div></section>
    <section className="section" aria-labelledby="models-h"><div className="section-head"><h2 id="models-h">Models included</h2><Link href="/studio/models" className="btn btn-outline btn-sm">Manage models →</Link></div>
      <div className="table-scroll"><table className="st-table"><thead><tr><th>Model</th><th>Runs on</th><th>Size</th><th>Best for</th></tr></thead><tbody>{MODELS.map((m) => <tr key={m.id}><td><b>{m.name}</b></td><td>{m.kind === "webllm" ? "WebGPU" : "CPU (any browser)"}</td><td>{formatSize(m.sizeMB)}</td><td>{m.tasks.join(", ")}</td></tr>)}</tbody></table></div>
    </section>
    <section className="section" aria-labelledby="faq-h"><div className="section-head"><h2 id="faq-h">Questions</h2></div>
      <div className="st-faq">{FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
  </>);
}
