"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStudio } from "./StudioProvider";
import { defaultModelFor, formatSize, getModel, usableModels, type ModelInfo } from "@/lib/studio/models";
import { isCached } from "@/lib/studio/engine";

/** Model selector used at the top of each Studio app. Returns the selected model id via onChange. */
export function ModelBar({ task, value, onChange }: { task: "chat" | "code" | "text"; value: string; onChange: (id: string) => void }) {
  const { gpu, engines, loading, error, load } = useStudio();
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const list = usableModels(task, !!gpu?.ok);
  useEffect(() => { if (gpu && (!value || !list.some((m) => m.id === value))) onChange(defaultModelFor(task, gpu.ok)); }, [gpu]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { list.forEach((m) => isCached(m).then((c) => setCached((x) => ({ ...x, [m.id]: c })))); }, [gpu, engines]); // eslint-disable-line react-hooks/exhaustive-deps
  const m: ModelInfo | undefined = getModel(value);
  const ready = !!engines[value]; const busy = loading?.id === value;
  return (
    <div className="st-modelbar" aria-label="Model">
      {gpu && !gpu.ok && <div className="alert alert-warn st-gpu"><b>WebGPU isn’t available</b> — {gpu.reason} Studio will use smaller CPU models (slower, simpler answers). For the best experience use a recent Chrome, Edge or Safari on a computer with a GPU.</div>}
      <div className="st-modelrow">
        <label htmlFor={`model-${task}`} className="sr-only">Model</label>
        <select id={`model-${task}`} value={value} onChange={(e) => onChange(e.target.value)} disabled={!!loading}>
          {list.map((x) => <option key={x.id} value={x.id}>{x.name} · {formatSize(x.sizeMB)}{cached[x.id] ? " · cached" : ""}</option>)}
        </select>
        {ready ? <span className="st-ready" role="status">● Ready</span>
          : <button className="btn btn-dark btn-sm" disabled={!m || !!loading || !gpu} onClick={() => load(value)}>{busy ? "Loading…" : cached[value] ? "Load (cached)" : `Download ${m ? formatSize(m.sizeMB) : ""}`}</button>}
        <Link href="/studio/models" className="btn btn-ghost btn-sm">Manage models</Link>
      </div>
      {m && !ready && !busy && <p className="st-hint">{m.note} {cached[value] ? "Already in your browser cache — loads without downloading." : "Downloaded once from Hugging Face, then cached in your browser for offline use."}</p>}
      {busy && loading && <div className="st-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(loading.progress * 100)} aria-label="Model download progress"><i style={{ width: `${Math.max(2, loading.progress * 100)}%` }} /><span>{loading.text}</span></div>}
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
