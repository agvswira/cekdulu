import { afterEach, describe, expect, it, vi } from "vitest";
import { analysisJsonSchema } from "@/domain/analysis/schema";
import { OpenAICompatibleStructuredModel } from "./external-model";
import { GeminiStructuredModel } from "./model";
import { createAnalysisModel } from "./provider";

describe("createAnalysisModel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("selects Gemini only when AI_PROVIDER is gemini", () => {
    const model = createAnalysisModel({
      AI_PROVIDER: "gemini",
      GEMINI_API_KEY: "gemini-test-key",
      GEMINI_MODEL: "gemini-test-model",
      AI_BASE_URL: "https://provider.example/v1",
      AI_API_KEY: "external-test-key",
      AI_MODEL: "external-test-model",
    });

    expect(model).toBeInstanceOf(GeminiStructuredModel);
    expect(model).not.toBeInstanceOf(OpenAICompatibleStructuredModel);
  });

  it("selects the external adapter without falling back to configured Gemini", () => {
    const model = createAnalysisModel({
      AI_PROVIDER: "external",
      GEMINI_API_KEY: "gemini-test-key",
      AI_BASE_URL: "https://provider.example/v1",
      AI_API_KEY: "external-test-key",
      AI_MODEL: "external-test-model",
    });

    expect(model).toBeInstanceOf(OpenAICompatibleStructuredModel);
    expect(model).not.toBeInstanceOf(GeminiStructuredModel);
  });

  it.each([
    ["false", false],
    ["true", true],
  ])("maps AI_ENABLE_THINKING=%s to the external request", async (configuredValue, expected) => {
    const fetchImpl = vi.fn().mockResolvedValue(Response.json({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: 1,
      model: "external-test-model",
      choices: [{
        index: 0,
        message: { role: "assistant", content: "{}" },
        finish_reason: "stop",
      }],
    }));
    vi.stubGlobal("fetch", fetchImpl);
    const model = createAnalysisModel({
      AI_PROVIDER: "external",
      AI_BASE_URL: "https://provider.example/v1",
      AI_API_KEY: "external-test-key",
      AI_MODEL: "external-test-model",
      AI_ENABLE_THINKING: configuredValue,
    });

    await model?.generate(
      "safe prompt",
      analysisJsonSchema,
      new AbortController().signal,
    );

    const requestBody = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(requestBody.enable_thinking).toBe(expected);
  });

  it.each([
    ["missing provider", { GEMINI_API_KEY: "gemini-test-key" }],
    ["unknown provider", { AI_PROVIDER: "unknown", GEMINI_API_KEY: "gemini-test-key" }],
    ["missing Gemini key", { AI_PROVIDER: "gemini" }],
    ["missing external base URL", {
      AI_PROVIDER: "external", AI_API_KEY: "external-test-key", AI_MODEL: "external-test-model",
    }],
    ["invalid external base URL", {
      AI_PROVIDER: "external", AI_BASE_URL: "not-a-url", AI_API_KEY: "external-test-key", AI_MODEL: "external-test-model",
    }],
    ["plaintext external base URL", {
      AI_PROVIDER: "external", AI_BASE_URL: "http://provider.example/v1", AI_API_KEY: "external-test-key", AI_MODEL: "external-test-model",
    }],
    ["external base URL with a query", {
      AI_PROVIDER: "external", AI_BASE_URL: "https://provider.example/v1?version=1", AI_API_KEY: "external-test-key", AI_MODEL: "external-test-model",
    }],
    ["external base URL with a fragment", {
      AI_PROVIDER: "external", AI_BASE_URL: "https://provider.example/v1#endpoint", AI_API_KEY: "external-test-key", AI_MODEL: "external-test-model",
    }],
    ["missing external key", {
      AI_PROVIDER: "external", AI_BASE_URL: "https://provider.example/v1", AI_MODEL: "external-test-model",
    }],
    ["missing external model", {
      AI_PROVIDER: "external", AI_BASE_URL: "https://provider.example/v1", AI_API_KEY: "external-test-key",
    }],
    ["empty thinking option", {
      AI_PROVIDER: "external", AI_BASE_URL: "https://provider.example/v1", AI_API_KEY: "external-test-key", AI_MODEL: "external-test-model", AI_ENABLE_THINKING: "",
    }],
    ["uppercase thinking option", {
      AI_PROVIDER: "external", AI_BASE_URL: "https://provider.example/v1", AI_API_KEY: "external-test-key", AI_MODEL: "external-test-model", AI_ENABLE_THINKING: "FALSE",
    }],
    ["unknown thinking option", {
      AI_PROVIDER: "external", AI_BASE_URL: "https://provider.example/v1", AI_API_KEY: "external-test-key", AI_MODEL: "external-test-model", AI_ENABLE_THINKING: "disabled",
    }],
  ])("does not choose another provider for %s", (_name, env) => {
    expect(createAnalysisModel(env)).toBeNull();
  });
});
