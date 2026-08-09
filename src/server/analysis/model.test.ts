import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { GeminiStructuredModel } from "./model";

describe("GeminiStructuredModel", () => {
  beforeEach(() => {
    generateContent.mockReset();
  });

  it("forwards the server deadline signal to Gemini", async () => {
    generateContent.mockResolvedValue({ text: "{}" });
    const signal = new AbortController().signal;
    const model = new GeminiStructuredModel("test-api-key", "test-model");

    await model.generate("safe prompt", {}, signal);

    expect(generateContent).toHaveBeenCalledWith({
      model: "test-model",
      contents: "safe prompt",
      config: expect.objectContaining({ abortSignal: signal }),
    });
  });
});
