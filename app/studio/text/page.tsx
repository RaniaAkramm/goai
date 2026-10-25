import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/StudioShell";
export const metadata: Metadata = { title: "Free AI Summarizer, Rewriter & Translator to English", description: "Summarize, rewrite in any tone, fix grammar and translate text to English with local AI in your browser. Free, private, no sign-up.", keywords: ["AI summarizer", "free text summarizer", "AI rewriter", "paraphrasing tool", "translate to English AI", "grammar fixer"], alternates: { canonical: "/studio/text" }, openGraph: { title: "Free AI Summarizer, Rewriter & Translator to English · GoAI.foo", description: "Summarize, rewrite in any tone, fix grammar and translate text to English with local AI in your browser. Free, private, no sign-up.", url: "/studio/text" } };
export default function Page() {
  return (<>
    <div className="page-head st-head"><span className="badge badge-lime">AI Studio · runs on your device</span><h1>Text tools</h1><p className="muted">Summarize, rewrite, fix grammar or translate anything into English — privately.</p></div>
    <StudioApp app="text" />
  </>);
}
