import { GoogleGenAI } from "@google/genai";

export interface StructuredModel {
  generate(prompt: string, schema: Record<string, unknown>): Promise<string>;
}

export class GeminiStructuredModel implements StructuredModel {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string, private readonly model = "gemini-3.6-flash") {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(prompt: string, schema: Record<string, unknown>) {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    });
    if (!response.text) throw new Error("EMPTY_MODEL_RESPONSE");
    return response.text;
  }
}
