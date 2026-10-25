import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

const DESC = "Free AI tools and developer tools in your browser: private in-browser AI chat, AI code assistant, text summarizer and translator (AI Studio), JSON formatter, regex tester, diff and a website builder with ZIP export. No sign-up, no uploads, no paid APIs.";
export const metadata: Metadata = {
  metadataBase: new URL("https://goai.foo"),
  title: { default: "GoAI.foo — Free AI Studio, Developer Tools & Website Builder (No Sign-up)", template: "%s · GoAI.foo" },
  description: DESC,
  applicationName: "GoAI.foo",
  keywords: ["free AI tools", "local AI", "in-browser AI chat", "AI code assistant", "free AI chat no sign-up", "no sign-up AI", "private AI", "offline AI", "WebGPU AI", "WebLLM", "AI text summarizer", "AI translator to English", "AI website generator", "free developer tools", "online developer tools", "JSON formatter", "JSON validator", "JSON to CSV", "regex tester", "diff checker", "Base64 encoder", "SHA-256 hash generator", "HTML CSS JS playground", "website builder", "free website builder", "static site generator", "landing page builder", "ZIP export"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "GoAI.foo", url: "https://goai.foo", title: "GoAI.foo — Free AI Studio & Developer Tools", description: DESC, locale: "en_US" },
  twitter: { card: "summary_large_image", title: "GoAI.foo — Free AI Studio & Developer Tools", description: DESC },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#F4F5F2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
