import { describe, expect, it } from "vitest";
import { analysisRequestSchema, analysisResultSchema } from "./schema";
import { validResult } from "./test-fixtures";

describe("analysisRequestSchema", () => {
  it("trims and accepts a message at the minimum length", () => {
    expect(analysisRequestSchema.parse({ message: `  ${"a".repeat(20)}  ` })).toEqual({
      message: "a".repeat(20),
    });
  });

  it.each(["a".repeat(19), "a".repeat(5001)])(
    "rejects a message outside the length boundary",
    (message) => expect(() => analysisRequestSchema.parse({ message })).toThrow(),
  );
});

describe("analysisResultSchema", () => {
  it("accepts the versioned result contract", () => {
    expect(analysisResultSchema.parse(validResult)).toEqual(validResult);
  });

  it("rejects fake precision and unknown levels", () => {
    expect(() => analysisResultSchema.parse({ ...validResult, riskLevel: "63%" })).toThrow();
  });
});
