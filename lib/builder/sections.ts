/** Builder v2 section library: rich, real-copy sections rendered from a SiteContent object. */
export type Feature = { icon: string; title: string; text: string };
export type SiteContent = {
  brand: string; tagline: string; eyebrow: string; heroTitle: string; heroText: string; ctaPrimary: string; ctaSecondary: string;
  logos: string[]; stats: { value: string; label: string }[];
  featuresTitle: string; featuresText: string; features: Feature[];
  splitTitle: string; splitText: string; splitPoints: string[];
  steps: { title: string; text: string }[];
  testimonials: { quote: string; name: string; role: string }[];
  pricing: { name: string; price: string; period: string; text: string; features: string[]; featured?: boolean }[];
  faqs: { q: string; a: string }[];
  ctaTitle: string; ctaText: string;
  aboutTitle: string; aboutText: string; values: Feature[]; team: { name: string; role: string }[];
  items: { icon: string; title: string; text: string; price?: string; tags?: string[]; meta?: string }[];
  contact: { email: string; phone: string; address: string; hours: string };
};
export type BuildOptions = { primary?: string; font?: string; style?: "rounded" | "soft" | "sharp"; mode?: "light" | "dark" | "auto"; content?: Partial<SiteContent> };

const e = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const initials = (n: string) => n.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

const COMMON = {
  logos: ["NORTHWIND", "Acme Co.", "Lumen", "BRIGHTLY", "Kestrel", "Oakline"],
  contact: { email: "hello@example.com", phone: "+1 (555) 014-2290", address: "120 Market Street, Suite 400", hours: "Mon–Fri, 9:00–18:00" },
  team: [{ name: "Maya Reyes", role: "Founder & CEO" }, { name: "Omar Khalil", role: "Head of Operations" }, { name: "Lena Park", role: "Lead Designer" }, { name: "Sam Adeyemi", role: "Customer Success" }],
};

