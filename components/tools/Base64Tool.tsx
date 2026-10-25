"use client";
import { useState } from "react";
import { encodeBase64, decodeBase64 } from "@/lib/base64";
import { CopyButton, Chip } from "../ui";
export default function Base64Tool() {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [url, setUrl] = useState(false);
  const [input, setInput] = useState("Hello, world! 👋 مرحبا");
  let out = "", err = "";
  try { out = mode === "enc" ? encodeBase64(input, url) : input.trim() ? decodeBase64(input) : ""; } catch (e) { err = e instanceof Error ? e.message : String(e); }
  return (
    <div className="tool-panel">
      <div className="toolbar">
        <Chip on={mode === "enc"} onClick={() => setMode("enc")}>Encode</Chip><Chip on={mode === "dec"} onClick={() => setMode("dec")}>Decode</Chip>
        {mode === "enc" && <label><input type="checkbox" checked={url} onChange={(e) => setUrl(e.target.checked)} /> URL-safe (Base64URL)</label>}
        <button className="btn btn-ghost btn-sm" disabled={!out} onClick={() => { setInput(out); setMode(mode === "enc" ? "dec" : "enc"); }}>Swap ⇅</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setInput("")}>Clear</button>
      </div>
      <div className="two-col">
        <div className="field"><label htmlFor="b64-in">{mode === "enc" ? "Text" : "Base64"}</label><textarea id="b64-in" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} /></div>
        <div className="field"><span className="label">{mode === "enc" ? "Base64" : "Decoded text"}</span><pre className="output" style={{ minHeight: 240 }}>{out}</pre><div className="toolbar"><CopyButton text={out} /></div></div>
      </div>
      {err && <div className="alert alert-error" role="alert">{err}</div>}
      <p className="note">Text is encoded as UTF-8, so emoji and non-Latin scripts round-trip correctly. <strong>Base64 is an encoding, not encryption</strong> — anyone can decode it. Don’t use it to protect secrets.</p>
    </div>
  );
}
