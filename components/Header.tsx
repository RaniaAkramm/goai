"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/tools", label: "Tools", icon: "⚒" },
  { href: "/builder", label: "Builder", icon: "▦" },
  { href: "/about", label: "About", icon: "i" },
];

export function Header() {
  const path = usePathname();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const on = () => { const y = window.scrollY; setHidden(y > last && y > 120); last = y; };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <header className={`site-header${hidden ? " is-hidden" : ""}`}>
        <div className="header-card">
          <Link href="/" className="brand" aria-label="GoAI.foo home"><Logo /><span>GoAI<b>.foo</b></span></Link>
          <nav aria-label="Main" className="top-nav">
            {NAV.map((n) => <Link key={n.href} href={n.href} className={active(n.href) ? "active" : ""} aria-current={active(n.href) ? "page" : undefined}>{n.label}</Link>)}
          </nav>
          <Link href="/tools" className="btn btn-dark btn-sm hide-sm">Open tools</Link>
        </div>
      </header>
      <nav aria-label="Mobile" className="bottom-nav">
        {NAV.map((n) => <Link key={n.href} href={n.href} className={active(n.href) ? "active" : ""} aria-current={active(n.href) ? "page" : undefined}><span aria-hidden="true">{n.icon}</span>{n.label}</Link>)}
      </nav>
    </>
  );
}
