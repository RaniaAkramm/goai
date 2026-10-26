import { describe, it, expect } from "vitest";
import { pickChatModel, CHAT_MODELS } from "../lib/chatPrompt";
import { getModel } from "../lib/studio/models";
describe("pickChatModel", () => {
  it("phones get the small model even with WebGPU", () => expect(pickChatModel({ webgpu: true, mobile: true, memGB: 8 })).toBe(CHAT_MODELS.small));
  it("low memory gets small", () => expect(pickChatModel({ webgpu: true, mobile: false, memGB: 4 })).toBe(CHAT_MODELS.small));
  it("no WebGPU gets small", () => expect(pickChatModel({ webgpu: false, mobile: false })).toBe(CHAT_MODELS.small));
  it("capable desktop gets Qwen", () => expect(pickChatModel({ webgpu: true, mobile: false, memGB: 8 })).toBe(CHAT_MODELS.desktop));
  it("small model under 150MB", () => expect(getModel(CHAT_MODELS.small)!.sizeMB).toBeLessThan(150));
});

import { dedupeRepeats } from "../lib/chatPrompt";
describe("dedupeRepeats", () => {
  it("cuts looping paragraphs", () => {
    const a = "Project Builder makes sites. It is free to use.";
    expect(dedupeRepeats(a + "\n\n" + a + "\n\n" + a)).toBe(a);
  });
  it("keeps normal text", () => { expect(dedupeRepeats("One thing here. Another thing.")).toBe("One thing here. Another thing."); });
});
