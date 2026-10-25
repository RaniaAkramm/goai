"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { track } from "@vercel/analytics";
const loading = () => <div className="tool-panel" aria-busy="true">Loading tool…</div>;
const MAP = {
  "json-formatter": dynamic(() => import("./tools/JsonFormatter"), { ssr: false, loading }),
  "json-csv": dynamic(() => import("./tools/JsonCsv"), { ssr: false, loading }),
  base64: dynamic(() => import("./tools/Base64Tool"), { ssr: false, loading }),
  diff: dynamic(() => import("./tools/DiffTool"), { ssr: false, loading }),
  playground: dynamic(() => import("./tools/Playground"), { ssr: false, loading }),
  "text-tools": dynamic(() => import("./tools/TextTools"), { ssr: false, loading }),
  regex: dynamic(() => import("./tools/RegexTester"), { ssr: false, loading }),
  hash: dynamic(() => import("./tools/HashTool"), { ssr: false, loading }),
} as const;
export function ToolLoader({ slug }: { slug: string }) {
  const C = MAP[slug as keyof typeof MAP];
  useEffect(() => { if (C) track("tool_used", { tool: slug }); }, [slug, C]);
  return C ? <C /> : null;
}
