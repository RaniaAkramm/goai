import type { Metadata } from "next";
import { BuilderHomeLoader } from "@/components/builder/Loaders";
export const metadata: Metadata = { title: "Free Website Builder — Templates, Visual Editor & ZIP Export", description: "Build professional, responsive websites in your browser: rich templates with hero, pricing, testimonials and FAQ, your colors and fonts, visual + code editor, ZIP export. Free, no sign-up.", keywords: ["free website builder", "landing page builder", "website templates", "static site generator", "HTML website builder", "no sign-up website builder"], alternates: { canonical: "/builder" } };
export default function BuilderPage() {
  return (<div className="container"><div className="page-head"><span className="badge badge-soft">Local-first · Saved in this browser</span><h1 style={{ marginTop: 12 }}>Project Builder</h1>
    <p>Start from a template or a blank page, edit visually or in code, preview on desktop, tablet and mobile, run a project check and export a ZIP. Projects are stored in this browser’s IndexedDB — export them to keep a copy.</p></div>
    <BuilderHomeLoader /></div>);
}
