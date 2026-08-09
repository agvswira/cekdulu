import { InvalidModelOutputError, ProviderRequestError } from "./errors";
import type { StructuredModel } from "./model";

interface OpenAICompatibleModelOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  enableThinking?: boolean;
  fetchImpl?: typeof fetch;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

export class OpenAICompatibleStructuredModel implements StructuredModel {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: OpenAICompatibleModelOptions) {
    const baseUrl = options.baseUrl.endsWith("/")
      ? options.baseUrl
      : `${options.baseUrl}/`;
    this.endpoint = new URL("chat/completions", baseUrl).toString();
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async generate(
    prompt: string,
    schema: Record<string, unknown>,
    signal: AbortSignal,
  ) {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: "system",
            content: `Keluarkan hanya satu objek JSON yang mengikuti JSON Schema CekDulu berikut. Jangan sertakan markdown atau teks lain.\n${JSON.stringify(schema)}`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
        ...(this.options.enableThinking === undefined
          ? {}
          : { enable_thinking: this.options.enableThinking }),
      }),
      signal,
    });

    if (!response.ok) throw new ProviderRequestError(response.status);

    let payload: ChatCompletionResponse;
    try {
      payload = await response.json() as ChatCompletionResponse;
    } catch {
      throw new InvalidModelOutputError();
    }

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new InvalidModelOutputError();
    }
    return content;
  }
}
