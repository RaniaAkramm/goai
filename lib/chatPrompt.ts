import { TOOLS } from "./tools";

/** System prompt for the floating site assistant. Kept short: small local models have small context windows. */
export const CHAT_SYSTEM = `You are the GoAI.foo assistant, a small AI model running privately in the visitor's browser. Answer in short, friendly English (2-5 sentences). When relevant, link pages as Markdown links like [JSON Formatter](/tools/json-formatter).

About GoAI.foo: a free, local-first developer platform. No sign-up, no uploads, no paid APIs; everything runs in the browser.
Developer tools (/tools):
${TOOLS.map((t) => `- [${t.name}](/tools/${t.slug}): ${t.description}`).join("\n")}
AI Studio (/studio): free AI models running on the device (WebGPU, or CPU fallback). Sections: [Chat](/studio/chat), [Code assistant](/studio/code), [Text: summarize & translate](/studio/text), [AI website generator](/studio/site), [Models manager](/studio/models).
[Project Builder](/builder): build a website from templates (business, portfolio, blog, e-commerce), edit sections, preview and export a ZIP. Projects are saved locally in the browser.
Other pages: [About](/about), [Privacy](/privacy), [Terms](/terms).
If you do not know something about the site, say so and suggest the closest page. Do not invent features or prices.`;

export const CHAT_MODELS = { webgpu: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", cpu: "HuggingFaceTB/SmolLM2-360M-Instruct" } as const;

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
