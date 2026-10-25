import type { SiteContent } from "../builder/sections";
export type Msg = { role: "system" | "user" | "assistant"; content: string };

export const SYSTEM_CHAT = "You are GoAI Studio, a friendly, concise assistant running privately in the user's browser. Answer in clear English. Use Markdown for lists and code blocks.";

/** Keep the system prompt plus as many recent messages as fit in a character budget (small local models have small context windows). */
export function trimHistory(msgs: Msg[], budget = 6000): Msg[] {
  const sys = msgs.filter((m) => m.role === "system");
  const rest = msgs.filter((m) => m.role !== "system");
  const out: Msg[] = []; let used = sys.reduce((n, m) => n + m.content.length, 0);
  for (let i = rest.length - 1; i >= 0; i--) {
    const len = rest[i].content.length;
    if (used + len > budget && out.length > 0) break;
    out.unshift(rest[i]); used += len;
  }
  while (out.length && out[0].role !== "user") out.shift();
  return [...sys, ...out];
}

export const chatTitle = (first: string) => { const t = first.replace(/\s+/g, " ").trim(); return t.length > 48 ? t.slice(0, 45).trimEnd() + "…" : t || "New chat"; };

export type CodeAction = "explain" | "fix" | "write" | "review" | "comment" | "convert";
export const CODE_ACTIONS: { id: CodeAction; label: string; hint: string }[] = [
  { id: "explain", label: "Explain", hint: "Step-by-step explanation of what the code does." },
  { id: "fix", label: "Fix bugs", hint: "Find and fix errors; returns corrected code." },
  { id: "write", label: "Write code", hint: "Describe what you need; get working code." },
  { id: "review", label: "Review", hint: "Code review: bugs, security, readability." },
  { id: "comment", label: "Add comments", hint: "Adds clear comments and docstrings." },
  { id: "convert", label: "Convert", hint: "Translate the code to another language." },
];
export function codeMessages(action: CodeAction, lang: string, code: string, instruction = "", target = "TypeScript"): Msg[] {
  const sys = `You are an expert ${lang} developer and patient teacher. Be precise. Put code in a single fenced \`\`\`${lang.toLowerCase()} block.`;
  const block = code.trim() ? `\n\n\`\`\`${lang.toLowerCase()}\n${code.slice(0, 8000)}\n\`\`\`` : "";
  const extra = instruction.trim() ? `\nExtra instructions: ${instruction.trim()}` : "";
  const ask: Record<CodeAction, string> = {
    explain: `Explain what this ${lang} code does, step by step, then list any potential issues.`,
    fix: `Find the bugs in this ${lang} code. Briefly list each problem, then give the full corrected code.`,
    write: `Write ${lang} code for this request: ${instruction.trim() || "(describe what you need)"}. Include brief usage notes.`,
    review: `Review this ${lang} code like a senior engineer: correctness, security, performance, readability. Use a bulleted list with severity.`,
    comment: `Return this ${lang} code with clear comments and docstrings added. Do not change behaviour.`,
    convert: `Convert this ${lang} code to ${target}. Keep the same behaviour and idioms of ${target}.`,
  };
  return [{ role: "system", content: sys }, { role: "user", content: ask[action] + (action === "write" ? "" : extra) + (action === "write" ? block : block) }];
}

export type TextAction = "summarize" | "rewrite" | "translate" | "grammar" | "bullets";
export const TONES = ["Professional", "Friendly", "Concise", "Persuasive", "Simple"] as const;
export function textMessages(action: TextAction, text: string, tone: string = "Professional"): Msg[] {
  const t = text.slice(0, 8000);
  const ask: Record<TextAction, string> = {
    summarize: "Summarize the following text in 3–5 sentences in English. Keep key facts and numbers.",
    rewrite: `Rewrite the following text in a ${tone.toLowerCase()} tone, in English. Keep the meaning. Return only the rewritten text.`,
    translate: "Translate the following text into natural, fluent English. Return only the translation.",
    grammar: "Correct grammar, spelling and punctuation in the following text. Return only the corrected text.",
    bullets: "Turn the following text into clear bullet-point notes in English.",
  };
  return [{ role: "system", content: "You are a careful editor and translator. Output English only." }, { role: "user", content: `${ask[action]}\n\n"""\n${t}\n"""` }];
}

