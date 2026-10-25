"use client";
import { useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { useStudio } from "./StudioProvider";
import { ModelBar } from "./ModelBar";
import { TEMPLATE_LIST, createProject, FONT_CHOICES, type SiteContent } from "@/lib/builder/templates";
import { saveProject } from "@/lib/builder/db";
import { buildPreview } from "@/lib/builder/preview";
import { parseSiteContent, quickContent, siteMessages } from "@/lib/studio/prompts";

const TPLS = TEMPLATE_LIST.filter((t) => !["blank", "dashboard"].includes(t.id));
const SAMPLE = "A family-run artisan bakery in the city centre. Sourdough, croissants, custom cakes and specialty coffee. Open from 6am, pre-order online for pickup.";

export default function SiteGenerator() {
  const { engines, load } = useStudio();
  const [model, setModel] = useState("");
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [tpl, setTpl] = useState("business");
  const [color, setColor] = useState("#1f6feb");
  const [font, setFont] = useState("Modern");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [content, setContent] = useState<Partial<SiteContent> | null>(null);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const opts = { primary: color, font, mode, content: content ?? quickContent(desc, name) };
  const project = useMemo(() => createProject(tpl, name, opts), [tpl, name, color, font, mode, content, desc]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview = useMemo(() => buildPreview(project, "index.html", {}, false), [project]);
  const generate = async () => {
    setErr(""); setRaw(""); setBusy(true);
    try {
      const eng = engines[model] ?? await load(model); if (!eng) throw new Error("load a model first");
      track("studio_message", { app: "site" });
      const out = await eng.generate(siteMessages(`${name ? name + ". " : ""}${desc}`, tpl), { onToken: setRaw, temperature: 0.6, maxTokens: 1400 });
      const c = parseSiteContent(out);
      if (!c) throw new Error("the model didn't return valid JSON. Try again or pick a larger model.");
      if (name && !c.brand) c.brand = name;
      setContent(c);
    } catch (e) { setErr("Generation failed: " + (e instanceof Error ? e.message : String(e))); }
    setBusy(false);
  };
  const open = async () => { await saveProject(project); location.href = `/builder/edit?id=${project.id}`; };
  return (
    <div className="st-two st-site">
      <section className="tool-panel">
        <ModelBar task="text" value={model} onChange={setModel} />
        <div className="field" style={{ marginTop: 12 }}><label htmlFor="site-name">Business name</label><input id="site-name" type="text" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bloom & Crumb" /></div>
        <div className="field" style={{ marginTop: 10 }}><label htmlFor="site-desc">Describe your business</label><textarea id="site-desc" rows={5} maxLength={1500} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What you do, who it's for, what makes you different…" /></div>
        <div className="st-row" style={{ marginTop: 10 }}>
          <div className="field"><label htmlFor="site-tpl">Layout</label><select id="site-tpl" value={tpl} onChange={(e) => setTpl(e.target.value)}>{TPLS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="field"><label htmlFor="site-color">Brand color</label><input id="site-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></div>
          <div className="field"><label htmlFor="site-font">Font</label><select id="site-font" value={font} onChange={(e) => setFont(e.target.value)}>{Object.keys(FONT_CHOICES).map((f) => <option key={f}>{f}</option>)}</select></div>
          <div className="field"><label htmlFor="site-mode">Mode</label><select id="site-mode" value={mode} onChange={(e) => setMode(e.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select></div>
        </div>
        <div className="toolbar">
          <button className="btn btn-dark" onClick={generate} disabled={busy || !desc.trim()}>{busy ? "Writing copy…" : "✦ Write my site with AI"}</button>
          <button className="btn btn-lime" onClick={open}>Open in Builder →</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setDesc(SAMPLE); setName("Bloom & Crumb"); }}>Try an example</button>
        </div>
        <p className="st-hint">Without AI you still get a complete multi-page site with professional placeholder copy, your name, colors and font. AI rewrites the headline, services, stats, testimonials and FAQ for your business.</p>
        {busy && raw && <pre className="st-raw" aria-label="Model output">{raw.slice(-400)}</pre>}
        {content && !busy && <div className="alert alert-ok">AI copy applied: {Object.keys(content).length} fields. Preview updated →</div>}
        {err && <div className="alert alert-error">{err}</div>}
      </section>
      <section className="tool-panel st-output">
        <div className="toolbar" style={{ marginTop: 0, justifyContent: "space-between" }}><h2 style={{ fontSize: "1.2rem", margin: 0 }}>Live preview</h2><span className="badge badge-soft">{project.pages.length} pages</span></div>
        <iframe title="Generated site preview" className="st-frame" sandbox="allow-scripts" srcDoc={preview} />
      </section>
    </div>
  );
}
