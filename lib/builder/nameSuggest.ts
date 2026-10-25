/**
 * Name → site suggestions. Pure, offline heuristic (no network, no model):
 * normalises the name (incl. Arabic → Latin transliteration), splits it into words,
 * and matches roots/morphemes from a small English + transliterated-Arabic lexicon
 * (exact substring, word-prefix and 1-edit fuzzy matches). Returns ranked suggestions.
 */
import type { SiteContent } from "./sections";

export type TemplateId = "business" | "ecommerce" | "blog" | "portfolio" | "dashboard";
export type Topic = {
  id: string; label: string; template: TemplateId; alt: TemplateId; color: string;
  roots: string[]; tagline: string; eyebrow: string; hero: (n: string) => string; heroText: string; cta: string; features: string;
};
export type Suggestion = {
  topic: string; label: string; template: TemplateId; templateName: string; color: string; tagline: string;
  reasons: string[]; score: number; confidence: "high" | "medium" | "low"; content: Partial<SiteContent>; source: "heuristic" | "model";
};

export const TEMPLATE_NAMES: Record<TemplateId, string> = { business: "Business", ecommerce: "E-commerce", blog: "Blog", portfolio: "Portfolio", dashboard: "Dashboard" };

export const TOPICS: Topic[] = [
  { id: "health", label: "Health, olive oil & natural products", template: "ecommerce", alt: "business", color: "#4d7c0f",
    roots: ["olive", "oliv", "oli", "oil", "zait", "zeit", "zayt", "zit", "zaitoun", "zaytun", "زيت", "زيتون", "health", "heal", "seha", "sihha", "saha", "shifa", "صح", "شفاء", "herb", "aashab", "leaf", "green", "vita", "vital", "bio", "nutri", "organ", "natur", "pure", "well", "care", "fit", "mint", "naana", "sage", "aloe", "argan", "honey", "asal", "عسل"],
    tagline: "Pure, natural goodness — from the grove to your door.", eyebrow: "Natural · Cold-pressed · Small-batch",
    hero: (n) => `${n}: natural products for a healthier everyday`, heroText: "Cold-pressed oils, herbal blends and wellness essentials sourced from trusted growers and delivered fresh.", cta: "Shop the collection", features: "Why customers choose us" },
  { id: "shop", label: "Online shop / marketplace", template: "ecommerce", alt: "business", color: "#7c3aed",
    roots: ["shop", "store", "mart", "market", "souq", "souk", "suq", "bazar", "bazaar", "dukkan", "deal", "cart", "buy", "sale", "outlet", "boutique", "متجر", "سوق", "دكان"],
    tagline: "Everything you love, delivered.", eyebrow: "Free shipping on orders over $50",
    hero: (n) => `Shop ${n} — quality picks, fair prices`, heroText: "A curated catalogue with fast delivery, easy returns and secure checkout.", cta: "Browse products", features: "Why shop with us" },
  { id: "fashion", label: "Fashion & beauty", template: "ecommerce", alt: "portfolio", color: "#be185d",
    roots: ["style", "wear", "mode", "chic", "glam", "beauty", "beaut", "jamal", "jameel", "zina", "silk", "harir", "rose", "ward", "lux", "belle", "bella", "vogue", "kohl", "abaya", "jamil", "جمال", "أزياء", "عطر", "atr", "perfum", "scent"],
    tagline: "Effortless style, made to last.", eyebrow: "New season collection",
    hero: (n) => `${n} — style that feels like you`, heroText: "Thoughtfully designed pieces and beauty essentials, crafted from quality materials.", cta: "Shop new arrivals", features: "Crafted with care" },
  { id: "food", label: "Food, café & bakery", template: "business", alt: "ecommerce", color: "#b45309",
    roots: ["bake", "bakery", "bread", "khubz", "cafe", "coffee", "qahwa", "kahwa", "kitchen", "chef", "food", "taste", "tamr", "dates", "sweet", "halwa", "spice", "bahar", "grill", "pizza", "tea", "shai", "matbakh", "مطبخ", "قهوة", "خبز", "حلويات"],
    tagline: "Fresh, honest food made every day.", eyebrow: "Open daily · Order ahead",
    hero: (n) => `Welcome to ${n}`, heroText: "Seasonal menus, locally sourced ingredients and a warm table waiting for you.", cta: "See the menu", features: "What makes us special" },
  { id: "tech", label: "Tech, software & AI", template: "business", alt: "dashboard", color: "#1f6feb",
    roots: ["tech", "soft", "code", "byte", "cloud", "bit", "dev", "logic", "sys", "net", "app", "cyber", "quantum", "robot", "ai", "smart", "digital", "web", "تقنية", "برمج", "tiqni", "barmaj"],
    tagline: "Software that moves your business forward.", eyebrow: "Built for modern teams",
    hero: (n) => `${n} builds software that just works`, heroText: "From idea to launch, we design, build and run reliable digital products and AI tools.", cta: "Book a demo", features: "What we deliver" },
  { id: "data", label: "Analytics & admin dashboard", template: "dashboard", alt: "business", color: "#4f46e5",
    roots: ["dash", "metric", "analytic", "stat", "insight", "track", "admin", "panel", "monitor", "report", "ops", "data", "kpi", "chart", "graph", "ledger", "بيانات", "لوحة", "تحليل"],
    tagline: "All your numbers in one clear view.", eyebrow: "Real-time insights",
    hero: (n) => `${n} — your numbers, at a glance`, heroText: "Track KPIs, orders and performance in one live dashboard.", cta: "Open dashboard", features: "Key features" },
  { id: "writing", label: "Blog, news & writing", template: "blog", alt: "portfolio", color: "#9a3412",
    roots: ["blog", "journal", "diary", "story", "stories", "qissa", "hikaya", "note", "press", "ink", "pen", "qalam", "kalima", "word", "read", "news", "akhbar", "times", "post", "chronicle", "letter", "مدون", "قصة", "قلم", "أخبار", "كلمة"],
    tagline: "Stories, ideas and notes worth reading.", eyebrow: "Fresh articles every week",
    hero: (n) => `${n}: ideas worth reading`, heroText: "Essays, guides and stories — written with care and published regularly.", cta: "Read the latest", features: "Popular topics" },
  { id: "creative", label: "Creative studio & portfolio", template: "portfolio", alt: "business", color: "#f97316",
    roots: ["studio", "design", "art", "fann", "photo", "lens", "pixel", "creative", "craft", "folio", "visual", "rasm", "draw", "film", "motion", "brand", "atelier", "canvas", "color", "colour", "فن", "تصميم", "تصوير", "رسم"],
    tagline: "Design and visuals that tell your story.", eyebrow: "Selected work 2020–2026",
    hero: (n) => `${n} — design with purpose`, heroText: "Branding, photography and digital design for people who care about the details.", cta: "View my work", features: "Services" },
  { id: "pro", label: "Consulting, finance & legal", template: "business", alt: "blog", color: "#0f766e",
    roots: ["consult", "law", "legal", "finance", "capital", "invest", "account", "partner", "group", "solution", "advis", "trust", "wealth", "fund", "mal", "mohami", "muhami", "tax", "audit", "محام", "مال", "استشار"],
    tagline: "Clear advice. Measurable results.", eyebrow: "Trusted advisors since 2012",
    hero: (n) => `${n}: expert guidance you can rely on`, heroText: "We help businesses and families make confident financial and legal decisions.", cta: "Book a consultation", features: "How we help" },
  { id: "home", label: "Home, real estate & interiors", template: "business", alt: "portfolio", color: "#a16207",
    roots: ["home", "house", "bayt", "beit", "dar", "nest", "estate", "aqar", "realty", "interior", "decor", "living", "villa", "manzil", "بيت", "دار", "عقار"],
    tagline: "Find the place you'll love coming home to.", eyebrow: "Homes · Interiors · Renovation",
    hero: (n) => `${n} — spaces made for living`, heroText: "Homes, interiors and renovation services with honest pricing and expert guidance.", cta: "Explore listings", features: "Our services" },
  { id: "travel", label: "Travel & tourism", template: "business", alt: "blog", color: "#0284c7",
    roots: ["travel", "safar", "trip", "tour", "voyage", "journey", "sea", "bahr", "sky", "sama", "wander", "nomad", "rihla", "سفر", "رحلة", "سياحة"],
    tagline: "Journeys you'll talk about for years.", eyebrow: "Tailor-made trips",
    hero: (n) => `Travel further with ${n}`, heroText: "Hand-picked destinations, local guides and stress-free planning from start to finish.", cta: "Plan your trip", features: "Why travel with us" },
  { id: "education", label: "Education & learning", template: "business", alt: "blog", color: "#7c3aed",
    roots: ["learn", "academ", "school", "madras", "ilm", "edu", "tutor", "course", "kids", "atfal", "class", "study", "talib", "taalim", "skill", "تعليم", "مدرس", "علم", "أكاديمي"],
    tagline: "Learning that sticks.", eyebrow: "Courses for every level",
    hero: (n) => `Learn with ${n}`, heroText: "Practical courses and tutoring from experienced teachers — online and in person.", cta: "Browse courses", features: "What you'll get" },
];

