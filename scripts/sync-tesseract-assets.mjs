import { copyFile, mkdir, rm, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const destinationRoot = path.join(projectRoot, "public", "tesseract");

const packageRoots = {
  worker: path.dirname(require.resolve("tesseract.js/package.json")),
  core: path.dirname(require.resolve("tesseract.js-core/package.json")),
  eng: path.dirname(require.resolve("@tesseract.js-data/eng/package.json")),
  ind: path.dirname(require.resolve("@tesseract.js-data/ind/package.json")),
};

const assets = [
  ["worker", "dist/worker.min.js", "worker.min.js"],
  ["worker", "dist/worker.min.js.LICENSE.txt", "worker.min.js.LICENSE.txt"],
  ["core", "tesseract-core-lstm.wasm.js", "core/tesseract-core-lstm.wasm.js"],
  ["core", "tesseract-core-lstm.wasm", "core/tesseract-core-lstm.wasm"],
  ["core", "tesseract-core-simd-lstm.wasm.js", "core/tesseract-core-simd-lstm.wasm.js"],
  ["core", "tesseract-core-simd-lstm.wasm", "core/tesseract-core-simd-lstm.wasm"],
  [
    "core",
    "tesseract-core-relaxedsimd-lstm.wasm.js",
    "core/tesseract-core-relaxedsimd-lstm.wasm.js",
  ],
  [
    "core",
    "tesseract-core-relaxedsimd-lstm.wasm",
    "core/tesseract-core-relaxedsimd-lstm.wasm",
  ],
  ["eng", "4.0.0_best_int/eng.traineddata.gz", "lang/eng.traineddata.gz"],
  ["ind", "4.0.0_best_int/ind.traineddata.gz", "lang/ind.traineddata.gz"],
  ["worker", "LICENSE.md", "licenses/tesseract.js-LICENSE.md"],
  ["core", "LICENSE", "licenses/tesseract.js-core-LICENSE.txt"],
];

await rm(destinationRoot, { recursive: true, force: true });

for (const [packageName, sourcePath, destinationPath] of assets) {
  const source = path.join(packageRoots[packageName], sourcePath);
  const destination = path.join(destinationRoot, destinationPath);
  const sourceStat = await stat(source);
  if (!sourceStat.isFile() || sourceStat.size === 0) {
    throw new Error(`Tesseract asset is missing or empty: ${sourcePath}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}
