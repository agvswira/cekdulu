import { analysisJsonSchema } from "@/domain/analysis/schema";
import { validResult } from "@/domain/analysis/test-fixtures";
import { describe, expect, it, vi } from "vitest";
import { AnalysisUnavailableError } from "./errors";
import type { StructuredModel } from "./model";
import { analyzeMessage } from "./service";

const redactedInput = "klik [URL_1] sekarang";

describe("analyzeMessage", () => {
  it("retries one invalid response and returns the parsed result", async () => {
    const generate = vi.fn()
      .mockResolvedValueOnce("not-json")
      .mockResolvedValueOnce(JSON.stringify(validResult));
    const model: StructuredModel = { generate };

    await expect(analyzeMessage(redactedInput, model)).resolves.toEqual(validResult);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(redactedInput),
      analysisJsonSchema,
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

    await expect(analyzeMessage(redactedInput, model)).resolves.toEqual(validResult);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("throws AnalysisUnavailableError after both attempts fail", async () => {
    const generate = vi.fn().mockResolvedValue("not-json");
    const model: StructuredModel = { generate };

    await expect(analyzeMessage(redactedInput, model)).rejects.toEqual(
      new AnalysisUnavailableError(),
    );
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
