export function HeroArt() {
  return (
    <svg className="hero-visual" viewBox="0 0 400 400" role="img" aria-label="Illustration of stacked code windows">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#e6e9e2" /></linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dcff6b" /><stop offset="1" stopColor="#a9d31a" /></linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" floodOpacity=".14" /></filter>
      </defs>
      <circle cx="210" cy="200" r="160" fill="#eaf7c4" />
      <g filter="url(#sh)">
        <rect x="70" y="80" width="250" height="170" rx="26" fill="url(#g1)" />
        <rect x="70" y="80" width="250" height="40" rx="26" fill="#111" />
        <circle cx="98" cy="100" r="6" fill="#C8F135" /><circle cx="118" cy="100" r="6" fill="#555" /><circle cx="138" cy="100" r="6" fill="#555" />
        <rect x="96" y="142" width="120" height="12" rx="6" fill="#111" /><rect x="96" y="166" width="180" height="12" rx="6" fill="#c9ccc5" />
        <rect x="96" y="190" width="90" height="12" rx="6" fill="#C8F135" /><rect x="196" y="190" width="70" height="12" rx="6" fill="#c9ccc5" />
        <rect x="96" y="214" width="140" height="12" rx="6" fill="#c9ccc5" />
      </g>
      <g filter="url(#sh)">
        <rect x="190" y="220" width="160" height="110" rx="24" fill="#111" />
        <text x="214" y="270" fill="#C8F135" fontFamily="ui-monospace,monospace" fontSize="30" fontWeight="700">{"{ }"}</text>
        <rect x="214" y="290" width="100" height="10" rx="5" fill="#444" />
      </g>
      <g filter="url(#sh)"><circle cx="110" cy="300" r="44" fill="url(#g2)" /><path d="M92 300l12 12 24-26" fill="none" stroke="#111" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></g>
    </svg>
  );
}
