// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { detectWebGPU } from "../lib/studio/engine";
const setGpu = (g: unknown) => Object.defineProperty(navigator, "gpu", { value: g, configurable: true });
describe("detectWebGPU", () => {
  afterEach(() => setGpu(undefined));
  it("no gpu", async () => expect((await detectWebGPU()).ok).toBe(false));
  it("adapter without shader-f16 is not ok", async () => { setGpu({ requestAdapter: async () => ({ features: new Set<string>() }) }); const r = await detectWebGPU(); expect(r.ok).toBe(false); expect(r.f16).toBe(false); });
  it("adapter with shader-f16 is ok", async () => { setGpu({ requestAdapter: async () => ({ features: new Set(["shader-f16"]) }) }); expect((await detectWebGPU()).ok).toBe(true); });
});
