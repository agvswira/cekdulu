"use client";

import { useEffect, useRef } from "react";
import type { AnalysisResult } from "@/domain/analysis/schema";
import {
  MessageIntake,
  type MessageIntakeValue,
} from "@/features/message-input/message-intake";
import { MessageReview } from "@/features/message-input/message-review";
import { recognizeMessageImage } from "@/features/message-input/ocr";
import { AnalysisResultView } from "./analysis-result-view";
import { SAMPLE_MESSAGE } from "./sample-message";
import { UnavailableState } from "./unavailable-state";
import { useCheckMessageFlow } from "./use-check-message-flow";

const ANALYSIS_TIMEOUT_MS = 15_000;
const ocrErrorMessage =
  "Teks belum terbaca. Coba potong gambar lebih dekat atau tempel teks pesan.";
const unavailableFallback = {
  message: "Analisis AI sedang tidak tersedia.",
  safetySteps: [
    "Jangan klik tautan atau mengirim data dari pesan tersebut.",
    "Cari kanal resmi pihak terkait secara terpisah.",
    "Jika sudah mentransfer, segera hubungi penyedia layanan keuangan dan IASC.",
  ],
} as const;

type AnalyzeResponse =
  | { status: "ok"; analysis: AnalysisResult }
  | { status: "unavailable"; message: string; safetySteps: string[] }
  | { status: "invalid_request" };

type RecognizeImage = (
  file: File,
  onProgress: (progress: number) => void,
) => Promise<string>;

interface CheckMessageFlowProps {
  recognizeImage?: RecognizeImage;
}

export function CheckMessageFlow({
  recognizeImage = recognizeMessageImage,
}: CheckMessageFlowProps) {
  const flow = useCheckMessageFlow();
  const activeRequest = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      requestSequence.current += 1;
      activeRequest.current?.abort();
    };
  }, []);

  async function analyzeRedactedText(redactedText: string) {
    const requestId = ++requestSequence.current;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);
    const isCurrentRequest = () =>
      isMounted.current && requestSequence.current === requestId;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: redactedText }),
        cache: "no-store",
        signal: controller.signal,
      });
      const body = await response.json() as AnalyzeResponse;
      if (!isCurrentRequest()) return;

      if (response.ok && body.status === "ok") {
        flow.resolveAnalysis(body.analysis);
        return;
      }

      if (body.status === "unavailable") {
        flow.showUnavailable(
          redactedText,
          body.message,
          body.safetySteps,
        );
        return;
      }
    } catch {
      // Timeout, network, and malformed-response failures share a non-classifying fallback.
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) activeRequest.current = null;
    }

    if (isCurrentRequest()) {
      flow.showUnavailable(
        redactedText,
        unavailableFallback.message,
        unavailableFallback.safetySteps,
      );
    }
  }

  async function recognizeForFlow(
    file: File,
    onLocalProgress: (progress: number) => void,
  ) {
    flow.startOcr();
    try {
      const text = await recognizeImage(file, (progress) => {
        onLocalProgress(progress);
        flow.updateOcrProgress(progress);
      });
      flow.reviewText(text);
      return text;
    } catch (error) {
      flow.showOcrError(ocrErrorMessage);
      throw error;
    }
  }

  function handleIntakeReady(value: MessageIntakeValue) {
    flow.reviewText(value.text);
  }

  function handleConfirm(redactedText: string) {
    flow.confirmRedactedText(redactedText);
    void analyzeRedactedText(redactedText);
  }

  function handleSample() {
    flow.confirmRedactedText(SAMPLE_MESSAGE.redactedText);
    void analyzeRedactedText(SAMPLE_MESSAGE.redactedText);
  }

  function handleRetry() {
    if (flow.state.stage !== "unavailable") return;
    const redactedText = flow.state.redactedText;
    flow.retry();
    void analyzeRedactedText(redactedText);
  }

  function handleReset() {
    requestSequence.current += 1;
    activeRequest.current?.abort();
    activeRequest.current = null;
    flow.reset();
  }

  if (flow.state.stage === "extracting") {
    const progressPercent = Math.round(flow.state.progress * 100);
    return (
      <section className="checkPanel loadingState" role="status" aria-live="polite">
        <span className="loadingMark" aria-hidden="true" />
        <p className="sectionKicker">OCR lokal di perangkat</p>
        <h2>Membaca gambar…</h2>
        <progress
          aria-label="Progres OCR"
          aria-valuenow={progressPercent}
          value={progressPercent}
          max={100}
        />
        <p>{progressPercent}% — gambar tidak dikirim ke server.</p>
      </section>
    );
  }

  if (flow.state.stage === "review") {
    return (
      <div className="checkPanel">
        <MessageReview
          initialText={flow.state.rawText}
          onConfirm={handleConfirm}
        />
      </div>
    );
  }

  if (flow.state.stage === "analyzing") {
    return (
      <section className="checkPanel loadingState" role="status" aria-live="polite">
        <span className="loadingMark" aria-hidden="true" />
        <p className="sectionKicker">CekDulu sedang bekerja</p>
        <h2>Menganalisis pesan…</h2>
        <p>Hanya teks yang sudah disamarkan dan dikonfirmasi yang dikirim.</p>
      </section>
    );
  }

  if (flow.state.stage === "result") {
    return (
      <div className="checkPanel">
        <AnalysisResultView analysis={flow.state.analysis} />
        <button className="secondaryButton" type="button" onClick={handleReset}>
          Periksa pesan lain
        </button>
      </div>
    );
  }

  if (flow.state.stage === "unavailable") {
    return (
      <div className="checkPanel">
        <UnavailableState
          message={flow.state.message}
          safetySteps={flow.state.safetySteps}
          onRetry={handleRetry}
        />
        <button className="secondaryButton" type="button" onClick={handleReset}>
          Periksa pesan lain
        </button>
      </div>
    );
  }

  return (
    <div className="checkPanel">
      {flow.state.error ? <p role="alert">{flow.state.error}</p> : null}
      <MessageIntake
        onReady={handleIntakeReady}
        recognizeImage={recognizeForFlow}
      />
      <section className="samplePanel" aria-labelledby="sample-heading">
        <p className="sectionKicker">Demo tanpa data pribadi</p>
        <h2 id="sample-heading">Atau coba contoh CekDulu</h2>
        <p>
          Gunakan contoh sintetis yang sudah disamarkan untuk melihat cara hasil
          dijelaskan.
        </p>
        <blockquote className="sampleMessage">
          <span>{SAMPLE_MESSAGE.label}</span>
          <p>{SAMPLE_MESSAGE.redactedText}</p>
        </blockquote>
        <button className="primaryButton" type="button" onClick={handleSample}>
          Coba contoh pesan
        </button>
        <p className="samplePrivacy">Tidak memakai pesan, gambar, atau data pribadi Anda.</p>
      </section>
    </div>
  );
}
