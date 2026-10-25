const { chromium } = require("playwright");
const { unzipSync, strFromU8 } = require("fflate");
const fs = require("fs");
const B = "http://localhost:3311", S = "/workspace/goai/docs/screenshots/";
(async () => {
  const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
  const p = await ctx.newPage(); const res = []; const ok = (n, c) => res.push(`${c ? "PASS" : "FAIL"} ${n}`);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  p.on("dialog", async (d) => { const m = d.message(); if (d.type() === "prompt") await d.accept(m.startsWith("New page") ? "pricing" : m.startsWith("New project") ? "Renamed Site" : d.defaultValue()); else await d.accept(); });
  await p.goto(B + "/builder"); await p.fill("#pname", "Sunrise Bakery"); await p.click("text=Use Business");
  await p.waitForURL(/edit\?id=/); await p.waitForSelector("iframe"); await p.waitForTimeout(800);
  const fr = p.frameLocator("iframe");
  await fr.locator("h1").click(); await p.waitForSelector("#in-text");
  await p.fill("#in-text", "Fresh bread every morning"); await p.locator("#in-color").fill("#aa0000"); await p.locator("#in-color").blur(); await p.waitForTimeout(500);
  ok("visual text edit in preview", (await fr.locator("h1").textContent()) === "Fresh bread every morning");
  ok("visual style written", (await fr.locator("h1").getAttribute("style") || "").includes("color"));
  await p.click("button[role=tab]:has-text('Theme')"); await p.fill("#th-primary", "#ff6600"); await p.waitForTimeout(400);
  await p.click("button[role=tab]:has-text('Pages')"); await p.click("text=+ Add page"); await p.waitForTimeout(400);
  ok("page added", (await p.locator(".b-link:has-text('pricing.html')").count()) === 1);
  await p.screenshot({ path: S + "builder-visual-desktop.png" });
  await p.click("button.chip:has-text('Preview')"); await p.click("button.chip:has-text('Mobile')"); await p.waitForTimeout(500);
  ok("mobile width", (await p.locator("iframe").evaluate((f) => f.getBoundingClientRect().width)) === 375);
  await p.screenshot({ path: S + "builder-preview-mobile.png" });
  await p.click("button.chip:has-text('Desktop')");
  await fr.locator(".nav a:has-text('About')").click(); await p.waitForTimeout(500);
  ok("preview link nav", (await fr.locator("h1").textContent()) === "About us");
  await p.click("button.chip:has-text('Code')"); await p.waitForSelector(".cm-content"); 
  await p.click("button.chip:has-text('styles.css')"); await p.waitForTimeout(300);
  ok("code editor shows theme change", (await p.locator(".cm-content").textContent()).includes("#ff6600"));
  await p.click(".cm-content"); await p.keyboard.press("Control+End"); await p.keyboard.type("\nzzmarker"); await p.waitForTimeout(300);
  await p.click("text=↶ Undo"); await p.waitForTimeout(300);
  ok("undo", !(await p.locator(".cm-content").textContent()).includes("zzmarker"));
  console.log("redoDisabled", await p.locator("text=↷ Redo").isDisabled(), (await p.locator(".cm-content").textContent()).slice(-40)); await p.click("text=↷ Redo"); await p.waitForTimeout(300); console.log((await p.locator(".cm-content").textContent()).slice(-40)); ok("redo", (await p.locator(".cm-content").textContent()).includes("zzmarker"));
  await p.waitForSelector(".b-status.s-saved", { timeout: 5000 }); ok("autosave status", true);
  // assets
  await p.click("button[role=tab]:has-text('Assets')");
  await p.setInputFiles("input[type=file]", ["/tmp/logo.png"]); await p.waitForTimeout(600);
  ok("asset uploaded", (await p.locator(".b-assets figure").count()) === 1);
  await p.setInputFiles("input[type=file]", ["/tmp/fake.png"]); await p.waitForTimeout(600);
  ok("fake image rejected", (await p.textContent("body")).includes("already exists") || (await p.textContent("body")).includes("does not match"));
  await p.click("text=Check Project"); await p.waitForSelector(".b-report");
  ok("check report", (await p.textContent(".b-report")).includes("Passed"));
  await p.screenshot({ path: S + "builder-check.png" });
  await p.waitForTimeout(1200);
  // reload persistence
  await p.reload(); await p.waitForSelector("iframe"); await p.waitForTimeout(800);
  ok("persisted after reload", (await p.frameLocator("iframe").locator("h1").textContent()) === "Fresh bread every morning" && (await p.locator(".b-link:has-text('pricing.html')").count()) === 1);
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click("text=Export ZIP")]);
  const path = "/tmp/export.zip"; await dl.saveAs(path);
  const z = unzipSync(fs.readFileSync(path)); const keys = Object.keys(z);
  ok("zip contents " + keys.length, ["sunrise-bakery/public/index.html", "sunrise-bakery/public/pricing.html", "sunrise-bakery/public/assets/logo.png", "sunrise-bakery/server.js", "sunrise-bakery/.env.example", "sunrise-bakery/README.md", "sunrise-bakery/db/schema.sql"].every((k) => keys.includes(k)));
  ok("zip has edits", strFromU8(z["sunrise-bakery/public/index.html"]).includes("Fresh bread every morning") && strFromU8(z["sunrise-bakery/public/styles.css"]).includes("#ff6600"));
  fs.rmSync("/tmp/exported", { recursive: true, force: true }); for (const [k, v] of Object.entries(z)) { if (k.endsWith("/")) continue; fs.mkdirSync(require("path").dirname("/tmp/exported/" + k), { recursive: true }); fs.writeFileSync("/tmp/exported/" + k, v); }
  // My projects
  await p.goto(B + "/builder"); await p.waitForSelector("text=My Projects"); await p.waitForTimeout(500);
  await p.click("text=Duplicate"); await p.waitForTimeout(500); ok("duplicate", (await p.locator("article.card").count()) === 2);
  await p.locator("article.card").first().locator("text=Rename").click(); await p.waitForTimeout(500); ok("rename", (await p.textContent("body")).includes("Renamed Site"));
  await p.screenshot({ path: S + "builder-projects.png", fullPage: true });
  await p.locator("article.card").first().locator("text=Delete").click(); await p.waitForTimeout(500); ok("delete", (await p.locator("article.card").count()) === 1);
  for (const t of ["E-commerce", "Blog", "Portfolio", "Dashboard", "Blank"]) { await p.goto(B + "/builder"); await p.click(`text=Use ${t}`); await p.waitForURL(/edit/); await p.waitForSelector("iframe"); await p.click("text=Check Project"); await p.waitForSelector(".b-report"); ok(`${t} template 0 errors`, (await p.textContent(".b-report")).includes("Errors (0)")); }
  const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 }); await m.goto(B + "/builder"); await m.waitForTimeout(800); await m.screenshot({ path: S + "builder-mobile.png" });
  ok("no page errors " + errs.join("|"), errs.length === 0);
  await br.close(); console.log(res.join("\n"));
})().catch((e) => { console.error(e); process.exit(1); });
