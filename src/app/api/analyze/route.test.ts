import { afterEach, describe, expect, it, vi } from "vitest";
import { validResult } from "@/domain/analysis/test-fixtures";
import { AnalysisUnavailableError } from "@/server/analysis/errors";
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
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    vi.mocked(analyzeMessage).mockResolvedValue(validResult);

    const response = await POST(request({ message: redactedMessage }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ok", analysis: validResult });
    expect(analyzeMessage).toHaveBeenCalledWith(redactedMessage, expect.anything());
  });

  it("returns general safety guidance without a classification when analysis is unavailable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    vi.mocked(analyzeMessage).mockRejectedValue(new AnalysisUnavailableError());

    const response = await POST(request({ message: redactedMessage }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual(fallback);
    expect(body).not.toHaveProperty("riskLevel");
  });
});
