"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { detectWebGPU, loadEngine, type Engine } from "@/lib/studio/engine";
import { getModel } from "@/lib/studio/models";

type Status = { id: string; progress: number; text: string } | null;
type Ctx = { gpu: { ok: boolean; reason: string } | null; engines: Record<string, Engine>; loading: Status; error: string; load: (id: string) => Promise<Engine | null>; unload: (id: string) => Promise<void> };
const C = createContext<Ctx | null>(null);
export const useStudio = () => { const c = useContext(C); if (!c) throw new Error("StudioProvider missing"); return c; };

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [gpu, setGpu] = useState<Ctx["gpu"]>(null);
  const [engines, setEngines] = useState<Record<string, Engine>>({});
  const [loading, setLoading] = useState<Status>(null);
  const [error, setError] = useState("");
  const ref = useRef(engines); ref.current = engines;
  useEffect(() => { detectWebGPU().then(setGpu); }, []);
  const unload = useCallback(async (id: string) => { const e = ref.current[id]; if (!e) return; await e.unload().catch(() => {}); setEngines((x) => { const y = { ...x }; delete y[id]; return y; }); }, []);
  const load = useCallback(async (id: string) => {
    if (ref.current[id]) return ref.current[id];
    const m = getModel(id); if (!m) return null;
    setError(""); setLoading({ id, progress: 0, text: "Preparing…" });
    try {
      // Only keep one GPU model in memory at a time.
      if (m.kind === "webllm") for (const [k, e] of Object.entries(ref.current)) if (e.model.kind === "webllm") await unload(k);
      const e = await loadEngine(id, (p) => setLoading({ id, progress: p.progress, text: p.text }));
      setEngines((x) => ({ ...x, [id]: e })); track("studio_model_loaded", { model: id });
      return e;
    } catch (e) {
      setError(`Could not load ${m.name}: ${e instanceof Error ? e.message : String(e)}. Check your connection, free disk space and GPU memory, or pick a smaller model.`);
      return null;
    } finally { setLoading(null); }
  }, [unload]);
  return <C.Provider value={{ gpu, engines, loading, error, load, unload }}>{children}</C.Provider>;
}
