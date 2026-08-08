import { z } from "zod";

export const evaluationCategorySchema = z.enum([
  "clearly_suspicious",
  "subtle_manipulation",
  "ambiguous",
  "legitimate_urgency",
  "normal",
]);

export const evaluationCaseSchema = z.object({
  id: z.string().regex(/^(dev|holdout)-\d{2}$/),
  category: evaluationCategorySchema,
  message: z.string().min(20).max(5000),
  expectedRisk: z.enum(["low", "medium", "high"]),
  rationale: z.string().min(20),
});

export const evaluationDatasetSchema = z.array(evaluationCaseSchema);

export type EvaluationCategory = z.infer<typeof evaluationCategorySchema>;
export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;

export function normalizeEvaluationMessage(message: string) {
  return message.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}

export function parseEvaluationJson(source: string, errorMessage: string): unknown {
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new Error(errorMessage);
  }
}
