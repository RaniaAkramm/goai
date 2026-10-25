import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/tools", "/builder", "/studio", "/studio/chat", "/studio/code", "/studio/text", "/studio/models", "/studio/site", "/about", "/privacy", "/terms", ...TOOLS.map((t) => `/tools/${t.slug}`)].map((p) => ({ url: `https://goai.foo${p}` }));
}
