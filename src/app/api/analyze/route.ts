import { randomUUID } from "node:crypto";
import { analysisRequestSchema } from "@/domain/analysis/schema";
import { AnalysisUnavailableError } from "@/server/analysis/errors";
import { createAnalysisModel } from "@/server/analysis/provider";
import { analyzeMessage } from "@/server/analysis/service";

const safetySteps = [
  "Jangan klik tautan atau mengirim data dari pesan tersebut.",
  "Cari kanal resmi pihak terkait secara terpisah.",
  "Jika sudah mentransfer, segera hubungi penyedia layanan keuangan dan IASC.",
];

const noStore = { "Cache-Control": "no-store" };
const SERVER_ANALYSIS_DEADLINE_MS = 13_000;

export async function POST(request: Request) {
  const parsed = analysisRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ status: "invalid_request" }, { status: 400, headers: noStore });
  }

  const model = createAnalysisModel();
  if (!model) {
    return Response.json(
      { status: "unavailable", message: "Analisis AI sedang tidak tersedia.", safetySteps },
      { status: 503, headers: noStore },
    );
  }

  const startedAtMs = Date.now();
  const deadline = new AbortController();
  const abortForDisconnect = () => deadline.abort(request.signal.reason);
  if (request.signal.aborted) {
    abortForDisconnect();
  } else {
    request.signal.addEventListener("abort", abortForDisconnect, { once: true });
  }
  const timeout = setTimeout(() => deadline.abort(), SERVER_ANALYSIS_DEADLINE_MS);

  try {
    const analysis = await analyzeMessage(parsed.data.message, model, {
      signal: deadline.signal,
      requestId: randomUUID(),
      startedAtMs,
    });
    return Response.json({ status: "ok", analysis }, { headers: noStore });
  } catch (error) {
    if (!(error instanceof AnalysisUnavailableError)) throw error;
    return Response.json(
      { status: "unavailable", message: "Analisis AI sedang tidak tersedia.", safetySteps },
      { status: 503, headers: noStore },
    );
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortForDisconnect);
  }
}
