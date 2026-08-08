import { createWorker, OEM, type LoggerMessage, type Worker } from "tesseract.js";

type WorkerFactory = (
  languages: string[],
  oem: OEM,
  options: {
    corePath: string;
    langPath: string;
    logger: (message: LoggerMessage) => void;
    workerBlobURL: boolean;
    workerPath: string;
  },
) => Promise<Worker>;

export async function recognizeMessageImage(
  file: File,
  onProgress: (progress: number) => void = () => undefined,
  workerFactory: WorkerFactory = createWorker,
) {
  const worker = await workerFactory(["ind", "eng"], OEM.LSTM_ONLY, {
    corePath: "/tesseract/core",
    langPath: "/tesseract/lang",
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        onProgress(message.progress);
      }
    },
    workerBlobURL: false,
    workerPath: "/tesseract/worker.min.js",
  });

  try {
    const { data } = await worker.recognize(file);
    const text = data.text.trim();
    if (!text) throw new Error("OCR_EMPTY");
    return text;
  } finally {
    await worker.terminate();
  }
}
