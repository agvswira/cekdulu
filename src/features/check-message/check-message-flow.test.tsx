import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { validResult } from "@/domain/analysis/test-fixtures";
import { AnalysisResultView } from "./analysis-result-view";
import { CheckMessageFlow } from "./check-message-flow";

const sampleText =
  "Paket Anda akan dikembalikan hari ini. Klik [URL_1] sekarang dan konfirmasi data melalui [PHONE_1].";

describe("CheckMessageFlow", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders repeated valid items without duplicate-key warnings", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const repeatedResult = {
      ...validResult,
      signals: [validResult.signals[0]!, validResult.signals[0]!],
      actions: [validResult.actions[0]!, validResult.actions[0]!],
      limitations: [validResult.limitations[0]!, validResult.limitations[0]!],
    };

    render(<AnalysisResultView analysis={repeatedResult} />);

    expect(screen.getAllByText("klik [URL_1] sekarang")).toHaveLength(2);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("sends the redacted sample and renders its structured result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ status: "ok", analysis: validResult }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<CheckMessageFlow />);
    await user.click(screen.getByRole("button", { name: "Coba contoh pesan" }));

    expect(await screen.findByRole("heading", { name: "Risiko tinggi" })).toBeInTheDocument();
    expect(screen.getByText("klik [URL_1] sekarang")).toBeInTheDocument();
    expect(screen.getByText("Jangan klik")).toBeInTheDocument();
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buka panduan resmi IASC" })).toMatchObject({
      href: "https://iasc.ojk.go.id/",
      target: "_blank",
      rel: "noreferrer",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: sampleText }),
    });
  });

  it("shows general safety guidance without a risk label for a 503 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      status: "unavailable",
      message: "Analisis AI sedang tidak tersedia.",
      safetySteps: [
        "Jangan klik tautan atau mengirim data dari pesan tersebut.",
        "Cari kanal resmi pihak terkait secara terpisah.",
        "Jika sudah mentransfer, segera hubungi penyedia layanan keuangan dan IASC.",
      ],
    }, { status: 503 })));
    const user = userEvent.setup();

    render(<CheckMessageFlow />);
    await user.click(screen.getByRole("button", { name: "Coba contoh pesan" }));

    expect(await screen.findByText("Analisis AI sedang tidak tersedia.")).toBeInTheDocument();
    expect(screen.getByText("Cari kanal resmi pihak terkait secara terpisah.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
    expect(screen.queryByText(/Risiko (rendah|sedang|tinggi)/i)).not.toBeInTheDocument();
  });
});
