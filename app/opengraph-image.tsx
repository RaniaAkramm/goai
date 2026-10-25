import { ImageResponse } from "next/og";
export const alt = "GoAI.foo — Free AI Studio, developer tools and website builder in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OG() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#111", color: "#fff", padding: 72, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 800 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#C8F135" }} />GoAI<span style={{ color: "#C8F135" }}>.foo</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Free AI & developer tools</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: "#C8F135" }}>that stay on your device.</div>
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 28 }}>
        {["AI Studio", "8 dev tools", "Website builder", "No sign-up"].map((t) => <div key={t} style={{ display: "flex", padding: "10px 24px", borderRadius: 999, border: "2px solid #C8F135" }}>{t}</div>)}
      </div>
    </div>, size);
}
