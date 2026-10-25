export const ALGOS = ["SHA-256", "SHA-384", "SHA-512"] as const;
export type Algo = (typeof ALGOS)[number];
export const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export async function hashText(text: string, algo: Algo): Promise<string> {
  return toHex(await crypto.subtle.digest(algo, new TextEncoder().encode(text)));
}
export async function hashBytes(data: ArrayBuffer, algo: Algo) { return toHex(await crypto.subtle.digest(algo, data)); }
