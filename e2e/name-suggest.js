const { chromium } = require("playwright");
const B = "http://localhost:3311", S = "/workspace/goai/docs/screenshots/";
(async () => {
  const br = await chromium.launch(); const res = []; const ok = (n, c) => res.push(`${c ? "PASS" : "FAIL"} ${n}`);
  const p = await br.newPage({ viewport: { width: 1440, height: 1000 } }); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(B + "/builder"); await p.fill("#pname", "Olibea");
  const cards = p.getByTestId("name-suggestion"); await cards.first().waitFor();
  ok("3 suggestions shown", (await cards.count()) === 3);
  const first = await cards.first().textContent();
  ok("Olibea top = E-commerce health", first.includes("E-commerce") && first.includes("olive"));
  await p.getByTestId("name-suggestions").screenshot({ path: S + "builder-name-suggest-olibea.png" });
  await cards.first().getByRole("button", { name: "Apply" }).click();
  ok("color pre-filled", (await p.inputValue("#opt-color")) === "#4d7c0f");
  ok("template highlighted", await p.locator("#tpl-ecommerce", { hasText: "Suggested" }).isVisible());
  await p.screenshot({ path: S + "builder-name-suggest-applied.png", fullPage: true });
  await p.fill("#pname", "أوليبيا"); await cards.first().waitFor();
  ok("Arabic name → health", (await cards.first().textContent()).includes("olive"));
  await p.getByTestId("name-suggestions").screenshot({ path: S + "builder-name-suggest-arabic.png" });
  await p.goto(B + "/builder"); await p.fill("#pname", "Olibea"); await cards.first().waitFor(); await cards.first().getByRole("button", { name: /Apply/ }).click();
  await p.getByRole("button", { name: /Create E-commerce site/ }).click(); await p.waitForURL(/edit\?id=/);
  const id = new URL(p.url()).searchParams.get("id");
  const html = await p.evaluate(async (id) => { const r = indexedDB.open("goai-builder"); const db = await new Promise((s) => (r.onsuccess = () => s(r.result))); const proj = await new Promise((s) => { const q = db.transaction("projects").objectStore("projects").get(id); q.onsuccess = () => s(q.result); }); return proj.files["index.html"].replace('<link rel="stylesheet" href="styles.css">', "<style>" + proj.files["styles.css"] + "</style>"); }, id);
  ok("copy pre-filled in site", html.includes("natural products for a healthier everyday"));
  const v = await br.newPage({ viewport: { width: 1440, height: 900 } }); await v.setContent(html); await v.waitForTimeout(300);
  await v.screenshot({ path: S + "builder-name-suggest-site.png" }); await v.close();
  if (process.env.AI) {
    await p.goto(B + "/builder"); await p.fill("#pname", "Olibea"); await p.getByTestId("smarter").click();
    try { await p.getByText("Ranked by a local AI model").waitFor({ timeout: 240000 }); ok("smarter (model) suggestion", true); await p.getByTestId("name-suggestions").screenshot({ path: S + "builder-name-suggest-ai.png" }); console.log(await cards.allTextContents()); }
    catch (e) { ok("smarter (model) suggestion: " + (await p.getByTestId("name-suggestions").textContent()).slice(0, 300), false); }
  }
  ok("no page errors", errs.length === 0 || (console.log(errs), false));
  console.log(res.join("\n")); await br.close();
})();
