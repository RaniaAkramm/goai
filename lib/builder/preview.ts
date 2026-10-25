import type { Project } from "./types";

const CSP = "default-src 'none'; img-src data:; media-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'none';";

const bridge = (edit: boolean) => `<script>(function(){
var EDIT=${edit};
document.addEventListener('click',function(e){
  var t=e.target;
  if(EDIT){var el=t.closest?t.closest('[data-goai-i]'):null; e.preventDefault(); e.stopPropagation();
    if(el){parent.postMessage({goai:'select',i:Number(el.getAttribute('data-goai-i')),tag:el.tagName.toLowerCase()},'*');
      document.querySelectorAll('[data-goai-sel]').forEach(function(x){x.removeAttribute('data-goai-sel')}); el.setAttribute('data-goai-sel','');}
    return;}
  var a=t.closest?t.closest('a[href]'):null; if(!a)return;
  var h=a.getAttribute('href')||''; if(h.charAt(0)==='#')return; e.preventDefault();
  var m=/^(?:\\.\\/)?([A-Za-z0-9._-]+\\.html)(#.*)?$/.exec(h);
  if(m)parent.postMessage({goai:'nav',page:m[1]},'*');
},true);
document.addEventListener('submit',function(e){e.preventDefault();parent.postMessage({goai:'info',msg:'Form submission is disabled in preview.'},'*')},true);
})();</script>${edit ? `<style>[data-goai-i]:hover{outline:2px dashed #7cb305!important;outline-offset:2px;cursor:pointer}[data-goai-sel]{outline:3px solid #C8F135!important;outline-offset:2px}</style>` : ""}`;

/** Parse html and number every element inside <body> in document order. */
export function numberElements(doc: Document) {
  doc.body?.querySelectorAll("*").forEach((el, i) => el.setAttribute("data-goai-i", String(i)));
}
export function elementAt(doc: Document, i: number): Element | null {
  return doc.body?.querySelectorAll("*")[i] ?? null;
}
export const serialize = (doc: Document) => "<!DOCTYPE html>\n" + doc.documentElement.outerHTML + "\n";

export function buildPreview(p: Project, page: string, assetUrls: Record<string, string>, edit: boolean): string {
  const html = p.files[page];
  if (html === undefined) return `<!DOCTYPE html><p>Page not found: ${page.replace(/</g, "&lt;")}</p>`;
  const doc = new DOMParser().parseFromString(html, "text/html");
  numberElements(doc);
  const head = doc.head;
  head.querySelectorAll('meta[http-equiv]').forEach((m) => m.remove());
  const csp = doc.createElement("meta"); csp.setAttribute("http-equiv", "Content-Security-Policy"); csp.setAttribute("content", CSP);
  head.prepend(csp);
  doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach((l) => {
    const f = (l.getAttribute("href") ?? "").replace(/^\.\//, "");
    if (p.files[f] !== undefined) { const s = doc.createElement("style"); s.textContent = rewriteAssetRefs(p.files[f], assetUrls); l.replaceWith(s); }
  });
  doc.querySelectorAll("script[src]").forEach((sc) => {
    const f = (sc.getAttribute("src") ?? "").replace(/^\.\//, "");
    const s = doc.createElement("script");
    if (p.files[f] !== undefined && !edit) s.textContent = p.files[f].replace(/<\/script/gi, "<\\/script");
    sc.replaceWith(s);
  });
  if (edit) doc.querySelectorAll("script:not([src])").forEach((s) => (s.textContent = ""));
  doc.querySelectorAll("[src],[href],[poster]").forEach((el) => {
    for (const attr of ["src", "href", "poster"]) {
      const v = el.getAttribute(attr); if (!v) continue;
      const k = v.replace(/^\.\//, "").split(/[?#]/)[0];
      if (k.startsWith("assets/") && assetUrls[k]) el.setAttribute(attr, assetUrls[k]);
    }
  });
  doc.querySelectorAll("[style]").forEach((el) => el.setAttribute("style", rewriteAssetRefs(el.getAttribute("style")!, assetUrls)));
  return serialize(doc).replace(/<\/body>/i, bridge(edit) + "</body>");
}

export function rewriteAssetRefs(css: string, assetUrls: Record<string, string>) {
  return css.replace(/url\((['"]?)(\.\/)?(assets\/[^'")]+)\1\)/g, (all, _q, _d, path) => (assetUrls[path] ? `url("${assetUrls[path]}")` : all));
}

export type ElementProps = { tag: string; text?: string; href?: string; src?: string; alt?: string; color: string; background: string; fontSize: string; fontWeight: string; padding: string; margin: string; textAlign: string };
const LEAF = (el: Element) => [...el.childNodes].every((n) => n.nodeType === 3 || (n.nodeType === 1 && ["b", "strong", "em", "i", "span", "br", "small"].includes((n as Element).tagName.toLowerCase())));
export function readElement(el: Element): ElementProps {
  const st = (el as HTMLElement).style;
  return {
    tag: el.tagName.toLowerCase(),
    text: LEAF(el) && el.tagName !== "IMG" ? el.textContent ?? "" : undefined,
    href: el.tagName === "A" ? el.getAttribute("href") ?? "" : undefined,
    src: el.tagName === "IMG" ? el.getAttribute("src") ?? "" : undefined,
    alt: el.tagName === "IMG" ? el.getAttribute("alt") ?? "" : undefined,
    color: st.color, background: st.backgroundColor, fontSize: st.fontSize, fontWeight: st.fontWeight, padding: st.padding, margin: st.margin, textAlign: st.textAlign,
  };
}
const CSS_SAFE = /^[#(),.%\w\s-]*$/;
export function applyElement(html: string, i: number, props: Partial<ElementProps>): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = elementAt(doc, i) as HTMLElement | null;
  if (!el) throw new Error("Element not found; the page may have changed.");
  if (props.text !== undefined && LEAF(el)) el.textContent = props.text;
  if (props.href !== undefined && el.tagName === "A") {
    if (/^\s*javascript:/i.test(props.href)) throw new Error("javascript: links are not allowed.");
    el.setAttribute("href", props.href);
  }
  if (props.src !== undefined && el.tagName === "IMG") el.setAttribute("src", props.src);
  if (props.alt !== undefined && el.tagName === "IMG") el.setAttribute("alt", props.alt);
  const map: [keyof ElementProps, string][] = [["color", "color"], ["background", "background-color"], ["fontSize", "font-size"], ["fontWeight", "font-weight"], ["padding", "padding"], ["margin", "margin"], ["textAlign", "text-align"]];
  for (const [k, css] of map) {
    const v = props[k];
    if (v === undefined) continue;
    if (!CSS_SAFE.test(v)) throw new Error(`Invalid value for ${css}.`);
    if (v.trim() === "") el.style.removeProperty(css); else el.style.setProperty(css, v.trim());
  }
  if (el.getAttribute("style") === "") el.removeAttribute("style");
  return serialize(doc);
}
export function insertImage(html: string, i: number, src: string, alt: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = elementAt(doc, i);
  if (!el) throw new Error("Element not found.");
  const img = doc.createElement("img"); img.setAttribute("src", src); img.setAttribute("alt", alt);
  el.after(img);
  return serialize(doc);
}
export function removeElement(html: string, i: number): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = elementAt(doc, i); if (!el) throw new Error("Element not found.");
  el.remove(); return serialize(doc);
}
