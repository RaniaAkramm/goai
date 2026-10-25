"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TOOLS } from "@/lib/tools";
export function ToolDirectory() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? TOOLS.filter((t) => [t.name, t.description, ...t.keywords].join(" ").toLowerCase().includes(s)) : TOOLS;
  }, [q]);
  return (
    <>
      <label htmlFor="tool-search" className="sr-only">Search tools</label>
      <input id="tool-search" type="search" className="search" placeholder="Search tools — e.g. json, sha256, camelCase" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="muted" aria-live="polite" style={{ margin: "12px 0" }}>{list.length} of {TOOLS.length} tools</p>
      <div className="grid grid-4">
        {list.map((t) => <Link key={t.slug} href={`/tools/${t.slug}`} className="card tool-card"><div className="icon-sq" aria-hidden="true">{t.icon}</div><h3>{t.name}</h3><p>{t.description}</p></Link>)}
      </div>
      {!list.length && <p className="alert alert-info">No tools match “{q}”.</p>}
    </>
  );
}
