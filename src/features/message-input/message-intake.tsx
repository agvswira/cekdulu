"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { validateImageFile, type ImageValidationErrorCode } from "./file-validation";
import { recognizeMessageImage } from "./ocr";

export type MessageIntakeValue =
  | { source: "image"; text: string; file: File }
  | { source: "text"; text: string };

type RecognizeImage = (
  file: File,
  onProgress: (progress: number) => void,
) => Promise<string>;

type MessageIntakeProps = {
  onReady: (value: MessageIntakeValue) => void;
  recognizeImage?: RecognizeImage;
};

const validationMessages: Record<ImageValidationErrorCode, string> = {
  UNSUPPORTED_IMAGE_TYPE: "Gunakan gambar PNG atau JPEG.",
  IMAGE_TOO_LARGE: "Ukuran gambar maksimal 5 MB.",
};

export function MessageIntake({
  onReady,
  recognizeImage = recognizeMessageImage,
}: MessageIntakeProps) {
  const imageInputId = useId();
  const textInputId = useId();
  const textHelpId = useId();
  const isMounted = useRef(true);
  const currentOcrOperation = useRef(0);
  const [source, setSource] = useState<"image" | "text">("image");
  const [pastedText, setPastedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      currentOcrOperation.current += 1;
    };
  }, []);

  function selectSource(nextSource: "image" | "text") {
    setSource(nextSource);
    setError(null);
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validationMessages[validation.code]);
      return;
    }

    setProgress(0);
    setIsExtracting(true);
    const operation = ++currentOcrOperation.current;
    const isCurrentOperation = () =>
      isMounted.current && currentOcrOperation.current === operation;

    try {
      const text = await recognizeImage(file, (nextProgress) => {
        if (isCurrentOperation()) setProgress(nextProgress);
      });
      if (isCurrentOperation()) onReady({ source: "image", text, file });
    } catch {
      if (isCurrentOperation()) {
        setError(
          "Teks belum terbaca. Coba potong gambar lebih dekat atau tempel teks pesan.",
        );
      }
    } finally {
      if (isCurrentOperation()) setIsExtracting(false);
    }
  }

  function handleTextSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = pastedText.trim();
    if (text.length < 20) return;
    onReady({ source: "text", text });
  }

  const usablePastedText = pastedText.trim().length >= 20;
  const progressPercent = Math.round(progress * 100);

  return (
    <section aria-labelledby="message-intake-title">
      <h2 id="message-intake-title">Periksa pesan</h2>
      <p>
        Gambar dibaca di perangkat ini. Cek dan samarkan teks sebelum mengirimnya
        untuk analisis.
      </p>

      <fieldset>
        <legend>Pilih cara memasukkan pesan</legend>
        <label>
          <input
            type="radio"
            name="message-source"
            value="image"
            checked={source === "image"}
            disabled={isExtracting}
            onChange={() => selectSource("image")}
          />
          Unggah gambar
        </label>
        <label>
          <input
            type="radio"
            name="message-source"
            value="text"
            checked={source === "text"}
            disabled={isExtracting}
            onChange={() => selectSource("text")}
          />
          Tempel teks
        </label>
      </fieldset>

      {source === "image" ? (
        <div>
          <label htmlFor={imageInputId}>Unggah tangkapan layar</label>
          <input
            id={imageInputId}
            type="file"
            accept="image/png,image/jpeg"
            disabled={isExtracting}
            onChange={handleImageChange}
          />
          <p>Format PNG atau JPEG, maksimal 5 MB.</p>

          {isExtracting ? (
            <div role="status" aria-live="polite">
              <progress
                aria-label="Progres OCR"
                aria-valuenow={progressPercent}
                value={progressPercent}
                max={100}
              />
              <span>Membaca gambar di perangkat… {progressPercent}%</span>
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleTextSubmit}>
          <label htmlFor={textInputId}>Teks pesan</label>
          <textarea
            id={textInputId}
            value={pastedText}
            aria-describedby={textHelpId}
            onChange={(event) => setPastedText(event.target.value)}
          />
          <p id={textHelpId}>Masukkan sedikitnya 20 karakter agar pesan dapat ditinjau.</p>
          <button type="submit" disabled={!usablePastedText}>
            Tinjau pesan
          </button>
        </form>
      )}

      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
