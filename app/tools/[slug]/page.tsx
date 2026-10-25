import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOOLS, getTool } from "@/lib/tools";
import { ToolLoader } from "@/components/ToolLoader";

export const dynamicParams = false;
export function generateStaticParams() { return TOOLS.map((t) => ({ slug: t.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = getTool((await params).slug);
  return t ? { title: t.name, description: `${t.description} Free, runs locally in your browser.` } : {};
}
export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTool(slug);
  if (!t) notFound();
  return (
    <div className="container">
      <div className="page-head">
        <p style={{ margin: 0 }}><Link href="/tools" className="muted">← All tools</Link></p>
        <h1 style={{ fontSize: "clamp(2rem,4.5vw,3rem)", marginTop: 10 }}>{t.name}</h1>
        <p>{t.description} <span className="badge badge-soft">Runs locally</span></p>
      </div>
      <ToolLoader slug={slug} />
    </div>
  );
}
