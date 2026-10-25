export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#111" />
      <path d="M38 22a12 12 0 1 0 2 16h-9" fill="none" stroke="#C8F135" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="46" cy="18" r="5" fill="#C8F135" />
    </svg>
  );
}
