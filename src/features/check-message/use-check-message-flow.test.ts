import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { validResult } from "@/domain/analysis/test-fixtures";
import { useCheckMessageFlow } from "./use-check-message-flow";

const rawText = "Hubungi 0812-3456-7890 sekarang juga";
const redactedText = "Hubungi [PHONE_1] sekarang juga";
const unavailable = {
  message: "Analisis AI sedang tidak tersedia.",
  safetySteps: ["Jangan klik tautan.", "Verifikasi lewat kanal resmi."],
};

describe("useCheckMessageFlow", () => {
  it("moves from image intake through OCR, review, analysis, result, and reset", () => {
    const { result } = renderHook(() => useCheckMessageFlow());

    expect(result.current.state).toEqual({ stage: "intake" });
    act(() => result.current.startOcr());
    expect(result.current.state).toEqual({ stage: "extracting", progress: 0 });

    act(() => result.current.updateOcrProgress(0.4));
    expect(result.current.state).toEqual({ stage: "extracting", progress: 0.4 });

    act(() => result.current.reviewText(rawText));
    expect(result.current.state).toEqual({ stage: "review", rawText });

    act(() => result.current.confirmRedactedText(redactedText));
    expect(result.current.state).toEqual({ stage: "analyzing", redactedText });

    act(() => result.current.resolveAnalysis(validResult));
    expect(result.current.state).toEqual({ stage: "result", analysis: validResult });

    act(() => result.current.reset());
    expect(result.current.state).toEqual({ stage: "intake" });
  });

  it("moves from paste review through unavailable and retries the same redacted text", () => {
    const { result } = renderHook(() => useCheckMessageFlow());

    act(() => result.current.reviewText(rawText));
    act(() => result.current.confirmRedactedText(redactedText));
    act(() => result.current.showUnavailable(
      redactedText,
      unavailable.message,
      unavailable.safetySteps,
    ));

    expect(result.current.state).toEqual({
      stage: "unavailable",
      redactedText,
      ...unavailable,
    });

    act(() => result.current.retry());
    expect(result.current.state).toEqual({ stage: "analyzing", redactedText });
  });

  it("returns OCR failures to intake with recovery copy and permits paste review", () => {
    const { result } = renderHook(() => useCheckMessageFlow());

    act(() => result.current.startOcr());
    act(() => result.current.showOcrError("Teks belum terbaca. Tempel teks pesan."));
    expect(result.current.state).toEqual({
      stage: "intake",
      error: "Teks belum terbaca. Tempel teks pesan.",
    });

    act(() => result.current.reviewText(rawText));
    expect(result.current.state).toEqual({ stage: "review", rawText });
  });

  it("reset removes raw, redacted, result, and unavailable data", () => {
    const { result } = renderHook(() => useCheckMessageFlow());

    act(() => result.current.reviewText(rawText));
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ stage: "intake" });

    act(() => result.current.reviewText(rawText));
    act(() => result.current.confirmRedactedText(redactedText));
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ stage: "intake" });

    act(() => result.current.reviewText(rawText));
    act(() => result.current.confirmRedactedText(redactedText));
    act(() => result.current.resolveAnalysis(validResult));
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ stage: "intake" });

    act(() => result.current.reviewText(rawText));
    act(() => result.current.confirmRedactedText(redactedText));
    act(() => result.current.showUnavailable(
      redactedText,
      unavailable.message,
      unavailable.safetySteps,
    ));
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ stage: "intake" });
  });
});
