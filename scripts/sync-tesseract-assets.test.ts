import { afterEach, describe, expect, it } from "vitest";
import { rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();
const assetRoot = path.join(projectRoot, "public", "tesseract");
const requiredAssets = [
  "worker.min.js",
  "worker.min.js.LICENSE.txt",
  "core/tesseract-core-lstm.wasm.js",
  "core/tesseract-core-lstm.wasm",
  "core/tesseract-core-simd-lstm.wasm.js",
  "core/tesseract-core-simd-lstm.wasm",
  "core/tesseract-core-relaxedsimd-lstm.wasm.js",
  "core/tesseract-core-relaxedsimd-lstm.wasm",
  "lang/eng.traineddata.gz",
  "lang/ind.traineddata.gz",
  "licenses/tesseract.js-LICENSE.md",
  "licenses/tesseract.js-core-LICENSE.txt",
] as const;

afterEach(() => {
  rmSync(assetRoot, { recursive: true, force: true });
});

describe("Tesseract build assets", () => {
  it("materializes every worker, LSTM core, and language asset used at runtime", () => {
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const result = spawnSync(command, ["run", "prepare:tesseract", "--silent"], {
      cwd: projectRoot,
      encoding: "utf8",
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    for (const relativePath of requiredAssets) {
      expect(statSync(path.join(assetRoot, relativePath)).size, relativePath).toBeGreaterThan(0);
    }
  });
});