const AR: Record<string, string> = { "ا": "a", "أ": "a", "إ": "i", "آ": "a", "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z", "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "ة": "a", "و": "o", "ي": "i", "ى": "a", "ئ": "i", "ؤ": "o", "ء": "" };

/** Arabic → rough Latin transliteration (e.g. "أوليبيا" → "olibia"). */
export const transliterate = (s: string) => s.replace(/[\u064B-\u0652\u0640]/g, "").replace(/(^|\s)[اأآ]و(?=[\u0600-\u06FF])/g, "$1o").replace(/[\u0600-\u06FF]/g, (c) => AR[c] ?? "");

/** Split a name into lowercase words: spaces, punctuation, camelCase and digits. */
export function splitWords(name: string): string[] {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\.(com|net|org|io|foo|app|shop|store|co)\b/gi, " $1").toLowerCase()
    .split(/[^a-z0-9\u0600-\u06FF]+/).filter(Boolean);
}

export function lev(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
  return d[b.length];
}

const isArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

type Hit = { root: string; word: string; kind: "exact" | "prefix" | "inside" | "fuzzy"; w: number };

function matchTopic(t: Topic, words: string[], latinWords: string[]): Hit[] {
  const hits: Hit[] = [];
  for (const root of t.roots) {
    const pool = isArabic(root) ? words : latinWords;
    for (const word of pool) {
      let h: Hit | null = null;
      if (word === root) h = { root, word, kind: "exact", w: 3 };
      else if (word.startsWith(root) && (root.length >= 3 || word.length <= 4)) h = { root, word, kind: "prefix", w: root.length >= 4 ? 2.5 : 2 };
      else if (root.length >= 4 && word.includes(root)) h = { root, word, kind: "inside", w: 1.5 };
      else if (root.length >= 4 && word.length >= 4 && lev(word.slice(0, root.length), root) === 1) h = { root, word, kind: "fuzzy", w: 1 };
      if (h) { hits.push(h); break; }
    }
  }
  return hits;
}

