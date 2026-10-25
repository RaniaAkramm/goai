"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { StudioProvider, useStudio } from "./StudioProvider";

const loading = () => <div className="tool-panel" aria-busy="true">Loading Studio…</div>;
export const APPS = {
  chat: dynamic(() => import("./ChatApp"), { ssr: false, loading }),
  code: dynamic(() => import("./CodeAssistant"), { ssr: false, loading }),
  text: dynamic(() => import("./TextTools"), { ssr: false, loading }),
  site: dynamic(() => import("./SiteGenerator"), { ssr: false, loading }),
  models: dynamic(() => import("./ModelsManager"), { ssr: false, loading }),
};
export function StudioApp({ app }: { app: keyof typeof APPS }) { const C = APPS[app]; return <C />; }

const TABS = [["/studio", "Overview"], ["/studio/chat", "AI Chat"], ["/studio/code", "Code"], ["/studio/text", "Text"], ["/studio/site", "Site generator"], ["/studio/models", "Models"]];
function Status() {
  const { engines, gpu } = useStudio();
  const n = Object.keys(engines).length;
  return <span className="st-status">{gpu === null ? "Checking GPU…" : gpu.ok ? "WebGPU ✓" : "CPU mode"} · {n ? `${n} model${n > 1 ? "s" : ""} loaded` : "no model loaded"}</span>;
}
export function StudioShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <StudioProvider>
      <div className="container">
        <nav className="st-tabs" aria-label="Studio">
          {TABS.map(([h, l]) => <Link key={h} href={h} className={path === h ? "active" : ""} aria-current={path === h ? "page" : undefined}>{l}</Link>)}
          <Status />
        </nav>
        {children}
      </div>
    </StudioProvider>
  );
}
