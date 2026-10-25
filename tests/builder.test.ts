// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { createProject, TEMPLATE_LIST } from "../lib/builder/templates";
import { addPage, renamePage, duplicatePage, deletePage, movePage, setHomepage, normalizePageName, readTheme, writeTheme, History, setPageTitle } from "../lib/builder/ops";
import { checkProject, jsSyntaxCheck } from "../lib/builder/check";
import { buildExportFiles, zipProject, safeSegment } from "../lib/builder/export";
import { validateAsset, sniff } from "../lib/builder/assets";
import { buildPreview, applyElement, readElement, elementAt } from "../lib/builder/preview";

describe("templates", () => {
  it("all templates create valid projects that pass checks without errors", () => {
    expect(TEMPLATE_LIST.map((t) => t.id)).toEqual(["business", "ecommerce", "blog", "portfolio", "dashboard", "blank"]);
    for (const t of TEMPLATE_LIST) {
      const p = createProject(t.id);
      expect(p.files["index.html"]).toContain("<!DOCTYPE html>");
      expect(p.files["styles.css"]).toContain("@media");
      const r = checkProject(p, { jsSyntax: jsSyntaxCheck });
      expect(r.errors, t.id + JSON.stringify(r.errors)).toEqual([]);
      expect(r.passed.length).toBeGreaterThan(3);
    }
  });
});

describe("page ops", () => {
  it("normalize names", () => { expect(normalizePageName("My Page!")).toBe("my-page.html"); expect(() => normalizePageName("../")).toThrow(); expect(normalizePageName("../../etc")).toBe("etc.html"); });
  it("add / rename updates links / duplicate / delete / move", () => {
    let p = createProject("business");
    p = addPage(p, "Pricing");
    expect(p.pages).toContain("pricing.html");
    expect(p.files["index.html"]).toContain('href="pricing.html"');
    p = renamePage(p, "about.html", "company");
    expect(p.files["about.html"]).toBeUndefined();
    expect(p.files["index.html"]).toContain('href="company.html"');
    expect(p.files["index.html"]).not.toContain('href="about.html"');
    p = duplicatePage(p, "contact.html"); expect(p.pages).toContain("contact-copy.html");
    p = deletePage(p, "contact-copy.html"); expect(p.files["contact-copy.html"]).toBeUndefined();
    expect(() => deletePage(p, "index.html")).toThrow();
    const before = p.pages.indexOf("pricing.html"); p = movePage(p, "pricing.html", -1); expect(p.pages.indexOf("pricing.html")).toBe(before - 1);
    expect(checkProject(p).errors).toEqual([]);
  });
  it("set homepage swaps files and links", () => {
    let p = createProject("blog");
    const postHtml = p.files["post.html"];
    p = setHomepage(p, "post.html");
    expect(p.pages[0]).toBe("index.html");
    expect(p.files["index.html"]).toContain("Start small, ship often</h1>");
    expect(p.files["post.html"]).toContain("Notes on building things");
    expect(postHtml).toContain('href="index.html"');
    expect(checkProject(p).warnings.filter((w) => w.includes("not found"))).toEqual([]);
  });
  it("page title updates nav", () => { const p = setPageTitle(createProject("business"), "about.html", "Our Story"); expect(p.files["index.html"]).toContain(">Our Story</a>"); });
});

describe("theme + history", () => {
  it("read/write css vars", () => {
    const css = createProject("business").files["styles.css"];
    expect(readTheme(css).primary).toBe("#1f6feb");
    const c2 = writeTheme(css, "primary", "#ff0000; } body { x");
    expect(readTheme(c2).primary).toBe("#ff0000  body  x");
    expect(readTheme(writeTheme(css, "radius", "4px")).radius).toBe("4px");
  });
  it("bounded history", () => {
    const h = new History<number>(3);
    for (let i = 0; i < 5; i++) h.push(i);
    expect(h.size).toBe(3);
    expect(h.undo(5)).toBe(4); expect(h.redo(4)).toBe(5); expect(h.canRedo).toBe(false);
  });
});