const BASE: Record<string, Omit<SiteContent, "brand">> = {
  business: {
    tagline: "Reliable solutions for growing teams.", eyebrow: "Trusted by 400+ companies",
    heroTitle: "Grow faster with systems that simply work", heroText: "We help small and medium businesses plan, build and run the tools they depend on — so your team can focus on customers, not busywork.",
    ctaPrimary: "Book a free consultation", ctaSecondary: "See our services", ...COMMON,
    stats: [{ value: "12+", label: "Years of experience" }, { value: "400+", label: "Clients served" }, { value: "98%", label: "Client retention" }, { value: "24h", label: "Average response" }],
    featuresTitle: "Everything you need to scale", featuresText: "From the first workshop to day-to-day support, one team covers the whole journey.",
    features: [{ icon: "◎", title: "Strategy & consulting", text: "Clear priorities, realistic roadmaps and honest advice on what to build next." }, { icon: "⚙", title: "Implementation", text: "We set up, migrate and integrate the tools you choose — on time and documented." }, { icon: "◈", title: "Automation", text: "Remove repetitive work with reliable workflows that connect your apps." }, { icon: "▲", title: "Analytics", text: "Dashboards that show what matters, so decisions are based on real numbers." }, { icon: "✦", title: "Training", text: "Hands-on sessions that get your whole team confident with new systems." }, { icon: "☏", title: "Ongoing support", text: "A friendly, dedicated contact whenever something needs attention." }],
    splitTitle: "A partner, not just a vendor", splitText: "We work as an extension of your team. You get one point of contact, transparent pricing and weekly progress updates you can actually read.",
    splitPoints: ["Fixed-price proposals with no surprises", "Weekly updates and shared roadmaps", "Security and privacy built in from day one", "Documentation your team owns"],
    steps: [{ title: "Discover", text: "A free call to understand your goals, tools and constraints." }, { title: "Plan", text: "A clear proposal with scope, timeline and fixed price." }, { title: "Build", text: "We implement in short cycles with demos every week." }, { title: "Support", text: "Training, handover and ongoing help as you grow." }],
    testimonials: [{ quote: "They untangled years of messy spreadsheets in six weeks. Our team finally trusts the numbers.", name: "Priya Nair", role: "COO, Lumen Health" }, { quote: "Clear communication, fixed price, delivered early. Exactly what a small company needs.", name: "Daniel Brooks", role: "Founder, Oakline Studio" }, { quote: "Support is fast and genuinely friendly. It feels like having an in-house IT team.", name: "Aisha Rahman", role: "Director, Kestrel Logistics" }],
    pricing: [{ name: "Starter", price: "$490", period: "/month", text: "For small teams getting organised.", features: ["Up to 10 users", "Monthly strategy call", "Email support", "Basic automation"] }, { name: "Growth", price: "$1,290", period: "/month", text: "Our most popular plan for scaling teams.", features: ["Up to 50 users", "Weekly check-ins", "Priority support", "Advanced automation", "Custom dashboards"], featured: true }, { name: "Enterprise", price: "Custom", period: "", text: "For complex organisations.", features: ["Unlimited users", "Dedicated team", "SLA & onboarding", "Security review"] }],
    faqs: [{ q: "How long does a typical project take?", a: "Most projects run 4–10 weeks. You get a fixed timeline in the proposal before any work starts." }, { q: "Do you work with our existing tools?", a: "Yes. We start from what you already use and only recommend changes that clearly pay off." }, { q: "Can we cancel a monthly plan?", a: "Plans are month-to-month. Cancel any time with 30 days’ notice." }, { q: "Is the first consultation really free?", a: "Yes — a 45-minute call with no obligation. You keep the notes and recommendations." }],
    ctaTitle: "Ready to simplify how your business runs?", ctaText: "Book a free 45-minute consultation and leave with a clear, practical plan.",
    aboutTitle: "About us", aboutText: "We are a small, senior team that values clear communication and dependable work. Since 2014 we have helped hundreds of companies replace chaos with calm, well-documented systems.",
    values: [{ icon: "◎", title: "Clarity", text: "Plain language, honest estimates and no jargon." }, { icon: "✓", title: "Reliability", text: "We do what we say, when we say we will." }, { icon: "♥", title: "Care", text: "We treat your business like it is our own." }],
    items: [],
  },
  ecommerce: {
    tagline: "Everyday goods, thoughtfully made.", eyebrow: "New autumn collection",
    heroTitle: "Everyday goods, thoughtfully made", heroText: "Durable, beautiful essentials crafted by independent makers. Free shipping over $50 and 30-day returns on everything.",
    ctaPrimary: "Shop the collection", ctaSecondary: "Our story", ...COMMON,
    stats: [{ value: "25k+", label: "Happy customers" }, { value: "4.9★", label: "Average rating" }, { value: "120", label: "Independent makers" }, { value: "30-day", label: "Free returns" }],
    featuresTitle: "Why shop with us", featuresText: "Small shop, big care — from packaging to support.",
    features: [{ icon: "⛟", title: "Free shipping", text: "On every order over $50, tracked to your door." }, { icon: "↺", title: "30-day returns", text: "Not in love? Send it back, no questions asked." }, { icon: "♻", title: "Plastic-free packaging", text: "Recycled and compostable materials only." }, { icon: "☏", title: "Real human support", text: "Reply within a few hours, seven days a week." }],
    splitTitle: "", splitText: "", splitPoints: [], steps: [],
    testimonials: [{ quote: "The mug is even nicer in person. Packaging was gorgeous and arrived in two days.", name: "Chloe M.", role: "Verified buyer" }, { quote: "My tote has survived a year of daily use and still looks new.", name: "Jonas W.", role: "Verified buyer" }, { quote: "Lovely shop, fast replies when I needed to change my address.", name: "Fatima S.", role: "Verified buyer" }],
    pricing: [],
    faqs: [{ q: "How long does shipping take?", a: "Orders ship within 1 business day. Delivery usually takes 2–5 business days." }, { q: "Can I return a gift?", a: "Yes. Gift returns are refunded as store credit to the recipient." }, { q: "Do you ship internationally?", a: "We ship to 30+ countries. Rates are shown at checkout." }],
    ctaTitle: "Get 10% off your first order", ctaText: "Join our newsletter for new arrivals, maker stories and members-only offers.",
    aboutTitle: "Our story", aboutText: "We started as a weekend market stall and grew into a home for independent makers.", values: [], 
    items: [{ icon: "👜", title: "Canvas Tote", text: "Heavyweight organic cotton, reinforced handles.", price: "$24" }, { icon: "☕", title: "Ceramic Mug", text: "Hand-glazed stoneware, 350 ml.", price: "$18" }, { icon: "📓", title: "Notebook Set", text: "Three A5 notebooks, recycled paper.", price: "$12" }, { icon: "🕯", title: "Soy Candle", text: "Cedar & fig, 40-hour burn.", price: "$22" }, { icon: "🧣", title: "Wool Scarf", text: "Soft merino, made in small batches.", price: "$39" }, { icon: "🪴", title: "Planter Pot", text: "Matte terracotta with drainage tray.", price: "$28" }],
  },
  blog: {
    tagline: "Notes on building things.", eyebrow: "Featured essay",
    heroTitle: "Notes on building things", heroText: "Essays and practical guides on making software, writing clearly and doing calm, focused work. New posts every other Tuesday.",
    ctaPrimary: "Read the latest", ctaSecondary: "About the author", ...COMMON,
    stats: [], featuresTitle: "", featuresText: "", features: [], splitTitle: "", splitText: "", splitPoints: [], steps: [], testimonials: [], pricing: [], faqs: [],
    ctaTitle: "Get new posts by email", ctaText: "One thoughtful email every two weeks. No spam, unsubscribe any time.",
    aboutTitle: "About this blog", aboutText: "Written by a curious developer who has spent fifteen years building products, teams and side projects — and writing down what worked.",
    values: [{ icon: "✎", title: "Practical", text: "Every post ends with something you can try today." }, { icon: "◷", title: "Unhurried", text: "Fewer, better posts instead of daily noise." }, { icon: "♥", title: "Independent", text: "No ads, no sponsors, reader-supported." }],
    items: [{ icon: "✦", title: "Start small, ship often", text: "Why tiny releases beat big launches — and how to plan them.", tags: ["Process"], meta: "Oct 12 · 6 min read" }, { icon: "✎", title: "Writing docs people read", text: "A simple structure for READMEs, guides and decision records.", tags: ["Writing"], meta: "Sep 28 · 8 min read" }, { icon: "◎", title: "The art of the side project", text: "Keeping motivation without burning out on evenings and weekends.", tags: ["Life"], meta: "Sep 14 · 5 min read" }, { icon: "⚙", title: "Boring tech, happy teams", text: "Choosing tools you will still like in three years.", tags: ["Engineering"], meta: "Aug 31 · 7 min read" }, { icon: "◈", title: "Designing for slow networks", text: "Practical tips for fast pages on any connection.", tags: ["Web"], meta: "Aug 17 · 9 min read" }, { icon: "▲", title: "Reviews that help", text: "How to give code review feedback that lands well.", tags: ["Teams"], meta: "Aug 3 · 4 min read" }],
  },
  portfolio: {
    tagline: "Design and frontend development.", eyebrow: "Available for new projects",
    heroTitle: "Hi, I’m Alex — I design and build for the web.", heroText: "Frontend developer and product designer helping startups ship fast, accessible interfaces people enjoy using.",
    ctaPrimary: "See my work", ctaSecondary: "Get in touch", ...COMMON,
    stats: [{ value: "8 yrs", label: "Experience" }, { value: "60+", label: "Projects shipped" }, { value: "30", label: "Happy clients" }, { value: "100", label: "Lighthouse scores" }],
    featuresTitle: "What I do", featuresText: "End-to-end help from first sketch to production code.",
    features: [{ icon: "✎", title: "Product design", text: "User flows, wireframes and polished UI in Figma." }, { icon: "</>", title: "Frontend development", text: "Fast, accessible sites and apps with modern tooling." }, { icon: "◈", title: "Design systems", text: "Reusable components that keep teams consistent." }],
    splitTitle: "", splitText: "", splitPoints: [],
    steps: [{ title: "Intro call", text: "We talk goals, audience and timeline." }, { title: "Design", text: "Wireframes, then high-fidelity screens." }, { title: "Build", text: "Clean, tested code with weekly previews." }, { title: "Launch", text: "Deploy, measure and iterate together." }],
    testimonials: [{ quote: "Alex turned a vague idea into a product our users love. Fast, thoughtful and detail-obsessed.", name: "Nora Lindqvist", role: "CEO, Brightly" }, { quote: "The best frontend partner we have worked with. Our conversion rate went up 34%.", name: "Marcus Chen", role: "CMO, Kestrel" }],
    pricing: [], faqs: [],
    ctaTitle: "Have a project in mind?", ctaText: "I take on a small number of projects each quarter. Let’s talk about yours.",
    aboutTitle: "", aboutText: "", values: [],
    items: [{ icon: "☀", title: "Weather Dashboard", text: "Responsive dashboard with offline support and smooth charts.", tags: ["HTML", "CSS", "JS"] }, { icon: "🍲", title: "Recipe Finder", text: "Search, filter and save recipes locally — works offline.", tags: ["JavaScript"] }, { icon: "◈", title: "Studio Website", text: "Marketing site for a design studio with a custom CMS.", tags: ["Design", "Web"] }, { icon: "▲", title: "Fintech Onboarding", text: "Redesigned sign-up flow that lifted completion by 28%.", tags: ["UX"] }, { icon: "♫", title: "Music Player", text: "Accessible audio player with keyboard controls.", tags: ["A11y"] }, { icon: "⛰", title: "Travel Journal", text: "Map-based journal app for adventurous travellers.", tags: ["App"] }],
  },
};
BASE.blank = { ...BASE.business, heroTitle: "Hello world", heroText: "Start editing this page — headings, text, colors and spacing are all editable." };
BASE.dashboard = { ...BASE.business, tagline: "Store admin dashboard." };

