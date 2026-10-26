const { chromium, devices } = require("playwright");
const B = "https://goai.foo", S = "/workspace/goai/docs/screenshots/live-";
const fakeGpu = (f16) => { const feats = new Set(f16 ? ["shader-f16"] : []); Object.defineProperty(navigator, "gpu", { value: { requestAdapter: async () => ({ features: feats, limits: {}, requestDevice: async () => { throw new Error("simulated device failure"); }, requestAdapterInfo: async () => ({}) }), getPreferredCanvasFormat: () => "bgra8unorm" }, configurable: true }); Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true }); };
async function run(br, name, opts, gpu) {
  const ctx = await br.newContext(opts); if (gpu !== undefined) await ctx.addInitScript(fakeGpu, gpu);
  const p = await ctx.newPage(); const logs = []; p.on("console", (m) => logs.push(m.type() + ": " + m.text())); p.on("pageerror", (e) => logs.push("PAGEERR " + e.message));
  await p.goto(B + "/", { waitUntil: "networkidle" }); for (let i = 0; i < 10 && !(await p.locator("#cw-input").count()); i++) { await p.click(".cw-fab"); await p.waitForTimeout(800); } await p.fill("#cw-input", "What is the Project Builder?"); await p.keyboard.press("Enter");
  const t0 = Date.now(); let maxLag = 0, typed = 0, shot = false;
  while (Date.now() - t0 < 240000) {
    const s = Date.now();
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(1))));
    await p.fill("#cw-input", "typing " + typed++); maxLag = Math.max(maxLag, Date.now() - s);
    if (!shot && Date.now() - t0 > 8000) { await p.screenshot({ path: S + name + "-loading.png" }); shot = true; }
    const txt = await p.locator(".cw-msg.assistant").last().innerText();
    if (await p.locator(".cw-note.err").count()) break;
    if (txt.trim().length > 20 && !(await p.locator("button:has-text('Stop')").count())) break;
    await p.waitForTimeout(1000);
  }
  await p.fill("#cw-input", ""); await p.screenshot({ path: S + name + "-reply.png" });
  const reply = await p.locator(".cw-msg.assistant").last().innerText(); const err = await p.locator(".cw-note.err").count();
  console.log(`== ${name}: ${Math.round((Date.now() - t0) / 1000)}s, max UI lag ${maxLag}ms over ${typed} type checks, error=${err}\nREPLY: ${reply.slice(0, 300)}\nLOGS: ${logs.filter((l) => /chat|engine|worker|ERR|error/i.test(l)).slice(0, 8).join(" | ")}`);
  await ctx.close();
}
(async () => {
  const br = await chromium.launch({ args: ["--enable-unsafe-webgpu"] });
  const which = process.argv[2];
  if (!which || which === "mobile") await run(br, "mobile", { ...devices["iPhone 13"] });
  if (!which || which === "desktop") await run(br, "desktop", { viewport: { width: 1440, height: 900 } });
  if (!which || which === "nof16") await run(br, "desktop-nof16", { viewport: { width: 1440, height: 900 } }, false);
  if (!which || which === "gpufail") await run(br, "desktop-gpufail", { viewport: { width: 1440, height: 900 } }, true);
  await br.close();
})();
