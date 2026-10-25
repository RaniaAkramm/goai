import { describe, it, expect } from "vitest";
import { suggestFromName, transliterate, splitWords, lev } from "../lib/builder/nameSuggest";

const top = (n: string) => suggestFromName(n)[0];
describe("name suggestions (offline heuristic)", () => {
  it("Olibea → shop template, health/olive topic, green palette", () => {
    const s = top("Olibea");
    expect(s.template).toBe("ecommerce"); expect(s.topic).toBe("health");
    expect(s.color).toBe("#4d7c0f"); expect(s.reasons.length).toBeGreaterThan(0);
    expect(s.content.brand).toBe("Olibea"); expect(s.content.heroTitle).toContain("Olibea");
  });
  it("Arabic أوليبيا → same result via transliteration", () => {
    expect(transliterate("أوليبيا")).toBe("olibia");
    const s = top("أوليبيا"); expect(s.topic).toBe("health"); expect(s.template).toBe("ecommerce");
  });
  it("Arabic words match natively", () => { expect(top("زيت الزيتون").topic).toBe("health"); expect(top("متجر نور").template).toBe("ecommerce"); });
  it.each([
    ["Sunrise Bakery", "food", "business"], ["PixelForge Studio", "creative", "portfolio"], ["MetricsHub", "data", "dashboard"],
    ["Inkwell Journal", "writing", "blog"], ["Souq Al Bahar", "shop", "ecommerce"], ["Northstar Consulting", "pro", "business"],
    ["CodeNest", "tech", "business"], ["Dar Al Ilm Academy", "education", "business"], ["Glamour Beauty", "fashion", "ecommerce"],
  ])("%s → %s / %s", (n, topic, tpl) => { const s = top(n); expect(s.topic).toBe(topic); expect(s.template).toBe(tpl); });
  it("fuzzy match tolerates a typo", () => expect(top("Jurnal Daily").topic).toBe("writing"));
  it("always returns 3 distinct suggestions; empty name → none", () => {
    for (const n of ["Olibea", "Xyzzq", "Sunrise Bakery"]) { const s = suggestFromName(n); expect(s).toHaveLength(3); expect(new Set(s.map((x) => x.topic + x.template)).size).toBe(3); }
    expect(top("Xyzzq").confidence).toBe("low"); expect(suggestFromName("  ")).toEqual([]);
  });
  it("helpers", () => { expect(splitWords("CodeNest.io shop")).toEqual(["code", "nest", "io", "shop"]); expect(lev("jurnal", "journal")).toBe(1); });
});
