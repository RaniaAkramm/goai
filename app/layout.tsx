import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://goai.foo"),
  title: { default: "GoAI.foo — Free developer tools & project builder in your browser", template: "%s · GoAI.foo" },
  description: "Free, private developer tools and a local-first project builder. No account, no uploads — everything runs in your browser.",
};
export const viewport: Viewport = { themeColor: "#F4F5F2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
