import Link from "next/link";
import { Logo } from "./Logo";
const COLS = [
  { h: "Tools", l: [["/tools", "All developer tools"], ["/tools/json-formatter", "JSON formatter"], ["/tools/regex", "Regex tester"], ["/tools/diff", "Diff checker"]] },
  { h: "Build", l: [["/builder", "Project Builder"], ["/studio/site", "AI site generator"], ["/builder#new-h", "Site templates"]] },
  { h: "AI Studio", l: [["/studio", "Studio overview"], ["/studio/chat", "AI chat"], ["/studio/code", "Code assistant"], ["/studio/text", "Text tools"], ["/studio/models", "Models"]] },
  { h: "Company", l: [["/about", "About"], ["/privacy", "Privacy"], ["/terms", "Terms"]] },
];
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-tag">Build faster.<br />Keep your data <span className="lime">on your device.</span></p>
          <p className="footer-sub">Free developer tools, a local-first website builder and private in-browser AI. No account, no uploads, no paid APIs.</p>
          <div className="cta-row" style={{ marginTop: 16 }}><Link href="/studio" className="btn btn-lime">Open AI Studio</Link><Link href="/tools" className="btn btn-outline footer-outline">Browse tools</Link></div>
        </div>
        <div className="footer-links">
          {COLS.map((c) => <div key={c.h}><h3>{c.h}</h3>{c.l.map(([h, t]) => <Link key={h + t} href={h}>{t}</Link>)}</div>)}
        </div>
      </div>
      <div className="container footer-bottom">
        <span className="brand-sm"><Logo size={22} /> © 2026 GoAI.foo. All rights reserved.</span>
        <span>Made with care for developers · Runs entirely in your browser</span>
      </div>
    </footer>
  );
}
