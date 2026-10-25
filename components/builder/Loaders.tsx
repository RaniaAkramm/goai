"use client";
import dynamic from "next/dynamic";
const loading = () => <div className="tool-panel" aria-busy="true">Loading…</div>;
export const BuilderHomeLoader = dynamic(() => import("./BuilderHome"), { ssr: false, loading });
export const EditorLoader = dynamic(() => import("./Editor"), { ssr: false, loading });
