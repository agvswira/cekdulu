import { analysisJsonSchema, analysisResultSchema, type AnalysisResult } from "@/domain/analysis/schema";
import { validateAnalysisSemantics } from "@/domain/analysis/safety";
import { AnalysisUnavailableError, InvalidModelOutputError } from "./errors";
import type { StructuredModel } from "./model";
import { buildAnalysisPrompt } from "./prompt";

export type AnalysisErrorCategory =
  | "auth"
  | "invalid_output"
  | "network"
  | "provider"
  | "quota"
  | "timeout";

export interface AnalysisDiagnostic {
  requestId: string;
  attempt: number;
  errorCategory: AnalysisErrorCategory;
  elapsedMs: number;
}

export interface AnalyzeMessageOptions {
  signal: AbortSignal;
  requestId: string;
  startedAtMs: number;
  now?: () => number;
  log?: (diagnostic: AnalysisDiagnostic) => void;
}

function errorStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  return typeof error.status === "number" ? error.status : undefined;
}

function classifyModelError(error: unknown, signal: AbortSignal): AnalysisErrorCategory {
  if (
    signal.aborted
    || (error instanceof DOMException && error.name === "AbortError")
  ) {
    return "timeout";
  }
  if (error instanceof InvalidModelOutputError) return "invalid_output";

  const status = errorStatus(error);
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "quota";
  if (error instanceof TypeError) return "network";
  return "provider";
}

function emitDiagnostic(
  options: AnalyzeMessageOptions,
  attempt: number,
  errorCategory: AnalysisErrorCategory,
) {
  const now = options.now ?? Date.now;
  const diagnostic: AnalysisDiagnostic = {
    requestId: options.requestId,
    attempt,
    errorCategory,
    elapsedMs: Math.max(0, Math.round(now() - options.startedAtMs)),
  };
  (options.log ?? console.warn)(diagnostic);
}

export async function analyzeMessage(
  redactedMessage: string,
  model: StructuredModel,
  options: AnalyzeMessageOptions,
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(redactedMessage);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const attemptNumber = attempt + 1;
    if (options.signal.aborted) {
      emitDiagnostic(options, attemptNumber, "timeout");
      throw new AnalysisUnavailableError();
    }

    let raw: string;
    try {
      raw = await model.generate(prompt, analysisJsonSchema, options.signal);
    } catch (error) {
      const category = classifyModelError(error, options.signal);
      emitDiagnostic(options, attemptNumber, category);
      if (category !== "invalid_output") throw new AnalysisUnavailableError();
      if (attemptNumber === 2) throw new AnalysisUnavailableError();
      continue;
    }

    if (options.signal.aborted) {
      emitDiagnostic(options, attemptNumber, "timeout");
      throw new AnalysisUnavailableError();
    }

    try {
      const result = analysisResultSchema.parse(JSON.parse(raw));
      validateAnalysisSemantics(result, redactedMessage);
      return result;
    } catch {
      emitDiagnostic(options, attemptNumber, "invalid_output");
      if (attemptNumber === 2) throw new AnalysisUnavailableError();
    }
  }

  throw new AnalysisUnavailableError();
}
