const { chromium, devices } = require("playwright");
const B = process.env.BASE || "http://localhost:3417", S = "/workspace/goai/docs/screenshots/answers-";
const QS = ["What is GoAI.foo?","which tools do you have","how do i pretty print json","convert my excel csv into json","is it really free?","do you upload my data to a server","Can I make a landing page?","how do I host the site I made","jsn formater","sha256 of a file","does it work without internet","what's the weather in Paris","ما هو هذا الموقع؟","هل الموقع مجاني","is the builder free","can I export json from the builder","what can I do on my iphone with the studio"];
async function run(br, name, opts) {
  const ctx = await br.newContext(opts); const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(B + "/", { waitUntil: "networkidle" });
  for (let i = 0; i < 10 && !(await p.locator("#cw-input").count()); i++) { await p.click(".cw-fab"); await p.waitForTimeout(800); }
  await p.screenshot({ path: S + name + "-chips.png" });
  // chip click before model loaded
  let t0 = Date.now(); await p.click(".cw-chip >> nth=1"); await p.waitForFunction(() => document.querySelectorAll(".cw-msg.assistant").length >= 2);
  console.log(`== ${name} chip instant ${Date.now() - t0}ms`); await p.screenshot({ path: S + name + "-chip-answer.png" });
  for (const [i, q] of QS.entries()) {
    const n = await p.locator(".cw-msg.assistant").count(); t0 = Date.now();
    await p.fill("#cw-input", q); await p.keyboard.press("Enter");
    let txt = "";
    while (Date.now() - t0 < 240000) {
      await p.waitForTimeout(300);
      const c = await p.locator(".cw-msg.assistant").count(); if (c <= n) continue;
      txt = await p.locator(".cw-msg.assistant").last().innerText();
      if (await p.locator(".cw-note.err").count()) { txt = "ERROR " + txt; break; }
      if (txt.trim().length > 5 && !(await p.locator("button:has-text('Stop')").count()) && !(await p.locator(".cw-dots").count())) break;
    }
    const sents = txt.split(/(?<=[.!?])\s+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 15); const rep = sents.length - new Set(sents).size;
    console.log(`[${name} ${i + 1}] ${((Date.now() - t0) / 1000).toFixed(1)}s rep=${rep} Q: ${q}\n   A: ${txt.replace(/\s+/g, " ").slice(0, 260)}`);
    if ([0, 6, 11, 12, 14, 16].includes(i)) await p.screenshot({ path: S + name + "-q" + (i + 1) + ".png" });
    if (i === 8) { await p.click("button:has-text('Clear')"); }
  }
  console.log(name, "page errors:", errs.length ? errs : "none"); await ctx.close();
}
(async () => { const br = await chromium.launch({ args: ["--enable-unsafe-webgpu"] });
  const w = process.argv[2];
  if (!w || w === "desktop") await run(br, "desktop", { viewport: { width: 1440, height: 900 } });
  if (!w || w === "mobile") await run(br, "mobile", { ...devices["iPhone 13"] });
  await br.close(); })();
