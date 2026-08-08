import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateEvaluationDatasetFiles,
  validateEvaluationDatasets,
} from "./validate-evaluation-dataset";

const categories = [
  "clearly_suspicious",
  "subtle_manipulation",
  "ambiguous",
  "legitimate_urgency",
  "normal",
] as const;

type CaseFixture = {
  id: string;
  category: (typeof categories)[number];
  message: string;
  expectedRisk: "low" | "medium" | "high";
  rationale: string;
};

function makeDataset(prefix: "dev" | "holdout", perCategory: number) {
  let caseNumber = 0;
  return categories.flatMap((category) =>
    Array.from({ length: perCategory }, (_, categoryIndex): CaseFixture => {
      caseNumber += 1;
      return {
        id: `${prefix}-${String(caseNumber).padStart(2, "0")}`,
        category,
        message: `Pesan sintetis ${prefix} untuk ${category} nomor ${categoryIndex + 1} tanpa data pribadi.`,
        expectedRisk: category === "clearly_suspicious" ? "high" : "low",
        rationale: `Alasan sintetis untuk kategori ${category} dan kasus ${categoryIndex + 1}.`,
      };
    }),
  );
}

describe("validateEvaluationDatasets", () => {
  it("accepts exactly ten development and fifteen holdout cases with balanced categories", () => {
    const result = validateEvaluationDatasets({
      development: makeDataset("dev", 2),
      holdout: makeDataset("holdout", 3),
    });

    expect(result).toEqual({ development: 10, holdout: 15 });
  });

  it("rejects development sets without exactly two cases in every category", () => {
    const development = makeDataset("dev", 2);
    development[0] = { ...development[0]!, category: "normal" };

    expect(() => validateEvaluationDatasets({ development })).toThrow(
      "Development dataset must contain exactly 2 cases per category",
    );
    expect(() =>
      validateEvaluationDatasets({ development: development.slice(1) }),
    ).toThrow("Development dataset must contain exactly 10 cases");
  });

  it("rejects holdout sets without exactly three cases in every category", () => {
    const holdout = makeDataset("holdout", 3);
    holdout[0] = { ...holdout[0]!, category: "normal" };

    expect(() =>
      validateEvaluationDatasets({
        development: makeDataset("dev", 2),
        holdout,
      }),
    ).toThrow("Holdout dataset must contain exactly 3 cases per category");
    expect(() =>
      validateEvaluationDatasets({
        development: makeDataset("dev", 2),
        holdout: holdout.slice(1),
      }),
    ).toThrow("Holdout dataset must contain exactly 15 cases");
  });

  it("rejects duplicate normalized messages within one dataset", () => {
    const development = makeDataset("dev", 2);
    development[1] = {
      ...development[1]!,
      message: `  ${development[0]!.message.toUpperCase()}   `,
    };

    expect(() => validateEvaluationDatasets({ development })).toThrow(
      "Development dataset messages must be unique",
    );
  });

  it("rejects normalized message overlap without exposing message bodies", () => {
    const development = makeDataset("dev", 2);
    const holdout = makeDataset("holdout", 3);
    const privateMessage = "Pesan sintetis privat yang tidak boleh muncul dalam output validator.";
    development[0] = { ...development[0]!, message: privateMessage };
    holdout[0] = { ...holdout[0]!, message: `  ${privateMessage.toUpperCase()}  ` };

    let observedError: unknown;
    try {
      validateEvaluationDatasets({ development, holdout });
    } catch (error) {
      observedError = error;
    }

    expect(observedError).toBeInstanceOf(Error);
    expect((observedError as Error).message).toBe(
      "Development and holdout messages must not overlap",
    );
    expect((observedError as Error).message).not.toContain(privateMessage);
  });

  it("rejects dataset-specific id prefixes", () => {
    const development = makeDataset("dev", 2);
    development[0] = {
      ...development[0]!,
      id: "holdout-01",
    };

    expect(() => validateEvaluationDatasets({ development })).toThrow(
      "Development dataset ids must use the dev- prefix",
    );
  });

  it("rejects malformed case fields", () => {
    const development = makeDataset("dev", 2);
    development[0] = { ...development[0]!, rationale: "terlalu singkat" };

    expect(() => validateEvaluationDatasets({ development })).toThrow();
  });

  it("reads dataset paths and returns aggregate counts without message bodies", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cekdulu-evaluation-"));
    const developmentPath = join(directory, "development.json");
    const holdoutPath = join(directory, "holdout.private.json");
    await writeFile(developmentPath, JSON.stringify(makeDataset("dev", 2)));
    await writeFile(holdoutPath, JSON.stringify(makeDataset("holdout", 3)));

    const result = await validateEvaluationDatasetFiles({
      developmentPath,
      holdoutPath,
    });

    expect(result).toEqual({ development: 10, holdout: 15 });
    expect(JSON.stringify(result)).not.toContain("Pesan sintetis");
  });

  it("does not expose malformed private holdout JSON in errors", async () => {
    const directory = await mkdtemp(join(tmpdir(), "cekdulu-private-json-"));
    const developmentPath = join(directory, "development.json");
    const holdoutPath = join(directory, "holdout.private.json");
    await writeFile(developmentPath, JSON.stringify(makeDataset("dev", 2)));
    await writeFile(holdoutPath, "SYNTHETIC_PRIVATE_MARKER");

    const observedError = await validateEvaluationDatasetFiles({
      developmentPath,
      holdoutPath,
    }).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(observedError).toBeInstanceOf(Error);
    expect((observedError as Error).message).toBe(
      "Holdout dataset is not valid JSON",
    );
    expect((observedError as Error).message).not.toContain("SYNTHETIC_");
  });
});