export function contentFor(tplId: string, brand: string, override?: Partial<SiteContent>): SiteContent {
  const base = BASE[tplId] ?? BASE.business;
  const out = { ...base, brand } as SiteContent;
  if (override) for (const [k, v] of Object.entries(override)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

const head = (eyebrow: string, title: string, text?: string) => `    <div class="section-head">
      ${eyebrow ? `<span class="eyebrow">${e(eyebrow)}</span>` : ""}
      <h2>${e(title)}</h2>
      ${text ? `<p>${e(text)}</p>` : ""}
    </div>`;
const wrap = (inner: string, cls = "section") => `<section class="${cls}">
  <div class="container">
${inner}
  </div>
</section>`;
const contactForm = `<form id="contact-form" action="/api/messages" method="post">
      <label>Name <input name="name" required maxlength="100" autocomplete="name"></label>
      <label>Email <input name="email" type="email" required maxlength="200" autocomplete="email"></label>
      <label>Message <textarea name="message" rows="5" required maxlength="5000"></textarea></label>
      <button class="btn" type="submit">Send message</button>
      <p id="form-status" role="status"></p>
    </form>`;

function heroArt(c: SiteContent, tpl: string) {
  const s = c.stats;
  const a = s[0] ? `<div class="float-card a"><b>${e(s[0].value)}</b>${e(s[0].label)}</div>` : "";
  const b = s[1] ? `<div class="float-card b"><b>${e(s[1].value)}</b>${e(s[1].label)}</div>` : "";
  const label = tpl === "blog" ? "Reading progress" : tpl === "ecommerce" ? "Orders shipped today" : "Project progress";
  return `<div class="hero-art" aria-hidden="true">${a}<div class="float-card c">${label}<div class="bar-row"><i style="width:78%"></i></div><div class="bar-row"><i style="width:52%"></i></div></div>${b}</div>`;
}

const R: Record<string, (c: SiteContent, tpl: string) => string> = {
  hero: (c, tpl) => `<section class="section hero">
  <div class="container hero-grid">
    <div>
      <span class="eyebrow">${e(c.eyebrow)}</span>
      <h1>${e(c.heroTitle)}</h1>
      <p class="lead">${e(c.heroText)}</p>
      <div class="actions"><a class="btn" href="${tpl === "ecommerce" ? "#products" : tpl === "blog" ? "post.html" : tpl === "portfolio" ? "work.html" : "contact.html"}">${e(c.ctaPrimary)}</a> <a class="btn secondary" href="${tpl === "portfolio" || tpl === "ecommerce" ? "contact.html" : "about.html"}">${e(c.ctaSecondary)}</a></div>
      ${tpl === "ecommerce" ? `<p class="trust">Cart: <span class="cart-count" id="cart-count">0</span> items · <span class="stars">★★★★★</span> 4.9 from 2,300 reviews</p>` : `<p class="trust"><span class="stars">★★★★★</span> Rated 4.9/5 by our community</p>`}
    </div>
    ${heroArt(c, tpl)}
  </div>
</section>`,
  logos: (c) => `<section aria-label="Trusted by"><div class="container logos">${c.logos.map((l) => `<span>${e(l)}</span>`).join("")}</div></section>`,
  stats: (c) => c.stats.length ? wrap(`    <div class="stats">${c.stats.map((s) => `<div class="stat"><b>${e(s.value)}</b><span>${e(s.label)}</span></div>`).join("")}</div>`, "section alt") : "",
  features: (c) => c.features.length ? wrap(`${head("Services", c.featuresTitle, c.featuresText)}
    <div class="grid">
${c.features.map((f) => `      <div class="card"><div class="icon">${e(f.icon)}</div><h3>${e(f.title)}</h3><p>${e(f.text)}</p></div>`).join("\n")}
    </div>`) : "",
  split: (c) => c.splitTitle ? wrap(`    <div class="split">
      <div class="hero-art" aria-hidden="true" style="aspect-ratio:4/3"><div class="float-card a"><b>+42%</b>Team productivity</div><div class="float-card b"><b>-30%</b>Time on admin</div></div>
      <div><span class="eyebrow">Why us</span><h2>${e(c.splitTitle)}</h2><p class="muted">${e(c.splitText)}</p><ul class="checks">${c.splitPoints.map((p) => `<li>${e(p)}</li>`).join("")}</ul></div>
    </div>`, "section alt") : "",
  steps: (c) => c.steps.length ? wrap(`${head("How it works", "A simple, proven process")}
    <div class="grid steps">${c.steps.map((s) => `<div class="card"><h3>${e(s.title)}</h3><p>${e(s.text)}</p></div>`).join("")}</div>`) : "",
  testimonials: (c) => c.testimonials.length ? wrap(`${head("Testimonials", "Loved by people like you")}
    <div class="grid">
${c.testimonials.map((t) => `      <figure class="card quote"><span class="stars" aria-label="5 stars">★★★★★</span><blockquote>“${e(t.quote)}”</blockquote><figcaption class="person"><span class="avatar" aria-hidden="true">${e(initials(t.name))}</span><span><b>${e(t.name)}</b><small>${e(t.role)}</small></span></figcaption></figure>`).join("\n")}
    </div>`, "section alt") : "",
  pricing: (c) => c.pricing.length ? wrap(`${head("Pricing", "Simple, transparent pricing", "No setup fees. Change or cancel any time.")}
    <div class="grid">
${c.pricing.map((p) => `      <div class="card price-card${p.featured ? " featured" : ""}">${p.featured ? `<span class="ribbon">Most popular</span>` : ""}<h3>${e(p.name)}</h3><p>${e(p.text)}</p><div class="amount">${e(p.price)}<small>${e(p.period)}</small></div><ul class="checks">${p.features.map((f) => `<li>${e(f)}</li>`).join("")}</ul><a class="btn${p.featured ? "" : " secondary"}" href="contact.html">Choose ${e(p.name)}</a></div>`).join("\n")}
    </div>`) : "",
  faq: (c) => c.faqs.length ? wrap(`${head("FAQ", "Frequently asked questions")}
    <div class="faq">
${c.faqs.map((f, i) => `      <details${i === 0 ? " open" : ""}><summary>${e(f.q)}</summary><p>${e(f.a)}</p></details>`).join("\n")}
    </div>`) : "",
  cta: (c) => wrap(`    <div class="cta-box"><h2>${e(c.ctaTitle)}</h2><p>${e(c.ctaText)}</p><div class="actions"><a class="btn light" href="contact.html">${e(c.ctaPrimary)}</a></div></div>`),
  newsletter: (c) => wrap(`    <div class="cta-box"><h2>${e(c.ctaTitle)}</h2><p>${e(c.ctaText)}</p><form class="newsletter"><input type="email" required placeholder="you@example.com" aria-label="Email address"><button class="btn light" type="submit">Subscribe</button></form></div>`),
  about: (c) => `<section class="section hero">
  <div class="container hero-grid">
    <div><span class="eyebrow">Our story</span><h1>${e(c.aboutTitle)}</h1><p class="lead">${e(c.aboutText)}</p></div>
    ${heroArt(c, "about")}
  </div>
</section>`,
  values: (c) => c.values.length ? wrap(`${head("Values", "What we believe in")}
    <div class="grid">${c.values.map((f) => `<div class="card"><div class="icon">${e(f.icon)}</div><h3>${e(f.title)}</h3><p>${e(f.text)}</p></div>`).join("")}</div>`, "section alt") : "",
  team: (c) => wrap(`${head("Team", "The people behind " + c.brand)}
    <div class="grid">${c.team.map((t) => `<div class="card" style="text-align:center"><span class="avatar" style="width:4.5rem;height:4.5rem;margin:0 auto 1rem;font-size:1.3rem" aria-hidden="true">${e(initials(t.name))}</span><h3>${e(t.name)}</h3><p>${e(t.role)}</p></div>`).join("")}</div>`),
  contact: (c, tpl) => wrap(`    <div class="split" style="align-items:start">
      <div class="contact-info"><span class="eyebrow">Contact</span><h1>${tpl === "portfolio" ? "Let’s work together" : tpl === "ecommerce" ? "Questions?" : "Contact us"}</h1><p class="lead muted">We usually reply within one business day.</p>
        <div class="card"><h3>✉ Email</h3><p><a href="mailto:${e(c.contact.email)}">${e(c.contact.email)}</a></p></div>
        <div class="card"><h3>☏ Phone</h3><p>${e(c.contact.phone)} · ${e(c.contact.hours)}</p></div>
        <div class="card"><h3>⌂ Office</h3><p>${e(c.contact.address)}</p></div>
      </div>
      <div class="card">
    ${contactForm}
      </div>
    </div>`),
  products: (c) => wrap(`${head("Shop", "Bestsellers", "Small-batch goods our customers keep coming back for.")}
    <div class="grid" id="products">
${c.items.map((p) => `      <div class="card product"><div class="thumb" aria-hidden="true">${e(p.icon)}</div><h3>${e(p.title)}</h3><p>${e(p.text)}</p><p class="price">${e(p.price ?? "")}</p><button class="btn" data-add="${e(p.title)}">Add to cart</button></div>`).join("\n")}
    </div>`),
  cart: () => wrap(`    <span class="eyebrow">Your bag</span><h1>Your cart</h1>
    <div class="card"><ul id="cart-list"></ul><div class="actions"><button class="btn secondary" id="cart-clear" type="button">Clear cart</button><a class="btn" href="contact.html">Request checkout</a></div><p class="meta">Demo cart — payments are not connected.</p></div>`),
  posts: (c) => wrap(`${head("Latest", "Recent articles")}
    <div class="grid">
${c.items.map((p, i) => `      <article class="card"><div class="thumb" aria-hidden="true">${e(p.icon)}</div>${(p.tags ?? []).map((t) => `<span class="tag">${e(t)}</span>`).join("")}<h3><a href="${i === 0 ? "post.html" : "post.html"}">${e(p.title)}</a></h3><p>${e(p.text)}</p><p class="meta">${e(p.meta ?? "")}</p></article>`).join("\n")}
    </div>`),
  article: (c) => `<article class="section">
  <div class="container post">
    <span class="tag">Process</span>
    <h1>Start small, ship often</h1>
    <p class="meta">By ${e(c.brand)} · Oct 12 · 6 min read</p>
    <p>Big launches feel exciting, but they hide risk. Every week a change sits unreleased, the gap between what you built and what people need quietly grows.</p>
    <h2>Why small releases win</h2>
    <p>Small changes are easier to review, easier to test and easier to undo. They also give you feedback while the work is still fresh in your mind.</p>
    <blockquote>Ship the smallest thing that teaches you something new.</blockquote>
    <h2>A simple weekly rhythm</h2>
    <ul class="checks"><li>Monday: pick one outcome for the week</li><li>Midweek: release something behind a flag</li><li>Friday: review what you learned and write it down</li></ul>
    <p>Try it for a month. You will be surprised how much calmer — and faster — your work feels.</p>
  </div>
</article>`,
  work: (c) => wrap(`${head("Portfolio", "Selected work", "A few recent projects across design and development.")}
    <div class="grid">
${c.items.map((p) => `      <div class="card"><div class="thumb" aria-hidden="true">${e(p.icon)}</div><h3>${e(p.title)}</h3><p>${e(p.text)}</p>${(p.tags ?? []).map((t) => `<span class="tag">${e(t)}</span>`).join("")}</div>`).join("\n")}
    </div>`),
  dashboard: () => wrap(`    <span class="eyebrow">Last 30 days</span><h1>Overview</h1>
    <div class="dash-stats">
      <div class="card stat"><span>Visitors</span><b>12,480</b><span class="trend">▲ 12.4%</span><div class="bar" style="width:80%"></div></div>
      <div class="card stat"><span>Orders</span><b>342</b><span class="trend">▲ 6.1%</span><div class="bar" style="width:55%"></div></div>
      <div class="card stat"><span>Revenue</span><b>$8,210</b><span class="trend">▲ 9.8%</span><div class="bar" style="width:65%"></div></div>
      <div class="card stat"><span>Refunds</span><b>4</b><span class="trend">▼ 2.0%</span><div class="bar" style="width:8%"></div></div>
    </div>
    <div class="split" style="align-items:stretch;margin-bottom:2rem">
      <div class="card"><h3>Weekly revenue</h3><div class="chart" aria-label="Bar chart of weekly revenue">${[40, 62, 55, 78, 66, 90, 84].map((h) => `<i style="height:${h}%"></i>`).join("")}</div></div>
      <div class="card"><h3>Top products</h3><ul class="checks"><li>Canvas Tote — 128 sold</li><li>Ceramic Mug — 94 sold</li><li>Notebook Set — 71 sold</li><li>Soy Candle — 52 sold</li></ul></div>
    </div>
    <h2>Recent orders</h2>
    <label>Filter <input id="filter" placeholder="Type to filter"></label>
    <div class="table-wrap">
      <table id="orders">
        <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          <tr><td>#1042</td><td>Maya R.</td><td><span class="pill">Paid</span></td><td>$54.00</td></tr>
          <tr><td>#1041</td><td>Omar K.</td><td><span class="pill">Pending</span></td><td>$19.50</td></tr>
          <tr><td>#1040</td><td>Lena P.</td><td><span class="pill">Refunded</span></td><td>$32.00</td></tr>
          <tr><td>#1039</td><td>Sam A.</td><td><span class="pill">Paid</span></td><td>$88.20</td></tr>
          <tr><td>#1038</td><td>Priya N.</td><td><span class="pill">Shipped</span></td><td>$41.00</td></tr>
        </tbody>
      </table>
    </div>`),
  settings: () => wrap(`    <h1>Settings</h1>
    <div class="split" style="align-items:start"><div class="card"><h3>Store</h3><form><label>Store name <input value="My Store"></label><label>Currency <select><option>USD</option><option>EUR</option><option>GBP</option></select></label><label>Support email <input type="email" value="support@example.com"></label><button class="btn" type="button">Save changes</button></form></div>
    <div class="card"><h3>Notifications</h3><ul class="checks"><li>New order emails</li><li>Weekly summary report</li><li>Low stock alerts</li></ul></div></div>`),
};

export function renderSections(ids: string[], c: SiteContent, tpl: string) {
  return ids.map((id) => R[id]?.(c, tpl) ?? "").filter(Boolean).join("\n");
}

export function footerHtml(siteName: string, pages: { file: string; title: string }[], c: SiteContent | null) {
  const tagline = c?.tagline ?? "Built with GoAI.foo Project Builder.";
  const contact = c?.contact ?? COMMON.contact;
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div><p class="footer-brand">${e(siteName)}</p><p>${e(tagline)}</p></div>
      <div><h4>Pages</h4><ul>${pages.map((p) => `<li><a href="${p.file}">${e(p.title)}</a></li>`).join("")}</ul></div>
      <div><h4>Contact</h4><ul><li><a href="mailto:${e(contact.email)}">${e(contact.email)}</a></li><li>${e(contact.phone)}</li><li>${e(contact.hours)}</li></ul></div>
      <div><h4>Legal</h4><ul><li><a href="#privacy">Privacy policy</a></li><li><a href="#terms">Terms of service</a></li><li><a href="#cookies">Cookie settings</a></li></ul></div>
    </div>
    <div class="footer-bottom"><p>&copy; <span data-year>${new Date().getFullYear()}</span> ${e(siteName)}. All rights reserved.</p><p>Made with care.</p></div>
  </div>
</footer>`;
}
