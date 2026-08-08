import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { validResult } from "../src/domain/analysis/test-fixtures";
import { evaluateDataset, runEvaluation, writeEvaluationReport } from "./evaluate";

const claimLabel =
  "Agreement with team expected classification; not fraud-detection accuracy";

const dataset = [
  {
    id: "dev-01",
    category: "clearly_suspicious",
    message: "Pesan sintetis pertama meminta tindakan berisiko melalui [URL_1].",
    expectedRisk: "high",
    rationale: "Kasus sintetis pertama diharapkan memiliki risiko tinggi.",
  },
  {
    id: "dev-02",
    category: "ambiguous",
    message: "Pesan sintetis kedua memiliki konteks yang belum dapat diverifikasi.",
    expectedRisk: "low",
    rationale: "Kasus sintetis kedua sengaja dipakai untuk satu ketidakcocokan.",
  },
  {
    id: "dev-03",
    category: "normal",
    message: "Pesan sintetis ketiga hanya menyampaikan informasi tanpa tindakan.",
    expectedRisk: "medium",
    rationale: "Kasus sintetis ketiga diharapkan memiliki risiko menengah.",
  },
] as const;

function okResponse(riskLevel: "low" | "medium" | "high") {
  return new Response(
    JSON.stringify({
      status: "ok",
      analysis: { ...validResult, riskLevel },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("evaluateDataset", () => {
  it("reports three schema-valid outputs and two expected-classification agreements", async () => {
    const responses = [okResponse("high"), okResponse("medium"), okResponse("medium")];
    let activeRequests = 0;
    let maximumActiveRequests = 0;
    const fetchImpl = vi.fn(async () => {
      activeRequests += 1;
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
      await Promise.resolve();
      activeRequests -= 1;
      return responses.shift() as Response;
    });

    const report = await evaluateDataset({
      dataset,
      baseUrl: "http://127.0.0.1:3000/",
      fetchImpl,
      now: () => new Date("2026-08-08T10:00:00.000Z"),
    });

    expect(report).toMatchObject({
      generatedAt: "2026-08-08T10:00:00.000Z",
      total: 3,
      schemaValid: 3,
      unavailable: 0,
      expectedClassificationAgreement: { count: 2, total: 3 },
      claimLabel,
    });
    expect(report.records.map((record) => record.actualRisk)).toEqual([
      "high",
      "medium",
      "medium",
    ]);
    expect(maximumActiveRequests).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "http://127.0.0.1:3000/api/analyze",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: dataset[0].message }),
      }),
    );
  });

  it("counts unavailable responses separately without coercing a risk class", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status: "unavailable",
          message: "Analisis AI sedang tidak tersedia.",
          safetySteps: ["Gunakan kanal resmi untuk verifikasi."],
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    );

    const report = await evaluateDataset({
      dataset: [dataset[0]],
      baseUrl: "http://127.0.0.1:3000",
      fetchImpl,
    });

    expect(report).toMatchObject({
      total: 1,
      schemaValid: 0,
      unavailable: 1,
      expectedClassificationAgreement: { count: 0, total: 1 },
      claimLabel,
      records: [
        {
          id: "dev-01",
          actualRisk: null,
          schemaValid: false,
          unavailable: true,
          agreesWithExpected: false,
        },
      ],
    });
  });
});

describe("writeEvaluationReport", () => {
  it("writes body-free JSON and adjacent Markdown with truthful agreement wording", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cekdulu-report-"));
    const outputPath = join(directory, "development.json");
    const report = await evaluateDataset({
      dataset: [dataset[0]],
      baseUrl: "http://127.0.0.1:3000",
      fetchImpl: async () => okResponse("high"),
      now: () => new Date("2026-08-08T10:00:00.000Z"),
    });

    const paths = await writeEvaluationReport(report, outputPath);
    const json = await readFile(paths.jsonPath, "utf8");
    const markdown = await readFile(paths.markdownPath, "utf8");

    expect(paths).toEqual({
      jsonPath: outputPath,
      markdownPath: join(directory, "development.md"),
    });
    expect(JSON.parse(json)).toEqual(report);
    expect(json).not.toContain(dataset[0].message);
    expect(markdown).toContain("## Expected-classification agreement");
    expect(markdown).toContain("**1/1**");
    expect(markdown).toContain(claimLabel);
    expect(markdown).not.toMatch(/^#{1,6} Accuracy$/m);
    expect(markdown).not.toContain(dataset[0].message);
  });
});

describe("runEvaluation", () => {
  it("reads a validated dataset and writes both report formats", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cekdulu-runner-"));
    const datasetPath = join(directory, "dataset.json");
    const outputPath = join(directory, "results", "report.json");
    await writeFile(datasetPath, JSON.stringify([dataset[0]]));

    const result = await runEvaluation({
      datasetPath,
      baseUrl: "http://127.0.0.1:3000",
      outputPath,
      fetchImpl: async () => okResponse("high"),
      now: () => new Date("2026-08-08T10:00:00.000Z"),
    });

    expect(result.report).toMatchObject({
      total: 1,
      schemaValid: 1,
      expectedClassificationAgreement: { count: 1, total: 1 },
    });
    expect(result.paths).toEqual({
      jsonPath: outputPath,
      markdownPath: join(directory, "results", "report.md"),
    });
    expect(JSON.parse(await readFile(outputPath, "utf8"))).toEqual(result.report);
  });

  it("does not expose malformed dataset JSON in errors", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cekdulu-runner-json-"));
    const datasetPath = join(directory, "dataset.json");
    await writeFile(datasetPath, "SYNTHETIC_PRIVATE_MARKER");

    const observedError = await runEvaluation({
      datasetPath,
      baseUrl: "http://127.0.0.1:3000",
      outputPath: join(directory, "report.json"),
    }).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(observedError).toBeInstanceOf(Error);
    expect((observedError as Error).message).toBe(
      "Evaluation dataset is not valid JSON",
    );
    expect((observedError as Error).message).not.toContain("SYNTHETIC_");
  });
});
