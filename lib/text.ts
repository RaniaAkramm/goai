const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const wseg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "word" }) : null;

export function stats(t: string) {
  const characters = seg ? [...seg.segment(t)].length : [...t].length;
  let words = 0;
  if (wseg) for (const s of wseg.segment(t)) { if ((s as { isWordLike?: boolean }).isWordLike) words++; }
  else words = (t.match(/\S+/g) ?? []).length;
  return {
    characters,
    charactersNoSpaces: seg ? [...seg.segment(t.replace(/\s/g, ""))].length : [...t.replace(/\s/g, "")].length,
    words,
    lines: t === "" ? 0 : t.split(/\r\n|\r|\n/).length,
    bytes: new TextEncoder().encode(t).length,
  };
}

const words = (t: string) => t.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const cap = (w: string) => w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase();

export const transforms = {
  upper: (t: string) => t.toLocaleUpperCase(),
  lower: (t: string) => t.toLocaleLowerCase(),
  title: (t: string) => t.toLocaleLowerCase().replace(/(^|[\s\-_(\["'])(\p{L})/gu, (_, p, c) => p + c.toLocaleUpperCase()),
  sentence: (t: string) => t.toLocaleLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, p, c) => p + c.toLocaleUpperCase()),
  camel: (t: string) => words(t).map((w, i) => (i ? cap(w) : w.toLocaleLowerCase())).join(""),
  pascal: (t: string) => words(t).map(cap).join(""),
  snake: (t: string) => words(t).map((w) => w.toLocaleLowerCase()).join("_"),
  kebab: (t: string) => words(t).map((w) => w.toLocaleLowerCase()).join("-"),
  collapseSpaces: (t: string) => t.replace(/[^\S\r\n]+/g, " ").replace(/^ +| +$/gm, "").replace(/(\r?\n){3,}/g, "\n\n").trim(),
  trimLines: (t: string) => t.split(/\r?\n/).map((l) => l.trim()).join("\n"),
  removeEmptyLines: (t: string) => t.split(/\r?\n/).filter((l) => l.trim() !== "").join("\n"),
  reverse: (t: string) => (seg ? [...seg.segment(t)].map((s) => s.segment) : [...t]).reverse().join(""),
};
export type TransformKey = keyof typeof transforms;
