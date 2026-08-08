import { analysisJsonSchema, analysisResultSchema, type AnalysisResult } from "@/domain/analysis/schema";
import { validateAnalysisSemantics } from "@/domain/analysis/safety";
import { AnalysisUnavailableError } from "./errors";
import type { StructuredModel } from "./model";
import { buildAnalysisPrompt } from "./prompt";

export async function analyzeMessage(
  redactedMessage: string,
  model: StructuredModel,
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(redactedMessage);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await model.generate(prompt, analysisJsonSchema);
      const result = analysisResultSchema.parse(JSON.parse(raw));
      validateAnalysisSemantics(result, redactedMessage);
      return result;
    } catch {
      // The fixed second attempt is the only retry; no partial result escapes.
    }
  }

  throw new AnalysisUnavailableError();
}