describe("check", () => {
  it("detects errors and warnings honestly", () => {
    const p = createProject("blank");
    p.files["index.html"] = p.files["index.html"].replace("</main>", '<a href="missing.html">x</a><img src="assets/nope.png"></main>');
    p.files["styles.css"] += "\n.broken { color: red;";
    p.files["script.js"] += "\nfunction (";
    const r = checkProject(p, { jsSyntax: jsSyntaxCheck });
    expect(r.errors.some((e) => e.includes("nope.png"))).toBe(true);
    expect(r.errors.some((e) => e.includes("unbalanced"))).toBe(true);
    expect(r.errors.some((e) => e.includes("script.js"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("missing.html"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("alt text"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("basic static checks"))).toBe(true);
  });
  it("missing index", () => { const p = createProject("blank"); delete p.files["index.html"]; expect(checkProject(p).errors[0]).toMatch(/index.html/); });
});

describe("export", () => {
  it("static export layout", () => {
    const p = createProject("portfolio"); p.backend = false;
    const f = buildExportFiles(p, [{ name: "me.png", data: new Uint8Array([1]) }]);
    expect(Object.keys(f).sort()).toEqual([".gitignore", "README.md", "assets/me.png", "contact.html", "index.html", "script.js", "styles.css", "work.html"]);
  });
  it("backend export with parameterized SQL and no secrets", () => {
    const p = createProject("business");
    const f = buildExportFiles(p, [], true);
    for (const k of ["package.json", "server.js", "db/init.js", "db/schema.sql", ".env.example", "public/index.html", "README.md"]) expect(f[k], k).toBeDefined();
    const server = strFromU8(f["server.js"]);
    expect(server).toContain("db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)')");
    expect(server).not.toMatch(/\$\{.*\}.*(INSERT|SELECT)/);
    expect(strFromU8(f[".env.example"])).toContain("replace-with");
    expect(strFromU8(f[".gitignore"])).toContain(".env");
    expect(JSON.parse(strFromU8(f["package.json"])).scripts.start).toBe("node server.js");
  });
  it("zip round trip + path safety", () => {
    const p = createProject("blank"); p.name = "My Cool Site";
    const z = unzipSync(zipProject(p, [{ name: "../../evil.png", data: new Uint8Array([9]) }]));
    expect(Object.keys(z)).toContain("my-cool-site/index.html");
    expect(Object.keys(z)).toContain("my-cool-site/assets/evil.png");
    expect(Object.keys(z).every((k) => !k.includes(".."))).toBe(true);
    expect(safeSegment("a/../b c.png")).toBe("b-c.png");
  });
});

describe("assets", () => {
  it("validates type/size/ext", () => {
    expect(validateAsset("a.png", "image/png", 10, 0)).toBeNull();
    expect(validateAsset("a.exe", "application/x-msdownload", 10, 0)).toMatch(/not allowed/);
    expect(validateAsset("a.jpg", "image/png", 10, 0)).toMatch(/extension/);
    expect(validateAsset("a.png", "image/png", 6e6, 0)).toMatch(/5 MB/);
    expect(validateAsset("a.png", "image/png", 10, 50 * 1024 * 1024)).toMatch(/50 MB/);
  });
  it("sniffs magic bytes", () => {
    expect(sniff(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), "image/png")).toBe(true);
    expect(sniff(new Uint8Array([1, 2, 3, 4]), "image/png")).toBe(false);
    expect(sniff(new TextEncoder().encode("<svg xmlns='x'>"), "image/svg+xml")).toBe(true);
  });
});

describe("preview + visual edit", () => {
  it("inlines css/js, applies CSP, maps assets", () => {
    const p = createProject("business");
    p.files["index.html"] = p.files["index.html"].replace("</main>", '<img src="assets/logo.png" alt="Logo"></main>');
    const out = buildPreview(p, "index.html", { "assets/logo.png": "data:image/png;base64,AAAA" }, false);
    expect(out).toContain("Content-Security-Policy");
    expect(out).not.toContain('href="styles.css"');
    expect(out).toContain("--primary");
    expect(out).toContain('src="data:image/png;base64,AAAA"');
    expect(out).toContain("Mobile navigation toggle");
    expect(buildPreview(p, "index.html", {}, true)).not.toContain("Mobile navigation toggle");
  });
  it("edits text and style and writes back", () => {
    const p = createProject("business");
    const doc = new DOMParser().parseFromString(p.files["index.html"], "text/html");
    const idx = [...doc.body.querySelectorAll("*")].findIndex((e) => e.tagName === "H1");
    const html = applyElement(p.files["index.html"], idx, { text: "New headline", color: "#ff0000", padding: "10px" });
    expect(html).toContain("New headline");
    const d2 = new DOMParser().parseFromString(html, "text/html");
    const props = readElement(elementAt(d2, idx)!);
    expect(props.text).toBe("New headline"); expect(props.padding).toBe("10px");
    expect(() => applyElement(html, idx, { color: "red;}</style><script>" })).toThrow();
    const ai = [...d2.body.querySelectorAll("*")].findIndex((e) => e.tagName === "A" && e.getAttribute("href") === "contact.html" && e.classList.contains("btn"));
    expect(() => applyElement(html, ai, { href: "javascript:alert(1)" })).toThrow();
    expect(applyElement(html, ai, { href: "about.html" })).toContain('class="btn" href="about.html"');
  });
});
