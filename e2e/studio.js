const { chromium, devices } = require("playwright");
const B = "http://localhost:3311", S = "/workspace/goai/docs/screenshots/";
(async () => {
  const br = await chromium.launch(); const res = []; const ok = (n, c) => { res.push(`${c ? "PASS" : "FAIL"} ${n}`); };
  const errs = [];
  const mk = async (opts, gpu = "1") => { const ctx = await br.newContext(opts); await ctx.addInitScript((g) => { try { localStorage.setItem("goai-studio-mock", "1"); localStorage.setItem("goai-studio-mock-gpu", g); } catch (e) {} }, gpu); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); p.on("dialog", (d) => d.accept()); return p; };
  const p = await mk({ viewport: { width: 1440, height: 950 } });
  // overview
  await p.goto(B + "/studio"); ok("studio overview h1", (await p.textContent("h1")).includes("on your device"));
  ok("nav has Studio", (await p.locator(".top-nav a:has-text('Studio')").count()) === 1);
  await p.screenshot({ path: S + "studio-overview-desktop.png", fullPage: true });
  // chat
  await p.goto(B + "/studio/chat"); await p.waitForSelector("#model-chat");
  ok("default webgpu model selected", (await p.inputValue("#model-chat")).includes("Qwen2.5-0.5B"));
  await p.click("button:has-text('Download')"); await p.waitForSelector(".st-ready", { timeout: 10000 }); ok("model download progress -> ready", true);
  await p.fill("#chat-in", "Hello studio"); await p.keyboard.press("Enter");
  await p.waitForSelector(".st-bubble.assistant:has-text('mock model')", { timeout: 10000 });
  await p.waitForTimeout(800);
  ok("streamed reply", (await p.locator(".st-bubble.assistant").count()) >= 1);
  ok("history saved", (await p.locator(".st-history .st-hbtn:has-text('Hello studio')").count()) === 1);
  await p.fill("#chat-in", "Second question"); await p.keyboard.press("Enter"); await p.waitForTimeout(2000);
  await p.screenshot({ path: S + "studio-chat-desktop.png" });
  await p.reload(); await p.waitForSelector(".st-hbtn"); await p.click(".st-hbtn"); await p.waitForTimeout(300);
  ok("history persists after reload", (await p.locator(".st-bubble").count()) === 4);
  // code
  await p.goto(B + "/studio/code"); await p.waitForSelector(".cm-content");
  await p.click('.st-modelrow button.btn-dark'); await p.waitForSelector(".st-ready");
  await p.click(".chips button:has-text('Fix bugs')"); await p.click("button:has-text('Run Fix bugs')");
  await p.waitForSelector(".st-output pre", { timeout: 10000 }); await p.waitForTimeout(1500);
  ok("code answer with code block", (await p.locator(".st-output pre").count()) >= 1);
  await p.click("button:has-text('Use in editor')"); await p.waitForTimeout(300);
  ok("use in editor", (await p.locator(".cm-content").textContent()).includes("return a + b"));
  await p.screenshot({ path: S + "studio-code-desktop.png" });
  // text
  await p.goto(B + "/studio/text"); await p.click("button:has-text('Try a sample')");
  await p.click('.st-modelrow button.btn-dark'); await p.waitForSelector('.st-ready');
  await p.click(".tool-panel .toolbar button.btn-dark"); await p.waitForTimeout(2500);
  ok("text tool output", ((await p.textContent(".st-plain")) || "").length > 10);
  await p.click(".chips button:has-text('Translate to English')"); await p.check(".st-check input");
  await p.click(".tool-panel .toolbar button.btn-dark"); await p.waitForTimeout(1500);
  ok("dedicated translate model", (await p.textContent(".st-plain")).includes("Translation (mock)"));
  await p.screenshot({ path: S + "studio-text-desktop.png" });
  // site generator
  await p.goto(B + "/studio/site"); await p.click("button:has-text('Try an example')");
  await p.locator("#site-color").fill("#c2410c");
  await p.click('.st-modelrow button.btn-dark').catch(() => {}); await p.waitForSelector(".st-ready");
  await p.click("button:has-text('Write my site with AI')"); await p.waitForSelector(".alert-ok", { timeout: 15000 }); await p.waitForTimeout(800);
  const fr = p.frameLocator(".st-frame");
  ok("AI copy in preview", (await fr.locator("h1").first().textContent()).includes("Bread worth waking up for"));
  ok("preview footer", (await fr.locator(".site-footer").textContent()).includes("All rights reserved"));
  await p.screenshot({ path: S + "studio-site-desktop.png" });
  await p.click("button:has-text('Open in Builder')"); await p.waitForURL(/builder\/edit/); await p.waitForSelector("iframe"); await p.waitForTimeout(800);
  ok("opened generated site in builder", (await p.frameLocator("iframe").locator("h1").first().textContent()).includes("Bread"));
  // models
  await p.goto(B + "/studio/models"); await p.waitForSelector(".st-model");
  ok("models page lists all", (await p.locator(".st-model").count()) === 8);
  await p.screenshot({ path: S + "studio-models-desktop.png", fullPage: true });
  // no-webgpu fallback
  const q = await mk({ viewport: { width: 1280, height: 900 } }, "0");
  await q.goto(B + "/studio/chat"); await q.waitForSelector(".st-gpu");
  ok("no-webgpu fallback message", (await q.textContent(".st-gpu")).includes("WebGPU isn’t available"));
  ok("cpu model default", (await q.inputValue("#model-chat")).includes("SmolLM2"));
  await q.screenshot({ path: S + "studio-nowebgpu-desktop.png" });
  // mobile
  const m = await mk({ ...devices["iPhone 13"] });
  await m.goto(B + "/studio"); ok("mobile bottom nav studio", await m.locator(".bottom-nav a:has-text('Studio')").isVisible());
  await m.screenshot({ path: S + "studio-overview-mobile.png" });
  await m.goto(B + "/studio/chat"); await m.click("button:has-text('Download')"); await m.waitForSelector(".st-ready");
  await m.fill("#chat-in", "Hi from phone"); await m.keyboard.press("Enter"); await m.waitForTimeout(2500);
  ok("mobile chat reply", (await m.locator(".st-bubble.assistant").count()) >= 1);
  const ow = await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1); ok("mobile no horizontal overflow", ow);
  await m.screenshot({ path: S + "studio-chat-mobile.png" });
  await m.goto(B + "/studio/code"); await m.waitForSelector(".cm-content"); await m.screenshot({ path: S + "studio-code-mobile.png" });
  // footer + SEO
  await p.goto(B + "/"); const ft = await p.textContent(".site-footer");
  ok("site footer copyright", ft.includes("© 2026 GoAI.foo. All rights reserved.") && ft.includes("Made with care"));
  await p.locator(".site-footer").scrollIntoViewIfNeeded(); await p.locator(".site-footer").screenshot({ path: S + "studio-site-footer.png" });
  ok("meta keywords", ((await p.getAttribute('meta[name="keywords"]', "content")) || "").includes("in-browser AI chat"));
  ok("og image", (await p.locator('meta[property="og:image"]').count()) >= 1);
  const og = await p.request.get(B + "/opengraph-image"); ok("og image renders", og.ok() && (og.headers()["content-type"] || "").includes("image/png"));
  const sm = await (await p.request.get(B + "/sitemap.xml")).text(); ok("sitemap has studio", sm.includes("/studio/chat"));
  await p.goto(B + "/tools/regex"); ok("tool unique title", (await p.title()).startsWith("Regex Tester — Free Online"));
  ok("no page errors", errs.length === 0); if (errs.length) console.log(errs.slice(0, 5));
  console.log(res.join("\n")); console.log(`${res.filter((r) => r.startsWith("PASS")).length}/${res.length} passed`);
  await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
