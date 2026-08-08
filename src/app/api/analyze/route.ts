import { analysisRequestSchema } from "@/domain/analysis/schema";
import { AnalysisUnavailableError } from "@/server/analysis/errors";
import { GeminiStructuredModel } from "@/server/analysis/model";
import { analyzeMessage } from "@/server/analysis/service";

const safetySteps = [
  "Jangan klik tautan atau mengirim data dari pesan tersebut.",
  "Cari kanal resmi pihak terkait secara terpisah.",
  "Jika sudah mentransfer, segera hubungi penyedia layanan keuangan dan IASC.",
];

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const parsed = analysisRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ status: "invalid_request" }, { status: 400, headers: noStore });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { status: "unavailable", message: "Analisis AI sedang tidak tersedia.", safetySteps },
      { status: 503, headers: noStore },
    );
  }

  try {
    const model = new GeminiStructuredModel(apiKey, process.env.GEMINI_MODEL);
    const analysis = await analyzeMessage(parsed.data.message, model);
    return Response.json({ status: "ok", analysis }, { headers: noStore });
  } catch (error) {
    if (!(error instanceof AnalysisUnavailableError)) throw error;
    return Response.json(
      { status: "unavailable", message: "Analisis AI sedang tidak tersedia.", safetySteps },
      { status: 503, headers: noStore },
    );
  }
}
