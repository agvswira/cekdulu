import { z } from "zod";

export const signalCategorySchema = z.enum([
  "urgency",
  "impersonation",
  "credential_request",
  "payment_request",
  "unverified_link",
  "other",
]);

export const analysisRequestSchema = z.object({
  message: z.string().trim().min(20).max(5000),
});

export const analysisResultSchema = z.object({
  version: z.literal("1"),
  riskLevel: z.enum(["low", "medium", "high"]),
  summary: z.string().trim().min(1).max(320),
  signals: z.array(z.object({
    quote: z.string().trim().min(1).max(180),
    category: signalCategorySchema,
    explanation: z.string().trim().min(1).max(280),
  })).max(5),
  actions: z.array(z.object({
    priority: z.number().int().min(1).max(4),
    title: z.string().trim().min(1).max(80),
    instruction: z.string().trim().min(1).max(240),
  })).min(2).max(4),
  limitations: z.array(z.string().trim().min(1).max(240)).min(1).max(3),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type SignalCategory = z.infer<typeof signalCategorySchema>;

export const analysisJsonSchema = {
  type: "object",
  properties: {
    version: { type: "string", enum: ["1"] },
    riskLevel: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string" },
    signals: { type: "array", items: { type: "object", properties: {
      quote: { type: "string" },
      category: { type: "string", enum: signalCategorySchema.options },
      explanation: { type: "string" },
    }, required: ["quote", "category", "explanation"] } },
    actions: { type: "array", items: { type: "object", properties: {
      priority: { type: "integer" }, title: { type: "string" }, instruction: { type: "string" },
    }, required: ["priority", "title", "instruction"] } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: ["version", "riskLevel", "summary", "signals", "actions", "limitations"],
} as const;
