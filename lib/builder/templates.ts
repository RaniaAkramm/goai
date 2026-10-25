import type { Project } from "./types";

type Theme = { primary: string; bg: string; text: string; surface: string; font: string; radius: string; space: string };
type PageDef = { file: string; title: string; body: string };
type Tpl = { id: string; name: string; description: string; theme: Theme; pages: PageDef[]; extraCss?: string; extraJs?: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function cssFor(t: Theme, extra = "") {
  return `:root {
  --primary: ${t.primary};
  --bg: ${t.bg};
  --text: ${t.text};
  --surface: ${t.surface};
  --font: ${t.font};
  --radius: ${t.radius};
  --space: ${t.space};
}
* { box-sizing: border-box; }
body { margin: 0; font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; }
img { max-width: 100%; height: auto; display: block; }
a { color: var(--primary); }
.container { width: min(1100px, 100% - 2 * var(--space)); margin-inline: auto; }
.site-header { background: var(--surface); border-bottom: 1px solid rgba(0,0,0,.08); position: sticky; top: 0; z-index: 10; }
.site-header .container { display: flex; align-items: center; justify-content: space-between; padding-block: calc(var(--space) * .6); gap: var(--space); }
.logo { font-weight: 800; font-size: 1.25rem; text-decoration: none; color: var(--text); }
.nav { display: flex; gap: calc(var(--space) * .8); list-style: none; margin: 0; padding: 0; }
.nav a { text-decoration: none; color: var(--text); font-weight: 600; }
.nav a:hover { color: var(--primary); }
.nav-toggle { display: none; background: none; border: 1px solid currentColor; border-radius: var(--radius); padding: .4rem .7rem; font: inherit; color: var(--text); }
.section { padding-block: calc(var(--space) * 3); }
.hero h1 { font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.1; margin: 0 0 var(--space); }
.hero p { font-size: 1.15rem; max-width: 40em; }
.btn { display: inline-block; background: var(--primary); color: #fff; padding: .8rem 1.5rem; border-radius: var(--radius); text-decoration: none; font-weight: 700; border: 0; cursor: pointer; font: inherit; }
.btn.secondary { background: transparent; color: var(--primary); border: 2px solid var(--primary); }
.grid { display: grid; gap: var(--space); grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.card { background: var(--surface); border-radius: var(--radius); padding: calc(var(--space) * 1.2); box-shadow: 0 2px 10px rgba(0,0,0,.06); }
.card h3 { margin-top: 0; }
form { display: grid; gap: calc(var(--space) * .6); max-width: 520px; }
input, textarea, select { font: inherit; padding: .7rem; border: 1px solid rgba(0,0,0,.2); border-radius: var(--radius); width: 100%; }
.site-footer { background: var(--text); color: var(--bg); padding-block: calc(var(--space) * 2); margin-top: calc(var(--space) * 2); }
.site-footer a { color: var(--bg); }
@media (max-width: 700px) {
  .nav-toggle { display: inline-block; }
  .nav { display: none; position: absolute; left: 0; right: 0; top: 100%; flex-direction: column; background: var(--surface); padding: var(--space); }
  .nav.open { display: flex; }
  .section { padding-block: calc(var(--space) * 2); }
}
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

export function pageHtml(siteName: string, title: string, nav: string, body: string) {
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
<footer class="site-footer">
  <div class="container">
    <p>&copy; ${new Date().getFullYear()} ${esc(siteName)}. All rights reserved.</p>
  </div>
</footer>
<script src="script.js"></script>
</body>
</html>
`;
}

const contactForm = (label: string) => `<section class="section">
  <div class="container">
    <h1>${label}</h1>
    <form id="contact-form" action="/api/messages" method="post">
      <label>Name <input name="name" required maxlength="100"></label>
      <label>Email <input name="email" type="email" required maxlength="200"></label>
      <label>Message <textarea name="message" rows="5" required maxlength="5000"></textarea></label>
      <button class="btn" type="submit">Send</button>
      <p id="form-status" role="status"></p>
    </form>
  </div>
</section>`;

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
`;

const TEMPLATES: Tpl[] = [
  {
    id: "business", name: "Business", description: "Company site with services, about and contact form.",
    theme: { primary: "#1f6feb", bg: "#f7f9fc", text: "#14213d", surface: "#ffffff", font: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", radius: "10px", space: "1.25rem" },
    pages: [
      { file: "index.html", title: "Home", body: `<section class="section hero">
  <div class="container">
    <h1>Reliable solutions for growing teams</h1>
    <p>We help small and medium businesses plan, build and run the systems they depend on.</p>
    <p><a class="btn" href="contact.html">Get in touch</a> <a class="btn secondary" href="about.html">About us</a></p>
  </div>
</section>
<section class="section">
  <div class="container grid">
    <div class="card"><h3>Consulting</h3><p>Clear advice on processes, tools and priorities.</p></div>
    <div class="card"><h3>Implementation</h3><p>We set up and integrate the tools you choose.</p></div>
    <div class="card"><h3>Support</h3><p>Friendly help when something needs attention.</p></div>
  </div>
</section>` },
      { file: "about.html", title: "About", body: `<section class="section">
  <div class="container">
    <h1>About us</h1>
    <p>We are a small team that values clear communication and dependable work.</p>
  </div>
</section>` },
      { file: "contact.html", title: "Contact", body: contactForm("Contact us") },
    ],
  },
  {
    id: "ecommerce", name: "E-commerce", description: "Product grid with a simple client-side cart.",
    theme: { primary: "#d6336c", bg: "#fff8fa", text: "#2b2d42", surface: "#ffffff", font: "'Helvetica Neue', Arial, sans-serif", radius: "14px", space: "1.25rem" },
    extraCss: `.product .price { font-weight: 800; font-size: 1.2rem; }
.cart-count { background: var(--primary); color: #fff; border-radius: 999px; padding: 0 .55rem; font-size: .85rem; }
.thumb { aspect-ratio: 4 / 3; border-radius: calc(var(--radius) - 4px); background: linear-gradient(135deg, var(--primary), #ffb3c6); margin-bottom: .8rem; }`,
    extraJs: `
// Simple cart stored in localStorage (demo only; no payments).
var CART_KEY = 'shop-cart';
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } }
function renderCount() { var el = document.getElementById('cart-count'); if (el) el.textContent = String(getCart().length); }
document.querySelectorAll('[data-add]').forEach(function (b) {
  b.addEventListener('click', function () { var c = getCart(); c.push(b.getAttribute('data-add')); try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} renderCount(); });
});
var list = document.getElementById('cart-list');
if (list) { var items = getCart(); list.innerHTML = ''; if (!items.length) list.textContent = 'Your cart is empty.'; items.forEach(function (i) { var li = document.createElement('li'); li.textContent = i; list.appendChild(li); }); }
var clear = document.getElementById('cart-clear');
if (clear) clear.addEventListener('click', function () { try { localStorage.removeItem(CART_KEY); } catch (e) {} location.reload(); });
renderCount();
`,
    pages: [
      { file: "index.html", title: "Shop", body: `<section class="section hero">
  <div class="container">
    <h1>Everyday goods, thoughtfully made</h1>
    <p>Browse our small collection. Cart: <span class="cart-count" id="cart-count">0</span></p>
  </div>
</section>
<section class="section">
  <div class="container grid">
    <div class="card product"><div class="thumb"></div><h3>Canvas Tote</h3><p class="price">$24</p><button class="btn" data-add="Canvas Tote">Add to cart</button></div>
    <div class="card product"><div class="thumb"></div><h3>Ceramic Mug</h3><p class="price">$18</p><button class="btn" data-add="Ceramic Mug">Add to cart</button></div>
    <div class="card product"><div class="thumb"></div><h3>Notebook Set</h3><p class="price">$12</p><button class="btn" data-add="Notebook Set">Add to cart</button></div>
  </div>
</section>` },
      { file: "cart.html", title: "Cart", body: `<section class="section">
  <div class="container">
    <h1>Your cart</h1>
    <ul id="cart-list"></ul>
    <button class="btn secondary" id="cart-clear">Clear cart</button>
    <p>Checkout is not included in this template.</p>
  </div>
</section>` },
      { file: "contact.html", title: "Contact", body: contactForm("Questions?") },
    ],
  },
  {
    id: "blog", name: "Blog", description: "Article list and a readable post layout.",
    theme: { primary: "#2a9d8f", bg: "#fdfcf8", text: "#222222", surface: "#ffffff", font: "Georgia, 'Times New Roman', serif", radius: "6px", space: "1.25rem" },
    extraCss: `.post { max-width: 70ch; } .post h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); line-height: 1.2; } .meta { color: #777; font-size: .9rem; }`,
    pages: [
      { file: "index.html", title: "Home", body: `<section class="section hero">
  <div class="container">
    <h1>Notes on building things</h1>
    <p>Short essays about craft, tools and learning.</p>
  </div>
</section>
<section class="section">
  <div class="container grid">
    <article class="card"><p class="meta">Oct 2026</p><h3><a href="post.html">Start small, ship often</a></h3><p>Why tiny releases beat big launches.</p></article>
    <article class="card"><p class="meta">Sep 2026</p><h3><a href="post.html">Reading code well</a></h3><p>Habits that make unfamiliar code easier.</p></article>
  </div>
</section>` },
      { file: "post.html", title: "Article", body: `<article class="section">
  <div class="container post">
    <p class="meta">October 2026 · 4 min read</p>
    <h1>Start small, ship often</h1>
    <p>Big plans are tempting. Small releases teach you more, sooner.</p>
    <h2>Make it real</h2>
    <p>Put something in front of people as early as you can and listen.</p>
    <p><a href="index.html">&larr; Back to all posts</a></p>
  </div>
</article>` },
      { file: "about.html", title: "About", body: `<section class="section"><div class="container post"><h1>About this blog</h1><p>Written by a curious developer.</p></div></section>` },
    ],
  },
  {
    id: "portfolio", name: "Portfolio", description: "Personal portfolio with projects and contact.",
    theme: { primary: "#7c3aed", bg: "#0f0f14", text: "#ececf1", surface: "#1a1a22", font: "'Inter', system-ui, sans-serif", radius: "16px", space: "1.4rem" },
    extraCss: `.site-footer { background: #000; color: var(--text); } .site-footer a { color: var(--text); } .tag { display: inline-block; font-size: .8rem; border: 1px solid var(--primary); border-radius: 999px; padding: .1rem .6rem; margin-right: .3rem; }
input, textarea { background: var(--surface); color: var(--text); border-color: rgba(255,255,255,.2); }`,
    pages: [
      { file: "index.html", title: "Home", body: `<section class="section hero">
  <div class="container">
    <h1>Hi, I’m Alex — I design and build for the web.</h1>
    <p>Frontend developer focused on fast, accessible interfaces.</p>
    <p><a class="btn" href="work.html">See my work</a> <a class="btn secondary" href="contact.html">Contact</a></p>
  </div>
</section>` },
      { file: "work.html", title: "Work", body: `<section class="section">
  <div class="container">
    <h1>Selected work</h1>
    <div class="grid">
      <div class="card"><h3>Weather Dashboard</h3><p>Responsive dashboard with offline support.</p><span class="tag">HTML</span><span class="tag">CSS</span></div>
      <div class="card"><h3>Recipe Finder</h3><p>Search and save recipes locally.</p><span class="tag">JavaScript</span></div>
      <div class="card"><h3>Studio Website</h3><p>Marketing site for a design studio.</p><span class="tag">Design</span></div>
    </div>
  </div>
</section>` },
      { file: "contact.html", title: "Contact", body: contactForm("Let’s work together") },
    ],
  },
  {
    id: "dashboard", name: "Dashboard", description: "Admin-style dashboard with stats and a data table.",
    theme: { primary: "#0ea5e9", bg: "#f1f5f9", text: "#0f172a", surface: "#ffffff", font: "system-ui, -apple-system, 'Segoe UI', sans-serif", radius: "12px", space: "1rem" },
    extraCss: `.stats { display: grid; gap: var(--space); grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.stat b { display: block; font-size: 1.8rem; } .table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: var(--radius); }
th, td { text-align: left; padding: .7rem; border-bottom: 1px solid rgba(0,0,0,.08); }
.bar { height: 10px; background: var(--primary); border-radius: 99px; }`,
    extraJs: `
// Table filter
var q = document.getElementById('filter');
if (q) q.addEventListener('input', function () {
  var v = q.value.toLowerCase();
  document.querySelectorAll('#orders tbody tr').forEach(function (tr) { tr.hidden = tr.textContent.toLowerCase().indexOf(v) === -1; });
});
`,
    pages: [
      { file: "index.html", title: "Overview", body: `<section class="section">
  <div class="container">
    <h1>Overview</h1>
    <div class="stats">
      <div class="card stat"><span>Visitors</span><b>12,480</b><div class="bar" style="width:80%"></div></div>
      <div class="card stat"><span>Orders</span><b>342</b><div class="bar" style="width:55%"></div></div>
      <div class="card stat"><span>Revenue</span><b>$8,210</b><div class="bar" style="width:65%"></div></div>
      <div class="card stat"><span>Refunds</span><b>4</b><div class="bar" style="width:8%"></div></div>
    </div>
    <h2>Recent orders</h2>
    <label>Filter <input id="filter" placeholder="Type to filter"></label>
    <div class="table-wrap">
      <table id="orders">
        <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          <tr><td>#1042</td><td>Maya R.</td><td>Paid</td><td>$54.00</td></tr>
          <tr><td>#1041</td><td>Omar K.</td><td>Pending</td><td>$19.50</td></tr>
          <tr><td>#1040</td><td>Lena P.</td><td>Refunded</td><td>$32.00</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>` },
      { file: "settings.html", title: "Settings", body: `<section class="section">
  <div class="container">
    <h1>Settings</h1>
    <form><label>Store name <input value="My Store"></label><label>Currency <select><option>USD</option><option>EUR</option></select></label><button class="btn" type="button">Save</button></form>
  </div>
</section>` },
    ],
  },
];

export const TEMPLATE_LIST = [...TEMPLATES.map(({ id, name, description }) => ({ id, name, description })), { id: "blank", name: "Blank", description: "A single empty page with base styles." }];

export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export function createProject(templateId: string, name?: string): Project {
  const now = Date.now();
  const tpl = TEMPLATES.find((t) => t.id === templateId);
  const siteName = name?.trim() || (tpl ? `My ${tpl.name} Site` : "My Site");
  if (!tpl) {
    const theme: Theme = { primary: "#2563eb", bg: "#ffffff", text: "#111111", surface: "#ffffff", font: "system-ui, sans-serif", radius: "8px", space: "1.25rem" };
    const pages = [{ file: "index.html", title: "Home" }];
    return {
      id: uid(), name: siteName, template: "blank", createdAt: now, updatedAt: now, pages: ["index.html"], assets: [], backend: false,
      files: {
        "index.html": pageHtml(siteName, "Home", navHtml(siteName, pages), `<section class="section">\n  <div class="container">\n    <h1>Hello world</h1>\n    <p>Start editing this page.</p>\n  </div>\n</section>`),
        "styles.css": cssFor(theme), "script.js": JS_BASE,
      },
    };
  }
  const nav = navHtml(siteName, tpl.pages);
  const files: Record<string, string> = { "styles.css": cssFor(tpl.theme, tpl.extraCss), "script.js": JS_BASE + FORM_JS + (tpl.extraJs ?? "") };
  for (const p of tpl.pages) files[p.file] = pageHtml(siteName, p.title, nav, p.body);
  return { id: uid(), name: siteName, template: tpl.id, createdAt: now, updatedAt: now, pages: tpl.pages.map((p) => p.file), files, assets: [], backend: tpl.pages.some((p) => p.body.includes("contact-form")) };
}
