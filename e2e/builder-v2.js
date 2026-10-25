const { chromium, devices } = require("playwright");
const B = "http://localhost:3311", S = "/workspace/goai/docs/screenshots/";
(async () => {
  const br = await chromium.launch(); const res = []; const ok = (n, c) => res.push(`${c ? "PASS" : "FAIL"} ${n}`);
  const ctx = await br.newContext({ viewport: { width: 1440, height: 950 } }); const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(B + "/builder"); await p.screenshot({ path: S + "builder-home-v2.png" });
  for (const [tpl, color, font, mode] of [["business", "#0f766e", "Modern", "auto"], ["ecommerce", "", "", "auto"], ["blog", "", "Classic", "auto"], ["portfolio", "#f97316", "", "dark"]]) {
    await p.goto(B + "/builder"); await p.fill("#pname", tpl === "business" ? "Northstar Consulting" : "");
    if (color) await p.locator("#opt-color").fill(color);
    if (font) await p.selectOption("#opt-font", font);
    await p.selectOption("#opt-mode", mode);
    await p.click(`button:has-text('Use ${tpl === "ecommerce" ? "E-commerce" : tpl[0].toUpperCase() + tpl.slice(1)}')`);
    await p.waitForURL(/edit\?id=/); const id = new URL(p.url()).searchParams.get("id");
    // render the real exported HTML standalone for a full-page shot
    const html = await p.evaluate(async (id) => { const r = indexedDB.open("goai-builder"); const db = await new Promise((s) => (r.onsuccess = () => s(r.result))); const proj = await new Promise((s) => { const q = db.transaction("projects").objectStore("projects").get(id); q.onsuccess = () => s(q.result); }); return proj.files["index.html"].replace('<link rel="stylesheet" href="styles.css">', "<style>" + proj.files["styles.css"] + "</style>").replace('<script src="script.js"></script>', "<script>" + proj.files["script.js"] + "</script>"); }, id);
    const v = await br.newPage({ viewport: { width: 1440, height: 900 } }); await v.setContent(html); await v.waitForTimeout(300);
    const sections = await v.locator("main section, main article").count();
    ok(`${tpl}: rich page (${sections} sections)`, sections >= 3);
    ok(`${tpl}: footer`, (await v.textContent(".site-footer")).includes("All rights reserved"));
    if (color) ok(`${tpl}: chosen color applied`, (await v.evaluate(() => getComputedStyle(document.querySelector(".btn")).backgroundColor)) !== "rgb(31, 111, 235)");
    await v.screenshot({ path: S + `builder-${tpl}-v2.png`, fullPage: true });
    if (tpl === "business") { await v.setViewportSize({ width: 390, height: 844 }); await v.waitForTimeout(200); await v.screenshot({ path: S + "builder-business-mobile-v2.png", fullPage: true }); }
    await v.close();
  }
  ok("no page errors", errs.length === 0);
  console.log(res.join("\n")); await br.close();
})();
