import { processJson } from "../lib/json";
self.onmessage = (e: MessageEvent<{ id: number; text: string; mode: "format" | "minify"; indent: number | string }>) => {
  const { id, text, mode, indent } = e.data;
  (self as unknown as Worker).postMessage({ id, result: processJson(text, mode, indent) });
};
