import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/StudioShell";
export const metadata: Metadata = { title: "Free AI Website Generator — Write a Full Site with Local AI", description: "Describe your business and get a complete, professional multi-page website with AI-written copy, your colors and fonts. Edit in the Builder and export a ZIP. Free.", keywords: ["AI website generator", "free AI website builder", "AI landing page generator", "website copy generator", "no sign-up website builder"], alternates: { canonical: "/studio/site" }, openGraph: { title: "Free AI Website Generator — Write a Full Site with Local AI · GoAI.foo", description: "Describe your business and get a complete, professional multi-page website with AI-written copy, your colors and fonts. Edit in the Builder and export a ZIP. Free.", url: "/studio/site" } };
export default function Page() {
  return (<>
    <div className="page-head st-head"><span className="badge badge-lime">AI Studio · runs on your device</span><h1>AI site generator</h1><p className="muted">Describe your business; local AI writes the copy and the Builder turns it into a full, editable website.</p></div>
    <StudioApp app="site" />
  </>);
}
