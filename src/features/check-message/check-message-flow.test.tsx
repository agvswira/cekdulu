import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { validResult } from "@/domain/analysis/test-fixtures";
import { AnalysisResultView } from "./analysis-result-view";
import { CheckMessageFlow } from "./check-message-flow";
import { SAMPLE_MESSAGE } from "./sample-message";

const rawMessage = "Hubungi 0812-3456-7890 sekarang juga";
const redactedMessage = "Hubungi [PHONE_1] sekarang juga";
const unavailableResponse = {
  status: "unavailable",
  message: "Analisis AI sedang tidak tersedia.",
  safetySteps: [
    "Jangan klik tautan atau mengirim data dari pesan tersebut.",
    "Cari kanal resmi pihak terkait secara terpisah.",
    "Jika sudah mentransfer, segera hubungi penyedia layanan keuangan dan IASC.",
  ],
};

function successfulResponse() {
  return Response.json({ status: "ok", analysis: validResult });
}

describe("CheckMessageFlow", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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

  it("runs screenshot OCR, permits correction, sends only redacted text, and resets", async () => {
    const user = userEvent.setup();
    let finishOcr: (text: string) => void = () => undefined;
    const recognizeImage = vi.fn(
      async (_file: File, onProgress: (progress: number) => void) => {
        onProgress(0.35);
        return new Promise<string>((resolve) => {
          finishOcr = resolve;
        });
      },
    );
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);
    const screenshot = new File(["synthetic screenshot"], "pesan.png", {
      type: "image/png",
    });

    render(<CheckMessageFlow recognizeImage={recognizeImage} />);
    await user.upload(screen.getByLabelText("Unggah tangkapan layar"), screenshot);

    expect(await screen.findByRole("status")).toHaveTextContent("35%");
    expect(screen.queryByLabelText("Unggah tangkapan layar")).not.toBeInTheDocument();

    await act(async () => finishOcr("Hubungi 0812-3456-789O sekarang juga"));
    const editor = await screen.findByLabelText("Teks pesan untuk diperiksa");
    await user.clear(editor);
    await user.type(editor, rawMessage);

    expect(screen.getByLabelText("Pratinjau teks tersamarkan")).toHaveTextContent(
      redactedMessage,
    );
    await user.click(screen.getByRole("button", { name: "Konfirmasi dan periksa" }));

    expect(await screen.findByRole("heading", { name: "Risiko tinggi" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Teks pesan untuk diperiksa")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/analyze");
    expect(options).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
    expect(JSON.parse(options.body as string)).toEqual({ message: redactedMessage });
    expect(options.body).not.toContain(rawMessage);
    expect(options.body).not.toContain("synthetic screenshot");

    await user.click(screen.getByRole("button", { name: "Periksa pesan lain" }));
    expect(screen.getByLabelText("Unggah tangkapan layar")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Risiko tinggi" })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(rawMessage)).not.toBeInTheDocument();
  });

  it("supports the paste-text path through review and analysis", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);

    render(<CheckMessageFlow />);
    await user.click(screen.getByRole("radio", { name: "Tempel teks" }));
    await user.type(
      screen.getByLabelText("Teks pesan"),
      "Email dana@contoh.id untuk verifikasi sekarang",
    );
    await user.click(screen.getByRole("button", { name: "Tinjau pesan" }));

    expect(screen.getByLabelText("Pratinjau teks tersamarkan")).toHaveTextContent(
      "Email [EMAIL_1] untuk verifikasi sekarang",
    );
    await user.click(screen.getByRole("button", { name: "Konfirmasi dan periksa" }));

    expect(await screen.findByRole("heading", { name: "Risiko tinggi" })).toBeInTheDocument();
    const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(options.body as string)).toEqual({
      message: "Email [EMAIL_1] untuk verifikasi sekarang",
    });
  });

  it("returns failed OCR to intake with paste-text recovery", async () => {
    const user = userEvent.setup();
    const recognizeImage = vi.fn(async () => {
      throw new Error("OCR_EMPTY");
    });

    render(<CheckMessageFlow recognizeImage={recognizeImage} />);
    await user.upload(
      screen.getByLabelText("Unggah tangkapan layar"),
      new File(["image"], "pesan.png", { type: "image/png" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Teks belum terbaca. Coba potong gambar lebih dekat atau tempel teks pesan.",
    );
    await user.click(screen.getByRole("radio", { name: "Tempel teks" }));
    expect(screen.getByLabelText("Teks pesan")).toBeInTheDocument();
  });

  it("retries the built-in redacted sample without adding a risk label to fallback", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json(unavailableResponse, { status: 503 }))
      .mockResolvedValueOnce(successfulResponse());
    vi.stubGlobal("fetch", fetchMock);

    render(<CheckMessageFlow />);
    await user.click(screen.getByRole("button", { name: "Coba contoh pesan" }));

    expect(await screen.findByText(unavailableResponse.message)).toBeInTheDocument();
    expect(screen.queryByText(/Risiko (rendah|sedang|tinggi)/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByRole("heading", { name: "Risiko tinggi" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const call of fetchMock.mock.calls) {
      const options = call[1] as RequestInit;
      expect(JSON.parse(options.body as string)).toEqual({
        message: SAMPLE_MESSAGE.redactedText,
      });
    }
  });

  it("aborts analysis after 15 seconds and shows classification-free guidance", async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => {
      requestSignal = options.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      });
    }));

    render(<CheckMessageFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Coba contoh pesan" }));
    expect(screen.getByRole("status")).toHaveTextContent("Menganalisis pesan");

    await act(async () => {
      vi.advanceTimersByTime(15_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(requestSignal?.aborted).toBe(true);
    expect(screen.getByText("Analisis AI sedang tidak tersedia.")).toBeInTheDocument();
    expect(screen.queryByText(/Risiko (rendah|sedang|tinggi)/i)).not.toBeInTheDocument();
  });
});
