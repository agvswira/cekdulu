"use client";

import { useReducer } from "react";
import type { AnalysisResult } from "@/domain/analysis/schema";

export type FlowState =
  | { stage: "intake"; error?: string }
  | { stage: "extracting"; progress: number }
  | { stage: "review"; rawText: string }
  | { stage: "analyzing"; redactedText: string }
  | { stage: "result"; analysis: AnalysisResult }
  | {
    stage: "unavailable";
    redactedText: string;
    message: string;
    safetySteps: string[];
  };

type FlowEvent =
  | { type: "START_OCR" }
  | { type: "OCR_PROGRESS"; progress: number }
  | { type: "OCR_FAILED"; error: string }
  | { type: "REVIEW_TEXT"; rawText: string }
  | { type: "CONFIRM_REDACTED"; redactedText: string }
  | { type: "RESOLVE"; analysis: AnalysisResult }
  | {
    type: "UNAVAILABLE";
    redactedText: string;
    message: string;
    safetySteps: string[];
  }
  | { type: "RETRY" }
  | { type: "RESET" };

function reducer(state: FlowState, event: FlowEvent): FlowState {
  switch (event.type) {
    case "START_OCR":
      return { stage: "extracting", progress: 0 };
    case "OCR_PROGRESS":
      return state.stage === "extracting"
        ? { ...state, progress: event.progress }
        : state;
    case "OCR_FAILED":
      return { stage: "intake", error: event.error };
    case "REVIEW_TEXT":
      return { stage: "review", rawText: event.rawText };
    case "CONFIRM_REDACTED":
      return { stage: "analyzing", redactedText: event.redactedText };
    case "RESOLVE":
      return { stage: "result", analysis: event.analysis };
    case "UNAVAILABLE":
      return {
        stage: "unavailable",
        redactedText: event.redactedText,
        message: event.message,
        safetySteps: event.safetySteps,
      };
    case "RETRY":
      return state.stage === "unavailable"
        ? { stage: "analyzing", redactedText: state.redactedText }
        : state;
    case "RESET":
      return { stage: "intake" };
  }
}

export function useCheckMessageFlow() {
  const [state, dispatch] = useReducer(reducer, { stage: "intake" });

  return {
    state,
    startOcr: () => dispatch({ type: "START_OCR" }),
    updateOcrProgress: (progress: number) =>
      dispatch({ type: "OCR_PROGRESS", progress }),
    showOcrError: (error: string) => dispatch({ type: "OCR_FAILED", error }),
    reviewText: (rawText: string) => dispatch({ type: "REVIEW_TEXT", rawText }),
    confirmRedactedText: (redactedText: string) =>
      dispatch({ type: "CONFIRM_REDACTED", redactedText }),
    resolveAnalysis: (analysis: AnalysisResult) => dispatch({ type: "RESOLVE", analysis }),
    showUnavailable: (
      redactedText: string,
      message: string,
      safetySteps: readonly string[],
    ) => dispatch({
      type: "UNAVAILABLE",
      redactedText,
      message,
      safetySteps: [...safetySteps],
    }),
    retry: () => dispatch({ type: "RETRY" }),
    reset: () => dispatch({ type: "RESET" }),
  };
}
