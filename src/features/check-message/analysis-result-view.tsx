import type { AnalysisResult } from "@/domain/analysis/schema";

const riskLabels: Record<AnalysisResult["riskLevel"], string> = {
  low: "Risiko rendah",
  medium: "Risiko sedang",
  high: "Risiko tinggi",
};

const categoryLabels: Record<AnalysisResult["signals"][number]["category"], string> = {
  urgency: "Tekanan waktu",
  impersonation: "Penyamaran identitas",
  credential_request: "Permintaan data rahasia",
  payment_request: "Permintaan pembayaran",
  unverified_link: "Tautan belum terverifikasi",
  other: "Sinyal lain",
};

interface AnalysisResultViewProps {
  analysis: AnalysisResult;
}

export function AnalysisResultView({ analysis }: AnalysisResultViewProps) {
  return (
    <section className="analysisResult" aria-labelledby="analysis-risk-level">
      <div className="resultLead">
        <p className="sectionKicker">Hasil pemeriksaan</p>
        <h2
          className={`riskBadge riskBadge--${analysis.riskLevel}`}
          data-stage-heading
          id="analysis-risk-level"
          tabIndex={-1}
        >
          {riskLabels[analysis.riskLevel]}
        </h2>
        <p className="resultSummary">{analysis.summary}</p>
      </div>

      <section className="resultSection" aria-labelledby="evidence-heading">
        <h3 id="evidence-heading">Yang perlu diwaspadai</h3>
        <ul className="evidenceList">
          {analysis.signals.map((signal, index) => (
            <li className="evidenceCard" key={`${signal.category}-${signal.quote}-${index}`}>
              <mark>{signal.quote}</mark>
              <p className="signalCategory">{categoryLabels[signal.category]}</p>
              <p>{signal.explanation}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="resultSection" aria-labelledby="actions-heading">
        <h3 id="actions-heading">Langkah aman berikutnya</h3>
        <ol className="actionList">
          {analysis.actions.map((action, index) => (
            <li className="actionCard" key={`${action.priority}-${action.title}-${index}`}>
              <span className="actionNumber" aria-hidden="true">{action.priority}</span>
              <div>
                <h4>{action.title}</h4>
                <p>{action.instruction}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="limitations" aria-labelledby="limitations-heading">
        <h3 id="limitations-heading">Batas pemeriksaan</h3>
        <ul>
          {analysis.limitations.map((limitation, index) => (
            <li key={`${limitation}-${index}`}>{limitation}</li>
          ))}
        </ul>
      </section>

      <a
        className="officialLink"
        href="https://iasc.ojk.go.id/"
        target="_blank"
        rel="noreferrer"
      >
        Buka panduan resmi IASC
      </a>
    </section>
  );
}