/** Return the first fenced code block's content, or the whole text if there is none. */
export function extractCode(s: string): string {
  const m = /```[\w+-]*\n([\s\S]*?)```/.exec(s);
  return (m ? m[1] : s).replace(/\n$/, "");
}

export const SITE_SCHEMA_HINT = `{"brand":"","tagline":"","eyebrow":"","heroTitle":"","heroText":"","ctaPrimary":"","ctaSecondary":"","features":[{"icon":"★","title":"","text":""}],"stats":[{"value":"","label":""}],"testimonials":[{"quote":"","name":"","role":""}],"faqs":[{"q":"","a":""}],"ctaTitle":"","ctaText":"","aboutText":""}`;
export function siteMessages(description: string, template: string): Msg[] {
  return [
    { role: "system", content: "You write professional website copy. Reply with ONLY one JSON object, no prose, no code fence." },
    { role: "user", content: `Write English website copy for a ${template} website. Business: ${description.slice(0, 1500)}\nUse exactly this JSON shape (6 features, 4 stats, 3 testimonials, 4 faqs, realistic specific copy, short icons as single symbols):\n${SITE_SCHEMA_HINT}` },
  ];
}

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const arr = <T,>(v: unknown, f: (x: Record<string, unknown>) => T | null, max: number): T[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x) => f(x as Record<string, unknown>)).filter((x): x is T => x !== null).slice(0, max) : []);

/** Parse model output into a safe partial SiteContent (tolerates fences, prose and trailing commas). */
export function parseSiteContent(raw: string): Partial<SiteContent> | null {
  const s = raw.replace(/```(json)?/gi, "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  let obj: Record<string, unknown>;
  try { obj = JSON.parse(s.slice(a, b + 1).replace(/,\s*([}\]])/g, "$1")); } catch { return null; }
  const out: Partial<SiteContent> = {};
  for (const k of ["brand", "tagline", "eyebrow", "heroTitle", "heroText", "ctaPrimary", "ctaSecondary", "ctaTitle", "ctaText", "aboutText", "featuresTitle", "featuresText"] as const) { const v = str(obj[k], k === "heroText" || k === "aboutText" ? 600 : 140); if (v) (out as Record<string, string>)[k] = v; }
  const features = arr(obj.features, (x) => (str(x.title) ? { icon: str(x.icon, 3) || "★", title: str(x.title, 80), text: str(x.text, 240) } : null), 6);
  const stats = arr(obj.stats, (x) => (str(x.value) ? { value: str(x.value, 12), label: str(x.label, 40) } : null), 4);
  const testimonials = arr(obj.testimonials, (x) => (str(x.quote) ? { quote: str(x.quote, 300), name: str(x.name, 40) || "Happy customer", role: str(x.role, 60) } : null), 3);
  const faqs = arr(obj.faqs, (x) => (str(x.q) ? { q: str(x.q, 160), a: str(x.a, 400) } : null), 6);
  if (features.length) out.features = features; if (stats.length) out.stats = stats; if (testimonials.length) out.testimonials = testimonials; if (faqs.length) out.faqs = faqs;
  return Object.keys(out).length ? out : null;
}

/** No-AI fallback: derive basic copy from a free-text description. */
export function quickContent(description: string, name: string): Partial<SiteContent> {
  const d = description.replace(/\s+/g, " ").trim();
  const first = d.split(/[.!?]/)[0]?.trim() || d;
  return { brand: name || undefined, tagline: first.slice(0, 120) || undefined, heroTitle: name ? `${name} — ${first}`.slice(0, 90) : first.slice(0, 90) || undefined, heroText: d.slice(0, 280) || undefined };
}
