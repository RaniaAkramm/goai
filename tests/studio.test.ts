// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import { trimHistory, chatTitle, codeMessages, textMessages, extractCode, parseSiteContent, quickContent, siteMessages, type Msg } from "../lib/studio/prompts";
import { renderMarkdown } from "../lib/studio/markdown";
import { MODELS, defaultModelFor, usableModels, formatSize, getModel } from "../lib/studio/models";
import { saveChat, listChats, deleteChat, getChat } from "../lib/studio/db";
import { createProject, TEMPLATE_LIST } from "../lib/builder/templates";
import { readTheme } from "../lib/builder/ops";
import { checkProject, jsSyntaxCheck } from "../lib/builder/check";

describe("studio prompts", () => {
  it("trimHistory keeps system + recent turns within budget, starting with user", () => {
    const msgs: Msg[] = [{ role: "system", content: "S" }, ...Array.from({ length: 20 }, (_, i) => ({ role: (i % 2 ? "assistant" : "user") as Msg["role"], content: "x".repeat(500) + i }))];
    const t = trimHistory(msgs, 2200);
    expect(t[0].role).toBe("system"); expect(t[1].role).toBe("user");
    expect(t.at(-1)!.content.endsWith("19")).toBe(true);
    expect(t.reduce((n, m) => n + m.content.length, 0)).toBeLessThanOrEqual(2200 + 600);
  });
  it("chatTitle", () => { expect(chatTitle("  hi  there ")).toBe("hi there"); expect(chatTitle("a".repeat(80)).length).toBeLessThanOrEqual(46); expect(chatTitle("")).toBe("New chat"); });
  it("code + text messages", () => {
    const m = codeMessages("fix", "Python", "print(1", "be brief");
    expect(m[0].role).toBe("system"); expect(m[1].content).toContain("```python"); expect(m[1].content).toContain("be brief");
    expect(codeMessages("write", "Go", "ignored", "a web server")[1].content).toContain("a web server");
    expect(codeMessages("convert", "JavaScript", "x", "", "Rust")[1].content).toContain("Rust");
    expect(textMessages("translate", "hola")[1].content).toMatch(/English/);
    expect(textMessages("rewrite", "t", "Friendly")[1].content).toContain("friendly");
  });
  it("extractCode", () => { expect(extractCode("a\n```js\nconst x=1;\n```\nb")).toBe("const x=1;"); expect(extractCode("plain")).toBe("plain"); });
  it("parseSiteContent tolerates fences/prose/trailing commas and sanitises", () => {
    const raw = 'Sure!\n```json\n{"brand":"Acme","heroTitle":"  Big   title ","features":[{"title":"Fast","text":"Very","icon":"⚡⚡⚡⚡"},{"nope":1},],"stats":[{"value":"10x","label":"faster"}],"evil":"<script>"}\n```';
    const c = parseSiteContent(raw)!;
    expect(c.brand).toBe("Acme"); expect(c.heroTitle).toBe("Big title"); expect(c.features).toHaveLength(1); expect(c.features![0].icon.length).toBeLessThanOrEqual(3);
    expect((c as Record<string, unknown>).evil).toBeUndefined();
    expect(parseSiteContent("no json")).toBeNull(); expect(parseSiteContent("{bad json")).toBeNull();
  });
  it("siteMessages + quickContent", () => { expect(siteMessages("bakery", "business")[1].content).toContain("bakery"); expect(quickContent("We bake bread. Daily.", "Crumb").heroTitle).toContain("Crumb"); });
});

describe("markdown renderer", () => {
  it("escapes HTML and renders code/lists/bold", () => {
    const h = renderMarkdown("**hi** <img src=x onerror=alert(1)>\n\n- a\n- b\n\n```js\nif (a<b) {}\n```");
    expect(h).not.toContain("<img"); expect(h).toContain("&lt;img"); expect(h).toContain("<strong>hi</strong>");
    expect(h).toContain("<ul><li>a</li><li>b</li></ul>"); expect(h).toContain("a&lt;b");
  });
  it("handles an unfinished fence while streaming", () => { expect(renderMarkdown("```py\nprint(1)")).toContain("<pre"); });
});

describe("models", () => {
  it("catalog is consistent", () => {
    expect(new Set(MODELS.map((m) => m.id)).size).toBe(MODELS.length);
    expect(getModel(defaultModelFor("code", true))?.kind).toBe("webllm");
    expect(getModel(defaultModelFor("chat", false))?.kind).toBe("transformers");
    expect(usableModels("chat", false).every((m) => m.kind === "transformers")).toBe(true);
    expect(usableModels("chat", true).length).toBeGreaterThan(3);
    expect(formatSize(945)).toBe("945 MB"); expect(formatSize(2264)).toBe("2.2 GB");
  });
});

describe("chat history (IndexedDB)", () => {
  it("save / list / delete", async () => {
    await saveChat({ id: "a", title: "A", model: "m", createdAt: 1, updatedAt: 1, messages: [{ role: "user", content: "hi" }] });
    await saveChat({ id: "b", title: "B", model: "m", createdAt: 2, updatedAt: 5, messages: [] });
    expect((await listChats()).map((c) => c.id)).toEqual(["b", "a"]);
    expect((await getChat("a"))?.messages[0].content).toBe("hi");
    await deleteChat("a"); expect((await listChats()).map((c) => c.id)).toEqual(["b"]);
  });
});

describe("builder v2 templates", () => {
  it("rich sections on home pages", () => {
    const h = createProject("business", "Sunrise").files["index.html"];
    for (const cls of ["hero", "logos", "quote", "price-card", "faq", "cta-box", "site-footer", "footer-grid"]) expect(h, cls).toContain(cls);
    expect(h).toMatch(/&copy; <span data-year>\d{4}<\/span> Sunrise\. All rights reserved\./);
    expect((h.match(/class="card"/g) ?? []).length).toBeGreaterThan(8);
  });
  it("every template has a full footer with site name and passes checks", () => {
    for (const t of TEMPLATE_LIST) { const p = createProject(t.id, "Zeta Co"); for (const f of p.pages) expect(p.files[f]).toContain("Zeta Co. All rights reserved."); expect(checkProject(p, { jsSyntax: jsSyntaxCheck }).errors).toEqual([]); }
  });
  it("applies chosen color, font, corners and dark mode", () => {
    const p = createProject("business", "X", { primary: "#ff5500", font: "Classic", style: "sharp", mode: "dark" });
    const th = readTheme(p.files["styles.css"]);
    expect(th.primary).toBe("#ff5500"); expect(th.font).toContain("Georgia"); expect(th.radius).toBe("4px"); expect(th.bg).toBe("#0e0f13");
    expect(p.files["styles.css"]).toContain("color-mix(in srgb, var(--primary)");
    expect(createProject("business", "X", { primary: "red;}" }).files["styles.css"]).toContain("--primary: #1f6feb");
  });
  it("AI content overrides copy and is escaped", () => {
    const p = createProject("business", "", { content: { brand: "Bloom", heroTitle: "Hello <b>world</b>", testimonials: [{ quote: "Great", name: "Ann Lee", role: "Chef" }] } });
    expect(p.name).toBe("Bloom"); expect(p.files["index.html"]).toContain("Hello &lt;b&gt;world&lt;/b&gt;"); expect(p.files["index.html"]).toContain(">AL<");
  });
});
