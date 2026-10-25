import type { Project } from "./types";
import { contentFor, renderSections, footerHtml, type SiteContent, type BuildOptions } from "./sections";
export type { SiteContent, BuildOptions } from "./sections";

export type Theme = { primary: string; bg: string; text: string; surface: string; font: string; radius: string; space: string };
type PageDef = { file: string; title: string; sections: string[] };
type Tpl = { id: string; name: string; description: string; theme: Theme; pages: PageDef[] };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export const FONT_CHOICES: Record<string, string> = {
  System: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  Modern: "'Inter', 'Segoe UI', system-ui, sans-serif",
  Classic: "Georgia, 'Times New Roman', serif",
  Friendly: "'Trebuchet MS', 'Segoe UI', sans-serif",
  Mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
export const STYLE_CHOICES = { rounded: "16px", soft: "28px", sharp: "4px" } as const;

/** v2 stylesheet. Every color is derived from the 7 theme variables (color-mix), so changing --primary recolors the whole site. */
export function cssFor(t: Theme, extra = "") {
  return `:root {
  --primary: ${t.primary};
  --bg: ${t.bg};
  --text: ${t.text};
  --surface: ${t.surface};
  --font: ${t.font};
  --radius: ${t.radius};
  --space: ${t.space};
  --muted: color-mix(in srgb, var(--text) 62%, var(--bg));
  --line: color-mix(in srgb, var(--text) 12%, transparent);
  --tint: color-mix(in srgb, var(--primary) 12%, var(--bg));
  --primary-dark: color-mix(in srgb, var(--primary) 78%, #000);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.65; -webkit-font-smoothing: antialiased; }
img { max-width: 100%; height: auto; display: block; }
a { color: var(--primary); }
h1, h2, h3 { line-height: 1.12; letter-spacing: -.02em; margin: 0 0 .5em; }
h2 { font-size: clamp(1.7rem, 3.6vw, 2.6rem); }
.container { width: min(1140px, 100% - 2 * var(--space)); margin-inline: auto; }
.muted { color: var(--muted); }
.eyebrow { display: inline-block; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--primary); background: var(--tint); padding: .3rem .8rem; border-radius: 999px; margin-bottom: 1rem; }
/* header */
.site-header { background: color-mix(in srgb, var(--surface) 88%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 10; }
.site-header .container { display: flex; align-items: center; justify-content: space-between; padding-block: calc(var(--space) * .7); gap: var(--space); position: relative; }
.logo { font-weight: 800; font-size: 1.25rem; text-decoration: none; color: var(--text); display: flex; align-items: center; gap: .5rem; }
.logo::before { content: ""; width: 1.4rem; height: 1.4rem; border-radius: calc(var(--radius) / 2); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); }
.nav { display: flex; gap: calc(var(--space) * .4); list-style: none; margin: 0; padding: 0; }
.nav a { text-decoration: none; color: var(--text); font-weight: 600; padding: .45rem .8rem; border-radius: 999px; }
.nav a:hover { background: var(--tint); color: var(--primary); }
.nav-toggle { display: none; background: none; border: 1px solid currentColor; border-radius: var(--radius); padding: .4rem .7rem; font: inherit; color: var(--text); }
/* layout */
.section { padding-block: calc(var(--space) * 4); }
.section.alt { background: var(--surface); border-block: 1px solid var(--line); }
.section-head { max-width: 640px; margin: 0 auto calc(var(--space) * 2); text-align: center; }
.section-head p { color: var(--muted); font-size: 1.1rem; }
.btn { display: inline-flex; align-items: center; gap: .4rem; background: var(--primary); color: #fff; padding: .85rem 1.6rem; border-radius: var(--radius); text-decoration: none; font-weight: 700; border: 2px solid var(--primary); cursor: pointer; font: inherit; transition: transform .15s, box-shadow .15s, background .15s; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px color-mix(in srgb, var(--primary) 30%, transparent); }
.btn.secondary { background: transparent; color: var(--text); border-color: var(--line); }
.btn.light { background: #fff; color: var(--primary-dark); border-color: #fff; }
.actions { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 1.6rem; }
/* hero */
.hero { padding-block: calc(var(--space) * 4) calc(var(--space) * 3); background: radial-gradient(60% 80% at 85% 10%, var(--tint), transparent 70%); }
.hero-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: calc(var(--space) * 2.5); align-items: center; }
.hero h1 { font-size: clamp(2.2rem, 5.2vw, 3.8rem); margin: 0 0 var(--space); }
.hero p.lead { font-size: 1.2rem; color: var(--muted); max-width: 34em; }
.hero-art { position: relative; aspect-ratio: 1 / .9; border-radius: calc(var(--radius) * 1.6); background: linear-gradient(145deg, var(--primary), var(--primary-dark)); overflow: hidden; box-shadow: 0 30px 60px color-mix(in srgb, var(--primary) 25%, transparent); }
.hero-art::before, .hero-art::after { content: ""; position: absolute; border-radius: 50%; background: rgba(255,255,255,.14); }
.hero-art::before { width: 70%; aspect-ratio: 1; right: -18%; top: -20%; }
.hero-art::after { width: 45%; aspect-ratio: 1; left: -10%; bottom: -12%; }
.float-card { position: absolute; background: var(--surface); color: var(--text); border-radius: var(--radius); padding: .9rem 1.1rem; box-shadow: 0 16px 40px rgba(0,0,0,.18); font-size: .9rem; z-index: 1; }
.float-card b { display: block; font-size: 1.5rem; color: var(--primary); }
.float-card.a { left: 8%; top: 14%; } .float-card.b { right: 8%; bottom: 14%; } .float-card.c { left: 14%; bottom: 30%; width: 52%; }
.bar-row { height: 8px; border-radius: 99px; background: var(--tint); margin-top: .5rem; overflow: hidden; } .bar-row i { display: block; height: 100%; background: var(--primary); border-radius: 99px; }
.trust { display: flex; align-items: center; gap: .6rem; margin-top: 1.4rem; color: var(--muted); font-size: .92rem; }
.stars { color: #f5a524; letter-spacing: 2px; }
/* logos + stats */
.logos { display: flex; flex-wrap: wrap; justify-content: center; gap: calc(var(--space) * 2); padding-block: calc(var(--space) * 1.5); color: var(--muted); font-weight: 800; letter-spacing: .04em; opacity: .75; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space); text-align: center; }
.stat b { display: block; font-size: clamp(1.8rem, 4vw, 2.6rem); color: var(--primary); line-height: 1.1; }
.stat span { color: var(--muted); }
/* cards */
.grid { display: grid; gap: var(--space); grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: calc(var(--space) * 1.4); transition: transform .2s, box-shadow .2s; }
.card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(0,0,0,.08); }
.card h3 { margin-top: 0; }
.card p { color: var(--muted); }
.icon { width: 3rem; height: 3rem; border-radius: calc(var(--radius) * .7); display: grid; place-items: center; background: var(--tint); color: var(--primary); font-size: 1.4rem; margin-bottom: 1rem; }
.steps { counter-reset: step; }
.steps .card::before { counter-increment: step; content: "0" counter(step); font-weight: 800; color: var(--primary); font-size: 1.1rem; display: block; margin-bottom: .6rem; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--space) * 2.5); align-items: center; }
.checks { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: .6rem; }
.checks li::before { content: "✓"; display: inline-grid; place-items: center; width: 1.4rem; height: 1.4rem; margin-right: .6rem; border-radius: 50%; background: var(--primary); color: #fff; font-size: .8rem; font-weight: 800; }
/* testimonials */
.quote { display: flex; flex-direction: column; gap: 1rem; }
.quote blockquote { margin: 0; font-size: 1.05rem; color: var(--text); }
.person { display: flex; align-items: center; gap: .8rem; margin-top: auto; }
.avatar { width: 2.8rem; height: 2.8rem; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #fff; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); flex: none; }
.person small { display: block; color: var(--muted); }
/* pricing */
.price-card { display: flex; flex-direction: column; position: relative; }
.price-card .amount { font-size: 2.6rem; font-weight: 800; margin: .4rem 0; }
.price-card .amount small { font-size: 1rem; color: var(--muted); font-weight: 600; }
.price-card .btn { margin-top: auto; justify-content: center; }
.price-card .checks { margin-bottom: 1.5rem; }
.price-card.featured { border: 2px solid var(--primary); box-shadow: 0 24px 50px color-mix(in srgb, var(--primary) 20%, transparent); }
.ribbon { position: absolute; top: -.8rem; right: 1.2rem; background: var(--primary); color: #fff; font-size: .75rem; font-weight: 800; padding: .25rem .7rem; border-radius: 999px; }
/* faq */
.faq { max-width: 760px; margin-inline: auto; display: grid; gap: .8rem; }
.faq details { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem 1.3rem; }
.faq summary { cursor: pointer; font-weight: 700; list-style: none; display: flex; justify-content: space-between; gap: 1rem; }
.faq summary::after { content: "+"; color: var(--primary); font-size: 1.3rem; line-height: 1; }
.faq details[open] summary::after { content: "–"; }
.faq details p { color: var(--muted); margin: .8rem 0 0; }
/* cta */
.cta-box { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; border-radius: calc(var(--radius) * 1.6); padding: calc(var(--space) * 3); text-align: center; }
.cta-box p { opacity: .9; max-width: 36em; margin-inline: auto; }
.cta-box .actions { justify-content: center; }
.newsletter { display: flex; gap: .6rem; max-width: 460px; margin: 1.4rem auto 0; }
.newsletter input { flex: 1; border: 0; }
/* products / posts */
.thumb { aspect-ratio: 4 / 3; border-radius: calc(var(--radius) * .7); margin-bottom: 1rem; background: linear-gradient(135deg, var(--tint), color-mix(in srgb, var(--primary) 45%, var(--bg))); display: grid; place-items: center; font-size: 2.6rem; }
.price { font-weight: 800; font-size: 1.2rem; color: var(--text); }
.tag { display: inline-block; font-size: .78rem; font-weight: 700; color: var(--primary); background: var(--tint); border-radius: 999px; padding: .15rem .65rem; margin-right: .3rem; }
.meta { font-size: .88rem; color: var(--muted); }
.cart-count { background: var(--primary); color: #fff; border-radius: 999px; padding: 0 .55rem; font-size: .85rem; }
.post { max-width: 720px; margin-inline: auto; font-size: 1.08rem; }
.post h1 { font-size: clamp(2rem, 4.5vw, 3rem); }
.post blockquote { border-left: 4px solid var(--primary); margin: 1.5rem 0; padding: .4rem 1.2rem; background: var(--tint); border-radius: 0 var(--radius) var(--radius) 0; }
/* forms */
form { display: grid; gap: calc(var(--space) * .7); }
label { font-weight: 600; display: grid; gap: .3rem; }
input, textarea, select { font: inherit; padding: .8rem; border: 1px solid var(--line); border-radius: calc(var(--radius) * .6); width: 100%; background: var(--surface); color: var(--text); }
input:focus, textarea:focus, select:focus { outline: 2px solid var(--primary); outline-offset: 1px; }
.contact-info .card { margin-bottom: var(--space); }
/* dashboard */
.dash-stats { display: grid; gap: var(--space); grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: calc(var(--space) * 2); }
.dash-stats b { display: block; font-size: 1.9rem; }
.trend { font-size: .85rem; font-weight: 700; color: var(--primary); }
.bar { height: 10px; background: var(--primary); border-radius: 99px; margin-top: .6rem; }
.chart { display: flex; align-items: flex-end; gap: .5rem; height: 180px; padding-top: 1rem; }
.chart i { flex: 1; background: linear-gradient(var(--primary), color-mix(in srgb, var(--primary) 40%, var(--bg))); border-radius: 6px 6px 0 0; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: var(--radius); overflow: hidden; }
th, td { text-align: left; padding: .8rem; border-bottom: 1px solid var(--line); }
th { font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.pill { font-size: .78rem; font-weight: 700; padding: .15rem .6rem; border-radius: 999px; background: var(--tint); color: var(--primary); }
/* footer */
.site-footer { background: color-mix(in srgb, var(--text) 94%, var(--primary)); color: color-mix(in srgb, var(--bg) 85%, transparent); padding-block: calc(var(--space) * 3) calc(var(--space) * 1.5); margin-top: calc(var(--space) * 2); }
.site-footer a { color: inherit; text-decoration: none; opacity: .85; }
.site-footer a:hover { opacity: 1; color: var(--primary); }
.footer-grid { display: grid; grid-template-columns: 1.6fr repeat(3, 1fr); gap: calc(var(--space) * 2); }
.footer-grid h4 { margin: 0 0 .8rem; font-size: .8rem; letter-spacing: .1em; text-transform: uppercase; opacity: .6; }
.footer-grid ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.footer-brand { font-size: 1.3rem; font-weight: 800; color: var(--bg); }
.footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-top: 1px solid rgba(255,255,255,.14); margin-top: calc(var(--space) * 2); padding-top: var(--space); font-size: .9rem; opacity: .75; }
@media (max-width: 860px) {
  .hero-grid, .split { grid-template-columns: 1fr; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .footer-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 700px) {
  .nav-toggle { display: inline-block; }
  .nav { display: none; position: absolute; left: 0; right: 0; top: 100%; flex-direction: column; background: var(--surface); padding: var(--space); border-bottom: 1px solid var(--line); }
  .nav.open { display: flex; }
  .section { padding-block: calc(var(--space) * 2.5); }
  .cta-box { padding: calc(var(--space) * 1.8); }
  .newsletter { flex-direction: column; }
  .footer-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }
${extra}`;
}

const JS_BASE = `// Mobile navigation toggle
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var nav = document.getElementById(btn.getAttribute('aria-controls'));
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
});
// Footer year
document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
`;

const FORM_JS = `
// Contact form: posts JSON to /api/messages when the optional backend is running.
var form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = document.getElementById('form-status');
    var data = Object.fromEntries(new FormData(form).entries());
    fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); status.textContent = 'Thanks! Your message was sent.'; form.reset(); })
      .catch(function () { status.textContent = 'Could not send right now. (Is the backend server running?)'; });
  });
}
// Newsletter forms (demo only)
document.querySelectorAll('.newsletter').forEach(function (f) {
  f.addEventListener('submit', function (e) { e.preventDefault(); var b = f.querySelector('button'); if (b) b.textContent = 'Subscribed ✓'; f.reset(); });
});
`;

const CART_JS = `
// Simple cart stored in localStorage (demo only; no payments).
var CART_KEY = 'shop-cart';
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } }
function renderCount() { document.querySelectorAll('.cart-count').forEach(function (el) { el.textContent = String(getCart().length); }); }
document.querySelectorAll('[data-add]').forEach(function (b) {
  b.addEventListener('click', function () { var c = getCart(); c.push(b.getAttribute('data-add')); try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} b.textContent = 'Added ✓'; renderCount(); });
});
var list = document.getElementById('cart-list');
if (list) { var items = getCart(); list.innerHTML = ''; if (!items.length) list.textContent = 'Your cart is empty.'; items.forEach(function (i) { var li = document.createElement('li'); li.textContent = i; list.appendChild(li); }); }
var clear = document.getElementById('cart-clear');
if (clear) clear.addEventListener('click', function () { try { localStorage.removeItem(CART_KEY); } catch (e) {} location.reload(); });
renderCount();
`;

const DASH_JS = `
// Table filter
var q = document.getElementById('filter');
if (q) q.addEventListener('input', function () {
  var v = q.value.toLowerCase();
  document.querySelectorAll('#orders tbody tr').forEach(function (tr) { tr.hidden = tr.textContent.toLowerCase().indexOf(v) === -1; });
});
`;

export function navHtml(siteName: string, pages: { file: string; title: string }[]) {
  return `<header class="site-header">
  <div class="container">
    <a class="logo" href="index.html">${esc(siteName)}</a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <ul class="nav" id="site-nav">
${pages.map((p) => `      <li><a href="${p.file}">${esc(p.title)}</a></li>`).join("\n")}
    </ul>
  </div>
</header>`;
}

export function pageHtml(siteName: string, title: string, nav: string, body: string, footer?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · ${esc(siteName)}</title>
  <meta name="description" content="${esc(siteName)} — ${esc(title)}">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${nav}
<main>
${body}
</main>
${footer ?? footerHtml(siteName, [], null)}
<script src="script.js"></script>
</body>
</html>
`;
}

const TEMPLATES: Tpl[] = [
  { id: "business", name: "Business", description: "Full company site: hero, clients, services, process, testimonials, pricing, FAQ, about and contact.",
    theme: { primary: "#1f6feb", bg: "#f7f9fc", text: "#14213d", surface: "#ffffff", font: FONT_CHOICES.System, radius: "14px", space: "1.25rem" },
    pages: [
      { file: "index.html", title: "Home", sections: ["hero", "logos", "features", "split", "steps", "stats", "testimonials", "pricing", "faq", "cta"] },
      { file: "about.html", title: "About", sections: ["about", "values", "team", "stats", "cta"] },
      { file: "contact.html", title: "Contact", sections: ["contact", "faq"] },
    ] },
  { id: "ecommerce", name: "E-commerce", description: "Storefront with hero, product grid and cart, perks, reviews, FAQ and newsletter.",
    theme: { primary: "#d6336c", bg: "#fff8fa", text: "#2b2d42", surface: "#ffffff", font: FONT_CHOICES.Modern, radius: "18px", space: "1.25rem" },
    pages: [
      { file: "index.html", title: "Shop", sections: ["hero", "products", "features", "testimonials", "faq", "newsletter"] },
      { file: "cart.html", title: "Cart", sections: ["cart", "products"] },
      { file: "contact.html", title: "Contact", sections: ["contact", "faq"] },
    ] },
  { id: "blog", name: "Blog", description: "Magazine-style blog: featured hero, article grid, full post layout, author page and newsletter.",
    theme: { primary: "#0f766e", bg: "#fbfaf7", text: "#1c1917", surface: "#ffffff", font: FONT_CHOICES.Classic, radius: "12px", space: "1.3rem" },
    pages: [
      { file: "index.html", title: "Home", sections: ["hero", "posts", "newsletter"] },
      { file: "post.html", title: "Article", sections: ["article", "posts"] },
      { file: "about.html", title: "About", sections: ["about", "values", "newsletter"] },
    ] },
  { id: "portfolio", name: "Portfolio", description: "Personal portfolio: hero, selected work, services, process, testimonials and contact.",
    theme: { primary: "#8b5cf6", bg: "#0f0f14", text: "#ececf1", surface: "#1a1a22", font: FONT_CHOICES.Modern, radius: "18px", space: "1.4rem" },
    pages: [
      { file: "index.html", title: "Home", sections: ["hero", "logos", "work", "features", "steps", "testimonials", "cta"] },
      { file: "work.html", title: "Work", sections: ["work", "stats", "cta"] },
      { file: "contact.html", title: "Contact", sections: ["contact"] },
    ] },
  { id: "dashboard", name: "Dashboard", description: "Admin dashboard with KPI cards, chart, filterable orders table and settings.",
    theme: { primary: "#0ea5e9", bg: "#f1f5f9", text: "#0f172a", surface: "#ffffff", font: FONT_CHOICES.System, radius: "12px", space: "1rem" },
    pages: [
      { file: "index.html", title: "Overview", sections: ["dashboard"] },
      { file: "settings.html", title: "Settings", sections: ["settings"] },
    ] },
];

export const TEMPLATE_LIST = [...TEMPLATES.map(({ id, name, description, theme }) => ({ id, name, description, primary: theme.primary })), { id: "blank", name: "Blank", description: "A clean starting page with header, hero and full footer.", primary: "#2563eb" }];

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

const HEX = /^#[0-9a-f]{6}$/i;
function applyOptions(theme: Theme, o: BuildOptions): Theme {
  const t = { ...theme };
  if (o.primary && HEX.test(o.primary)) t.primary = o.primary;
  if (o.font && FONT_CHOICES[o.font]) t.font = FONT_CHOICES[o.font];
  if (o.style && STYLE_CHOICES[o.style]) t.radius = STYLE_CHOICES[o.style];
  if (o.mode === "dark") { t.bg = "#0e0f13"; t.surface = "#181a20"; t.text = "#eceef2"; }
  if (o.mode === "light" && luminance(t.bg) < .3) { t.bg = "#f8f9fb"; t.surface = "#ffffff"; t.text = "#151821"; }
  return t;
}
function luminance(hex: string) { if (!HEX.test(hex)) return 1; const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }

/** Create a project from a template. `opts` applies chosen colors/fonts/style; `opts.content` overrides copy (e.g. from AI Studio). */
export function createProject(templateId: string, name?: string, opts: BuildOptions = {}): Project {
  const now = Date.now();
  const tpl = TEMPLATES.find((t) => t.id === templateId);
  const siteName = (opts.content?.brand || name || "").trim().slice(0, 80) || (tpl ? `My ${tpl.name} Site` : "My Site");
  const content: SiteContent = contentFor(tpl?.id ?? "blank", siteName, opts.content);
  if (!tpl) {
    const theme = applyOptions({ primary: "#2563eb", bg: "#ffffff", text: "#111111", surface: "#ffffff", font: FONT_CHOICES.System, radius: "12px", space: "1.25rem" }, opts);
    const pages = [{ file: "index.html", title: "Home" }];
    return {
      id: uid(), name: siteName, template: "blank", createdAt: now, updatedAt: now, pages: ["index.html"], assets: [], backend: false,
      files: {
        "index.html": pageHtml(siteName, "Home", navHtml(siteName, pages), `<section class="section hero">\n  <div class="container">\n    <span class="eyebrow">Welcome</span>\n    <h1>${esc(content.heroTitle)}</h1>\n    <p class="lead">${esc(content.heroText)}</p>\n  </div>\n</section>`, footerHtml(siteName, pages, content)),
        "styles.css": cssFor(theme), "script.js": JS_BASE,
      },
    };
  }
  const theme = applyOptions(tpl.theme, opts);
  const nav = navHtml(siteName, tpl.pages);
  const footer = footerHtml(siteName, tpl.pages, content);
  const files: Record<string, string> = { "styles.css": cssFor(theme), "script.js": JS_BASE + FORM_JS + (tpl.id === "ecommerce" ? CART_JS : "") + (tpl.id === "dashboard" ? DASH_JS : "") };
  for (const p of tpl.pages) files[p.file] = pageHtml(siteName, p.title, nav, renderSections(p.sections, content, tpl.id), footer);
  return { id: uid(), name: siteName, template: tpl.id, createdAt: now, updatedAt: now, pages: tpl.pages.map((p) => p.file), files, assets: [], backend: Object.values(files).some((f) => f.includes('id="contact-form"')) };
}
