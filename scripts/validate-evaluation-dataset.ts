import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import {
  evaluationDatasetSchema,
  normalizeEvaluationMessage,
  parseEvaluationJson,
  type EvaluationCase,
  type EvaluationCategory,
} from "../evaluation/dataset-schema";

const categories: EvaluationCategory[] = [
  "clearly_suspicious",
  "subtle_manipulation",
  "ambiguous",
  "legitimate_urgency",
  "normal",
];

type DatasetKind = "Development" | "Holdout";

function validateDataset(
  input: unknown,
  kind: DatasetKind,
  expectedCount: number,
  expectedPerCategory: number,
): EvaluationCase[] {
  const dataset = evaluationDatasetSchema.parse(input);
  if (dataset.length !== expectedCount) {
    throw new Error(`${kind} dataset must contain exactly ${expectedCount} cases`);
  }

  const prefix = kind === "Development" ? "dev-" : "holdout-";
  if (dataset.some((testCase) => !testCase.id.startsWith(prefix))) {
    throw new Error(`${kind} dataset ids must use the ${prefix} prefix`);
  }

  const normalizedMessages = dataset.map((testCase) =>
    normalizeEvaluationMessage(testCase.message),
  );
  if (new Set(normalizedMessages).size !== normalizedMessages.length) {
    throw new Error(`${kind} dataset messages must be unique`);
  }

  const balanced = categories.every(
    (category) =>
      dataset.filter((testCase) => testCase.category === category).length ===
      expectedPerCategory,
  );
  if (!balanced) {
    throw new Error(
      `${kind} dataset must contain exactly ${expectedPerCategory} cases per category`,
    );
  }

  return dataset;
}

export function validateEvaluationDatasets(input: {
  development: unknown;
  holdout?: unknown;
}) {
  const development = validateDataset(input.development, "Development", 10, 2);
  if (input.holdout === undefined) {
    return { development: development.length };
  }

  const holdout = validateDataset(input.holdout, "Holdout", 15, 3);
  const developmentMessages = new Set(
    development.map((testCase) => normalizeEvaluationMessage(testCase.message)),
  );
  if (
    holdout.some((testCase) =>
      developmentMessages.has(normalizeEvaluationMessage(testCase.message)),
    )
  ) {
    throw new Error("Development and holdout messages must not overlap");
  }

  return { development: development.length, holdout: holdout.length };
}

export async function validateEvaluationDatasetFiles(input: {
  developmentPath: string;
  holdoutPath?: string;
}) {
  const development = parseEvaluationJson(
    await readFile(input.developmentPath, "utf8"),
    "Development dataset is not valid JSON",
  );
  const holdout = input.holdoutPath
    ? parseEvaluationJson(
        await readFile(input.holdoutPath, "utf8"),
        "Holdout dataset is not valid JSON",
      )
    : undefined;

  return validateEvaluationDatasets({ development, holdout });
}

async function runCli() {
  const { values } = parseArgs({
    options: {
      development: { type: "string" },
      holdout: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (!values.development) {
    throw new Error("--development is required");
  }

  const result = await validateEvaluationDatasetFiles({
    developmentPath: values.development,
    holdoutPath: values.holdout,
  });
  console.log(JSON.stringify(result));
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
