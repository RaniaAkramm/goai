const { chromium, devices } = require("playwright");
const B = "http://localhost:3312", S = "/workspace/goai/docs/screenshots/";
(async () => {
  const br = await chromium.launch(); const res = []; const ok = (n, c) => res.push(`${c ? "PASS" : "FAIL"} ${n}`); const errs = [];
  const mk = async (opts, gpu = "1") => { const ctx = await br.newContext(opts); await ctx.addInitScript((g) => { localStorage.setItem("goai-studio-mock", "1"); localStorage.setItem("goai-studio-mock-gpu", g); }, gpu); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); return p; };
  const p = await mk({ viewport: { width: 1440, height: 900 } });
  for (const u of ["/", "/tools/regex", "/studio", "/builder"]) { await p.goto(B + u); ok("fab on " + u, await p.locator(".cw-fab").isVisible()); }
  await p.goto(B + "/"); await p.screenshot({ path: S + "chat-widget-closed-desktop.png" });
  await p.click(".cw-fab"); ok("panel opens", await p.locator(".cw-panel").isVisible());
  await p.screenshot({ path: S + "chat-widget-open-desktop.png" });
  await p.fill("#cw-input", "What tools do you have?"); await p.keyboard.press("Enter");
  await p.waitForSelector(".cw-msg.assistant:has-text('mock model')", { timeout: 15000 }); await p.waitForTimeout(600);
  ok("streamed reply", true); ok("no progress bar", (await p.locator(".cw-bar").count()) === 0);
  await p.screenshot({ path: S + "chat-widget-reply-desktop.png" });
  await p.click("button:has-text('Clear')"); ok("clear", (await p.locator(".cw-msg.user").count()) === 0);
  await p.keyboard.press("Escape"); ok("esc closes", (await p.locator(".cw-panel").count()) === 0);
  const m = await mk({ ...devices["iPhone 13"] }, "0");
  await m.goto(B + "/"); const fab = await m.locator(".cw-fab").boundingBox(), nav = await m.locator(".bottom-nav").boundingBox();
  ok("mobile fab above bottom nav", fab.y + fab.height <= nav.y);
  await m.screenshot({ path: S + "chat-widget-closed-mobile.png" });
  await m.click(".cw-fab"); await m.fill("#cw-input", "Hi"); await m.keyboard.press("Enter");
  await m.waitForSelector(".cw-msg.assistant:has-text('mock model')", { timeout: 15000 }); await m.waitForTimeout(600);
  ok("no error note", (await m.locator(".cw-note.err").count()) === 0);
  await m.screenshot({ path: S + "chat-widget-reply-mobile.png" });
  await m.click(".cw-x"); ok("close btn", (await m.locator(".cw-panel").count()) === 0);
  ok("no page errors", errs.length === 0); console.log(res.join("\n"), errs); await br.close();
})();
