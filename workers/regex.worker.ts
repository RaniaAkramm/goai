import { runRegex } from "../lib/regex";
self.onmessage = (e: MessageEvent<{ id: number; pattern: string; flags: string; text: string }>) => {
  const { id, pattern, flags, text } = e.data;
  (self as unknown as Worker).postMessage({ id, result: runRegex(pattern, flags, text) });
};
