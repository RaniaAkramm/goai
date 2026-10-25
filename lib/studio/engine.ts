"use client";
import { getModel, type ModelInfo } from "./models";
import type { Msg } from "./prompts";

export type Progress = { progress: number; text: string };
export type GenOpts = { onToken?: (full: string) => void; signal?: AbortSignal; maxTokens?: number; temperature?: number };
export interface Engine { model: ModelInfo; generate(msgs: Msg[], o?: GenOpts): Promise<string>; task?(kind: "summarize" | "translate", text: string): Promise<string>; unload(): Promise<void> }

export const isMock = () => typeof window !== "undefined" && (localStorage.getItem("goai-studio-mock") === "1" || /[?&]mock=1/.test(location.search));

export async function detectWebGPU(): Promise<{ ok: boolean; reason: string }> {
  if (isMock()) return { ok: localStorage.getItem("goai-studio-mock-gpu") !== "0", reason: "Simulated (test mode)" };
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
  if (!gpu) return { ok: false, reason: "This browser does not expose WebGPU." };
  try { const a = await gpu.requestAdapter(); return a ? { ok: true, reason: "WebGPU adapter found." } : { ok: false, reason: "No compatible GPU adapter was found." }; }
  catch (e) { return { ok: false, reason: "WebGPU failed to initialise: " + String(e) }; }
}

