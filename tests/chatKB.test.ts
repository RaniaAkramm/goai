import { describe, it, expect } from "vitest";
import { route, cleanLinks, factsPrompt, KB, SUGGESTIONS } from "../lib/chatKB";
import { TOOLS } from "../lib/tools";

const faq = (q: string) => { const r = route(q); return r.kind === "faq" ? KB.find((k) => k.answer === r.text)?.id : r.kind; };
describe("chat KB routing", () => {
  it.each([
    ["What is GoAI.foo?", "about"], ["which tools do you have", "tools"], ["how do i pretty print json", "json-formatter"],
    ["convert my excel csv into json", "json-csv"], ["is it really free?", "free"], ["do you upload my data to a server", "privacy"],
    ["Can I make a landing page?", "builder"], ["does it work without internet", "offline"], ["jsn formater", "json-formatter"],
    ["regx tester", "regex"], ["sha256 of a file", "hash"], ["how do I compare two files", "diff"], ["decode base64 string", "base64"],
    ["count words in my essay", "text-tools"], ["live html preview", "playground"],
  ])("%s -> %s", (q, id) => expect(faq(q)).toBe(id));
  it("off-topic gets a polite redirect", () => { expect(route("what's the weather in Paris").kind).toBe("offtopic"); expect(route("write me a poem about cats").kind).toBe("offtopic"); });
  it("Arabic gets a polite English-only reply", () => { const r = route("ما هو هذا الموقع؟"); expect(r.kind).toBe("arabic"); });
  it("greetings", () => expect(route("hello!").kind).toBe("greet"));
  it("ambiguous goes to the model with 1-3 facts", () => { const r = route("is the builder free"); expect(r.kind).toBe("model"); if (r.kind === "model") expect(r.facts.length).toBeLessThanOrEqual(3); });
  it("every tool has an entry with a working link", () => { for (const t of TOOLS) expect(KB.find((k) => k.id === t.slug)?.links[0].href).toBe("/tools/" + t.slug); });
  it("suggestions all answer instantly", () => { for (const s of SUGGESTIONS) expect(route(s).kind).toBe("faq"); });
  it("related chips answer instantly", () => { for (const e of KB) for (const id of e.related ?? []) { const t = KB.find((k) => k.id === id)!; expect(faq(t.title), t.title).toBe(id); } });
  it("cleanLinks drops invented pages", () => expect(cleanLinks("[A](/tools/regex) [B](/pricing)")).toBe("[A](/tools/regex) B"));
  it("facts prompt is short", () => expect(factsPrompt(KB.slice(0, 3)).length).toBeLessThan(1600));
});
import { grounded } from "../lib/chatKB";
describe("grounded", () => {
  const facts = KB.filter((k) => k.id === "builder" || k.id === "free");
  it("keeps supported sentences, drops invented ones", () => {
    const out = "The Project Builder is free and lets you export a ZIP. The platform also has a community forum where users share projects.";
    expect(grounded(out, facts, "is the builder free")).toBe("The Project Builder is free and lets you export a ZIP.");
  });
  it("drops invented UI steps", () => expect(grounded("Click the + button at the top right corner of the screen.", facts, "export")).toBe(""));
});
describe("export", () => { it.each(["can I export json from the builder", "how do I export my site", "download my website as zip"])("%s", (q) => expect(faq(q)).toBe("export")); });
