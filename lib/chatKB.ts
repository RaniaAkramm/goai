import { TOOLS } from "./tools";

/** Local knowledge base for the site assistant: instant, accurate answers with no model needed. */
export type KBLink = { label: string; href: string };
export type KBEntry = { id: string; title: string; keys: string[]; answer: string; links: KBLink[]; related?: string[] };

const T = (slug: string) => TOOLS.find((t) => t.slug === slug)!;
const toolLink = (slug: string): KBLink => ({ label: "Open " + T(slug).name, href: "/tools/" + slug });

const TOOL_HOWTO: Record<string, { keys: string[]; how: string }> = {
  "json-formatter": { keys: ["json formatter", "format json", "pretty print", "beautify json", "minify json", "validate json", "json error", "invalid json", "json lint", "formatter", "formater"], how: "Paste your JSON, then choose Format (pretty-print) or Minify. If the JSON is invalid it shows the line and column of the error." },
  "json-csv": { keys: ["json to csv", "csv to json", "convert csv", "convert json", "spreadsheet", "excel", "csv"], how: "Paste a JSON array to get CSV (nested fields are flattened), or paste CSV to get JSON. Quoting is handled correctly." },
  base64: { keys: ["base64", "base 64", "encode", "decode", "base64url"], how: "Paste text to encode it to Base64, or paste Base64 to decode it. It is UTF-8 safe and supports the URL-safe Base64URL variant." },
  diff: { keys: ["diff", "compare text", "compare code", "compare two", "difference", "changes between"], how: "Paste the original text on one side and the changed text on the other. It shows line-by-line changes with word-level highlights." },
  playground: { keys: ["playground", "html css js", "html", "css", "javascript", "live preview", "sandbox", "run code", "try code"], how: "Write HTML, CSS and JavaScript in the editors and see a live preview that runs in a sandbox." },
  "text-tools": { keys: ["text utilities", "text tools", "word count", "count words", "character count", "uppercase", "lowercase", "camel case", "snake case", "whitespace", "change case"], how: "Paste text to see word, character and line counts, clean up whitespace, or convert case (UPPER, lower, camelCase, snake_case and more)." },
  regex: { keys: ["regex", "regexp", "regular expression", "pattern", "test regex", "match groups"], how: "Type a JavaScript regular expression and flags, paste test text, and see matches highlighted with their capture groups." },
  hash: { keys: ["hash", "sha", "sha256", "sha-256", "sha512", "checksum", "file hash"], how: "Type text or pick a file to get its SHA-256, SHA-384 and SHA-512 hashes, computed locally with Web Crypto." },
};

