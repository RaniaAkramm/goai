export function encodeBase64(text: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const b = btoa(bin);
  return urlSafe ? b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b;
}

export function decodeBase64(input: string): string {
  let s = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
    const bad = s.search(/[^A-Za-z0-9+/=]/);
    throw new Error(bad >= 0 ? `Invalid Base64 character "${s[bad]}" at position ${bad + 1}.` : "Padding '=' may only appear at the end.");
  }
  s = s.replace(/=+$/, "");
  if (s.length % 4 === 1) throw new Error("Invalid Base64 length: the input appears truncated.");
  s += "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Decoded bytes are not valid UTF-8 text (the data may be binary, e.g. an image or file).");
  }
}
