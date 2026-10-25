/// <reference lib="webworker" />
// Runs Transformers.js (ONNX/WASM) off the main thread so the page stays responsive while the model loads and generates.
import { pipeline, TextStreamer, InterruptableStoppingCriteria } from "@huggingface/transformers";

type In =
  | { type: "load"; id: string; task: string; dtype: string }
  | { type: "gen"; rid: number; msgs: { role: string; content: string }[]; maxTokens: number }
  | { type: "task"; rid: number; kind: "summarize" | "translate"; text: string }
  | { type: "abort" }
  | { type: "dispose" };

const ctx = self as unknown as DedicatedWorkerGlobalScope;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipe: any = null;
const stopper = new InterruptableStoppingCriteria();
const files = new Map<string, [number, number]>();
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

ctx.onmessage = async (ev: MessageEvent<In>) => {
  const m = ev.data;
  try {
    if (m.type === "load") {
      const progress_callback = (p: { status: string; file?: string; loaded?: number; total?: number }) => {
        if (p.status === "progress" && p.file && p.total) {
          files.set(p.file, [p.loaded ?? 0, p.total]); let a = 0, b = 0; for (const [l, t] of files.values()) { a += l; b += t; }
          ctx.postMessage({ type: "progress", loaded: a, total: b });
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const P = pipeline as any;
      try { pipe = await P(m.task, m.id, { dtype: m.dtype, device: "wasm", progress_callback }); }
      catch (e) {
        console.warn("[transformers.worker] load with dtype=" + m.dtype + " failed, retrying with defaults:", e);
        ctx.postMessage({ type: "warn", message: "dtype " + m.dtype + " failed: " + errMsg(e) });
        pipe = await P(m.task, m.id, { progress_callback });
      }
      ctx.postMessage({ type: "ready" });
    } else if (m.type === "gen") {
      stopper.reset(); let out = "";
      const streamer = new TextStreamer(pipe.tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: (s: string) => { out += s; ctx.postMessage({ type: "token", rid: m.rid, full: out }); } });
      const r = await pipe(m.msgs, { max_new_tokens: m.maxTokens, do_sample: false, streamer, stopping_criteria: stopper });
      const g = r?.[0]?.generated_text; const final = Array.isArray(g) ? g[g.length - 1]?.content ?? out : out;
      ctx.postMessage({ type: "done", rid: m.rid, out: final || out });
    } else if (m.type === "task") {
      const r = await pipe(m.text.slice(0, 3000), m.kind === "summarize" ? { max_new_tokens: 160 } : {});
      ctx.postMessage({ type: "done", rid: m.rid, out: r?.[0]?.summary_text ?? r?.[0]?.translation_text ?? "" });
    } else if (m.type === "abort") stopper.interrupt();
    else if (m.type === "dispose") { await pipe?.dispose?.(); pipe = null; }
  } catch (e) {
    console.error("[transformers.worker]", e);
    ctx.postMessage({ type: "error", rid: "rid" in m ? m.rid : undefined, message: errMsg(e) });
  }
};
