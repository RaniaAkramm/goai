import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/StudioShell";
export const metadata: Metadata = { title: "In-Browser AI Models — Download, Cache & Manage", description: "Manage the free open AI models GoAI Studio runs in your browser: sizes, download progress, cache and WebGPU status.", keywords: ["WebLLM models", "Transformers.js models", "WebGPU check", "local AI models"], alternates: { canonical: "/studio/models" }, openGraph: { title: "In-Browser AI Models — Download, Cache & Manage · GoAI.foo", description: "Manage the free open AI models GoAI Studio runs in your browser: sizes, download progress, cache and WebGPU status.", url: "/studio/models" } };
export default function Page() {
  return (<>
    <div className="page-head st-head"><span className="badge badge-lime">AI Studio · runs on your device</span><h1>Models</h1><p className="muted">Download once, cached in your browser, usable offline. Delete any time.</p></div>
    <StudioApp app="models" />
  </>);
}
