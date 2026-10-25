import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/StudioShell";
export const metadata: Metadata = { title: "Free AI Code Assistant — Explain, Fix & Write Code Locally", description: "Explain, fix, review, comment and convert code with a local AI coding model in your browser. Free, private, no API key, no sign-up.", keywords: ["AI code assistant", "free AI coding assistant", "explain code AI", "fix code AI", "code converter AI", "local code model"], alternates: { canonical: "/studio/code" }, openGraph: { title: "Free AI Code Assistant — Explain, Fix & Write Code Locally · GoAI.foo", description: "Explain, fix, review, comment and convert code with a local AI coding model in your browser. Free, private, no API key, no sign-up.", url: "/studio/code" } };
export default function Page() {
  return (<>
    <div className="page-head st-head"><span className="badge badge-lime">AI Studio · runs on your device</span><h1>Code assistant</h1><p className="muted">Explain, fix, review, comment, convert or write code with Qwen2.5 Coder — your code never leaves the device.</p></div>
    <StudioApp app="code" />
  </>);
}
