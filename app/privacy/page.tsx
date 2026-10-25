import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy", description: "How GoAI.foo handles your data: tools process input locally in your browser." };
export default function Privacy() {
  return (<div className="container prose"><div className="page-head"><h1>Privacy</h1><p>Last updated: October 25, 2026</p></div>
    <h2>Tool processing is local</h2><p>All eight developer tools process your input inside your browser. The tools make no network requests with your data: JSON, CSV, Base64, diff, text, regex and hash operations run in JavaScript and Web Workers on your device. Files you hash are read locally and never uploaded.</p>
    <h2>Playground and builder previews</h2><p>Previews run in a sandboxed iframe. The playground preview sets a Content-Security-Policy that blocks network requests. Builder previews render your project files locally; if your own project code references external URLs (for example a web font or image link you add), your browser will request them when previewing.</p>
    <h2>What is stored on your device</h2><p>The Project Builder saves projects and uploaded assets in your browser’s IndexedDB. This data stays on your device. You can delete projects in “My Projects”, or remove everything by clearing this site’s data in your browser settings.</p>
    <h2>What the server sees</h2><p>Like any website, the server hosting GoAI.foo receives standard requests for its pages and scripts (for example IP address and user agent in server logs). We do not use accounts, analytics scripts, tracking cookies or advertising scripts at this time.</p>
    <h2>Advertising</h2><p>Ads are not active. If advertising (such as Google AdSense) is enabled in the future, this policy will be updated before it goes live to describe the cookies and requests involved.</p>
    <h2>Contact</h2><p>Questions about privacy can be sent through the contact details published on this site when available.</p></div>);
}