export async function isCached(m: ModelInfo): Promise<boolean> {
  if (isMock()) return localStorage.getItem("goai-mock-cached-" + m.id) === "1";
  try {
    if (m.kind === "webllm") { const w = await import("@mlc-ai/web-llm"); return await w.hasModelInCache(m.id); }
    if (!("caches" in window)) return false;
    const c = await caches.open("transformers-cache"); const keys = await c.keys();
    return keys.some((k) => k.url.includes(m.id));
  } catch { return false; }
}
export async function removeFromCache(m: ModelInfo) {
  if (isMock()) { localStorage.removeItem("goai-mock-cached-" + m.id); return; }
  if (m.kind === "webllm") { const w = await import("@mlc-ai/web-llm"); await w.deleteModelAllInfoInCache(m.id); return; }
  const c = await caches.open("transformers-cache");
  for (const k of await c.keys()) if (k.url.includes(m.id)) await c.delete(k);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function mockAnswer(msgs: Msg[]): string {
  const last = msgs[msgs.length - 1]?.content ?? "";
  if (/JSON object/.test(msgs[0]?.content ?? "")) return JSON.stringify({ brand: "Bloom & Crumb", tagline: "Artisan bakery baking fresh every morning.", eyebrow: "Fresh since 2012", heroTitle: "Bread worth waking up for", heroText: "Slow-fermented sourdough, flaky pastries and celebration cakes, baked by hand every morning in the heart of town.", ctaPrimary: "Order for pickup", ctaSecondary: "Visit the bakery", features: [{ icon: "🥖", title: "Slow sourdough", text: "48-hour fermentation for flavour and easy digestion." }, { icon: "🥐", title: "Butter pastries", text: "Laminated by hand with French butter." }, { icon: "🎂", title: "Custom cakes", text: "Birthdays, weddings and everything between." }, { icon: "🌾", title: "Local flour", text: "Stone-milled grain from farms within 80 km." }, { icon: "☕", title: "Specialty coffee", text: "Roasted in small batches nearby." }, { icon: "🚲", title: "Morning delivery", text: "Fresh loaves at your door by 8 am." }], stats: [{ value: "12", label: "Years baking" }, { value: "900+", label: "Loaves a week" }, { value: "4.9★", label: "Google rating" }, { value: "6am", label: "Doors open" }], testimonials: [{ quote: "The best croissant outside Paris. I come every Saturday.", name: "Hana Yusuf", role: "Regular customer" }, { quote: "Our wedding cake was stunning and delicious.", name: "Tom & Ines", role: "Newlyweds" }, { quote: "Friendly team and the sourdough is unbeatable.", name: "Rami Haddad", role: "Local chef" }], faqs: [{ q: "Do you have gluten-free options?", a: "Yes, we bake a gluten-free loaf and brownies daily." }, { q: "How early should I order a cake?", a: "Five days ahead for most designs." }, { q: "Can I pre-order bread?", a: "Order online by 8 pm for next-morning pickup." }, { q: "Do you cater events?", a: "Yes — pastry platters for 10 to 200 guests." }], ctaTitle: "Taste it fresh tomorrow morning", ctaText: "Pre-order online tonight and pick up warm bread from 6 am.", aboutText: "A family bakery built on patience, good flour and early mornings." });
  if (/```/.test(last) || /code/i.test(msgs[0]?.content ?? "")) return "Here is what the code does:\n\n1. It defines a function.\n2. It returns the result.\n\n```js\nfunction add(a, b) {\n  return a + b;\n}\n```\n\nNo issues found (mock model).";
  return "Hello! I'm a **mock model** used for automated tests. You asked: " + last.slice(0, 80);
}

class MockEngine implements Engine {
  constructor(public model: ModelInfo) {}
  async generate(msgs: Msg[], o: GenOpts = {}) {
    const text = mockAnswer(msgs); let out = "";
    for (const part of text.match(/.{1,12}/gs) ?? []) { if (o.signal?.aborted) break; out += part; o.onToken?.(out); await sleep(15); }
    return out;
  }
  async task(kind: "summarize" | "translate", text: string) { return kind === "summarize" ? "Summary (mock): " + text.slice(0, 60) : "Translation (mock): " + text.slice(0, 60); }
  async unload() {}
}

export async function loadEngine(id: string, onProgress: (p: Progress) => void): Promise<Engine> {
  const m = getModel(id); if (!m) throw new Error("Unknown model " + id);
  if (isMock()) {
    for (let i = 0; i <= 10; i++) { onProgress({ progress: i / 10, text: `Downloading ${m.name}… ${i * 10}%` }); await sleep(40); }
    localStorage.setItem("goai-mock-cached-" + m.id, "1");
    return new MockEngine(m);
  }
  if (m.kind === "webllm") {
    const w = await import("@mlc-ai/web-llm");
    const eng = await w.CreateMLCEngine(m.id, { initProgressCallback: (r) => onProgress({ progress: r.progress, text: r.text }) });
    return {
      model: m,
      async generate(msgs, o = {}) {
        const stop = () => eng.interruptGenerate(); o.signal?.addEventListener("abort", stop);
        let out = "";
        try {
          const chunks = await eng.chat.completions.create({ messages: msgs, stream: true, max_tokens: o.maxTokens ?? 1024, temperature: o.temperature ?? 0.7 });
          for await (const c of chunks) { out += c.choices[0]?.delta?.content ?? ""; o.onToken?.(out); }
        } finally { o.signal?.removeEventListener("abort", stop); }
        return out;
      },
      async unload() { await eng.unload(); },
    };
  }
  // Transformers.js (WASM / CPU)
  const t = await import("@huggingface/transformers");
  const files = new Map<string, [number, number]>();
  const progress_callback = (p: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (p.status === "progress" && p.file && p.total) { files.set(p.file, [p.loaded ?? 0, p.total]); let a = 0, b = 0; for (const [l, tt] of files.values()) { a += l; b += tt; } onProgress({ progress: b ? a / b : 0, text: `Downloading ${m.name}… ${Math.round((a / 1048576))} / ${Math.round(b / 1048576)} MB` }); }
    if (p.status === "ready") onProgress({ progress: 1, text: `${m.name} ready` });
  };
  const task = m.tasks.includes("summarize") ? "summarization" : m.tasks.includes("translate") ? "translation" : "text-generation";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipe: any = await (t.pipeline as any)(task, m.id, { dtype: "q4", device: "wasm", progress_callback }).catch(() => (t.pipeline as any)(task, m.id, { progress_callback }));
  const runTask = async (kind: "summarize" | "translate", text: string): Promise<string> => {
    const r = await pipe(text.slice(0, 3000), kind === "summarize" ? { max_new_tokens: 160 } : {});
    return r?.[0]?.summary_text ?? r?.[0]?.translation_text ?? "";
  };
  return {
    model: m,
    async generate(msgs, o = {}) {
      if (task !== "text-generation") { const r = await runTask(task === "summarization" ? "summarize" : "translate", msgs[msgs.length - 1].content); o.onToken?.(r); return r; }
      let out = "";
      const streamer = new t.TextStreamer(pipe.tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: (s: string) => { if (o.signal?.aborted) return; out += s; o.onToken?.(out); } });
      const r = await pipe(msgs, { max_new_tokens: o.maxTokens ?? 512, do_sample: false, streamer });
      const g = r?.[0]?.generated_text; const final = Array.isArray(g) ? g[g.length - 1]?.content ?? out : out;
      return final || out;
    },
    task: runTask,
    async unload() { await pipe.dispose?.(); },
  };
}
