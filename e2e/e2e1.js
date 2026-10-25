const { chromium } = require("playwright");
const B = "http://localhost:3311", S = "/workspace/goai/docs/screenshots/";
(async () => {
  const br = await chromium.launch();
  const res = [];
  const ok = (n, c) => { res.push(`${c ? "PASS" : "FAIL"} ${n}`); };
  for (const [n, w, h] of [["home-desktop", 1440, 900], ["home-mobile", 390, 844]]) {
    const p = await br.newPage({ viewport: { width: w, height: h } });
    await p.goto(B + "/"); await p.waitForTimeout(1300);
    await p.screenshot({ path: S + n + ".png", fullPage: true }); await p.close();
  }
  const p = await br.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const reqs = []; p.on("request", (r) => { if (!r.url().startsWith(B) && !r.url().startsWith("data:") && !r.url().startsWith("blob:") && r.url() !== "about:srcdoc") reqs.push(r.url()); });
  await p.goto(B + "/tools/json-formatter"); await p.fill("#json-in", '{"a":1,}'); await p.waitForTimeout(700);
  ok("json error w/ line", /line 1, column 8/.test(await p.textContent(".alert-error")));
  await p.fill("#json-in", '{"a":[1,2]}'); await p.waitForTimeout(700); ok("json format", (await p.textContent("pre.output")).includes('"a": ['));
  await p.goto(B + "/tools/json-csv"); await p.waitForSelector("#cv-in"); ok("csv", (await p.textContent("pre.output")).includes('address.city'));
  await p.goto(B + "/tools/base64"); await p.waitForSelector("#b64-in"); await p.fill("#b64-in", "€"); ok("b64", (await p.textContent("pre.output")).trim() === "4oKs");
  await p.goto(B + "/tools/diff"); await p.waitForSelector(".diff-table"); ok("diff", (await p.locator(".d-ins").count()) > 0);
  await p.goto(B + "/tools/playground"); await p.waitForSelector("iframe"); await p.waitForTimeout(800);
  const fr = p.frameLocator("iframe"); await fr.locator("#btn").click(); ok("playground runs", (await fr.locator("#out").textContent()).includes("Clicked 1"));
  ok("iframe sandbox", (await p.getAttribute("iframe", "sandbox")) === "allow-scripts");
  await p.goto(B + "/tools/text-tools"); await p.waitForSelector("#tt"); await p.fill("#tt", "hello big world"); await p.click("text=camelCase"); ok("text camel", (await p.inputValue("#tt")) === "helloBigWorld");
  await p.goto(B + "/tools/regex"); await p.waitForSelector("#rx"); await p.waitForTimeout(900); ok("regex matches", (await p.textContent("body")).includes("2 matches"));
  await p.fill("#rx", "(a+)+$"); await p.fill("#rx-t", "a".repeat(40) + "!"); await p.waitForTimeout(2600);
  ok("regex timeout", (await p.textContent("body")).includes("catastrophic backtracking"));
  await p.fill("#rx", "a"); await p.waitForTimeout(900); ok("regex recovers", (await p.textContent("body")).includes("40 matches"));
  await p.fill("#rx", "("); await p.waitForTimeout(800); ok("regex invalid", (await p.textContent("body")).includes("Invalid pattern"));
  await p.goto(B + "/tools/hash"); await p.waitForSelector("#h-in"); await p.fill("#h-in", "abc"); await p.waitForTimeout(400);
  ok("sha256", (await p.textContent("body")).includes("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"));
  await p.goto(B + "/tools"); await p.fill("#tool-search", "sha"); ok("search", (await p.locator(".tool-card").count()) === 1);
  ok("no page errors " + errs.join("|"), errs.length === 0); ok("no external requests " + reqs.join(","), reqs.length === 0);
  const m = await br.newPage({ viewport: { width: 390, height: 844 } }); await m.goto(B + "/tools/diff"); await m.waitForTimeout(800);
  await m.screenshot({ path: S + "tool-diff-mobile.png", fullPage: false });
  ok("no horizontal overflow mobile", await m.evaluate(() => document.documentElement.scrollWidth <= 390));
  await br.close(); console.log(res.join("\n"));
})();
