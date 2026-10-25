/**
 * Optional "Smarter suggestion": re-ranks topics with a small zero-shot NLI classifier
 * (Xenova/mobilebert-uncased-mnli, ~25 MB quantised) running locally via Transformers.js.
 * Free, no account, no API key; weights are cached by the browser after first download.
 */
import { TOPICS, scoreTopics, makeSuggestion, transliterate, type Suggestion } from "./nameSuggest";

export const NAME_MODEL_ID = "Xenova/mobilebert-uncased-mnli";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipe: Promise<any> | null = null;

export async function smarterSuggest(name: string, onProgress?: (text: string) => void, n = 3): Promise<Suggestion[]> {
  if (!pipe) {
    pipe = import("@huggingface/transformers").then((t) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t.pipeline as any)("zero-shot-classification", NAME_MODEL_ID, {
        progress_callback: (p: { status: string; loaded?: number; total?: number }) => { if (p.status === "progress" && p.total) onProgress?.(`Downloading model… ${Math.round(((p.loaded ?? 0) / p.total) * 100)}%`); },
      }));
    pipe.catch(() => { pipe = null; });
  }
  const clf = await pipe;
  onProgress?.("Thinking…");
  const heur = scoreTopics(name);
  const hints = heur.filter((h) => h.score > 0).flatMap((h) => h.hits.map((x) => x.root)).filter((r) => !/[\u0600-\u06FF]/.test(r));
  const latin = transliterate(name);
  const text = `A website called "${latin}".${hints.length ? ` The name suggests ${hints.slice(0, 4).join(", ")}.` : ""}`;
  const labels = TOPICS.map((t) => t.label);
  const r: { labels: string[]; scores: number[] } = await clf(text, labels, { hypothesis_template: "This website is about {}.", multi_label: false });
  const heurMax = Math.max(1, ...heur.map((h) => h.score));
  const combined = TOPICS.map((t) => {
    const p = r.scores[r.labels.indexOf(t.label)] ?? 0;
    const h = (heur.find((x) => x.topic.id === t.id)?.score ?? 0) / heurMax;
    return { t, p, score: 0.6 * p + 0.4 * h };
  }).sort((a, b) => b.score - a.score);
  return combined.slice(0, n).map(({ t, p, score }) => {
    const s = makeSuggestion(t, name, t.template, score * 5, [`Local AI model: ${Math.round(p * 100)}% match for “${t.label}”`], "model");
    return s;
  });
}
