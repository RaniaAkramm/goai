import type { Metadata } from "next";
import { ToolDirectory } from "@/components/ToolDirectory";
export const metadata: Metadata = { title: "Developer tools", description: "Free in-browser developer tools: JSON formatter, JSON to CSV, Base64, diff, playground, text utilities, regex tester and hash generator." };
export default function ToolsPage() {
  return (<div className="container"><div className="page-head"><span className="badge badge-soft">8 tools</span><h1 style={{ marginTop: 12 }}>Developer tools</h1><p>Every tool runs locally in your browser. Nothing you paste is sent to a server.</p></div><ToolDirectory /></div>);
}
