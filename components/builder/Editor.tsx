"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project, AssetMeta } from "@/lib/builder/types";
import { getProject, saveProject, putAsset, getAsset, deleteAsset } from "@/lib/builder/db";
import { normalizePageName, addPage, renamePage, duplicatePage, deletePage, movePage, setHomepage, setPageTitle, readTheme, writeTheme, History, THEME_KEYS, type ThemeKey } from "@/lib/builder/ops";
import { buildPreview, applyElement, readElement, elementAt, insertImage, removeElement, type ElementProps } from "@/lib/builder/preview";
import { checkProject, jsSyntaxCheck, type CheckReport } from "@/lib/builder/check";
import { validateAsset, sniff, MAX_TOTAL } from "@/lib/builder/assets";
import { safeSegment } from "@/lib/builder/export";
import { uid } from "@/lib/builder/templates";
import { exportZip } from "./exportZip";

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false, loading: () => <div className="cm-host" aria-busy="true">Loading editor…</div> });
const DEVICES = { desktop: { w: "100%", label: "Desktop" }, tablet: { w: "768px", label: "Tablet" }, mobile: { w: "375px", label: "Mobile" } } as const;
type Device = keyof typeof DEVICES;
const THEME_LABEL: Record<ThemeKey, string> = { primary: "Primary color", bg: "Background", text: "Text color", surface: "Surface / cards", font: "Font family", radius: "Corner radius", space: "Base spacing" };
const FONTS = ["system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", "Georgia, 'Times New Roman', serif", "'Helvetica Neue', Arial, sans-serif", "'Courier New', ui-monospace, monospace", "'Trebuchet MS', sans-serif"];
const isColor = (k: ThemeKey) => ["primary", "bg", "text", "surface"].includes(k);
const titleOf = (html: string) => (/<title>([^<·]*)/.exec(html)?.[1] ?? "").trim();

