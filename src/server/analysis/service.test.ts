import { analysisJsonSchema } from "@/domain/analysis/schema";
import { validResult } from "@/domain/analysis/test-fixtures";
import { describe, expect, it, vi } from "vitest";
import { AnalysisUnavailableError } from "./errors";
import type { StructuredModel } from "./model";
import { analyzeMessage } from "./service";

const redactedInput = "klik [URL_1] sekarang";

function analysisOptions(overrides: Record<string, unknown> = {}) {
  return {
    signal: new AbortController().signal,
    requestId: "req-test",
    startedAtMs: 100,
    now: () => 250,
    log: vi.fn(),
    ...overrides,
  };
}

describe("analyzeMessage", () => {
  it("retries one invalid response and returns the parsed result", async () => {
    const generate = vi.fn()
      .mockResolvedValueOnce("not-json")
      .mockResolvedValueOnce(JSON.stringify(validResult));
    const model: StructuredModel = { generate };

    const options = analysisOptions();

    await expect(analyzeMessage(redactedInput, model, options)).resolves.toEqual(validResult);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(redactedInput),
      analysisJsonSchema,
      options.signal,
    );
  });

  it("retries a semantic validation failure", async () => {
    const inventedEvidence = {
      ...validResult,
      signals: [{ ...validResult.signals[0]!, quote: "kutipan yang tidak ada" }],
    };
    const generate = vi.fn()
      .mockResolvedValueOnce(JSON.stringify(inventedEvidence))
      .mockResolvedValueOnce(JSON.stringify(validResult));
    const model: StructuredModel = { generate };

    await expect(analyzeMessage(redactedInput, model, analysisOptions())).resolves.toEqual(validResult);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("retries valid JSON that does not satisfy the analysis schema", async () => {
    const schemaInvalidResult = { ...validResult, riskLevel: "certainly_safe" };
    const generate = vi.fn()
      .mockResolvedValueOnce(JSON.stringify(schemaInvalidResult))
      .mockResolvedValueOnce(JSON.stringify(validResult));
    const model: StructuredModel = { generate };

    await expect(analyzeMessage(
      redactedInput,
      model,
      analysisOptions(),
    )).resolves.toEqual(validResult);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("throws AnalysisUnavailableError after both structured outputs are invalid", async () => {
    const generate = vi.fn().mockResolvedValue("not-json");
    const model: StructuredModel = { generate };

    await expect(analyzeMessage(redactedInput, model, analysisOptions())).rejects.toEqual(
      new AnalysisUnavailableError(),
    );
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("does not start a second attempt after the deadline aborts the first", async () => {
    const controller = new AbortController();
    const generate = vi.fn().mockImplementation(async () => {
      controller.abort();
      throw new DOMException("deadline", "AbortError");
    });
    const model: StructuredModel = { generate };

    await expect(analyzeMessage(
      redactedInput,
      model,
      analysisOptions({ signal: controller.signal }),
    )).rejects.toEqual(new AnalysisUnavailableError());
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["auth", Object.assign(new Error("unauthorized"), { status: 401 })],
    ["quota", Object.assign(new Error("quota"), { status: 429 })],
    ["provider", Object.assign(new Error("provider"), { status: 503 })],
    ["network", new TypeError("fetch failed")],
  ])("does not retry a %s failure", async (_category, failure) => {
    const generate = vi.fn().mockRejectedValue(failure);
    const model: StructuredModel = { generate };

    await expect(analyzeMessage(
      redactedInput,
      model,
      analysisOptions(),
    )).rejects.toEqual(new AnalysisUnavailableError());
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("logs only safe request metadata when a provider error contains sensitive text", async () => {
    const userContent = "pesan privat 081234567890";
    const secret = "secret-api-key-value";
    const generate = vi.fn().mockRejectedValue(
      Object.assign(new Error(`${userContent} ${secret}`), { status: 401 }),
    );
    const model: StructuredModel = { generate };
    const log = vi.fn();

    await expect(analyzeMessage(
      userContent,
      model,
      analysisOptions({ requestId: "req-safe", log }),
    )).rejects.toEqual(new AnalysisUnavailableError());

    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith({
      requestId: "req-safe",
      attempt: 1,
      errorCategory: "auth",
      elapsedMs: 150,
    });
    const serializedLog = JSON.stringify(log.mock.calls);
    expect(serializedLog).not.toContain(userContent);
    expect(serializedLog).not.toContain(secret);
  });
});