function reason(h: Hit, name: string): string {
  const w = isArabic(h.root) ? h.word : h.word;
  if (h.kind === "exact") return `“${w}” is a ${h.root.length > 3 ? "known" : "common"} word for this field`;
  if (h.kind === "prefix") return `“${w}” starts with “${h.root}”`;
  if (h.kind === "inside") return `“${w}” contains “${h.root}”`;
  return `“${w}” sounds like “${h.root}”${name ? "" : ""}`;
}

export function buildContent(t: Topic, name: string): Partial<SiteContent> {
  const n = name.trim() || "Your brand";
  return { brand: n, tagline: t.tagline, eyebrow: t.eyebrow, heroTitle: t.hero(n), heroText: t.heroText, ctaPrimary: t.cta, featuresTitle: t.features };
}

export function makeSuggestion(t: Topic, name: string, template: TemplateId, score: number, reasons: string[], source: Suggestion["source"] = "heuristic"): Suggestion {
  return { topic: t.id, label: t.label, template, templateName: TEMPLATE_NAMES[template], color: t.color, tagline: t.tagline, reasons, score,
    confidence: score >= 3 ? "high" : score >= 1.5 ? "medium" : "low", content: buildContent(t, name), source };
}

/** Score every topic for a name (exposed for the model re-ranker). */
export function scoreTopics(name: string): { topic: Topic; score: number; hits: Hit[] }[] {
  const words = splitWords(name);
  const latinWords = [...new Set(words.flatMap((w) => (isArabic(w) ? [transliterate(w)] : [w])).filter(Boolean))];
  return TOPICS.map((topic) => { const hits = matchTopic(topic, words, latinWords); return { topic, hits, score: hits.reduce((a, h) => a + h.w, 0) }; })
    .sort((a, b) => b.score - a.score);
}

/** Top-N suggestions with reasons. Always returns N items (falls back to sensible defaults). */
export function suggestFromName(name: string, n = 3): Suggestion[] {
  const out: Suggestion[] = []; const seen = new Set<string>();
  const add = (s: Suggestion) => { const k = `${s.topic}:${s.template}`; if (!seen.has(k) && out.length < n) { seen.add(k); out.push(s); } };
  if (!name.trim()) return [];
  const ranked = scoreTopics(name).filter((r) => r.score > 0);
  for (const r of ranked) add(makeSuggestion(r.topic, name, r.topic.template, r.score, r.hits.slice(0, 3).map((h) => reason(h, name))));
  if (ranked[0]) add(makeSuggestion(ranked[0].topic, name, ranked[0].topic.alt, ranked[0].score * 0.6, [`Alternative layout for ${ranked[0].topic.label.toLowerCase()}`]));
  for (const id of ["pro", "creative", "writing"]) { const t = TOPICS.find((x) => x.id === id)!; add(makeSuggestion(t, name, t.template, 0, ["No strong match in the name — a versatile starting point"])); }
  return out;
}
