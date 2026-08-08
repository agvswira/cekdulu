"use client";

import { type FormEvent, useId, useMemo, useState } from "react";
import {
  redactSensitiveText,
  type RedactionKind,
} from "./redaction";

type MessageReviewProps = {
  initialText: string;
  onConfirm: (redactedText: string) => void;
};

const redactionLabels: Record<RedactionKind, string> = {
  URL: "Tautan",
  EMAIL: "Alamat email",
  PHONE: "Nomor telepon",
  ACCOUNT: "Nomor rekening",
};

export function MessageReview({ initialText, onConfirm }: MessageReviewProps) {
  const editorId = useId();
  const editorHelpId = useId();
  const [text, setText] = useState(initialText);
  const normalizedText = text.trim();
  const redaction = useMemo(
    () => redactSensitiveText(normalizedText),
    [normalizedText],
  );
  const counts = redaction.spans.reduce<Partial<Record<RedactionKind, number>>>(
    (result, span) => ({
      ...result,
      [span.kind]: (result[span.kind] ?? 0) + 1,
    }),
    {},
  );
  const countEntries = (Object.entries(counts) as Array<[RedactionKind, number]>);
  const canConfirm = normalizedText.length >= 20;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canConfirm) return;
    onConfirm(redaction.redactedText);
  }

  return (
    <section aria-labelledby="message-review-title">
      <h2 id="message-review-title">Tinjau dan samarkan</h2>
      <p>
        Perbaiki hasil baca jika perlu. Hanya teks tersamarkan yang diteruskan
        setelah konfirmasi.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor={editorId}>Teks pesan untuk diperiksa</label>
        <textarea
          id={editorId}
          value={text}
          aria-describedby={editorHelpId}
          onChange={(event) => setText(event.target.value)}
        />
        <p id={editorHelpId}>
          Jika hasil baca kurang jelas, koreksi teks atau kembali untuk memotong gambar
          lebih dekat.
        </p>

        <h3>Yang akan disamarkan</h3>
        {countEntries.length > 0 ? (
          <ul aria-label="Ringkasan redaksi">
            {countEntries.map(([kind, count]) => (
              <li key={kind}>
                {redactionLabels[kind]}: {count}
              </li>
            ))}
          </ul>
        ) : (
          <p>Tidak ada data sensitif yang dikenali otomatis.</p>
        )}

        <h3>Pratinjau tersamarkan</h3>
        <pre aria-label="Pratinjau teks tersamarkan">{redaction.redactedText}</pre>

        {!canConfirm ? <p>Pesan perlu berisi sedikitnya 20 karakter.</p> : null}
        <button type="submit" disabled={!canConfirm}>
          Konfirmasi dan periksa
        </button>
      </form>
    </section>
  );
}
