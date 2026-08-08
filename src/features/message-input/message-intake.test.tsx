import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessageIntake } from "./message-intake";

afterEach(() => {
  cleanup();
});

describe("MessageIntake", () => {
  it("validates an upload, reports local OCR progress, and returns the image intake", async () => {
    const user = userEvent.setup();
    let finishOcr: (text: string) => void = () => undefined;
    const recognizeImage = vi.fn(
      async (_file: File, onProgress: (progress: number) => void) => {
        onProgress(0.45);
        return new Promise<string>((resolve) => {
          finishOcr = resolve;
        });
      },
    );
    const onReady = vi.fn();
    const file = new File(["image"], "pesan.png", { type: "image/png" });

    render(<MessageIntake onReady={onReady} recognizeImage={recognizeImage} />);
    await user.upload(screen.getByLabelText("Unggah tangkapan layar"), file);

    expect(await screen.findByRole("status")).toHaveTextContent("45%");
    expect(screen.getByRole("progressbar", { name: "Progres OCR" })).toHaveAttribute(
      "aria-valuenow",
      "45",
    );

    await act(async () => finishOcr("Pesan hasil OCR yang cukup panjang"));
    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith({
        source: "image",
        text: "Pesan hasil OCR yang cukup panjang",
        file,
      });
    });
  });

  it("allows choosing paste text and reports trimmed usable text", async () => {
    const user = userEvent.setup();
    const onReady = vi.fn();

    render(<MessageIntake onReady={onReady} />);
    await user.click(screen.getByRole("radio", { name: "Tempel teks" }));

    const textarea = screen.getByLabelText("Teks pesan");
    const submit = screen.getByRole("button", { name: "Tinjau pesan" });
    await user.type(textarea, "terlalu singkat");
    expect(submit).toBeDisabled();

    await user.clear(textarea);
    await user.type(textarea, "  Pesan mendesak dengan panjang cukup  ");
    await user.click(submit);

    expect(onReady).toHaveBeenCalledWith({
      source: "text",
      text: "Pesan mendesak dengan panjang cukup",
    });
  });

  it.each([
    [
      new File(["gif"], "pesan.gif", { type: "image/gif" }),
      "Gunakan gambar PNG atau JPEG.",
    ],
    [
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "besar.jpg", {
        type: "image/jpeg",
      }),
      "Ukuran gambar maksimal 5 MB.",
    ],
  ])("announces validation guidance for %s", async (file, expectedMessage) => {
    const user = userEvent.setup({ applyAccept: false });
    const recognizeImage = vi.fn();

    render(<MessageIntake onReady={vi.fn()} recognizeImage={recognizeImage} />);
    await user.upload(screen.getByLabelText("Unggah tangkapan layar"), file);

    expect(await screen.findByRole("alert")).toHaveTextContent(expectedMessage);
    expect(recognizeImage).not.toHaveBeenCalled();
  });

  it("offers crop and paste recovery when local OCR fails", async () => {
    const user = userEvent.setup();
    const recognizeImage = vi.fn(async () => {
      throw new Error("OCR_EMPTY");
    });

    render(<MessageIntake onReady={vi.fn()} recognizeImage={recognizeImage} />);
    await user.upload(
      screen.getByLabelText("Unggah tangkapan layar"),
      new File(["image"], "pesan.png", { type: "image/png" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Teks belum terbaca. Coba potong gambar lebih dekat atau tempel teks pesan.",
    );
  });

  it("ignores a stale OCR completion after the intake unmounts", async () => {
    const user = userEvent.setup();
    let finishOcr: (text: string) => void = () => undefined;
    const recognizeImage = vi.fn(
      async () => new Promise<string>((resolve) => {
        finishOcr = resolve;
      }),
    );
    const onReady = vi.fn();
    const { unmount } = render(
      <MessageIntake onReady={onReady} recognizeImage={recognizeImage} />,
    );

    await user.upload(
      screen.getByLabelText("Unggah tangkapan layar"),
      new File(["image"], "pesan.png", { type: "image/png" }),
    );
    expect(recognizeImage).toHaveBeenCalledOnce();

    unmount();
    await act(async () => finishOcr("Hasil lama yang tidak boleh dipakai"));

    expect(onReady).not.toHaveBeenCalled();
  });
});
