"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TEMPLATE_LIST, createProject, uid, FONT_CHOICES } from "@/lib/builder/templates";
import { track } from "@vercel/analytics";
import { listProjects, saveProject, deleteProject, getAsset, putAsset, clearAll } from "@/lib/builder/db";
import type { Project } from "@/lib/builder/types";
import { exportZip } from "./exportZip";
import { suggestFromName, type Suggestion } from "@/lib/builder/nameSuggest";
import NameSuggestions from "./NameSuggestions";

export default function BuilderHome() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [color, setColor] = useState("");
  const [font, setFont] = useState("");
  const [style, setStyle] = useState<"" | "rounded" | "soft" | "sharp">("");
  const [mode, setMode] = useState<"auto" | "light" | "dark">("auto");
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [aiSugs, setAiSugs] = useState<Suggestion[] | null>(null);
  const sugs = aiSugs ?? suggestFromName(name);
  const pick = (s: Suggestion) => { setPicked(s); setColor(s.color); track("builder_name_suggest", { topic: s.topic, template: s.template, source: s.source }); document.getElementById(`tpl-${s.template}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const refresh = () => listProjects().then(setProjects).catch((e) => setErr("Could not open browser storage (IndexedDB): " + e));
  useEffect(() => { refresh(); }, []);
  const create = async (tpl: string) => {
    const content = picked && picked.template === tpl ? { ...picked.content, brand: name.trim() || picked.content.brand } : undefined;
    const p = createProject(tpl, name, { primary: color || undefined, font: font || undefined, style: style || undefined, mode, content });
    await saveProject(p); location.href = `/builder/edit?id=${p.id}`;
  };
  const rename = async (p: Project) => { const n = prompt("New project name", p.name); if (n && n.trim()) { await saveProject({ ...p, name: n.trim().slice(0, 80), updatedAt: Date.now() }); refresh(); } };
  const duplicate = async (p: Project) => {
    const copy: Project = { ...structuredClone(p), id: uid(), name: `${p.name} (copy)`, createdAt: Date.now(), updatedAt: Date.now() };
    for (const a of p.assets) { const b = await getAsset(p.id, a.id); if (b) await putAsset(copy.id, a.id, b); }
    await saveProject(copy); refresh();
  };
  const del = async (p: Project) => { if (confirm(`Delete “${p.name}” permanently? This removes it and its assets from this browser and cannot be undone.`)) { await deleteProject(p); refresh(); } };
  return (
    <>
      {err && <div className="alert alert-error">{err}</div>}
      <section className="tool-panel" aria-labelledby="new-h">
        <h2 id="new-h" style={{ fontSize: "1.5rem" }}>New project</h2>
        <div className="field" style={{ maxWidth: 420 }}><label htmlFor="pname">Project / site name (optional)</label><input id="pname" type="text" maxLength={80} value={name} onChange={(e) => { setName(e.target.value); setAiSugs(null); }} placeholder="e.g. Olibea, Sunrise Bakery" /></div>
        <NameSuggestions name={name} suggestions={sugs} picked={picked} onPick={pick} onAi={setAiSugs} onCreate={(s) => create(s.template)} />
        <div className="b-opts">
          <div className="field"><label htmlFor="opt-color">Brand color</label><div style={{ display: "flex", gap: 8 }}><input id="opt-color" type="color" value={color || "#1f6feb"} onChange={(e) => setColor(e.target.value)} aria-label="Brand color" />{color ? <button className="btn btn-ghost btn-sm" onClick={() => setColor("")}>Template default</button> : <span className="muted" style={{ alignSelf: "center", fontSize: ".85rem" }}>Template default</span>}</div></div>
          <div className="field"><label htmlFor="opt-font">Font</label><select id="opt-font" value={font} onChange={(e) => setFont(e.target.value)}><option value="">Template default</option>{Object.keys(FONT_CHOICES).map((f) => <option key={f}>{f}</option>)}</select></div>
          <div className="field"><label htmlFor="opt-style">Corners</label><select id="opt-style" value={style} onChange={(e) => setStyle(e.target.value as typeof style)}><option value="">Template default</option><option value="rounded">Rounded</option><option value="soft">Extra soft</option><option value="sharp">Sharp</option></select></div>
          <div className="field"><label htmlFor="opt-mode">Mode</label><select id="opt-mode" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}><option value="auto">Template default</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
        </div>
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          {TEMPLATE_LIST.map((t) => (
            <div key={t.id} id={`tpl-${t.id}`} className="card" style={{ boxShadow: "none", outline: picked?.template === t.id ? `3px solid ${picked.color}` : undefined }}>
              {picked?.template === t.id && <span className="badge" style={{ background: picked.color, color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: ".75rem", float: "right" }}>Suggested · copy pre-filled</span>}
              <div className="icon-sq" aria-hidden="true" style={{ background: color || t.primary, color: "#fff" }}>{t.name.slice(0, 2)}</div><h3>{t.name}</h3><p className="muted">{t.description}</p>
              <button className="btn btn-dark btn-sm" onClick={() => create(t.id)}>Use {t.name}</button>
            </div>
          ))}
        </div>
        <p className="note" style={{ marginTop: 16 }}>Want copy written for your business? Try the <Link href="/studio/site">AI site generator in Studio</Link> — it runs locally in your browser.</p>
      </section>
      <section style={{ marginTop: 32 }} aria-labelledby="my-h">
        <h2 id="my-h" style={{ fontSize: "1.5rem" }}>My Projects</h2>
        {projects === null ? <p>Loading…</p> : projects.length === 0 ? <p className="muted">No projects yet. Pick a template above.</p> :
          <div className="grid grid-2">{projects.map((p) => (
            <article key={p.id} className="card">
              <h3><Link href={`/builder/edit?id=${p.id}`}>{p.name}</Link></h3>
              <p className="muted" style={{ fontSize: ".9rem" }}>{p.template} · {p.pages.length} page{p.pages.length === 1 ? "" : "s"} · {p.assets.length} asset{p.assets.length === 1 ? "" : "s"} · updated {new Date(p.updatedAt).toLocaleString()}</p>
              <div className="toolbar">
                <Link className="btn btn-dark btn-sm" href={`/builder/edit?id=${p.id}`}>Open</Link>
                <button className="btn btn-ghost btn-sm" onClick={() => rename(p)}>Rename</button>
                <button className="btn btn-ghost btn-sm" onClick={() => duplicate(p)}>Duplicate</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { track("builder_export"); exportZip(p); }}>Export ZIP</button>
                <button className="btn btn-danger btn-sm" onClick={() => del(p)}>Delete</button>
              </div>
            </article>))}</div>}
        <p className="note" style={{ marginTop: 20 }}>Projects live only in this browser. Clearing site data, private browsing or switching browsers will lose them — export a ZIP to keep a copy.{" "}
          {projects && projects.length > 0 && <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm("Delete ALL projects and assets stored by GoAI.foo in this browser? This cannot be undone.")) { await clearAll(); refresh(); } }}>Clear all local data</button>}</p>
      </section>
    </>
  );
}
