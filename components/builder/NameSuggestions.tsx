"use client";
import { useState } from "react";
import type { Suggestion } from "@/lib/builder/nameSuggest";

type Props = { name: string; suggestions: Suggestion[]; picked: Suggestion | null; onPick: (s: Suggestion) => void; onAi: (s: Suggestion[] | null) => void; onCreate: (s: Suggestion) => void };

export default function NameSuggestions({ name, suggestions, picked, onPick, onAi, onCreate }: Props) {
  const [busy, setBusy] = useState(""); const [err, setErr] = useState("");
  if (!name.trim()) return null;
  const smarter = async () => {
    setErr(""); setBusy("Loading local AI model…");
    try { const { smarterSuggest } = await import("@/lib/builder/nameSuggestModel"); onAi(await smarterSuggest(name, setBusy)); }
    catch (e) { setErr("The local AI model could not load in this browser (" + String((e as Error)?.message ?? e).slice(0, 120) + "). The instant suggestions still work."); }
    finally { setBusy(""); }
  };
  const isModel = suggestions[0]?.source === "model";
  return (
    <div className="name-sugs" data-testid="name-suggestions" aria-live="polite" style={{ margin: "8px 0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <strong>Suggested for “{name.trim()}”</strong>
        <span className="muted" style={{ fontSize: ".85rem" }}>{isModel ? "Ranked by a local AI model in your browser" : "Instant, based on the meaning and sound of the name"}</span>
        <button className="btn btn-ghost btn-sm" onClick={smarter} disabled={!!busy} data-testid="smarter">{busy || "✨ Smarter suggestion (local AI)"}</button>
        {isModel && <button className="btn btn-ghost btn-sm" onClick={() => onAi(null)}>Back to instant</button>}
      </div>
      {err && <p className="alert alert-error" style={{ marginTop: 8 }}>{err}</p>}
      <div className="grid grid-3" style={{ marginTop: 10 }}>
        {suggestions.map((s) => {
          const on = picked?.topic === s.topic && picked?.template === s.template;
          return (
            <div key={s.topic + s.template} className="card" data-testid="name-suggestion" style={{ boxShadow: "none", borderTop: `6px solid ${s.color}`, outline: on ? `2px solid ${s.color}` : undefined }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{s.templateName}</h3>
                <span className="muted" style={{ fontSize: ".75rem" }}>{s.confidence} match</span>
              </div>
              <p style={{ margin: "4px 0", fontWeight: 600 }}>{s.label}</p>
              <p className="muted" style={{ margin: "4px 0", fontSize: ".9rem" }}>“{s.tagline}”</p>
              <ul style={{ margin: "6px 0", paddingLeft: 18, fontSize: ".82rem" }} className="muted">{s.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span aria-label={`Brand color ${s.color}`} title={s.color} style={{ width: 22, height: 22, borderRadius: 6, background: s.color, display: "inline-block" }} />
                <button className="btn btn-dark btn-sm" onClick={() => onPick(s)}>{on ? "Applied ✓" : "Apply"}</button>
                {on && <button className="btn btn-sm" style={{ background: s.color, color: "#fff" }} onClick={() => onCreate(s)}>Create {s.templateName} site</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
