import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import { HeroArt } from "@/components/HeroArt";

const SERVICES = [
  { icon: "⚒", title: "Developer tools", text: "Eight everyday utilities — JSON, CSV, Base64, diff, regex, hashing and more — that run entirely in your browser.", href: "/tools", cta: "Browse tools" },
  { icon: "▦", title: "Project Builder", text: "Start from a responsive template, edit visually or in code, preview on any screen size and export a ZIP.", href: "/builder", cta: "Open the builder" },
  { icon: "⌂", title: "Local-first by design", text: "No sign-up, no uploads. Your inputs and projects stay in this browser unless you export them.", href: "/privacy", cta: "Read the privacy notes" },
];
const STEPS = [
  ["IDEA", "Pick a template or start blank."],
  ["BUILD", "Add pages, assets and content."],
  ["EDIT", "Change text, colors and spacing visually or in code."],
  ["PREVIEW", "Check desktop, tablet and mobile in a sandbox."],
  ["EXPORT", "Run Check Project, then download a ZIP."],
];

export default function Home() {
  return (
    <>
      <section className="hero container">
        <div className="hero-grid">
          <div>
            <span className="badge">Free · No account · In-browser</span>
            <h1 style={{ marginTop: 18 }}>Developer tools that <span className="mark">stay on your device.</span></h1>
            <p className="lead">GoAI.foo bundles fast, private utilities and a local-first website builder. Format, convert, compare, test and ship — without sending your data anywhere.</p>
            <div className="cta-row">
              <Link href="/tools" className="btn btn-dark">Explore the tools</Link>
              <Link href="/builder" className="btn btn-outline">Build a project</Link>
            </div>
            <ul className="pill-list" aria-label="Highlights"><li>8 working tools</li><li>5 site templates</li><li>ZIP export</li><li>Works offline once loaded</li></ul>
          </div>
          <HeroArt />
        </div>
      </section>

      <section className="section container" aria-labelledby="svc">
        <div className="section-head"><h2 id="svc">What you can do here</h2><p className="muted">Three parts, one simple rule: your work never leaves the browser unless you choose to export it.</p></div>
        <div className="grid grid-3">
          {SERVICES.map((s, i) => (
            <article key={s.title} className={`card ${i === 1 ? "card-dark" : ""}`}>
              <div className="icon-sq" aria-hidden="true">{s.icon}</div>
              <h3>{s.title}</h3><p className="muted">{s.text}</p>
              <Link href={s.href} className={`btn btn-sm ${i === 1 ? "btn-lime" : "btn-dark"}`}>{s.cta}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section container" aria-labelledby="tools">
        <div className="section-head"><h2 id="tools">Developer tools</h2><Link href="/tools" className="btn btn-outline btn-sm">All tools →</Link></div>
        <div className="grid grid-4">
          {TOOLS.map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`} className="card tool-card">
              <div className="icon-sq" aria-hidden="true">{t.icon}</div><h3>{t.name}</h3><p>{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container" aria-labelledby="how">
        <div className="dark-band">
          <span className="badge badge-lime">How it works</span>
          <h2 id="how" style={{ marginTop: 16 }}>From idea to a downloadable project.</h2>
          <ol className="steps">
            {STEPS.map(([t, d], i) => <li key={t}><small>0{i + 1} / 05</small><b>{t}</b><span>{d}</span></li>)}
          </ol>
          <p style={{ marginTop: 20 }}><Link href="/builder" className="btn btn-lime btn-sm">Try the Project Builder</Link></p>
        </div>
      </section>

      <section className="section container" aria-labelledby="ben">
        <div className="grid grid-2">
          <div className="card"><h2 id="ben" style={{ fontSize: "1.8rem" }}>Why GoAI.foo</h2>
            <ul className="checks"><li>Free for every tool and template</li><li>No registration and no tracking scripts</li><li>Processing happens locally in your browser</li><li>Touch-friendly on phones and tablets</li><li>Real exported source code, not screenshots</li></ul></div>
          <div className="card card-lime"><h2 style={{ fontSize: "1.8rem" }}>What we don’t do</h2>
            <ul className="checks no"><li>We don’t upload your inputs to a server</li><li>We don’t store your projects in the cloud</li><li>We don’t claim checks find every bug</li><li>We don’t show ads (any future ads will be disclosed)</li></ul></div>
        </div>
      </section>

      <section className="section container">
        <div className="cta-band"><h2>Ready to get something done?</h2><p>Open a tool in one click — nothing to install, nothing to sign up for.</p>
          <div className="cta-row"><Link href="/tools" className="btn btn-dark">Open developer tools</Link><Link href="/builder" className="btn btn-outline">Start a project</Link></div></div>
      </section>
    </>
  );
}
