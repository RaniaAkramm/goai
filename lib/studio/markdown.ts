const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
/** Tiny, safe Markdown → HTML (escapes everything first; no links/images/raw HTML). Handles unfinished code fences while streaming. */
export function renderMarkdown(md: string): string {
  const out: string[] = []; const lines = md.split("\n"); let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    const fence = /^```([\w+-]*)/.exec(l);
    if (fence) { const buf: string[] = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(`<pre data-lang="${esc(fence[1] || "code")}"><code>${esc(buf.join("\n"))}</code></pre>`); continue; }
    if (/^\s*[-*] /.test(l)) { const items: string[] = []; while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\s*[-*] /, ""))}</li>`); out.push(`<ul>${items.join("")}</ul>`); continue; }
    if (/^\s*\d+[.)] /.test(l)) { const items: string[] = []; while (i < lines.length && /^\s*\d+[.)] /.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(/^\s*\d+[.)] /, ""))}</li>`); out.push(`<ol>${items.join("")}</ol>`); continue; }
    const h = /^(#{1,4}) (.*)/.exec(l); if (h) { out.push(`<h4>${inline(h[2])}</h4>`); i++; continue; }
    if (!l.trim()) { i++; continue; }
    const para: string[] = []; while (i < lines.length && lines[i].trim() && !/^(```|\s*[-*] |\s*\d+[.)] |#{1,4} )/.test(lines[i])) para.push(inline(lines[i++]));
    out.push(`<p>${para.join("<br>")}</p>`);
  }
  return out.join("");
}
