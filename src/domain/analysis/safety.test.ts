import { describe, expect, it } from "vitest";
import { containsAbsoluteVerdict, validateAnalysisSemantics } from "./safety";
import { validResult } from "./test-fixtures";

describe("analysis semantic safety", () => {
  it.each(["Pesan ini pasti aman", "Ini pasti penipuan", "dijamin bukan scam"])(
    "rejects an absolute verdict: %s",
    (text) => expect(containsAbsoluteVerdict(text)).toBe(true),
  );

  it("rejects evidence that is absent from the redacted input", () => {
    expect(() => validateAnalysisSemantics(validResult, "pesan yang berbeda")).toThrow(
      "EVIDENCE_NOT_IN_INPUT",
    );
  });

  it("accepts evidence after normalizing case and whitespace", () => {
    expect(() =>
      validateAnalysisSemantics(validResult, "  KLIK   [url_1]  SEKARANG  "),
    ).not.toThrow();
  });

  it.each([
    ["summary", { ...validResult, summary: "Pesan ini pasti aman" }],
    ["signal explanation", {
      ...validResult,
      signals: [{ ...validResult.signals[0]!, explanation: "Ini pasti penipuan" }],
    }],
    ["action title", {
      ...validResult,
      actions: [{ ...validResult.actions[0]!, title: "Dijamin aman" }, validResult.actions[1]!],
    }],
    ["action instruction", {
      ...validResult,
      actions: [{ ...validResult.actions[0]!, instruction: "Pesan ini bukan scam" }, validResult.actions[1]!],
    }],
    ["limitation", { ...validResult, limitations: ["Pesan ini definitely safe"] }],
  ])("rejects an absolute verdict in %s", (_field, result) => {
    expect(() => validateAnalysisSemantics(result, "klik [URL_1] sekarang")).toThrow(
      "ABSOLUTE_VERDICT",
    );
  });
});
