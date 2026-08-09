import { analysisJsonSchema } from "@/domain/analysis/schema";
import { describe, expect, it, vi } from "vitest";
import { InvalidModelOutputError, ProviderRequestError } from "./errors";
import { OpenAICompatibleStructuredModel } from "./external-model";

const schema = analysisJsonSchema;

describe("OpenAICompatibleStructuredModel", () => {
  it("uses generic JSON mode with the CekDulu schema in the system message", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: 1,
      model: "configured-model",
      choices: [{
        index: 0,
        message: { role: "assistant", content: "{\"status\":\"ok\"}" },
        finish_reason: "stop",
      }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    const signal = new AbortController().signal;
    const model = new OpenAICompatibleStructuredModel({
      baseUrl: "https://provider.example/custom/v1",
      apiKey: "external-test-key",
      model: "configured-model",
      fetchImpl,
    });

    await expect(model.generate("private prompt", schema, signal)).resolves.toBe(
      "{\"status\":\"ok\"}",
    );

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://provider.example/custom/v1/chat/completions");
    expect(init).toMatchObject({
      method: "POST",
      signal,
      headers: {
        Authorization: "Bearer external-test-key",
        "Content-Type": "application/json",
      },
    });
    expect(JSON.parse(String(init.body))).toEqual({
      model: "configured-model",
      messages: [
        {
          role: "system",
          content: `Keluarkan hanya satu objek JSON yang mengikuti JSON Schema CekDulu berikut. Jangan sertakan markdown atau teks lain.\n${JSON.stringify(schema)}`,
        },
        { role: "user", content: "private prompt" },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
  });

  it("turns provider failures into a status-only safe error", async () => {
    const sensitiveBody = "raw response with private message and secret";
    const fetchImpl = vi.fn().mockResolvedValue(new Response(sensitiveBody, { status: 401 }));
    const model = new OpenAICompatibleStructuredModel({
      baseUrl: "https://provider.example/v1",
      apiKey: "external-test-key",
      model: "configured-model",
      fetchImpl,
    });

    const error = await model.generate(
      "private prompt",
      schema,
      new AbortController().signal,
    ).catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(ProviderRequestError);
    expect(error).toMatchObject({ status: 401, message: "PROVIDER_REQUEST_FAILED" });
    expect(JSON.stringify(error)).not.toContain(sensitiveBody);
    expect(JSON.stringify(error)).not.toContain("external-test-key");
    expect(JSON.stringify(error)).not.toContain("private prompt");
  });

  it("treats a malformed success payload as invalid structured output", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(Response.json({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: 1,
      model: "configured-model",
      choices: [],
    }));
    const model = new OpenAICompatibleStructuredModel({
      baseUrl: "https://provider.example/v1",
      apiKey: "external-test-key",
      model: "configured-model",
      fetchImpl,
    });

    await expect(model.generate(
      "private prompt",
      schema,
      new AbortController().signal,
    )).rejects.toEqual(new InvalidModelOutputError());
  });
});
