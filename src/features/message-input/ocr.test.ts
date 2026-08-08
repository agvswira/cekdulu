import { describe, expect, it, vi } from "vitest";
import { OEM, type LoggerMessage, type Worker } from "tesseract.js";
import { recognizeMessageImage } from "./ocr";

const image = new File(["image"], "pesan.png", { type: "image/png" });

function workerWith(
  recognize: Worker["recognize"],
  terminate = vi.fn(async () => undefined),
) {
  return {
    recognize,
    terminate,
  } as unknown as Worker;
}

describe("recognizeMessageImage", () => {
  it("returns trimmed local OCR text, reports recognition progress, and terminates", async () => {
    const recognize = vi.fn(async () => ({ data: { text: "  Pesan hasil OCR  " } }));
    const terminate = vi.fn(async () => undefined);
    const worker = workerWith(recognize as unknown as Worker["recognize"], terminate);
    let logger: ((message: LoggerMessage) => void) | undefined;
    const workerFactory = vi.fn(
      async (...args: [string[], OEM, {
        corePath: string;
        langPath: string;
        logger: (message: LoggerMessage) => void;
        workerBlobURL: boolean;
        workerPath: string;
      }]) => {
        logger = args[2].logger;
        return worker;
      },
    );
    const onProgress = vi.fn();

    const resultPromise = recognizeMessageImage(image, onProgress, workerFactory);
    await vi.waitFor(() => expect(workerFactory).toHaveBeenCalledOnce());
    logger?.({ status: "recognizing text", progress: 0.45 } as LoggerMessage);
    logger?.({ status: "loading language", progress: 0.9 } as LoggerMessage);

    await expect(resultPromise).resolves.toBe("Pesan hasil OCR");
    expect(workerFactory).toHaveBeenCalledWith(["ind", "eng"], OEM.LSTM_ONLY, {
      corePath: "/tesseract/core",
      langPath: "/tesseract/lang",
      logger: expect.any(Function),
      workerBlobURL: false,
      workerPath: "/tesseract/worker.min.js",
    });
    expect(recognize).toHaveBeenCalledWith(image);
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(0.45);
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("terminates the worker when recognition fails", async () => {
    const recognize = vi.fn(async () => {
      throw new Error("recognition failed");
    });
    const terminate = vi.fn(async () => undefined);
    const workerFactory = vi.fn(async () =>
      workerWith(recognize as unknown as Worker["recognize"], terminate),
    );

    await expect(recognizeMessageImage(image, undefined, workerFactory)).rejects.toThrow(
      "recognition failed",
    );
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("rejects empty OCR output and still terminates the worker", async () => {
    const recognize = vi.fn(async () => ({ data: { text: "   " } }));
    const terminate = vi.fn(async () => undefined);
    const workerFactory = vi.fn(async () =>
      workerWith(recognize as unknown as Worker["recognize"], terminate),
    );

    await expect(recognizeMessageImage(image, undefined, workerFactory)).rejects.toThrow(
      "OCR_EMPTY",
    );
    expect(terminate).toHaveBeenCalledOnce();
  });
});
