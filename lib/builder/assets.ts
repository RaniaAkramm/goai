export const ASSET_TYPES: Record<string, string[]> = {
  "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/gif": ["gif"], "image/webp": ["webp"], "image/svg+xml": ["svg"],
  "image/x-icon": ["ico"], "font/woff2": ["woff2"], "font/woff": ["woff"], "application/pdf": ["pdf"],
};
export const MAX_ASSET = 5 * 1024 * 1024, MAX_TOTAL = 50 * 1024 * 1024;
export function validateAsset(name: string, type: string, size: number, currentTotal: number): string | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const allowed = ASSET_TYPES[type];
  if (!allowed) return `${name}: file type "${type || "unknown"}" is not allowed. Allowed: PNG, JPEG, GIF, WebP, SVG, ICO, WOFF/WOFF2, PDF.`;
  if (!allowed.includes(ext)) return `${name}: extension .${ext} does not match type ${type}.`;
  if (size > MAX_ASSET) return `${name}: larger than 5 MB.`;
  if (size === 0) return `${name}: file is empty.`;
  if (currentTotal + size > MAX_TOTAL) return `${name}: project asset storage would exceed 50 MB.`;
  return null;
}
/** Check magic bytes so a renamed file can't pose as an image. SVG is text and checked for <svg. */
export function sniff(bytes: Uint8Array, type: string): boolean {
  const h = (...b: number[]) => b.every((x, i) => bytes[i] === x);
  switch (type) {
    case "image/png": return h(0x89, 0x50, 0x4e, 0x47);
    case "image/jpeg": return h(0xff, 0xd8, 0xff);
    case "image/gif": return h(0x47, 0x49, 0x46);
    case "image/webp": return h(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57;
    case "application/pdf": return h(0x25, 0x50, 0x44, 0x46);
    case "image/svg+xml": return /<svg[\s>]/i.test(new TextDecoder().decode(bytes.slice(0, 4096)));
    case "font/woff2": return h(0x77, 0x4f, 0x46, 0x32);
    case "font/woff": return h(0x77, 0x4f, 0x46, 0x46);
    case "image/x-icon": return h(0, 0, 1, 0);
    default: return false;
  }
}
