import { afterEach, describe, expect, it, vi } from "vitest";
import { validResult } from "@/domain/analysis/test-fixtures";
import { AnalysisUnavailableError } from "@/server/analysis/errors";
import { OpenAICompatibleStructuredModel } from "@/server/analysis/external-model";
import { GeminiStructuredModel } from "@/server/analysis/model";
import { analyzeMessage } from "@/server/analysis/service";
import { POST } from "./route";

vi.mock("@/server/analysis/service", () => ({
  analyzeMessage: vi.fn(),
}));

const redactedMessage = "klik [URL_1] sekarang";
const fallback = {
  status: "unavailable",
  message: "Analisis AI sedang tidak tersedia.",
  safetySteps: [
    "Jangan klik tautan atau mengirim data dari pesan tersebut.",
    "Cari kanal resmi pihak terkait secara terpisah.",
    "Jika sudah mentransfer, segera hubungi penyedia layanan keuangan dan IASC.",
  ],
};

function request(body: unknown) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns 400 for a short request", async () => {
    const response = await POST(request({ message: "terlalu pendek" }));

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "invalid_request" });
    expect(analyzeMessage).not.toHaveBeenCalled();
  });

  it("returns a validated analysis for a valid request", async () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    vi.mocked(analyzeMessage).mockResolvedValue(validResult);

    const response = await POST(request({ message: redactedMessage }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ok", analysis: validResult });
    expect(analyzeMessage).toHaveBeenCalledWith(
      redactedMessage,
      expect.any(GeminiStructuredModel),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        requestId: expect.any(String),
        startedAtMs: expect.any(Number),
      }),
    );
  });

  it("returns general safety guidance without a classification when analysis is unavailable", async () => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    vi.mocked(analyzeMessage).mockRejectedValue(new AnalysisUnavailableError());

    const response = await POST(request({ message: redactedMessage }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual(fallback);
    expect(body).not.toHaveProperty("riskLevel");
  });

  it("returns unavailable at the 13-second server deadline before the client timeout", async () => {
    vi.useFakeTimers();
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    vi.mocked(analyzeMessage).mockImplementation((_, __, options) => {
      if (!options) {
        return new Promise((_, reject) => {
          window.setTimeout(() => reject(new AnalysisUnavailableError()), 15_000);
        });
      }
      return new Promise((_, reject) => {
        options.signal.addEventListener("abort", () => {
          reject(new AnalysisUnavailableError());
        }, { once: true });
      });
    });

    let settled = false;
    const responsePromise = POST(request({ message: redactedMessage }))
      .then((response) => {
        settled = true;
        return response;
      });

    await vi.advanceTimersByTimeAsync(12_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);

    const response = await responsePromise;
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual(fallback);
  });

  it("uses the external adapter selected by AI_PROVIDER", async () => {
    vi.stubEnv("AI_PROVIDER", "external");
    vi.stubEnv("AI_BASE_URL", "https://provider.example/v1");
    vi.stubEnv("AI_API_KEY", "external-test-key");
    vi.stubEnv("AI_MODEL", "external-test-model");
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.mocked(analyzeMessage).mockResolvedValue(validResult);

    const response = await POST(request({ message: redactedMessage }));

    expect(response.status).toBe(200);
    expect(analyzeMessage).toHaveBeenCalledWith(
      redactedMessage,
      expect.any(OpenAICompatibleStructuredModel),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns unavailable for incomplete provider configuration without cross-provider fallback", async () => {
    vi.stubEnv("AI_PROVIDER", "external");
    vi.stubEnv("AI_BASE_URL", "https://provider.example/v1");
    vi.stubEnv("AI_MODEL", "external-test-model");
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");

    const response = await POST(request({ message: redactedMessage }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual(fallback);
    expect(analyzeMessage).not.toHaveBeenCalled();
  });
});
