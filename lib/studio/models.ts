export type ModelKind = "webllm" | "transformers";
export type ModelInfo = { id: string; name: string; kind: ModelKind; sizeMB: number; tasks: ("chat" | "code" | "text" | "summarize" | "translate")[]; note: string; recommended?: boolean; dtype?: string };

/** Free, open models. WebLLM models need WebGPU; Transformers.js models run on WASM (CPU) in any modern browser. Sizes = approximate download/VRAM. */
export const MODELS: ModelInfo[] = [
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", name: "Qwen2.5 0.5B Instruct", kind: "webllm", sizeMB: 945, tasks: ["chat", "text", "code"], note: "Fast and light. Good default for most laptops.", recommended: true },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", name: "Llama 3.2 1B Instruct", kind: "webllm", sizeMB: 879, tasks: ["chat", "text"], note: "Natural conversation and writing." },
  { id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC", name: "Qwen2.5 Coder 1.5B", kind: "webllm", sizeMB: 1630, tasks: ["code", "chat"], note: "Best for explaining, fixing and writing code." },
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Qwen2.5 1.5B Instruct", kind: "webllm", sizeMB: 1630, tasks: ["chat", "text", "code"], note: "Smarter answers; needs a decent GPU." },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", name: "Llama 3.2 3B Instruct", kind: "webllm", sizeMB: 2264, tasks: ["chat", "text", "code"], note: "Highest quality here; desktop GPU recommended." },
  { id: "HuggingFaceTB/SmolLM2-360M-Instruct", name: "SmolLM2 360M (CPU)", kind: "transformers", sizeMB: 390, tasks: ["chat", "text", "code"], note: "No WebGPU needed. Slower and simpler answers.", recommended: true },
  { id: "HuggingFaceTB/SmolLM2-135M-Instruct", name: "SmolLM2 135M (phone)", kind: "transformers", sizeMB: 131, dtype: "q8", tasks: ["chat", "text"], note: "Tiny and phone-friendly. Simple answers." },
  { id: "Xenova/distilbart-cnn-6-6", name: "DistilBART summarizer (CPU)", kind: "transformers", sizeMB: 300, tasks: ["summarize"], note: "Dedicated summarization model." },
  { id: "Xenova/opus-mt-mul-en", name: "OPUS-MT many→English (CPU)", kind: "transformers", sizeMB: 310, tasks: ["translate"], note: "Dedicated translation to English." },
];
export const getModel = (id: string) => MODELS.find((m) => m.id === id);
export const formatSize = (mb: number) => (mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`);
export function defaultModelFor(task: "chat" | "code" | "text", webgpu: boolean): string {
  if (!webgpu) return "HuggingFaceTB/SmolLM2-360M-Instruct";
  return task === "code" ? "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC" : "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
}
export const usableModels = (task: ModelInfo["tasks"][number], webgpu: boolean) => MODELS.filter((m) => m.tasks.includes(task) && (webgpu || m.kind === "transformers"));
