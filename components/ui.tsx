"use client";
import { useState } from "react";
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [s, setS] = useState(label);
  return (
    <button type="button" className="btn btn-ghost btn-sm" disabled={!text} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setS("Copied ✓"); } catch { setS("Copy failed"); }
      setTimeout(() => setS(label), 1500);
    }}>{s}</button>
  );
}
export function download(name: string, content: string | Blob, type = "text/plain") {
  const blob = typeof content === "string" ? new Blob([content], { type: `${type};charset=utf-8` }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="chip" aria-pressed={on} onClick={onClick}>{children}</button>;
}
