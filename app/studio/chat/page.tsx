import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/StudioShell";
export const metadata: Metadata = { title: "Free Private AI Chat — No Sign-up, Runs in Your Browser", description: "Chat with open AI models (Qwen, Llama, SmolLM) running locally in your browser with WebGPU. Free, private, no account, history saved on your device.", keywords: ["free AI chat", "in-browser AI chat", "private AI chat", "no sign-up AI", "local LLM", "WebLLM chat"], alternates: { canonical: "/studio/chat" }, openGraph: { title: "Free Private AI Chat — No Sign-up, Runs in Your Browser · GoAI.foo", description: "Chat with open AI models (Qwen, Llama, SmolLM) running locally in your browser with WebGPU. Free, private, no account, history saved on your device.", url: "/studio/chat" } };
export default function Page() {
  return (<>
    <div className="page-head st-head"><span className="badge badge-lime">AI Studio · runs on your device</span><h1>AI Chat</h1><p className="muted">Streaming answers from an open model running locally. History is saved in this browser only.</p></div>
    <StudioApp app="chat" />
  </>);
}
