import type { AnalysisResult } from "./schema";

const ABSOLUTE_VERDICT_PATTERN =
  /\b(pasti aman|dijamin aman|pasti penipuan|dijamin penipuan|definitely safe|definitely fraudulent|bukan scam)\b/i;

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function containsAbsoluteVerdict(text: string) {
  return ABSOLUTE_VERDICT_PATTERN.test(text);
}

export function validateAnalysisSemantics(result: AnalysisResult, redactedInput: string) {
  const generatedText = [
    result.summary,
    ...result.signals.map((signal) => signal.explanation),
    ...result.actions.flatMap((action) => [action.title, action.instruction]),
    ...result.limitations,
  ];

  if (generatedText.some(containsAbsoluteVerdict)) {
    throw new Error("ABSOLUTE_VERDICT");
  }

  const normalizedInput = normalizeText(redactedInput);

  for (const signal of result.signals) {
    if (!normalizedInput.includes(normalizeText(signal.quote))) {
      throw new Error("EVIDENCE_NOT_IN_INPUT");
    }
  }
}
