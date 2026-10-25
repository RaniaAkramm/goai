export type ToolMeta = { slug: string; name: string; short: string; description: string; keywords: string[]; icon: string };
export const TOOLS: ToolMeta[] = [
  { slug: "json-formatter", name: "JSON Formatter & Validator", short: "JSON", description: "Format, minify and validate JSON with readable error positions.", keywords: ["json", "pretty", "minify", "validate", "lint"], icon: "{ }" },
  { slug: "json-csv", name: "JSON ⇄ CSV Converter", short: "CSV", description: "Convert JSON arrays to CSV and back, with correct quoting and flattening.", keywords: ["csv", "json", "spreadsheet", "excel", "convert"], icon: "⇄" },
  { slug: "base64", name: "Base64 Encode / Decode", short: "B64", description: "UTF-8 safe Base64 and Base64URL encoding and decoding.", keywords: ["base64", "encode", "decode", "url"], icon: "64" },
  { slug: "diff", name: "Text & Code Diff", short: "Diff", description: "Compare two texts line by line with inline word highlights.", keywords: ["diff", "compare", "changes", "code"], icon: "±" },
  { slug: "playground", name: "HTML / CSS / JS Playground", short: "Play", description: "Write HTML, CSS and JavaScript with a live, sandboxed preview.", keywords: ["html", "css", "javascript", "sandbox", "preview"], icon: "</>" },
  { slug: "text-tools", name: "Text Utilities", short: "Text", description: "Counts, whitespace cleanup and case conversions — Unicode-safe.", keywords: ["word count", "case", "camel", "snake", "whitespace"], icon: "Aa" },
  { slug: "regex", name: "Regex Tester", short: "Regex", description: "Test JavaScript regular expressions with highlights and groups.", keywords: ["regex", "regexp", "pattern", "match"], icon: ".*" },
  { slug: "hash", name: "Hash Generator", short: "Hash", description: "SHA-256, SHA-384 and SHA-512 hashes of text or files via Web Crypto.", keywords: ["sha", "sha256", "hash", "checksum"], icon: "#" },
];
export const getTool = (s: string) => TOOLS.find((t) => t.slug === s);
