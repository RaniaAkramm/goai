import Link from "next/link";
export default function NotFound() { return <div className="container page-head"><h1>Page not found</h1><p>That page doesn’t exist.</p><Link href="/" className="btn btn-dark">Go home</Link></div>; }
