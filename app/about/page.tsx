import type { Metadata } from "next";
export const metadata: Metadata = { title: "About", description: "About GoAI.foo — free, local-first developer tools and project builder." };
export default function About() {
  return (<div className="container prose"><div className="page-head"><h1>About GoAI.foo</h1><p>A free toolbox for developers, makers and students who want quick answers without handing their data to a server.</p></div>
    <h2>What it is</h2><p>GoAI.foo is a collection of browser-based developer utilities and a local-first Project Builder. Everything is in English, free to use, and works without an account.</p>
    <h2>How it works</h2><ul><li>Tools run as JavaScript in your browser tab. Your input is not uploaded.</li><li>The Project Builder stores projects in your browser’s IndexedDB storage and exports them as a ZIP you own.</li><li>There are no paid APIs and no subscriptions.</li></ul>
    <h2>Limitations</h2><ul><li>Results depend on your browser’s capabilities (for example the regex engine and Web Crypto are your browser’s own).</li><li>Data saved in your browser can be lost if you clear site data or use private browsing. Export what matters.</li></ul></div>);
}
