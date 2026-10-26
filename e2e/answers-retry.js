const { chromium, devices } = require("playwright");
const S = "/workspace/goai/docs/screenshots/answers-retry-";
(async () => {
  const br = await chromium.launch(); const ctx = await br.newContext({ ...devices["iPhone 13"] }); const p = await ctx.newPage();
  let block = true;
  await ctx.route(/huggingface\.co|hf\.co|xethub|cdn-lfs/, (r) => block ? r.abort() : r.continue());
  await p.goto("http://localhost:3417/", { waitUntil: "networkidle" });
  for (let i = 0; i < 10 && !(await p.locator("#cw-input").count()); i++) { await p.click(".cw-fab"); await p.waitForTimeout(800); }
  await p.fill("#cw-input", "is the builder free"); await p.keyboard.press("Enter");
  await p.waitForSelector(".cw-note.err", { timeout: 200000 }); await p.screenshot({ path: S + "error.png" });
  console.log("error note:", await p.locator(".cw-note.err").innerText());
  block = false; await p.click("button:has-text('Retry')");
  const t0 = Date.now(); let txt = "";
  while (Date.now() - t0 < 240000) { await p.waitForTimeout(2000); txt = await p.locator(".cw-msg.assistant").last().innerText().catch(() => ""); if (txt.trim().length > 20 && !(await p.locator("button:has-text('Stop')").count())) break; }
  await p.screenshot({ path: S + "reply.png" }); console.log("after retry", Math.round((Date.now()-t0)/1000)+"s, err=", await p.locator(".cw-note.err").count(), "REPLY:", txt.slice(0, 250));
  await br.close();
})();
