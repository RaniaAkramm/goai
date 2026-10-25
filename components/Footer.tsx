import Link from "next/link";
import { Logo } from "./Logo";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-tag">Build faster.<br />Keep your data <span className="lime">on your device.</span></p>
          <Link href="/tools" className="btn btn-lime">Start with a tool</Link>
        </div>
        <div className="footer-links">
          <div><h3>Product</h3><Link href="/tools">Developer tools</Link><Link href="/builder">Project Builder</Link></div>
          <div><h3>Company</h3><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        </div>
      </div>
      <div className="container footer-bottom"><span className="brand-sm"><Logo size={22} /> GoAI.foo</span><span>Free. No account. Runs in your browser.</span></div>
    </footer>
  );
}
