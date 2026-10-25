export type RegexMatch = { index: number; end: number; text: string; groups: (string | undefined)[]; named?: Record<string, string | undefined> };
export type RegexResult = { ok: true; matches: RegexMatch[]; truncated: boolean } | { ok: false; error: string };

export const VALID_FLAGS = "dgimsuyv";

export function runRegex(pattern: string, flags: string, text: string, limit = 5000): RegexResult {
  const bad = [...flags].find((f) => !VALID_FLAGS.includes(f));
  if (bad) return { ok: false, error: `Unknown flag "${bad}".` };
  let re: RegExp;
  try { re = new RegExp(pattern, flags); } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
  const matches: RegexMatch[] = [];
  if (!re.global && !re.sticky) {
    const m = re.exec(text);
    if (m) matches.push(toMatch(m));
    return { ok: true, matches, truncated: false };
  }
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = g.exec(text))) {
    matches.push(toMatch(m));
    if (m[0] === "") g.lastIndex += re.unicode || re.unicodeSets ? Math.max(1, String.fromCodePoint(text.codePointAt(g.lastIndex) ?? 0).length) : 1;
    if (matches.length >= limit) return { ok: true, matches, truncated: true };
    if (!re.global) break;
  }
  return { ok: true, matches, truncated: false };
}
function toMatch(m: RegExpExecArray): RegexMatch {
  return { index: m.index, end: m.index + m[0].length, text: m[0], groups: m.slice(1), named: m.groups ? { ...m.groups } : undefined };
}
