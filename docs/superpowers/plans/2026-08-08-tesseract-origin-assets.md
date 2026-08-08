# Tesseract Origin Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make browser OCR load every Tesseract runtime asset from the CekDulu origin while preserving the existing CSP, UX, API, and privacy boundary.

**Architecture:** A build preparation script copies pinned Tesseract worker, LSTM core/WASM variants, and Indonesian/English trained data from installed npm packages into generated `public/tesseract/` assets. The client adapter passes only origin-local paths to `createWorker` and keeps screenshot recognition inside the browser.

**Tech Stack:** Next.js 16.3, TypeScript, Tesseract.js 7, Node.js file APIs, Vitest, Playwright, Vercel.

## Global Constraints

- Keep the existing Content Security Policy unchanged.
- Do not change the OCR UX, `/api/analyze` contract, or application flow.
- Screenshot files and raw OCR text remain browser-only.
- Only confirmed redacted text may cross `/api/analyze`.
- Do not store Vercel or Gemini secrets in repository files or the prompt log.
- Do not commit generated `public/tesseract/` output or local `.vercel/` metadata.

---

### Task 1: Protect origin-local asset resolution with regression tests

**Files:**
- Modify: `src/features/message-input/ocr.test.ts`
- Create: `scripts/sync-tesseract-assets.test.ts`

**Interfaces:**
- Consumes: `recognizeMessageImage(file, onProgress, workerFactory)` and npm script `prepare:tesseract`.
- Produces: failing regression evidence for local worker/core/language paths and the complete generated asset set.

- [ ] **Step 1: Extend the adapter test with literal local paths**

Assert that the worker factory receives:

```ts
{
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/core",
  langPath: "/tesseract/lang",
  workerBlobURL: false,
  logger: expect.any(Function),
}
```

- [ ] **Step 2: Add a real script-boundary test**

Run `npm run prepare:tesseract`, require exit code `0`, then assert non-empty generated files for the worker, three LSTM core loader/WASM pairs, and `eng`/`ind` trained data. Clean generated output in test teardown.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
npm test -- src/features/message-input/ocr.test.ts scripts/sync-tesseract-assets.test.ts
```

Expected: adapter argument mismatch and missing `prepare:tesseract` command.

---

### Task 2: Generate and consume self-hosted Tesseract assets

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `scripts/sync-tesseract-assets.mjs`
- Modify: `src/features/message-input/ocr.ts`

**Interfaces:**
- Consumes: pinned `tesseract.js`, `tesseract.js-core`, `@tesseract.js-data/eng`, and `@tesseract.js-data/ind` packages.
- Produces: `npm run prepare:tesseract` and origin-local `/tesseract/*` runtime assets.

- [ ] **Step 1: Pin runtime asset dependencies**

Install exact versions `tesseract.js@7.0.0`, `tesseract.js-core@7.0.0`, `@tesseract.js-data/eng@1.0.0`, and `@tesseract.js-data/ind@1.0.0`.

- [ ] **Step 2: Add the asset sync script**

Copy these non-empty files into `public/tesseract/`:

```text
worker.min.js
worker.min.js.LICENSE.txt
core/tesseract-core-lstm.wasm.js
core/tesseract-core-lstm.wasm
core/tesseract-core-simd-lstm.wasm.js
core/tesseract-core-simd-lstm.wasm
core/tesseract-core-relaxedsimd-lstm.wasm.js
core/tesseract-core-relaxedsimd-lstm.wasm
lang/eng.traineddata.gz
lang/ind.traineddata.gz
licenses/tesseract.js-LICENSE.md
licenses/tesseract.js-core-LICENSE.txt
```

Resolve package roots with `createRequire`, remove only the generated destination before copying, and fail immediately if any source is absent.

- [ ] **Step 3: Wire build hooks and ignore generated output**

Add `prepare:tesseract`, `predev`, and `prebuild` npm scripts. Ignore `/public/tesseract/` while preserving all other ignore rules.

- [ ] **Step 4: Configure the adapter**

Pass the literal origin-local worker/core/language paths and `workerBlobURL: false` to `createWorker`; preserve languages, OEM, progress, trimming, error, and termination behavior.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- src/features/message-input/ocr.test.ts scripts/sync-tesseract-assets.test.ts
```

Expected: all focused tests pass and generated test assets are removed by teardown.

---

### Task 3: Verify, review, deploy, and record actual evidence

**Files:**
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Consumes: verified local build and linked Vercel project `cekdulu`.
- Produces: production OCR/privacy evidence and a focused fix commit.

- [ ] **Step 1: Run local verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Confirm the strict CSP string is unchanged and all required generated assets are non-empty after build.

- [ ] **Step 2: Perform one final review**

Review the actual diff once for asset completeness, external runtime paths, privacy regressions, CSP changes, generated/secret leakage, and unrelated scope.

- [ ] **Step 3: Deploy production and fresh-browser verify**

Deploy the linked worktree to Vercel production. In a fresh browser, upload a synthetic screenshot, confirm OCR review, correct the text, verify redaction, and complete a real Gemini result. Observe that Tesseract runtime requests stay on the CekDulu origin and `/api/analyze` receives only confirmed redacted text.

- [ ] **Step 4: Append factual prompt evidence**

Record local commands, one review, deployment URL, fresh-browser timing/outcomes, CSP result, and privacy observation without secrets or private content.

- [ ] **Step 5: Commit only after all checks pass**

Stage source, tests, pinned dependency metadata, plan, `.gitignore`, and prompt log. Exclude `.vercel/` and generated `public/tesseract/`, then create one focused fix commit. Do not push or merge.