export default function Editor() {
  const id = typeof window !== "undefined" ? new URLSearchParams(location.search).get("id") : null;
  const [p, setP] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [page, setPage] = useState("index.html");
  const [file, setFile] = useState("index.html");
  const [mode, setMode] = useState<"preview" | "visual" | "code">("visual");
  const [side, setSide] = useState<"pages" | "files" | "assets" | "theme">("pages");
  const [device, setDevice] = useState<Device>("desktop");
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [msg, setMsg] = useState<{ kind: "error" | "ok" | "info"; text: string } | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [report, setReport] = useState<CheckReport | null>(null);
  const [, force] = useState(0);
  const [rev, setRev] = useState(0);
  const hist = useRef(new History<Project>(50));
  const lastPush = useRef(0);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!id) { setMissing(true); return; }
    getProject(id).then((x) => { if (!x) setMissing(true); else { setP(x); setPage(x.pages[0]); setFile(x.pages[0]); } });
  }, [id]);

  // asset blobs -> data URLs for preview
  useEffect(() => {
    if (!p) return;
    let live = true;
    (async () => {
      const m: Record<string, string> = {};
      for (const a of p.assets) {
        const b = await getAsset(p.id, a.id);
        if (b) m[`assets/${a.name}`] = await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(b); });
      }
      if (live) setAssetUrls(m);
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id, p?.assets]);

  // autosave
  useEffect(() => {
    if (!p || status !== "unsaved") return;
    const t = setTimeout(() => { setStatus("saving"); saveProject(p).then(() => setStatus("saved")).catch(() => setStatus("error")); }, 700);
    return () => clearTimeout(t);
  }, [p, status]);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (status === "unsaved" || status === "saving") e.preventDefault(); };
    window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h);
  }, [status]);

  const update = useCallback((fn: (x: Project) => Project, coalesce = false) => {
    if (!coalesce) setSel(null); // structural changes can shift element indices
    setP((cur) => {
      if (!cur) return cur;
      let next: Project;
      try { next = fn(cur); } catch (e) { setMsg({ kind: "error", text: e instanceof Error ? e.message : String(e) }); return cur; }
      if (next === cur) return cur;
      const now = Date.now();
      if (!coalesce || now - lastPush.current > 1200) hist.current.push(cur);
      lastPush.current = now;
      setStatus("unsaved"); setReport(null); force((n) => n + 1);
      return { ...next, updatedAt: now };
    });
  }, []);
  const undo = () => { if (!p) return; const prev = hist.current.undo(p); if (prev) { setP(prev); setStatus("unsaved"); setRev((r) => r + 1); setSel(null); } };
  const redo = () => { if (!p) return; const nx = hist.current.redo(p); if (nx) { setP(nx); setStatus("unsaved"); setRev((r) => r + 1); setSel(null); } };
  useEffect(() => { if (!p) return; if (p.files[page] === undefined) { setPage(p.pages[0]); setSel(null); } if (p.files[file] === undefined) setFile(p.pages[0]); }, [p, page, file]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || mode === "code") return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  // messages from preview iframe (validated by source)
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || !e.data || typeof e.data !== "object") return;
      const d = e.data as { goai?: string; i?: number; page?: string; msg?: string };
      if (d.goai === "select" && Number.isInteger(d.i)) setSel(d.i!);
      else if (d.goai === "nav" && typeof d.page === "string") { if (p?.files[d.page] !== undefined) { setPage(d.page); setSel(null); } else setMsg({ kind: "info", text: `Link target ${d.page} does not exist in this project.` }); }
      else if (d.goai === "info" && typeof d.msg === "string") setMsg({ kind: "info", text: d.msg });
    };
    window.addEventListener("message", on); return () => window.removeEventListener("message", on);
  }, [p]);

  const srcDoc = useMemo(() => (p ? buildPreview(p, page, assetUrls, mode === "visual") : ""), [p, page, assetUrls, mode]);
  const selProps: ElementProps | null = useMemo(() => {
    if (!p || sel === null) return null;
    const el = elementAt(new DOMParser().parseFromString(p.files[page] ?? "", "text/html"), sel);
    return el ? readElement(el) : null;
  }, [p, page, sel]);

  if (missing) return <div className="container page-head"><h1>Project not found</h1><p>It may have been deleted or stored in another browser.</p><Link className="btn btn-dark" href="/builder">Back to My Projects</Link></div>;
  if (!p) return <div className="container page-head" aria-busy="true">Loading project…</div>;

  const theme = readTheme(p.files["styles.css"] ?? "");
  const totalAssets = p.assets.reduce((s, a) => s + a.size, 0);

  const onUpload = async (list: FileList | null) => {
    if (!list) return;
    let total = totalAssets; const added: AssetMeta[] = []; const errs: string[] = [];
    for (const f of Array.from(list)) {
      const name = safeSegment(f.name);
      const e = validateAsset(name, f.type, f.size, total);
      if (e) { errs.push(e); continue; }
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (!sniff(bytes, f.type)) { errs.push(`${name}: content does not match its file type.`); continue; }
      if (p.assets.some((a) => a.name === name) || added.some((a) => a.name === name)) { errs.push(`${name}: an asset with this name already exists.`); continue; }
      const meta = { id: uid(), name, type: f.type, size: f.size };
      await putAsset(p.id, meta.id, new Blob([bytes], { type: f.type }));
      added.push(meta); total += f.size;
    }
    if (added.length) update((x) => ({ ...x, assets: [...x.assets, ...added] }));
    setMsg(errs.length ? { kind: "error", text: errs.join(" ") } : { kind: "ok", text: `Added ${added.length} asset(s).` });
  };
  const removeAsset = async (a: AssetMeta) => {
    const used = Object.values(p.files).some((c) => c.includes(`assets/${a.name}`));
    if (!confirm(`Delete asset ${a.name}?${used ? " It is still referenced in your files — Check Project will report the broken references." : ""}`)) return;
    await deleteAsset(p.id, a.id); update((x) => ({ ...x, assets: x.assets.filter((y) => y.id !== a.id) }));
  };
  const runCheck = () => setReport(checkProject(p, { jsSyntax: jsSyntaxCheck }));
  const doExport = async () => {
    const r = checkProject(p, { jsSyntax: jsSyntaxCheck }); setReport(r);
    if (r.errors.length && !confirm(`Check Project found ${r.errors.length} error(s). The exported project may not work correctly. Export anyway?`)) return;
    await exportZip(p); setMsg({ kind: "ok", text: "ZIP exported." });
  };
  const applySel = (props: Partial<ElementProps>) => { if (sel !== null) update((x) => ({ ...x, files: { ...x.files, [page]: applyElement(x.files[page], sel, props) } }), true); };

  return (
    <div className="builder">
      <div className="b-top">
        <Link href="/builder" className="btn btn-ghost btn-sm">← Projects</Link>
        <strong className="b-name" title={p.name}>{p.name}</strong>
        <span className={`b-status s-${status}`} role="status">{status === "saved" ? "Saved locally" : status === "saving" ? "Saving…" : status === "unsaved" ? "Unsaved changes" : "Save failed"}</span>
        <div className="toolbar" style={{ margin: 0, marginLeft: "auto" }}>
          <button className="btn btn-ghost btn-sm" onClick={undo} disabled={!hist.current.canUndo} aria-label="Undo">↶ Undo</button>
          <button className="btn btn-ghost btn-sm" onClick={redo} disabled={!hist.current.canRedo} aria-label="Redo">↷ Redo</button>
          <button className="btn btn-outline btn-sm" onClick={runCheck}>Check Project</button>
          <label className="b-check"><input type="checkbox" checked={p.backend} onChange={(e) => update((x) => ({ ...x, backend: e.target.checked }))} /> Include backend</label>
          <button className="btn btn-dark btn-sm" onClick={doExport}>Export ZIP</button>
        </div>
      </div>
      {msg && <div className={`alert alert-${msg.kind}`} role="status" style={{ margin: "8px 0" }}>{msg.text} <button className="btn btn-ghost btn-sm" onClick={() => setMsg(null)} aria-label="Dismiss">✕</button></div>}
      {report && <CheckView r={report} onClose={() => setReport(null)} />}

      <div className="b-grid">
        <aside className="b-side" aria-label="Project panels">
          <div className="chips" role="tablist">{(["pages", "files", "assets", "theme"] as const).map((s) => <button key={s} className="chip" role="tab" aria-selected={side === s} aria-pressed={side === s} onClick={() => setSide(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div>
          {side === "pages" && <div className="b-list">
            {p.pages.map((f, i) => (
              <div key={f} className={`b-item${f === page ? " on" : ""}`}>
                <button className="b-link" onClick={() => { setPage(f); setFile(f); setSel(null); }}>{f === "index.html" ? "⌂ " : ""}{titleOf(p.files[f]) || f}<small>{f}</small></button>
                <div className="b-actions">
                  <button title="Move up" aria-label={`Move ${f} up`} disabled={i === 0} onClick={() => update((x) => movePage(x, f, -1))}>↑</button>
                  <button title="Move down" aria-label={`Move ${f} down`} disabled={i === p.pages.length - 1} onClick={() => update((x) => movePage(x, f, 1))}>↓</button>
                  <details><summary aria-label={`More actions for ${f}`}>⋯</summary><div className="b-menu">
                    <button onClick={() => { const t = prompt("Page title", titleOf(p.files[f])); if (t?.trim()) update((x) => setPageTitle(x, f, t.trim())); }}>Edit title</button>
                    <button onClick={() => { const n = prompt("New file name (letters, numbers, - and _)", f.replace(".html", "")); if (n) { let to = f; try { to = normalizePageName(n); } catch { /* reported by update */ } update((x) => renamePage(x, f, n)); if (page === f) setPage(to); if (file === f) setFile(to); } }}>Rename file</button>
                    <button onClick={() => update((x) => duplicatePage(x, f))}>Duplicate</button>
                    <button disabled={f === "index.html"} onClick={() => { update((x) => setHomepage(x, f)); setPage("index.html"); setFile("index.html"); setSel(null); }}>Set as homepage</button>
                    <button className="danger" disabled={f === "index.html"} onClick={() => { if (confirm(`Delete page ${f}? Links pointing to it will break (you can undo).`)) { update((x) => deletePage(x, f)); if (page === f) { setPage("index.html"); setFile("index.html"); } } }}>Delete</button>
                  </div></details>
                </div>
              </div>))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => { const n = prompt("New page name, e.g. pricing"); if (n) update((x) => addPage(x, n)); }}>+ Add page</button>
          </div>}
          {side === "files" && <div className="b-list">
            {Object.keys(p.files).sort().map((f) => <div key={f} className={`b-item${f === file && mode === "code" ? " on" : ""}`}><button className="b-link" onClick={() => { setFile(f); setMode("code"); if (f.endsWith(".html")) setPage(f); }}>{f}<small>{(p.files[f].length / 1024).toFixed(1)} KB</small></button></div>)}
            {p.assets.map((a) => <div key={a.id} className="b-item"><span className="b-link muted">assets/{a.name}<small>{(a.size / 1024).toFixed(1)} KB · binary</small></span></div>)}
          </div>}
          {side === "assets" && <div>
            <label className="btn btn-dark btn-sm" style={{ marginTop: 10 }}>Upload files<input type="file" multiple hidden accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon,font/woff,font/woff2,application/pdf" onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} /></label>
            <p className="muted" style={{ fontSize: ".85rem" }}>Max 5 MB per file, 50 MB per project ({(totalAssets / 1048576).toFixed(1)} / {MAX_TOTAL / 1048576} MB used). Reference as <code>assets/name.png</code>.</p>
            <div className="b-assets">{p.assets.map((a) => (
              <figure key={a.id}>
                {a.type.startsWith("image/") && assetUrls[`assets/${a.name}`] ? <img src={assetUrls[`assets/${a.name}`]} alt="" /> : <div className="b-file">{a.name.split(".").pop()}</div>}
                <figcaption>{a.name}</figcaption>
                <div className="toolbar" style={{ margin: 0 }}>
                  {sel !== null && a.type.startsWith("image/") && mode === "visual" && <button className="btn btn-ghost btn-sm" onClick={() => {
                    if (selProps?.tag === "img") applySel({ src: `assets/${a.name}` });
                    else update((x) => ({ ...x, files: { ...x.files, [page]: insertImage(x.files[page], sel, `assets/${a.name}`, a.name.replace(/\.\w+$/, "")) } }));
                  }}>{selProps?.tag === "img" ? "Use for image" : "Insert after"}</button>}
                  <button className="btn btn-danger btn-sm" onClick={() => removeAsset(a)} aria-label={`Delete ${a.name}`}>Delete</button>
                </div>
              </figure>))}</div>
          </div>}
          {side === "theme" && <div className="b-theme">
            {THEME_KEYS.map((k) => (
              <div key={k} className="field" style={{ marginTop: 10 }}>
                <label htmlFor={`th-${k}`}>{THEME_LABEL[k]}</label>
                {isColor(k) ? <div style={{ display: "flex", gap: 8 }}><input type="color" aria-label={`${THEME_LABEL[k]} picker`} value={/^#[0-9a-f]{6}$/i.test(theme[k] ?? "") ? theme[k] : "#000000"} onChange={(e) => update((x) => ({ ...x, files: { ...x.files, "styles.css": writeTheme(x.files["styles.css"], k, e.target.value) } }), true)} />
                  <input id={`th-${k}`} type="text" value={theme[k] ?? ""} onChange={(e) => update((x) => ({ ...x, files: { ...x.files, "styles.css": writeTheme(x.files["styles.css"], k, e.target.value) } }), true)} /></div>
                  : k === "font" ? <select id={`th-${k}`} value={FONTS.includes(theme.font ?? "") ? theme.font : "__custom"} onChange={(e) => e.target.value !== "__custom" && update((x) => ({ ...x, files: { ...x.files, "styles.css": writeTheme(x.files["styles.css"], k, e.target.value) } }))}>
                    {FONTS.map((f) => <option key={f} value={f}>{f.split(",")[0].replace(/'/g, "")}</option>)}{!FONTS.includes(theme.font ?? "") && <option value="__custom">{theme.font} (custom)</option>}</select>
                  : <input id={`th-${k}`} type="text" value={theme[k] ?? ""} onChange={(e) => update((x) => ({ ...x, files: { ...x.files, "styles.css": writeTheme(x.files["styles.css"], k, e.target.value) } }), true)} />}
              </div>))}
            <p className="muted" style={{ fontSize: ".85rem", marginTop: 10 }}>These edit the CSS variables in <code>styles.css</code> <code>:root</code>.</p>
          </div>}
        </aside>

        <section className="b-main" aria-label="Workspace">
          <div className="toolbar" style={{ marginTop: 0 }}>
            <div className="chips" role="group" aria-label="Mode">
              <button className="chip" aria-pressed={mode === "visual"} onClick={() => setMode("visual")}>Visual edit</button>
              <button className="chip" aria-pressed={mode === "preview"} onClick={() => { setMode("preview"); setSel(null); }}>Preview</button>
              <button className="chip" aria-pressed={mode === "code"} onClick={() => { setMode("code"); setSel(null); }}>Code</button>
            </div>
            {mode !== "code" && <div className="chips" role="group" aria-label="Device">{(Object.keys(DEVICES) as Device[]).map((d) => <button key={d} className="chip" aria-pressed={device === d} onClick={() => setDevice(d)}>{DEVICES[d].label}</button>)}</div>}
            {mode !== "code" && <span className="muted" style={{ fontSize: ".85rem" }}>Page: {page}</span>}
          </div>
          {mode === "code" ? <div>
            <div className="chips" style={{ marginBottom: 8 }}>{Object.keys(p.files).sort().map((f) => <button key={f} className="chip" aria-pressed={file === f} onClick={() => setFile(f)}>{f}</button>)}</div>
            <CodeEditor revision={rev} file={file} value={p.files[file] ?? ""} onChange={(v) => update((x) => (x.files[file] === v ? x : { ...x, files: { ...x.files, [file]: v } }), true)} />
          </div> : <div className="b-stage">
            <iframe ref={frame} title={`Preview of ${page}`} sandbox="allow-scripts" srcDoc={srcDoc} referrerPolicy="no-referrer" style={{ width: DEVICES[device].w }} />
          </div>}
          {mode === "visual" && <p className="muted" style={{ fontSize: ".85rem" }}>Click any element in the preview to edit it. Scripts are paused in Visual edit; switch to Preview to test interactions and links.</p>}
        </section>

        {mode === "visual" && <aside className="b-insp" aria-label="Element inspector">
          {!selProps ? <p className="muted">Select an element in the preview.</p> : <Inspector key={`${page}-${sel}-${rev}`} props={selProps} pages={p.pages} assets={p.assets} onApply={applySel}
            onDelete={() => { update((x) => ({ ...x, files: { ...x.files, [page]: removeElement(x.files[page], sel!) } })); setSel(null); }} />}
        </aside>}
      </div>
    </div>
  );
}

function Inspector({ props, pages, assets, onApply, onDelete }: { props: ElementProps; pages: string[]; assets: AssetMeta[]; onApply: (p: Partial<ElementProps>) => void; onDelete: () => void }) {
  const [v, setV] = useState(props);
  const set = (k: keyof ElementProps, val: string) => setV({ ...v, [k]: val });
  const field = (k: keyof ElementProps, label: string, ph = "") => (
    <div className="field" style={{ marginTop: 8 }}><label htmlFor={`in-${k}`}>{label}</label><input id={`in-${k}`} type="text" value={(v[k] as string) ?? ""} placeholder={ph} onChange={(e) => set(k, e.target.value)} onBlur={() => onApply({ [k]: v[k] })} onKeyDown={(e) => e.key === "Enter" && onApply({ [k]: v[k] })} /></div>);
  const color = (k: "color" | "background", label: string) => (
    <div className="field" style={{ marginTop: 8 }}><label htmlFor={`in-${k}`}>{label}</label>
      <div style={{ display: "flex", gap: 6 }}><input type="color" aria-label={`${label} picker`} value={toHex(v[k]) ?? "#000000"} onChange={(e) => { set(k, e.target.value); onApply({ [k]: e.target.value }); }} />
        <input id={`in-${k}`} type="text" value={v[k]} placeholder="inherit" onChange={(e) => set(k, e.target.value)} onBlur={() => onApply({ [k]: v[k] })} />
        <button className="btn btn-ghost btn-sm" onClick={() => { set(k, ""); onApply({ [k]: "" }); }}>Reset</button></div></div>);
  return (
    <div>
      <p><span className="badge">&lt;{props.tag}&gt;</span></p>
      {props.text !== undefined && <div className="field"><label htmlFor="in-text">Text</label><textarea id="in-text" style={{ minHeight: 80, fontFamily: "inherit" }} value={v.text} onChange={(e) => set("text", e.target.value)} onBlur={() => onApply({ text: v.text })} /></div>}
      {props.href !== undefined && <>{field("href", "Link (href)", "page.html or https://…")}
        <select aria-label="Link to page" value="" onChange={(e) => { if (e.target.value) { set("href", e.target.value); onApply({ href: e.target.value }); } }}><option value="">Link to a page…</option>{pages.map((pg) => <option key={pg} value={pg}>{pg}</option>)}</select></>}
      {props.src !== undefined && <>{field("src", "Image source")}
        <select aria-label="Choose asset" value="" onChange={(e) => { if (e.target.value) { set("src", e.target.value); onApply({ src: e.target.value }); } }}><option value="">Choose from assets…</option>{assets.filter((a) => a.type.startsWith("image/")).map((a) => <option key={a.id} value={`assets/${a.name}`}>{a.name}</option>)}</select>
        {field("alt", "Alt text (describe the image)")}</>}
      {color("color", "Text color")}{color("background", "Background")}
      {field("fontSize", "Font size", "e.g. 1.5rem or 24px")}
      <div className="field" style={{ marginTop: 8 }}><label htmlFor="in-fw">Font weight</label><select id="in-fw" value={v.fontWeight} onChange={(e) => { set("fontWeight", e.target.value); onApply({ fontWeight: e.target.value }); }}><option value="">Default</option>{["300", "400", "600", "700", "800"].map((w) => <option key={w}>{w}</option>)}</select></div>
      <div className="field" style={{ marginTop: 8 }}><label htmlFor="in-ta">Text align</label><select id="in-ta" value={v.textAlign} onChange={(e) => { set("textAlign", e.target.value); onApply({ textAlign: e.target.value }); }}><option value="">Default</option>{["left", "center", "right"].map((w) => <option key={w}>{w}</option>)}</select></div>
      {field("padding", "Padding", "e.g. 16px or 1rem 2rem")}{field("margin", "Margin", "e.g. 0 auto")}
      <button className="btn btn-danger btn-sm" style={{ marginTop: 14 }} onClick={() => confirm("Remove this element? (You can undo.)") && onDelete()}>Remove element</button>
    </div>
  );
}
function toHex(c: string): string | null {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c); if (!m) return null;
  return "#" + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("");
}
function CheckView({ r, onClose }: { r: CheckReport; onClose: () => void }) {
  return (
    <section className="tool-panel b-report" aria-labelledby="rep-h" style={{ margin: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 id="rep-h" style={{ fontSize: "1.2rem", margin: 0 }}>Check Project</h2><button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button></div>
      <div className="grid grid-3" style={{ marginTop: 10 }}>
        <div><h3 style={{ color: "#c62828" }}>Errors ({r.errors.length})</h3><ul>{r.errors.map((e) => <li key={e}>{e}</li>)}</ul>{!r.errors.length && <p className="muted">None found by these checks.</p>}</div>
        <div><h3 style={{ color: "#9a6700" }}>Warnings ({r.warnings.length})</h3><ul>{r.warnings.map((e) => <li key={e}>{e}</li>)}</ul></div>
        <div><h3 style={{ color: "#2e7d32" }}>Passed ({r.passed.length})</h3><ul>{r.passed.map((e) => <li key={e}>{e}</li>)}</ul></div>
      </div>
    </section>
  );
}
