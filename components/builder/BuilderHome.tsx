"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TEMPLATE_LIST, createProject, uid } from "@/lib/builder/templates";
import { listProjects, saveProject, deleteProject, getAsset, putAsset, clearAll } from "@/lib/builder/db";
import type { Project } from "@/lib/builder/types";
import { exportZip } from "./exportZip";

export default function BuilderHome() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const refresh = () => listProjects().then(setProjects).catch((e) => setErr("Could not open browser storage (IndexedDB): " + e));
  useEffect(() => { refresh(); }, []);
  const create = async (tpl: string) => {
    const p = createProject(tpl, name);
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
        <div className="field" style={{ maxWidth: 420 }}><label htmlFor="pname">Project / site name (optional)</label><input id="pname" type="text" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunrise Bakery" /></div>
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          {TEMPLATE_LIST.map((t) => (
            <div key={t.id} className="card" style={{ boxShadow: "none" }}>
              <div className="icon-sq" aria-hidden="true">{t.name.slice(0, 2)}</div><h3>{t.name}</h3><p className="muted">{t.description}</p>
              <button className="btn btn-dark btn-sm" onClick={() => create(t.id)}>Use {t.name}</button>
            </div>
          ))}
        </div>
        <p className="note" style={{ marginTop: 16 }}>AI-assisted project generation is not available yet.</p>
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
                <button className="btn btn-ghost btn-sm" onClick={() => exportZip(p)}>Export ZIP</button>
                <button className="btn btn-danger btn-sm" onClick={() => del(p)}>Delete</button>
              </div>
            </article>))}</div>}
        <p className="note" style={{ marginTop: 20 }}>Projects live only in this browser. Clearing site data, private browsing or switching browsers will lose them — export a ZIP to keep a copy.{" "}
          {projects && projects.length > 0 && <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm("Delete ALL projects and assets stored by GoAI.foo in this browser? This cannot be undone.")) { await clearAll(); refresh(); } }}>Clear all local data</button>}</p>
      </section>
    </>
  );
}
