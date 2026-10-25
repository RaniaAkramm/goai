"use client";
import { getModel, type ModelInfo } from "./models";
import type { Msg } from "./prompts";

export type Progress = { progress: number; text: string };
export type GenOpts = { onToken?: (full: string) => void; signal?: AbortSignal; maxTokens?: number; temperature?: number };
export interface Engine { model: ModelInfo; generate(msgs: Msg[], o?: GenOpts): Promise<string>; task?(kind: "summarize" | "translate", text: string): Promise<string>; unload(): Promise<void> }

export const isMock = () => typeof window !== "undefined" && (localStorage.getItem("goai-studio-mock") === "1" || /[?&]mock=1/.test(location.search));

type GPUAdapterLike = { features?: { has(f: string): boolean } };
/** WebGPU is only "ok" when the adapter supports shader-f16: all WebLLM models here are q4f16 builds and fail with
 *  "extension f16 is not allowed" otherwise. Without it we use the CPU (Transformers.js) path. */
export async function detectWebGPU(): Promise<{ ok: boolean; reason: string; f16?: boolean }> {
  if (isMock()) { const ok = localStorage.getItem("goai-studio-mock-gpu") !== "0" && localStorage.getItem("goai-studio-mock-f16") !== "0"; return { ok, f16: ok, reason: "Simulated (test mode)" }; }
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<GPUAdapterLike | null> } }).gpu;
  if (!gpu) return { ok: false, reason: "This browser does not expose WebGPU." };
  try {
    const a = await gpu.requestAdapter();
    if (!a) return { ok: false, reason: "No compatible GPU adapter was found." };
    if (!a.features?.has("shader-f16")) return { ok: false, f16: false, reason: "GPU found, but it lacks shader-f16 support; using the CPU models." };
    return { ok: true, f16: true, reason: "WebGPU adapter with shader-f16 found." };
  } catch (e) { return { ok: false, reason: "WebGPU failed to initialise: " + String(e) }; }
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
  if (/```/.test(last) || /developer/i.test(msgs[0]?.content ?? "")) return "Here is what the code does:\n\n1. It defines a function.\n2. It returns the result.\n\n```js\nfunction add(a, b) {\n  return a + b;\n}\n```\n\nNo issues found (mock model).";
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
  return loadTransformersWorker(m, onProgress);
}

/** Transformers.js (WASM / CPU) in a Web Worker so loading and generation never block the UI thread. */
function loadTransformersWorker(m: ModelInfo, onProgress: (p: Progress) => void): Promise<Engine> {
  const task = m.tasks.includes("summarize") ? "summarization" : m.tasks.includes("translate") ? "translation" : "text-generation";
  const w = new Worker(new URL("../../workers/transformers.worker.ts", import.meta.url), { type: "module" });
  let rid = 0;
  const pending = new Map<number, { res: (s: string) => void; rej: (e: Error) => void; onToken?: (s: string) => void }>();
  return new Promise<Engine>((resolve, reject) => {
    let ready = false;
    w.onerror = (e) => { console.error("[engine] transformers worker error", e.message || e); const err = new Error(e.message || "worker failed"); if (!ready) { w.terminate(); reject(err); } for (const p of pending.values()) p.rej(err); pending.clear(); };
    w.onmessage = (ev: MessageEvent) => {
      const d = ev.data;
      if (d.type === "progress") onProgress({ progress: d.total ? d.loaded / d.total : 0, text: `Downloading ${m.name}… ${Math.round(d.loaded / 1048576)} / ${Math.round(d.total / 1048576)} MB` });
      else if (d.type === "warn") console.warn("[engine]", d.message);
      else if (d.type === "ready") { ready = true; onProgress({ progress: 1, text: `${m.name} ready` }); resolve(engine); }
      else if (d.type === "token") pending.get(d.rid)?.onToken?.(d.full);
      else if (d.type === "done") { pending.get(d.rid)?.res(d.out); pending.delete(d.rid); }
      else if (d.type === "error") {
        console.error("[engine] transformers worker:", d.message);
        if (!ready) { w.terminate(); reject(new Error(d.message)); return; }
        const p = d.rid !== undefined ? pending.get(d.rid) : undefined; if (p) { p.rej(new Error(d.message)); pending.delete(d.rid); }
      }
    };
    const call = (msg: Record<string, unknown>, onToken?: (s: string) => void) => new Promise<string>((res, rej) => { const id = ++rid; pending.set(id, { res, rej, onToken }); w.postMessage({ ...msg, rid: id }); });
    const runTask = (kind: "summarize" | "translate", text: string) => call({ type: "task", kind, text });
    const engine: Engine = {
      model: m,
      async generate(msgs, o = {}) {
        if (task !== "text-generation") { const r = await runTask(task === "summarization" ? "summarize" : "translate", msgs[msgs.length - 1].content); o.onToken?.(r); return r; }
        const stop = () => w.postMessage({ type: "abort" }); o.signal?.addEventListener("abort", stop);
        try { return await call({ type: "gen", msgs, maxTokens: o.maxTokens ?? 512 }, (s) => { if (!o.signal?.aborted) o.onToken?.(s); }); }
        finally { o.signal?.removeEventListener("abort", stop); }
      },
      task: runTask,
      async unload() { w.terminate(); },
    };
    w.postMessage({ type: "load", id: m.id, task, dtype: m.dtype ?? "q4" });
  });
}
