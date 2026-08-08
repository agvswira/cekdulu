"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/domain/analysis/schema";
import { AnalysisResultView } from "./analysis-result-view";
import { SAMPLE_MESSAGE } from "./sample-message";
import { UnavailableState } from "./unavailable-state";

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

type FlowState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "result"; analysis: AnalysisResult }
  | { status: "unavailable"; message: string; safetySteps: readonly string[] };

export function CheckMessageFlow() {
  const [flow, setFlow] = useState<FlowState>({ status: "idle" });

  async function analyzeSample() {
    setFlow({ status: "analyzing" });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: SAMPLE_MESSAGE.redactedText }),
      });
      const body = await response.json() as AnalyzeResponse;

      if (response.ok && body.status === "ok") {
        setFlow({ status: "result", analysis: body.analysis });
        return;
      }

      if (body.status === "unavailable") {
        setFlow({
          status: "unavailable",
          message: body.message,
          safetySteps: body.safetySteps,
        });
        return;
      }
    } catch {
      // Network and malformed-response failures use the same classification-free fallback.
    }

    setFlow({ status: "unavailable", ...unavailableFallback });
  }

  if (flow.status === "analyzing") {
    return (
      <section className="checkPanel loadingState" role="status" aria-live="polite">
        <span className="loadingMark" aria-hidden="true" />
        <p className="sectionKicker">CekDulu sedang bekerja</p>
        <h2>Menganalisis contoh pesan…</h2>
        <p>Kami hanya mengirim teks contoh yang sudah disamarkan.</p>
      </section>
    );
  }

  if (flow.status === "result") {
    return <div className="checkPanel"><AnalysisResultView analysis={flow.analysis} /></div>;
  }

  if (flow.status === "unavailable") {
    return (
      <div className="checkPanel">
        <UnavailableState
          message={flow.message}
          safetySteps={flow.safetySteps}
          onRetry={analyzeSample}
        />
      </div>
    );
  }

  return (
    <section className="checkPanel samplePanel" aria-labelledby="sample-heading">
      <p className="sectionKicker">Demo tanpa data pribadi</p>
      <h2 id="sample-heading">Coba alur CekDulu</h2>
      <p>
        Mulai dari contoh sintetis yang sudah disamarkan untuk melihat cara hasil dijelaskan.
      </p>
      <blockquote className="sampleMessage">
        <span>{SAMPLE_MESSAGE.label}</span>
        <p>{SAMPLE_MESSAGE.redactedText}</p>
      </blockquote>
      <button className="primaryButton" type="button" onClick={analyzeSample}>
        Coba contoh pesan
      </button>
      <p className="samplePrivacy">Tidak memakai pesan, gambar, atau data pribadi Anda.</p>
    </section>
  );
}
