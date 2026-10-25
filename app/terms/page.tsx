import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms", description: "Terms of use for GoAI.foo." };
export default function Terms() {
  return (<div className="container prose"><div className="page-head"><h1>Terms of use</h1><p>Last updated: October 25, 2026</p></div>
    <h2>Use of the service</h2><p>GoAI.foo is provided free of charge. You may use the tools and builder for personal and commercial work.</p>
    <h2>Your content</h2><p>You keep all rights to what you enter, build and export. Because processing happens in your browser, you are responsible for keeping copies of your work.</p>
    <h2>No warranty</h2><p>The service is provided “as is”, without warranties of any kind. Tool output and project checks may contain mistakes or miss problems. Verify results before relying on them, especially for security, legal or financial purposes. Passing “Check Project” does not mean a project is error-free or secure.</p>
    <h2>Limitation of liability</h2><p>To the extent permitted by law, GoAI.foo is not liable for loss of data or damages arising from use of the service.</p>
    <h2>Acceptable use</h2><p>Don’t use the service to build or distribute malware, phishing pages or content that breaks the law.</p>
    <h2>Changes</h2><p>These terms may be updated. The date above shows the latest revision.</p></div>);
}
