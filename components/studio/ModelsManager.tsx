"use client";
import { useEffect, useState } from "react";
import { useStudio } from "./StudioProvider";
import { MODELS, formatSize } from "@/lib/studio/models";
import { isCached, removeFromCache } from "@/lib/studio/engine";

export default function ModelsManager() {
  const { gpu, engines, loading, error, load, unload } = useStudio();
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [quota, setQuota] = useState("");
  const refresh = () => { MODELS.forEach((m) => isCached(m).then((c) => setCached((x) => ({ ...x, [m.id]: c })))); navigator.storage?.estimate?.().then((e) => setQuota(`${formatSize((e.usage ?? 0) / 1048576)} used of ~${formatSize((e.quota ?? 0) / 1048576)} available to this site`)).catch(() => {}); };
  useEffect(refresh, [engines]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className={`alert ${gpu?.ok ? "alert-ok" : "alert-warn"}`} role="status">{gpu === null ? "Checking WebGPU…" : gpu.ok ? <><b>WebGPU available.</b> GPU models run at full speed. {gpu.reason}</> : <><b>WebGPU unavailable.</b> {gpu.reason} GPU models are disabled; CPU models (marked CPU) still work.</>}</div>
      {quota && <p className="st-hint">Storage: {quota}.</p>}
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid grid-2">
        {MODELS.map((m) => {
          const disabled = m.kind === "webllm" && !gpu?.ok; const busy = loading?.id === m.id; const ready = !!engines[m.id];
          return (
            <article key={m.id} className={`card st-model${ready ? " on" : ""}`}>
              <div className="toolbar" style={{ margin: 0, justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>{m.name}</h3><span className={`badge ${m.kind === "webllm" ? "" : "badge-soft"}`}>{m.kind === "webllm" ? "WebGPU" : "CPU"}</span></div>
              <p className="muted" style={{ margin: "8px 0" }}>{m.note}</p>
              <ul className="pill-list" style={{ marginTop: 0 }}><li>{formatSize(m.sizeMB)}</li>{m.tasks.map((t) => <li key={t}>{t}</li>)}{m.recommended && <li>★ recommended</li>}{cached[m.id] && <li>✓ cached</li>}</ul>
              {busy && loading && <div className="st-progress" role="progressbar" aria-valuenow={Math.round(loading.progress * 100)} aria-label={`${m.name} download progress`}><i style={{ width: `${Math.max(2, loading.progress * 100)}%` }} /><span>{loading.text}</span></div>}
              <div className="toolbar">
                {ready ? <button className="btn btn-ghost btn-sm" onClick={() => unload(m.id)}>Unload from memory</button>
                  : <button className="btn btn-dark btn-sm" disabled={disabled || !!loading} onClick={() => load(m.id)}>{busy ? "Loading…" : cached[m.id] ? "Load" : "Download & load"}</button>}
                {cached[m.id] && <button className="btn btn-danger btn-sm" disabled={busy} onClick={async () => { if (confirm(`Delete ${m.name} from this browser's cache?`)) { await unload(m.id); await removeFromCache(m); refresh(); } }}>Delete from cache</button>}
              </div>
              <p className="st-id">{m.id}</p>
            </article>);
        })}
      </div>
    </>
  );
}
