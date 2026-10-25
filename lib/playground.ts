export function buildDocument(html: string, css: string, js: string): string {
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:;">
<style>${safeCss}</style>
</head>
<body>
${html}
<script>${safeJs}</script>
</body>
</html>`;
}