export const KB: KBEntry[] = [
  { id: "about", title: "What is GoAI.foo?", keys: ["what is goai", "goai", "this site", "this website", "about", "what can i do", "what do you do", "what is this", "overview"],
    answer: "GoAI.foo is a free, local-first developer platform. It has 8 developer tools, an AI Studio that runs open AI models in your browser, and a Project Builder for making websites from templates. Everything runs on your device: no sign-up and no uploads.",
    links: [{ label: "Developer tools", href: "/tools" }, { label: "AI Studio", href: "/studio" }, { label: "Project Builder", href: "/builder" }], related: ["tools", "studio", "builder"] },
  { id: "tools", title: "Which tools are there?", keys: ["tools", "which tools", "list tools", "developer tools", "dev tools", "utilities", "what tools"],
    answer: "There are 8 free developer tools:\n" + TOOLS.map((t) => `- [${t.name}](/tools/${t.slug}): ${t.description}`).join("\n"),
    links: [{ label: "All tools", href: "/tools" }], related: ["json-formatter", "regex", "hash"] },
  ...TOOLS.map((t): KBEntry => ({ id: t.slug, title: t.name, keys: [...TOOL_HOWTO[t.slug].keys, ...t.keywords, t.name.toLowerCase()],
    answer: `**${t.name}**: ${t.description}\nHow to use it: ${TOOL_HOWTO[t.slug].how} It runs entirely in your browser.`, links: [toolLink(t.slug)], related: ["tools", "privacy"] })),
  { id: "builder", title: "What is the Project Builder?", keys: ["project builder", "builder", "build a website", "make a website", "create a website", "website builder", "templates", "template", "landing page", "my site"],
    answer: "The Project Builder lets you make a website from a template (Business, E-commerce, Blog, Portfolio, Dashboard or Blank). You edit and reorder sections, preview it, and export a ZIP of plain HTML/CSS to host anywhere. Projects are saved locally in your browser.",
    links: [{ label: "Open Project Builder", href: "/builder" }], related: ["builder-how", "site-gen", "privacy"] },
  { id: "builder-how", title: "How do I build a site?", keys: ["how to build", "how do i build", "how do i make", "start a project", "new project", "publish my site", "host", "hosting", "deploy"],
    answer: "Open the Project Builder, pick a template, then edit the text, images and sections and watch the live preview. When you are happy, export a ZIP and upload it to any static host. GoAI.foo itself does not host your site.",
    links: [{ label: "Open Project Builder", href: "/builder" }], related: ["builder", "site-gen"] },
  { id: "export", title: "How do I export my site?", keys: ["export", "builder export", "export builder", "export my site", "download my site", "download site", "download website", "zip", "save my site", "export format"],
    answer: "In the Project Builder, use Export to download a ZIP with plain HTML and CSS files for your site. Upload that folder to any static host. The Builder exports a ZIP, not JSON; for JSON files use the JSON tools.",
    links: [{ label: "Open Project Builder", href: "/builder" }, { label: "JSON Formatter", href: "/tools/json-formatter" }], related: ["builder-how", "builder"] },
  { id: "studio", title: "What is AI Studio?", keys: ["ai studio", "studio", "ai models", "local ai", "run ai", "llm", "chatbot", "ai chat", "webgpu", "gpu"],
    answer: "AI Studio runs free open AI models directly in your browser, using WebGPU when available or the CPU otherwise. It has Chat, a Code assistant, Text tools (summarize and translate), an AI website generator, and a Models manager. Models download once, then work offline.",
    links: [{ label: "Open AI Studio", href: "/studio" }, { label: "Chat", href: "/studio/chat" }, { label: "Models", href: "/studio/models" }], related: ["code", "text-ai", "models"] },
  { id: "code", title: "Code assistant", keys: ["code assistant", "write code", "fix code", "explain code", "coding help", "debug", "programming"],
    answer: "The Code assistant in AI Studio explains, fixes and writes code with a local model (Qwen2.5 Coder is the best pick for code). Your code never leaves your device.",
    links: [{ label: "Open Code assistant", href: "/studio/code" }], related: ["studio", "models"] },
  { id: "text-ai", title: "Summarize & translate", keys: ["summarize", "summary", "translate", "translation", "translator"],
    answer: "AI Studio's Text section can summarize long text and translate many languages into English, using dedicated local models.",
    links: [{ label: "Open Text tools", href: "/studio/text" }], related: ["studio"] },
  { id: "site-gen", title: "AI website generator", keys: ["ai website generator", "generate a website", "generate site", "ai website", "website with ai"],
    answer: "The AI website generator in AI Studio drafts a simple website from your description using a local model. You can then refine it in the Project Builder.",
    links: [{ label: "Open AI website generator", href: "/studio/site" }, { label: "Project Builder", href: "/builder" }], related: ["builder"] },
  { id: "models", title: "Which AI models?", keys: ["which models", "which model", "model size", "download size", "qwen", "llama", "smollm", "models manager", "delete model", "storage"],
    answer: "AI Studio offers models like Qwen2.5 (0.5B and 1.5B), Llama 3.2 (1B and 3B), Qwen2.5 Coder 1.5B, and SmolLM2 for devices without WebGPU. Downloads range from about 130 MB to 2.3 GB. They are cached in your browser, and the Models manager shows and removes them.",
    links: [{ label: "Open Models manager", href: "/studio/models" }], related: ["studio", "offline"] },
  { id: "privacy", title: "Is my data private?", keys: ["privacy", "private", "data", "safe", "secure", "security", "upload", "server", "tracking", "my data", "local first", "local-first", "where is my data", "stored"],
    answer: "No, nothing is uploaded. GoAI.foo is local-first: tools, AI models and your projects all run and stay in your browser. Nothing you type or paste is sent to a server.",
    links: [{ label: "Privacy policy", href: "/privacy" }], related: ["free", "offline"] },
  { id: "free", title: "Is it free?", keys: ["free", "price", "pricing", "cost", "pay", "paid", "subscription", "how much", "account", "sign up", "signup", "login", "register"],
    answer: "Yes, GoAI.foo is completely free. There is no account, no sign-up and no paid API, because everything runs on your own device.",
    links: [{ label: "Explore the tools", href: "/tools" }], related: ["privacy", "about"] },
  { id: "offline", title: "Does it work offline?", keys: ["offline", "no internet", "without internet", "internet connection"],
    answer: "Once a page and its AI model have loaded, they keep working offline, because everything runs in your browser. The first load needs a connection.",
    links: [{ label: "AI Studio", href: "/studio" }], related: ["models", "privacy"] },
  { id: "mobile", title: "Does it work on my phone?", keys: ["phone", "mobile", "iphone", "android", "tablet", "slow", "device"],
    answer: "On a phone you can use all the developer tools and the Project Builder. For AI, phones get a small, light model; bigger models work best on a desktop with a good GPU.",
    links: [{ label: "Models", href: "/studio/models" }], related: ["models", "studio"] },
  { id: "assistant", title: "Who are you?", keys: ["who are you", "are you ai", "what are you", "are you human", "your name", "chatgpt"],
    answer: "I'm the GoAI.foo assistant. I answer questions about this site, and a small AI model runs privately in your browser for anything else about GoAI.",
    links: [{ label: "About GoAI", href: "/about" }], related: ["about", "privacy"] },
  { id: "contact", title: "Contact & terms", keys: ["contact", "support", "help me", "bug", "feedback", "terms", "license", "email"],
    answer: "You can find more about the project on the About page, and the rules of use in the Terms. Privacy details are in the Privacy policy.",
    links: [{ label: "About", href: "/about" }, { label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy" }], related: ["about"] },
];

export const SUGGESTIONS = ["What is GoAI.foo?", "Which tools are there?", "How do I build a website?", "Is my data private?", "Is it free?"];

const STOP = new Set("a an the is are am do does did i me my you your to of for in on and or it this that can how what which with be please tell about use using there".split(" "));
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "") || w;
export function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff\s-]/g, " ").split(/[\s-]+/).filter(Boolean).map(stem);
}
function lev1(a: string, b: string): boolean { // edit distance <= 1
  if (a === b) return true; if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, e = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++e > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return e + (a.length - i) + (b.length - j) <= 1;
}
const tokMatch = (q: string, k: string) => q === k || (k.length >= 5 && q.length >= 4 && lev1(q, k));

