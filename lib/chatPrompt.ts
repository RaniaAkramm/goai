import { TOOLS } from "./tools";

/** Small models loop; drop any sentence/paragraph that repeats an earlier one (cut from the first repeat on). */
export function dedupeRepeats(text: string): string {
  const parts = text.split(/(?<=[.!?])\s+|\n+/); const seen = new Set<string>(); let cut = -1, pos = 0;
  for (const p of parts) {
    const at = text.indexOf(p, pos); const k = p.trim().toLowerCase();
    if (k.length > 15 && seen.has(k)) { cut = at; break; }
    if (k) seen.add(k); pos = at + p.length;
  }
  return cut < 0 ? text : text.slice(0, cut).trimEnd();
}

/** System prompt for the floating site assistant. Kept short: small local models have small context windows. */
export const CHAT_SYSTEM = `You are the GoAI.foo assistant, a small AI model running privately in the visitor's browser. Answer in short, friendly English (2-5 sentences). When relevant, link pages as Markdown links like [JSON Formatter](/tools/json-formatter).

About GoAI.foo: a free, local-first developer platform. No sign-up, no uploads, no paid APIs; everything runs in the browser.
Developer tools (/tools):
${TOOLS.map((t) => `- [${t.name}](/tools/${t.slug}): ${t.description}`).join("\n")}
AI Studio (/studio): free AI models running on the device (WebGPU, or CPU fallback). Sections: [Chat](/studio/chat), [Code assistant](/studio/code), [Text: summarize & translate](/studio/text), [AI website generator](/studio/site), [Models manager](/studio/models).
[Project Builder](/builder): build a website from templates (business, portfolio, blog, e-commerce), edit sections, preview and export a ZIP. Projects are saved locally in the browser.
Other pages: [About](/about), [Privacy](/privacy), [Terms](/terms).
If you do not know something about the site, say so and suggest the closest page. Do not invent features or prices.`;

export const CHAT_MODELS = { desktop: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", small: "HuggingFaceTB/SmolLM2-135M-Instruct" } as const;
/** Load timeout for the chat model (ms). */
export const CHAT_LOAD_TIMEOUT = 180_000;
/** The ~945 MB WebGPU model only on capable desktops; phones / low memory / no WebGPU get the ~131 MB model. */
export function pickChatModel(env: { webgpu: boolean; mobile: boolean; memGB?: number }): string {
  if (env.webgpu && !env.mobile && (env.memGB ?? 8) >= 8) return CHAT_MODELS.desktop;
  return CHAT_MODELS.small;
}

/** Render minimal safe Markdown: links to internal pages, bold, inline code. Returns segments. */
export type Seg = { t: "text" | "link" | "bold" | "code"; v: string; href?: string };
export function parseInline(s: string): Seg[] {
  const out: Seg[] = []; const re = /\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ t: "text", v: s.slice(i, m.index) });
    if (m[1]) out.push({ t: "link", v: m[1], href: m[2] }); else if (m[3]) out.push({ t: "bold", v: m[3] }); else out.push({ t: "code", v: m[4] });
    i = re.lastIndex;
  }
  if (i < s.length) out.push({ t: "text", v: s.slice(i) });
  return out;
}
