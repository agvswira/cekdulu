import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { z } from "zod";
import {
  evaluationDatasetSchema,
  parseEvaluationJson,
  type EvaluationCategory,
} from "../evaluation/dataset-schema";
import { analysisResultSchema } from "../src/domain/analysis/schema";

const claimLabel =
  "Agreement with team expected classification; not fraud-detection accuracy";

export type EvaluationRecord = {
  id: string;
  category: EvaluationCategory;
  expectedRisk: "low" | "medium" | "high";
  actualRisk: "low" | "medium" | "high" | null;
  schemaValid: boolean;
  unavailable: boolean;
  agreesWithExpected: boolean;
};

export type EvaluationReport = {
  generatedAt: string;
  total: number;
  schemaValid: number;
  unavailable: number;
  expectedClassificationAgreement: { count: number; total: number };
  claimLabel: typeof claimLabel;
  records: EvaluationRecord[];
};

export async function evaluateDataset(input: {
  dataset: unknown;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}): Promise<EvaluationReport> {
  const dataset = evaluationDatasetSchema.parse(input.dataset);
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = input.baseUrl.replace(/\/+$/, "");
  const records: EvaluationRecord[] = [];

  for (const testCase of dataset) {
    let payload: unknown;
    try {
      const response = await fetchImpl(`${baseUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testCase.message }),
      });
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    const successful = z
      .object({ status: z.literal("ok"), analysis: analysisResultSchema })
      .safeParse(payload);
    records.push({
      id: testCase.id,
      category: testCase.category,
      expectedRisk: testCase.expectedRisk,
      actualRisk: successful.success ? successful.data.analysis.riskLevel : null,
      schemaValid: successful.success,
      unavailable: !successful.success,
      agreesWithExpected:
        successful.success &&
        successful.data.analysis.riskLevel === testCase.expectedRisk,
    });
  }

  return {
    generatedAt: (input.now?.() ?? new Date()).toISOString(),
    total: records.length,
    schemaValid: records.filter((record) => record.schemaValid).length,
    unavailable: records.filter((record) => record.unavailable).length,
    expectedClassificationAgreement: {
      count: records.filter((record) => record.agreesWithExpected).length,
      total: records.length,
    },
    claimLabel,
    records,
  };
}

function renderMarkdown(report: EvaluationReport) {
  const rows = report.records.map(
    (record) =>
      `| ${record.id} | ${record.category} | ${record.expectedRisk} | ${record.actualRisk ?? "unavailable"} | ${record.schemaValid ? "yes" : "no"} | ${record.agreesWithExpected ? "yes" : "no"} |`,
  );

  return [
    "# CekDulu evaluation report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Schema-valid outputs",
    "",
    `**${report.schemaValid}/${report.total}**`,
    "",
    "## Unavailable responses",
    "",
    `**${report.unavailable}/${report.total}**`,
    "",
    "## Expected-classification agreement",
    "",
    `**${report.expectedClassificationAgreement.count}/${report.expectedClassificationAgreement.total}**`,
    "",
    report.claimLabel,
    "",
    "| ID | Category | Expected risk | Actual risk | Schema valid | Agrees |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

export async function writeEvaluationReport(
  report: EvaluationReport,
  outputPath: string,
) {
  const markdownPath = outputPath.endsWith(".json")
    ? `${outputPath.slice(0, -5)}.md`
    : `${outputPath}.md`;
  await mkdir(dirname(outputPath), { recursive: true });
  await Promise.all([
    writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`),
    writeFile(markdownPath, renderMarkdown(report)),
  ]);

  return { jsonPath: outputPath, markdownPath };
}

export async function runEvaluation(input: {
  datasetPath: string;
  baseUrl: string;
  outputPath: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}) {
  const dataset = parseEvaluationJson(
    await readFile(input.datasetPath, "utf8"),
    "Evaluation dataset is not valid JSON",
  );
  const report = await evaluateDataset({
    dataset,
    baseUrl: input.baseUrl,
    fetchImpl: input.fetchImpl,
    now: input.now,
  });
  const paths = await writeEvaluationReport(report, input.outputPath);
  return { report, paths };
}

async function runCli() {
  const { values } = parseArgs({
    options: {
      dataset: { type: "string" },
      "base-url": { type: "string" },
      output: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (!values.dataset || !values["base-url"] || !values.output) {
    throw new Error("--dataset, --base-url, and --output are required");
  }

  const result = await runEvaluation({
    datasetPath: values.dataset,
    baseUrl: values["base-url"],
    outputPath: values.output,
  });
  console.log(
    JSON.stringify({
      total: result.report.total,
      schemaValid: result.report.schemaValid,
      unavailable: result.report.unavailable,
      expectedClassificationAgreement:
        result.report.expectedClassificationAgreement,
      output: result.paths,
    }),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((error: unknown) => {
    const message =
      error instanceof Error && error.name !== "ZodError"
        ? error.message
        : "Evaluation dataset does not match the required schema";
    console.error(message);
    process.exitCode = 1;
  });
}