/** Score an entry: each key phrase whose tokens all appear (fuzzily) in the question adds weight; multi-word phrases count more. */
export function scoreEntry(qt: string[], e: KBEntry): number {
  let best = 0, n = 0;
  for (const key of e.keys) {
    const kt = tokens(key).filter((t) => !STOP.has(t)); if (!kt.length) continue;
    if (kt.every((k) => qt.some((q) => tokMatch(q, k)))) { best = Math.max(best, kt.length * 2 + (kt.length > 1 ? 1 : 0)); n++; }
  }
  return best ? best + 0.5 * (n - 1) : 0;
}
export function rank(q: string): { e: KBEntry; s: number }[] {
  const qt = tokens(q).filter((t) => !STOP.has(t));
  return KB.map((e) => ({ e, s: scoreEntry(qt, e) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s);
}

export type Reply = { kind: "faq" | "arabic" | "greet" | "offtopic"; text: string; links: KBLink[]; chips: string[] } | { kind: "model"; facts: KBEntry[] };
const chipsFor = (e?: KBEntry) => (e?.related ?? []).map((id) => KB.find((k) => k.id === id)?.title).filter(Boolean).slice(0, 3) as string[];

/** Decide how to answer: instant KB answer, polite fixed reply, or the model with 1-3 retrieved facts. */
export function route(q: string): Reply {
  const raw = q.trim();
  if (/[\u0600-\u06ff]/.test(raw) && !/[a-z]{3}/i.test(raw))
    return { kind: "arabic", text: "Thanks for your message! GoAI.foo is available in English only for now, so please ask in English. You can start with one of these questions:", links: [], chips: SUGGESTIONS.slice(0, 3) };
  if (/^(hi|hello|hey|yo|salam|thanks|thank you|thx|ok|okay|good (morning|evening))\b[\s!.]*$/i.test(raw))
    return { kind: "greet", text: /thank|thx/i.test(raw) ? "You're welcome! Anything else about GoAI.foo?" : "Hi! Ask me anything about GoAI.foo's tools, AI Studio or the Project Builder.", links: [], chips: SUGGESTIONS.slice(0, 3) };
  const exact = KB.find((e) => e.title.toLowerCase() === raw.toLowerCase()); if (exact) return { kind: "faq", text: exact.answer, links: exact.links, chips: chipsFor(exact) };
  const r = rank(raw);
  if (r.length && r[0].s >= 2 && (r.length < 2 || r[0].s >= r[1].s + 0.5 || r[0].s >= 5)) {
    const e = r[0].e; return { kind: "faq", text: e.answer, links: e.links, chips: chipsFor(e) };
  }
  if (r.length) return { kind: "model", facts: r.slice(0, 3).map((x) => x.e) };
  return { kind: "offtopic", text: "I can only help with GoAI.foo: its free developer tools, AI Studio and the Project Builder. Here are some things you can ask:", links: [{ label: "Developer tools", href: "/tools" }, { label: "AI Studio", href: "/studio" }], chips: SUGGESTIONS.slice(0, 3) };
}

/** Short grounded prompt for the model: only the retrieved facts. */
export function factsPrompt(facts: KBEntry[]): string {
  return `You are the GoAI.foo assistant. Answer the user's question in 1-3 short sentences using ONLY these facts. If the facts don't answer it, say you're not sure and suggest the page.\nFacts:\n${facts.map((f) => "- " + f.answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "").replace(/\n/g, " ")).join("\n")}`;
}
/** Keep model text safe: drop links to pages that don't exist on the site. */
const PAGES = new Set(["/", "/tools", "/studio", "/builder", "/about", "/privacy", "/terms", "/studio/chat", "/studio/code", "/studio/text", "/studio/site", "/studio/models", ...TOOLS.map((t) => "/tools/" + t.slug)]);
export function cleanLinks(s: string): string {
  return s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, l, h) => (PAGES.has(h) ? m : l));
}

/** Grounding filter for model output: keep only sentences whose content words mostly appear in the facts or the question. */
export function grounded(out: string, facts: KBEntry[], q: string): string {
  const known = new Set(tokens(facts.map((f) => f.answer + " " + f.title + " " + f.keys.join(" ")).join(" ") + " " + q + " yes no also you your can will site goai foo"));
  const sents = out.replace(/\n+/g, " ").split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  const keep: string[] = [];
  for (const st of sents) {
    const w = tokens(st).filter((t) => !STOP.has(t) && t.length > 2); if (!w.length) continue;
    const ok = w.filter((t) => known.has(t)).length / w.length;
    if (ok >= 0.75 && !/[:]$/.test(st)) keep.push(st); else break; // stop at the first invented sentence
  }
  return keep.join(" ");
}
