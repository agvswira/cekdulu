# CekDulu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy CekDulu, a privacy-first web application that turns a suspicious-message screenshot or pasted text into an explainable risk check and safe next actions.

**Architecture:** A Next.js App Router client performs OCR, text correction, and sensitive-data redaction in the browser. A same-origin Route Handler sends only confirmed redacted text to Gemini structured output, validates the semantic contract, and returns either an analysis result or a non-classifying graceful fallback. No database or raw-message logging is used.

**Tech Stack:** Node.js 26, npm 12, Next.js App Router, React, TypeScript, CSS Modules/global CSS, Tesseract.js, Google GenAI SDK with `gemini-3.6-flash`, Zod, Vitest, Testing Library, Playwright, and Vercel.

## Global Constraints

- Submission deadline is 10 August 2026 at 13:00 WITA; Feature Zero must be deployed before OCR work begins.
- Product copy is Indonesian; code identifiers and developer documentation are English.
- The raw screenshot never leaves the browser, and the user confirms the redacted text before analysis.
- No account, database, message history, URL fetching, owner lookup, automatic reporting, or conversational chatbot.
- Never display an absolute “pasti aman” or “pasti penipuan” verdict or a fake confidence percentage.
- An AI timeout produces general safety guidance and Retry without a risk classification; do not add a rule-based risk classifier.
- Successful AI output must match the versioned schema and every evidence quote must exist in the redacted input.
- Development fixtures and holdout cases remain separate; `13/15` is described only as agreement with the team's expected classification.
- The holdout categories are: clearly suspicious, subtle manipulation, ambiguous, legitimate urgency, and normal.
- Every task appends its real AI prompt, verification, decision, and file/commit references to `docs/ai/PROMPT_LOG.md` before committing.

---

## File map

### Project configuration

- `package.json` — scripts and pinned dependency graph through `package-lock.json`.
- `tsconfig.json` — strict TypeScript and `@/*` alias.
- `next.config.ts` — Next.js configuration and security headers.
- `eslint.config.mjs` — Next.js lint rules.
- `vitest.config.ts`, `vitest.setup.ts` — unit/component test environment.
- `playwright.config.ts` — browser projects and web-server configuration.
- `.env.example` — non-secret Gemini configuration contract.

### Application shell and visual system

- `src/app/layout.tsx` — metadata and document shell.
- `src/app/page.tsx` — composes the CekDulu experience.
- `src/app/globals.css` — Calm Guardian tokens, layout, states, and responsive rules.
- `src/components/brand-header.tsx` — brand and privacy cue.

### Analysis domain and server boundary

- `src/domain/analysis/schema.ts` — request/result schemas, JSON Schema, and shared types.
- `src/domain/analysis/safety.ts` — semantic validation and prohibited-claim checks.
- `src/domain/analysis/test-fixtures.ts` — one shared valid result used only by automated tests.
- `src/server/analysis/prompt.ts` — Indonesian system/task prompt.
- `src/server/analysis/model.ts` — model interface and Gemini adapter.
- `src/server/analysis/service.ts` — retry, parse, and semantic-validation orchestration.
- `src/app/api/analyze/route.ts` — same-origin HTTP boundary and graceful fallback.

### Check-message feature

- `src/features/check-message/sample-message.ts` — one synthetic, pre-redacted demo message.
- `src/features/check-message/use-check-message-flow.ts` — explicit UI state machine.
- `src/features/check-message/check-message-flow.tsx` — screen composition and request orchestration.
- `src/features/check-message/analysis-result-view.tsx` — explainable risk result.
- `src/features/check-message/unavailable-state.tsx` — general safety guidance without classification.

### Input, OCR, and privacy

- `src/features/message-input/file-validation.ts` — MIME and 5 MB limit.
- `src/features/message-input/ocr.ts` — client-only Tesseract adapter.
- `src/features/message-input/redaction.ts` — deterministic typed-token redaction.
- `src/features/message-input/message-intake.tsx` — upload/paste UI.
- `src/features/message-input/message-review.tsx` — editable OCR text and redaction confirmation.

### Evaluation and evidence

- `evaluation/dataset-schema.ts` — fixture contract and category counts.
- `evaluation/development.json` — ten tuning fixtures, two per category.
- `evaluation/holdout.private.json` — locally supplied only after prompt freeze; ignored by Git.
- `evaluation/results/` — timestamped official-run evidence.
- `scripts/validate-evaluation-dataset.ts` — distribution and uniqueness validation.
- `scripts/evaluate.ts` — calls the deployed/local endpoint and computes expected-classification agreement.
- `docs/ai/PROMPT_LOG.md` — real vibecoding evidence.
- `docs/DEMO.md` — live and fallback demo choreography.
- `README.md` — setup, privacy boundary, commands, and deployment.

---

### Task 1: Bootstrap the tested Calm Guardian application shell

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/brand-header.tsx`
- Test: `src/components/brand-header.test.tsx`
- Create: `docs/ai/PROMPT_LOG.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `BrandHeader(): JSX.Element`, the `@/*` alias, test commands, and the Calm Guardian design tokens consumed by later tasks.

- [ ] **Step 1: Install the application and test dependencies**

Run:

```bash
npm init -y
npm install next@latest react@latest react-dom@latest @google/genai zod tesseract.js
npm install -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test @axe-core/playwright tsx
npm pkg set private=true --json
npm pkg set scripts.dev="next dev" scripts.build="next build" scripts.start="next start" scripts.lint="eslint ." scripts.typecheck="tsc --noEmit" scripts.test="vitest run" scripts.test:watch="vitest" scripts.test:e2e="playwright test" scripts.eval="tsx scripts/evaluate.ts" scripts.eval:validate="tsx scripts/validate-evaluation-dataset.ts"
```

Expected: dependencies install successfully and `package-lock.json` is created.

- [ ] **Step 2: Add strict TypeScript, Vitest, Next.js, ESLint, and Playwright configuration**

Use these exact configurations:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' blob: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://generativelanguage.googleapis.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" },
      ],
    }];
  },
};

export default nextConfig;
```

The development CSP permits Next.js evaluation code; before the production release, verify whether `'unsafe-eval'` can be removed from the production header without breaking Next.js or Tesseract workers.

```js
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([".next/**", "dist/**", "coverage/**", "playwright-report/**"]),
]);
```

```ts
// vitest.config.ts
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
});
```

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

Use the standard Next.js declaration in `next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 3: Write the failing brand-shell test**

```tsx
// src/components/brand-header.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandHeader } from "./brand-header";

describe("BrandHeader", () => {
  it("shows the approved brand and privacy cue", () => {
    render(<BrandHeader />);
    expect(screen.getByText("CekDulu")).toBeInTheDocument();
    expect(screen.getByText("Diproses secara privat")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the test and confirm the missing component failure**

Run: `npm test -- src/components/brand-header.test.tsx`
Expected: FAIL because `./brand-header` does not exist.

- [ ] **Step 5: Implement the shell and design tokens**

```tsx
// src/components/brand-header.tsx
export function BrandHeader() {
  return (
    <header className="brandHeader">
      <a className="brand" href="/" aria-label="CekDulu — beranda">
        <span className="brandMark" aria-hidden="true">✓</span>
        <span>CekDulu</span>
      </a>
      <span className="privacyCue">◇ Diproses secara privat</span>
    </header>
  );
}
```

Define these exact root tokens in `globals.css`: `--ink: #132c3e`, `--muted: #58717b`, `--paper: #f6f2e8`, `--surface: #fffdf7`, `--trust: #0e7c73`, `--trust-soft: #e2f3ed`, `--warning: #e08a15`, `--warning-soft: #fff0cf`, `--danger: #b83a2e`, `--line: #ddd8cc`, `--radius-lg: 20px`, and `--shadow: 0 18px 45px rgba(19,44,62,.10)`. Implement `layout.tsx` metadata with title `CekDulu — Periksa Pesan Sebelum Bertindak` and a temporary home page containing the approved headline `Cek pesannya. Lindungi keputusanmu.`.

- [ ] **Step 6: Create the real prompt-log format**

```md
# CekDulu Vibecoding Prompt Log

Each entry records: ID/time, member, tool/model, goal, constraints, full prompt,
response summary, verification, decision, and related files/commit.

Personal data and API keys are never recorded.
```

Append the real Task 1 interaction below this header.

- [ ] **Step 7: Verify the shell**

Run:

```bash
npm test -- src/components/brand-header.test.tsx
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next-env.d.ts next.config.ts eslint.config.mjs vitest.config.ts vitest.setup.ts playwright.config.ts src/app src/components docs/ai/PROMPT_LOG.md .gitignore
git commit -m "chore: bootstrap CekDulu application shell"
```

---

### Task 2: Define and enforce the analysis contract

**Files:**
- Create: `src/domain/analysis/schema.ts`
- Create: `src/domain/analysis/safety.ts`
- Create: `src/domain/analysis/test-fixtures.ts`
- Test: `src/domain/analysis/schema.test.ts`
- Test: `src/domain/analysis/safety.test.ts`
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Produces: `analysisRequestSchema`, `analysisResultSchema`, `analysisJsonSchema`, `AnalysisResult`, `SignalCategory`, `validateAnalysisSemantics(result, redactedInput)`, and `containsAbsoluteVerdict(text)`.
- Consumed by: server service, API route, result UI, evaluation runner.

- [ ] **Step 1: Write failing schema and semantic-safety tests**

```ts
// src/domain/analysis/schema.test.ts
import { describe, expect, it } from "vitest";
import { analysisResultSchema } from "./schema";

const validResult = {
  version: "1" as const,
  riskLevel: "high" as const,
  summary: "Pesan menggunakan tekanan waktu dan tautan yang belum terverifikasi.",
  signals: [{
    quote: "klik [URL_1] sekarang",
    category: "urgency" as const,
    explanation: "Tekanan waktu dapat mendorong keputusan tergesa-gesa.",
  }],
  actions: [
    { priority: 1, title: "Jangan klik", instruction: "Tutup pesan dan jangan membuka tautannya." },
    { priority: 2, title: "Verifikasi", instruction: "Cari kanal resmi secara terpisah." },
  ],
  limitations: ["CekDulu tidak dapat memastikan identitas pengirim."],
};

describe("analysisResultSchema", () => {
  it("accepts the versioned result contract", () => {
    expect(analysisResultSchema.parse(validResult)).toEqual(validResult);
  });

  it("rejects fake precision and unknown levels", () => {
    expect(() => analysisResultSchema.parse({ ...validResult, riskLevel: "63%" })).toThrow();
  });
});
```

```ts
// src/domain/analysis/safety.test.ts
import { describe, expect, it } from "vitest";
import { containsAbsoluteVerdict, validateAnalysisSemantics } from "./safety";
import { validResult } from "./test-fixtures";

describe("analysis semantic safety", () => {
  it.each(["Pesan ini pasti aman", "Ini pasti penipuan", "dijamin bukan scam"])(
    "rejects an absolute verdict: %s",
    (text) => expect(containsAbsoluteVerdict(text)).toBe(true),
  );

  it("rejects evidence that is absent from the redacted input", () => {
    expect(() => validateAnalysisSemantics(validResult, "pesan yang berbeda")).toThrow(
      "EVIDENCE_NOT_IN_INPUT",
    );
  });
});
```

Move the shared `validResult` to `src/domain/analysis/test-fixtures.ts` so later tests use the same contract.

- [ ] **Step 2: Run tests and confirm missing-module failures**

Run: `npm test -- src/domain/analysis`
Expected: FAIL because the schema and safety modules do not exist.

- [ ] **Step 3: Implement the Zod contract**

```ts
// src/domain/analysis/schema.ts
import { z } from "zod";

export const signalCategorySchema = z.enum([
  "urgency",
  "impersonation",
  "credential_request",
  "payment_request",
  "unverified_link",
  "other",
]);

export const analysisRequestSchema = z.object({
  message: z.string().trim().min(20).max(5000),
});

export const analysisResultSchema = z.object({
  version: z.literal("1"),
  riskLevel: z.enum(["low", "medium", "high"]),
  summary: z.string().trim().min(1).max(320),
  signals: z.array(z.object({
    quote: z.string().trim().min(1).max(180),
    category: signalCategorySchema,
    explanation: z.string().trim().min(1).max(280),
  })).max(5),
  actions: z.array(z.object({
    priority: z.number().int().min(1).max(4),
    title: z.string().trim().min(1).max(80),
    instruction: z.string().trim().min(1).max(240),
  })).min(2).max(4),
  limitations: z.array(z.string().trim().min(1).max(240)).min(1).max(3),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type SignalCategory = z.infer<typeof signalCategorySchema>;

export const analysisJsonSchema = {
  type: "object",
  properties: {
    version: { type: "string", enum: ["1"] },
    riskLevel: { type: "string", enum: ["low", "medium", "high"] },
    summary: { type: "string" },
    signals: { type: "array", items: { type: "object", properties: {
      quote: { type: "string" },
      category: { type: "string", enum: signalCategorySchema.options },
      explanation: { type: "string" },
    }, required: ["quote", "category", "explanation"] } },
    actions: { type: "array", items: { type: "object", properties: {
      priority: { type: "integer" }, title: { type: "string" }, instruction: { type: "string" },
    }, required: ["priority", "title", "instruction"] } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: ["version", "riskLevel", "summary", "signals", "actions", "limitations"],
} as const;
```

- [ ] **Step 4: Implement semantic validation**

Normalize whitespace and lowercase both sides before checking that every `signal.quote` occurs in the redacted input. Scan summary, signal explanations, action text, and limitations using `/\b(pasti aman|dijamin aman|pasti penipuan|dijamin penipuan|definitely safe|definitely fraudulent|bukan scam)\b/i`. Throw stable error codes `ABSOLUTE_VERDICT` and `EVIDENCE_NOT_IN_INPUT`.

- [ ] **Step 5: Verify the contract**

Run:

```bash
npm test -- src/domain/analysis
npm run typecheck
```

Expected: all tests pass.

- [ ] **Step 6: Log and commit**

Append the real contract-design prompt and verification outcome to the prompt log, then run:

```bash
git add src/domain/analysis docs/ai/PROMPT_LOG.md
git commit -m "feat: define safe analysis contract"
```

---

### Task 3: Build the Gemini analysis service and API boundary

**Files:**
- Create: `src/server/analysis/prompt.ts`
- Create: `src/server/analysis/model.ts`
- Create: `src/server/analysis/service.ts`
- Create: `src/server/analysis/errors.ts`
- Create: `src/app/api/analyze/route.ts`
- Test: `src/server/analysis/prompt.test.ts`
- Test: `src/server/analysis/service.test.ts`
- Test: `src/app/api/analyze/route.test.ts`
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Consumes: `analysisRequestSchema`, `analysisResultSchema`, `analysisJsonSchema`, `validateAnalysisSemantics`.
- Produces: `StructuredModel.generate(prompt, schema): Promise<string>`, `GeminiStructuredModel`, `buildAnalysisPrompt(redactedMessage)`, `analyzeMessage(redactedMessage, model): Promise<AnalysisResult>`, and `POST(request): Promise<Response>`.

- [ ] **Step 1: Write failing prompt and service tests**

Test that `buildAnalysisPrompt("klik [URL_1]")` contains the redacted input, the low/medium/high definitions, the five prohibited behaviors, and the instruction to quote only source text. Use a fake `StructuredModel` whose first response is invalid and second response is `JSON.stringify(validResult)`; assert `analyzeMessage` calls it twice and returns the parsed result. Add a second test where both attempts fail and assert `AnalysisUnavailableError`.

```ts
const model = {
  generate: vi.fn()
    .mockResolvedValueOnce("not-json")
    .mockResolvedValueOnce(JSON.stringify(validResult)),
};

await expect(analyzeMessage(redactedInput, model)).resolves.toEqual(validResult);
expect(model.generate).toHaveBeenCalledTimes(2);
```

- [ ] **Step 2: Run tests and confirm missing-module failures**

Run: `npm test -- src/server/analysis`
Expected: FAIL because the server modules do not exist.

- [ ] **Step 3: Implement the fixed Indonesian prompt**

```ts
// src/server/analysis/prompt.ts
export function buildAnalysisPrompt(redactedMessage: string) {
  return `Anda adalah mesin analisis risiko pesan untuk CekDulu.

Tugas Anda hanya menjelaskan sinyal yang terlihat pada teks. Anda tidak dapat
memastikan identitas pengirim atau menentukan bahwa pesan pasti aman/penipuan.

Definisi tingkat risiko:
- low: tidak ada sinyal kuat yang terlihat; pengguna tetap perlu memverifikasi.
- medium: ada sinyal yang meragukan atau belum dapat diverifikasi.
- high: ada gabungan tekanan, penyamaran identitas, permintaan kredensial/
  pembayaran, atau tautan tidak terverifikasi.

Aturan wajib:
1. Salin setiap quote persis dari pesan yang sudah disamarkan.
2. Jangan membuka atau menilai isi URL.
3. Jangan menebak pemilik nomor, rekening, atau identitas pengirim.
4. Jangan menciptakan nomor kontak resmi atau kesimpulan hukum.
5. Jangan menulis “pasti aman”, “pasti penipuan”, “dijamin aman”, atau padanannya.
6. Tindakan harus meminta pengguna mencari kanal resmi secara terpisah.
7. Gunakan Bahasa Indonesia sederhana dan keluarkan hanya struktur JSON yang diminta.

PESAN YANG SUDAH DISAMARKAN:
---
${redactedMessage}
---`;
}
```

- [ ] **Step 4: Implement the model adapter**

```ts
// src/server/analysis/model.ts
import { GoogleGenAI } from "@google/genai";

export interface StructuredModel {
  generate(prompt: string, schema: Record<string, unknown>): Promise<string>;
}

export class GeminiStructuredModel implements StructuredModel {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string, private readonly model = "gemini-3.6-flash") {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(prompt: string, schema: Record<string, unknown>) {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseFormat: { text: { mimeType: "application/json", schema } },
      },
    });
    if (!response.text) throw new Error("EMPTY_MODEL_RESPONSE");
    return response.text;
  }
}
```

- [ ] **Step 5: Implement parse, retry, and semantic validation**

```ts
// src/server/analysis/errors.ts
export class AnalysisUnavailableError extends Error {
  constructor() {
    super("ANALYSIS_UNAVAILABLE");
    this.name = "AnalysisUnavailableError";
  }
}
```

```ts
// src/server/analysis/service.ts
import { analysisJsonSchema, analysisResultSchema, type AnalysisResult } from "@/domain/analysis/schema";
import { validateAnalysisSemantics } from "@/domain/analysis/safety";
import { AnalysisUnavailableError } from "./errors";
import type { StructuredModel } from "./model";
import { buildAnalysisPrompt } from "./prompt";

export async function analyzeMessage(
  redactedMessage: string,
  model: StructuredModel,
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(redactedMessage);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await model.generate(prompt, analysisJsonSchema);
      const result = analysisResultSchema.parse(JSON.parse(raw));
      validateAnalysisSemantics(result, redactedMessage);
      return result;
    } catch {
      // The fixed second attempt is the only retry; no partial result escapes.
    }
  }

  throw new AnalysisUnavailableError();
}
```

- [ ] **Step 6: Write the failing Route Handler tests**

Mock `analyzeMessage` and test:

- malformed/short request → `400` with `{ status: "invalid_request" }`;
- valid request → `200` with `{ status: "ok", analysis }`;
- `AnalysisUnavailableError` → `503` with `{ status: "unavailable", message, safetySteps }`;
- fallback JSON has no `riskLevel` key.

- [ ] **Step 7: Implement the Route Handler**

Read `GEMINI_API_KEY` and optional `GEMINI_MODEL` server-side. Parse with `analysisRequestSchema`. On unavailable analysis, return these general steps:

1. `Jangan klik tautan atau mengirim data dari pesan tersebut.`
2. `Cari kanal resmi pihak terkait secara terpisah.`
3. `Jika sudah mentransfer, segera hubungi penyedia layanan keuangan dan IASC.`

Use `Cache-Control: no-store`. Do not log the request body.

```ts
// src/app/api/analyze/route.ts
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
```

- [ ] **Step 8: Verify, log, and commit**

Run:

```bash
npm test -- src/server/analysis src/app/api/analyze/route.test.ts
npm run typecheck
npm run lint
```

Append the real prompt/service iteration to the prompt log, then commit:

```bash
git add src/server src/app/api src/domain/analysis docs/ai/PROMPT_LOG.md
git commit -m "feat: add structured Gemini analysis endpoint"
```

---

### Task 4: Deliver Feature Zero through the built-in sample

**Files:**
- Create: `src/features/check-message/sample-message.ts`
- Create: `src/features/check-message/analysis-result-view.tsx`
- Create: `src/features/check-message/unavailable-state.tsx`
- Create: `src/features/check-message/check-message-flow.tsx`
- Test: `src/features/check-message/check-message-flow.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Consumes: `AnalysisResult`, `POST /api/analyze`.
- Produces: `SAMPLE_MESSAGE`, `AnalysisResultView`, `UnavailableState`, and the first end-to-end `CheckMessageFlow`.

- [ ] **Step 1: Add the synthetic demo message**

```ts
export const SAMPLE_MESSAGE = {
  label: "Contoh pesan kurir",
  redactedText:
    "Paket Anda akan dikembalikan hari ini. Klik [URL_1] sekarang dan konfirmasi data melalui [PHONE_1].",
} as const;
```

- [ ] **Step 2: Write the failing Feature Zero test**

Render `CheckMessageFlow`, click `Coba contoh pesan`, mock `fetch` with `{ status: "ok", analysis: validResult }`, and assert that the result shows `Risiko tinggi`, the exact evidence quote, and `Jangan klik`. Add a 503 response test that asserts general safety guidance is visible and no low/medium/high label is rendered.

- [ ] **Step 3: Run the test and confirm failure**

Run: `npm test -- src/features/check-message/check-message-flow.test.tsx`
Expected: FAIL because the feature components do not exist.

- [ ] **Step 4: Implement Feature Zero**

Use one client component with states `idle | analyzing | result | unavailable`. It posts `SAMPLE_MESSAGE.redactedText` to `/api/analyze`, renders a busy state with `aria-live="polite"`, and delegates successful and unavailable views to their dedicated components. Map `low`, `medium`, and `high` to `Risiko rendah`, `Risiko sedang`, and `Risiko tinggi`; never render a numeric confidence value.

- [ ] **Step 5: Style the approved visual hierarchy**

Implement the approved home headline, ivory paper, teal primary action, amber/high-risk badge, evidence cards with highlighted quotes, numbered action cards, privacy cue, and responsive one-column layout below 760 px. Respect `prefers-reduced-motion`.

The official action links to `https://iasc.ojk.go.id/`, opens in a new tab, and uses `rel="noreferrer"`. Its label is `Buka panduan resmi IASC`.

- [ ] **Step 6: Verify locally and deploy Feature Zero**

Run:

```bash
npm test -- src/features/check-message/check-message-flow.test.tsx
npm run typecheck
npm run lint
npm run build
npm run dev
```

In a fresh browser, confirm the built-in sample reaches a rendered result. Deploy this commit to the chosen Vercel project and verify the same public path before proceeding to Task 5.

- [ ] **Step 7: Log and commit**

```bash
git add src/features/check-message src/app docs/ai/PROMPT_LOG.md
git commit -m "feat: ship CekDulu feature zero"
```

---

### Task 5: Redact sensitive data deterministically in the browser

**Files:**
- Create: `src/features/message-input/redaction.ts`
- Test: `src/features/message-input/redaction.test.ts`
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Produces: `RedactionKind`, `RedactionSpan`, `RedactionResult`, and `redactSensitiveText(input): RedactionResult`.
- Consumed by: message review, request orchestration, privacy E2E test.

- [ ] **Step 1: Write failing redaction tests**

Cover these exact inputs:

```ts
it.each([
  ["Hubungi 0812-3456-7890", "Hubungi [PHONE_1]"],
  ["Telepon +62 812 3456 7890", "Telepon [PHONE_1]"],
  ["Kirim ke dana@contoh.id", "Kirim ke [EMAIL_1]"],
  ["Buka https://contoh.id/verifikasi?a=1", "Buka [URL_1]"],
  ["Transfer ke 1234567890123456", "Transfer ke [ACCOUNT_1]"],
])("redacts %s", (input, expected) => {
  expect(redactSensitiveText(input).redactedText).toBe(expected);
});
```

Also test repeated values receive stable numbered tokens, overlapping URL/email/phone matches are not double-redacted, and ordinary dates such as `10 Agustus 2026` remain unchanged.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- src/features/message-input/redaction.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement ordered, non-overlapping redaction**

```ts
// src/features/message-input/redaction.ts
export type RedactionKind = "URL" | "EMAIL" | "PHONE" | "ACCOUNT";

export type RedactionSpan = {
  kind: RedactionKind;
  token: string;
  original: string;
  start: number;
  end: number;
};

export type RedactionResult = { redactedText: string; spans: RedactionSpan[] };

const patterns: Array<{ kind: RedactionKind; precedence: number; regex: RegExp }> = [
  { kind: "URL", precedence: 0, regex: /https?:\/\/[^\s<>"']*[^\s<>"'.,!?;:]/gi },
  { kind: "EMAIL", precedence: 1, regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { kind: "PHONE", precedence: 2, regex: /(?<!\d)(?:\+62|62|0)8\d(?:[\s-]?\d){7,11}(?!\d)/g },
  { kind: "ACCOUNT", precedence: 3, regex: /(?<!\d)(?:\d[\s-]?){8,16}(?!\d)/g },
];

export function redactSensitiveText(input: string): RedactionResult {
  const candidates = patterns.flatMap(({ kind, precedence, regex }) =>
    Array.from(input.matchAll(new RegExp(regex.source, regex.flags))).map((match) => ({
      kind,
      precedence,
      original: match[0],
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    })),
  ).sort((a, b) => a.start - b.start || a.precedence - b.precedence || b.end - a.end);

  const accepted: typeof candidates = [];
  for (const candidate of candidates) {
    if (accepted.some((span) => candidate.start < span.end && candidate.end > span.start)) continue;
    accepted.push(candidate);
  }
  accepted.sort((a, b) => a.start - b.start);

  const counters: Record<RedactionKind, number> = { URL: 0, EMAIL: 0, PHONE: 0, ACCOUNT: 0 };
  const spans: RedactionSpan[] = [];
  let cursor = 0;
  let redactedText = "";

  for (const match of accepted) {
    counters[match.kind] += 1;
    const token = `[${match.kind}_${counters[match.kind]}]`;
    redactedText += input.slice(cursor, match.start) + token;
    spans.push({ kind: match.kind, token, original: match.original, start: match.start, end: match.end });
    cursor = match.end;
  }

  redactedText += input.slice(cursor);
  return { redactedText, spans };
}
```

- [ ] **Step 4: Add defense tests for values in surrounding punctuation**

Test parentheses around phone numbers, terminal punctuation after URLs, account digits separated by spaces, and a message containing all four kinds. Assert no original sensitive value appears in `redactedText`.

- [ ] **Step 5: Verify, log, and commit**

Run `npm test -- src/features/message-input/redaction.test.ts && npm run typecheck`. Append the real redaction iteration to the prompt log, then:

```bash
git add src/features/message-input/redaction.ts src/features/message-input/redaction.test.ts docs/ai/PROMPT_LOG.md
git commit -m "feat: add browser-side sensitive data redaction"
```

---

### Task 6: Add screenshot intake, local OCR, and review confirmation

**Files:**
- Create: `src/features/message-input/file-validation.ts`
- Create: `src/features/message-input/ocr.ts`
- Create: `src/features/message-input/message-intake.tsx`
- Create: `src/features/message-input/message-review.tsx`
- Test: `src/features/message-input/file-validation.test.ts`
- Test: `src/features/message-input/ocr.test.ts`
- Test: `src/features/message-input/message-intake.test.tsx`
- Test: `src/features/message-input/message-review.test.tsx`
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Consumes: `redactSensitiveText`.
- Produces: `validateImageFile(file)`, `recognizeMessageImage(file, onProgress)`, `MessageIntake`, and `MessageReview`.

- [ ] **Step 1: Write failing file-validation tests**

Accept `image/png` and `image/jpeg` files at or below `5 * 1024 * 1024` bytes. Reject GIF/PDF and larger files using stable codes `UNSUPPORTED_IMAGE_TYPE` and `IMAGE_TOO_LARGE`.

- [ ] **Step 2: Implement file validation and verify**

Run `npm test -- src/features/message-input/file-validation.test.ts`; implement the two checks; rerun until green.

- [ ] **Step 3: Write the failing OCR adapter test**

Inject a worker factory so the test can return a fake worker with `recognize` resolving to `{ data: { text: "Pesan hasil OCR" } }` and a spied `terminate`. Assert trimmed text is returned and `terminate` runs on success and failure.

- [ ] **Step 4: Implement local Tesseract OCR**

```ts
// src/features/message-input/ocr.ts
import { createWorker, OEM, type LoggerMessage, type Worker } from "tesseract.js";

type WorkerFactory = (
  languages: string[],
  oem: OEM,
  options: { logger: (message: LoggerMessage) => void },
) => Promise<Worker>;

export async function recognizeMessageImage(
  file: File,
  onProgress: (progress: number) => void = () => undefined,
  workerFactory: WorkerFactory = createWorker,
) {
  const worker = await workerFactory(["ind", "eng"], OEM.LSTM_ONLY, {
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        onProgress(message.progress);
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    const text = data.text.trim();
    if (!text) throw new Error("OCR_EMPTY");
    return text;
  } finally {
    await worker.terminate();
  }
}
```

Create the worker only inside the browser path. The file object is passed only to the Tesseract worker and never to `fetch`.

- [ ] **Step 5: Write failing intake and review component tests**

Test upload, paste-text selection, validation error copy, OCR progress, editable text, redaction preview tokens, and explicit `Konfirmasi dan periksa` action. Assert analysis cannot begin while the editable text is shorter than 20 characters.

- [ ] **Step 6: Implement the intake and review components**

`MessageIntake` owns only file/paste collection and reports `{ source: "image" | "text", text, file? }`. `MessageReview` owns editable local text, derives `RedactionResult`, shows token counts by type, and emits only `redactedText` after explicit confirmation. Never include `file` or raw text in its submit callback.

- [ ] **Step 7: Verify, log, and commit**

Run:

```bash
npm test -- src/features/message-input
npm run typecheck
npm run lint
```

Append the OCR/privacy interaction to the prompt log, then:

```bash
git add src/features/message-input docs/ai/PROMPT_LOG.md
git commit -m "feat: add private screenshot OCR and review"
```

---

### Task 7: Integrate the complete intake-to-result state machine

**Files:**
- Create: `src/features/check-message/use-check-message-flow.ts`
- Test: `src/features/check-message/use-check-message-flow.test.ts`
- Modify: `src/features/check-message/check-message-flow.tsx`
- Modify: `src/features/check-message/check-message-flow.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Consumes: `MessageIntake`, `MessageReview`, `AnalysisResultView`, `UnavailableState`, `POST /api/analyze`.
- Produces: explicit stages `intake | extracting | review | analyzing | result | unavailable` and transitions `startOcr`, `reviewText`, `confirmRedactedText`, `resolveAnalysis`, `showUnavailable`, `retry`, and `reset`.

- [ ] **Step 1: Write failing state-transition tests**

Test these sequences:

```text
intake -> extracting -> review -> analyzing -> result -> intake
intake -> review -> analyzing -> unavailable -> analyzing
extracting -> intake with OCR error copy and paste-text recovery
```

Assert `reset` clears all raw, redacted, and result state.

- [ ] **Step 2: Run the hook test and confirm failure**

Run: `npm test -- src/features/check-message/use-check-message-flow.test.ts`
Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the explicit reducer-backed hook**

Start with this discriminated union and reducer contract:

```ts
type FlowState =
  | { stage: "intake"; error?: string }
  | { stage: "extracting"; progress: number }
  | { stage: "review"; rawText: string }
  | { stage: "analyzing"; redactedText: string }
  | { stage: "result"; analysis: AnalysisResult }
  | { stage: "unavailable"; redactedText: string; message: string; safetySteps: string[] };

type FlowEvent =
  | { type: "START_OCR" }
  | { type: "OCR_PROGRESS"; progress: number }
  | { type: "OCR_FAILED"; error: string }
  | { type: "REVIEW_TEXT"; rawText: string }
  | { type: "CONFIRM_REDACTED"; redactedText: string }
  | { type: "RESOLVE"; analysis: AnalysisResult }
  | { type: "UNAVAILABLE"; redactedText: string; message: string; safetySteps: string[] }
  | { type: "RETRY" }
  | { type: "RESET" };

function reducer(state: FlowState, event: FlowEvent): FlowState {
  switch (event.type) {
    case "START_OCR": return { stage: "extracting", progress: 0 };
    case "OCR_PROGRESS": return state.stage === "extracting" ? { ...state, progress: event.progress } : state;
    case "OCR_FAILED": return { stage: "intake", error: event.error };
    case "REVIEW_TEXT": return { stage: "review", rawText: event.rawText };
    case "CONFIRM_REDACTED": return { stage: "analyzing", redactedText: event.redactedText };
    case "RESOLVE": return { stage: "result", analysis: event.analysis };
    case "UNAVAILABLE": return { stage: "unavailable", redactedText: event.redactedText, message: event.message, safetySteps: event.safetySteps };
    case "RETRY": return state.stage === "unavailable" ? { stage: "analyzing", redactedText: state.redactedText } : state;
    case "RESET": return { stage: "intake" };
  }
}
```

Expose command functions around `dispatch`; do not expose raw `dispatch` to UI components. The `analyzing` state contains redacted text but never a `File`; `result` contains only `AnalysisResult`.

- [ ] **Step 4: Write the failing integrated-flow tests**

Mock OCR and `fetch`. Verify screenshot upload → OCR text → user correction → `[PHONE_1]` preview → confirmation → request body contains only the redacted message → result. Add paste-text, retry, reset, and built-in-sample paths.

- [ ] **Step 5: Integrate the screens**

Compose exactly one active stage at a time. Keep raw OCR text inside the browser state. Post `{ message: redactedText }` with `Content-Type: application/json`, `cache: "no-store"`, and an `AbortController` timeout of 15 seconds. A timeout transitions to `unavailable` with no risk level.

- [ ] **Step 6: Verify, log, and commit**

Run:

```bash
npm test -- src/features/check-message
npm run typecheck
npm run lint
npm run build
```

Append the integration prompt and verification to the prompt log, then:

```bash
git add src/features/check-message src/app docs/ai/PROMPT_LOG.md
git commit -m "feat: complete CekDulu message-check flow"
```

---

### Task 8: Polish accessibility, responsive behavior, and browser privacy evidence

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/features/check-message/analysis-result-view.tsx`
- Modify: `src/features/check-message/unavailable-state.tsx`
- Modify: `src/features/message-input/message-intake.tsx`
- Modify: `src/features/message-input/message-review.tsx`
- Create: `e2e/core-flow.spec.ts`
- Create: `e2e/accessibility.spec.ts`
- Create: `e2e/privacy-boundary.spec.ts`
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Consumes: the complete public UI and `/api/analyze` request.
- Produces: verified desktop/mobile interaction, accessibility evidence, and proof that raw sensitive values do not cross the request boundary.

- [ ] **Step 1: Write the failing core-flow E2E test**

Intercept `/api/analyze`, return `validResult`, click the built-in example, and assert the result heading, evidence, action, and limitation appear. Run the same scenario in desktop and mobile projects.

- [ ] **Step 2: Write the failing privacy-boundary E2E test**

Paste `Hubungi 0812-3456-7890 atau buka https://contoh.id/verifikasi sekarang`, confirm review, capture the intercepted POST body, and assert it contains `[PHONE_1]` and `[URL_1]` but neither original value. Do not send the intercepted request to the real API.

- [ ] **Step 3: Write the failing accessibility test**

Use `@axe-core/playwright` on intake, review, result, and unavailable screens. Assert no serious or critical violations. Also assert keyboard focus moves to the new screen heading after each stage transition and the analyzing state announces progress via `aria-live`.

- [ ] **Step 4: Implement accessibility and responsive fixes**

Use semantic headings, labels, buttons, `fieldset` where appropriate, visible focus rings, minimum 44 px interactive targets, warning text in addition to color, and a single-column mobile layout. Keep body text at least 16 px on mobile. Disable nonessential motion under `prefers-reduced-motion: reduce`.

- [ ] **Step 5: Verify, log, and commit**

Run:

```bash
npm run test:e2e
npm test
npm run typecheck
npm run lint
npm run build
```

Append the UI/QA prompt and evidence to the prompt log, then:

```bash
git add src e2e docs/ai/PROMPT_LOG.md
git commit -m "test: verify accessible private browser flow"
```

---

### Task 9: Build the unbiased development and holdout evaluation harness

**Files:**
- Create: `evaluation/dataset-schema.ts`
- Create: `evaluation/development.json`
- Local only: `evaluation/holdout.private.json`
- Create: `scripts/validate-evaluation-dataset.ts`
- Create: `scripts/evaluate.ts`
- Test: `scripts/validate-evaluation-dataset.test.ts`
- Test: `scripts/evaluate.test.ts`
- Modify: `.gitignore`
- Modify: `docs/ai/PROMPT_LOG.md`

**Interfaces:**
- Consumes: `POST /api/analyze` and the five approved message categories.
- Produces: validated dataset files and a JSON/Markdown result containing schema-valid count and expected-classification agreement.

- [ ] **Step 1: Define and test the dataset contract**

```ts
export const evaluationCategorySchema = z.enum([
  "clearly_suspicious",
  "subtle_manipulation",
  "ambiguous",
  "legitimate_urgency",
  "normal",
]);

export const evaluationCaseSchema = z.object({
  id: z.string().regex(/^(dev|holdout)-\d{2}$/),
  category: evaluationCategorySchema,
  message: z.string().min(20).max(5000),
  expectedRisk: z.enum(["low", "medium", "high"]),
  rationale: z.string().min(20),
});

export type EvaluationCategory = z.infer<typeof evaluationCategorySchema>;
export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;
```

Test that the development set requires exactly 10 unique messages with two cases per category, and the holdout set requires exactly 15 unique messages with three cases per category. Reject duplicate normalized message text across development and holdout inputs.

- [ ] **Step 2: Create the development fixtures**

Use these ten synthetic cases. They contain no real phone, bank, or personal data and may be inspected during prompt tuning:

```json
[
  {
    "id": "dev-01",
    "category": "clearly_suspicious",
    "message": "Paket Anda gagal dikirim. Klik [URL_1] sekarang dan kirim kode OTP agar paket tidak dimusnahkan.",
    "expectedRisk": "high",
    "rationale": "Menggabungkan tekanan waktu, tautan tidak terverifikasi, dan permintaan kredensial rahasia."
  },
  {
    "id": "dev-02",
    "category": "clearly_suspicious",
    "message": "Rekening Anda diblokir malam ini. Transfer biaya verifikasi ke [ACCOUNT_1] lalu hubungi [PHONE_1].",
    "expectedRisk": "high",
    "rationale": "Mengatasnamakan bank, mengancam pemblokiran, dan meminta transfer ke rekening melalui pesan."
  },
  {
    "id": "dev-03",
    "category": "subtle_manipulation",
    "message": "Ini nomor baru Kakak. Tolong belikan pulsa sekarang, nanti sore langsung Kakak ganti uangnya.",
    "expectedRisk": "medium",
    "rationale": "Memakai kedekatan palsu dan permintaan mendesak, tetapi tidak menyertakan tautan atau kredensial."
  },
  {
    "id": "dev-04",
    "category": "subtle_manipulation",
    "message": "Agar pesanan marketplace lebih cepat, lanjutkan pembayaran di luar aplikasi melalui [URL_1].",
    "expectedRisk": "high",
    "rationale": "Mendorong pengguna keluar dari perlindungan platform dan menuju tautan yang tidak terverifikasi."
  },
  {
    "id": "dev-05",
    "category": "ambiguous",
    "message": "Kami sedang mengumpulkan donasi untuk korban banjir. Informasi dan rekening tersedia di [URL_1].",
    "expectedRisk": "medium",
    "rationale": "Tujuannya mungkin sah, tetapi identitas penggalang dan tautan belum dapat diverifikasi dari pesan."
  },
  {
    "id": "dev-06",
    "category": "ambiguous",
    "message": "Panitia mengingatkan formulir kegiatan ditutup besok. Silakan isi melalui [URL_1] jika belum mendaftar.",
    "expectedRisk": "medium",
    "rationale": "Ada tenggat dan tautan, namun tidak ada permintaan uang atau data rahasia yang eksplisit."
  },
  {
    "id": "dev-07",
    "category": "legitimate_urgency",
    "message": "Penerbangan Anda hari ini berubah jadwal. Periksa pembaruan langsung melalui aplikasi resmi maskapai.",
    "expectedRisk": "low",
    "rationale": "Pesan mendesak tetapi mengarahkan pengguna memeriksa aplikasi resmi tanpa tautan atau permintaan data."
  },
  {
    "id": "dev-08",
    "category": "legitimate_urgency",
    "message": "Pengisian mata kuliah ditutup pukul 16.00. Masuk melalui portal kampus yang biasa Anda gunakan.",
    "expectedRisk": "low",
    "rationale": "Memuat tenggat yang wajar dan meminta penggunaan portal yang sudah dikenal, bukan tautan dalam pesan."
  },
  {
    "id": "dev-09",
    "category": "normal",
    "message": "Rapat keluarga dilaksanakan Minggu pukul 10.00 di rumah Nenek. Mohon kabari jika tidak bisa hadir.",
    "expectedRisk": "low",
    "rationale": "Pesan informasional tanpa tautan, uang, kredensial, penyamaran identitas, atau tekanan manipulatif."
  },
  {
    "id": "dev-10",
    "category": "normal",
    "message": "Paket telah tiba di pusat distribusi dan diperkirakan dikirim besok. Tidak ada tindakan yang diperlukan.",
    "expectedRisk": "low",
    "rationale": "Hanya memberi pembaruan status dan secara eksplisit tidak meminta tindakan dari penerima."
  }
]
```

Validate them with `npm run eval:validate -- --development evaluation/development.json`.

- [ ] **Step 3: Protect the holdout boundary**

Add `evaluation/holdout.private.json` to `.gitignore`. After the prompt is frozen, Nata creates the 15-case holdout file independently using the exact schema and 3-per-category distribution. Wira and the prompt-building workflow do not inspect its message contents before the official run. The validator receives both paths only to reject overlap; it does not print message bodies.

- [ ] **Step 4: Write the failing evaluation-runner test**

Mock endpoint responses for three cases and assert the report contains:

```json
{
  "total": 3,
  "schemaValid": 3,
  "expectedClassificationAgreement": { "count": 2, "total": 3 },
  "claimLabel": "Agreement with team expected classification; not fraud-detection accuracy"
}
```

Assert unavailable responses are counted separately and never coerced into a risk class.

- [ ] **Step 5: Implement the evaluation runner**

Accept `--dataset`, `--base-url`, and `--output` arguments using `node:util.parseArgs`. Validate input cases, POST each message sequentially to `${baseUrl}/api/analyze`, validate successful responses with `analysisResultSchema`, and write both JSON and adjacent Markdown summaries. The Markdown heading must use `Expected-classification agreement`, not `Accuracy`.

Use this report contract and per-case loop:

```ts
type EvaluationRecord = {
  id: string;
  category: EvaluationCategory;
  expectedRisk: "low" | "medium" | "high";
  actualRisk: "low" | "medium" | "high" | null;
  schemaValid: boolean;
  unavailable: boolean;
  agreesWithExpected: boolean;
};

const records: EvaluationRecord[] = [];
for (const testCase of dataset) {
  const response = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: testCase.message }),
  });
  const payload: unknown = await response.json();
  const successful = z.object({ status: z.literal("ok"), analysis: analysisResultSchema }).safeParse(payload);
  records.push({
    id: testCase.id,
    category: testCase.category,
    expectedRisk: testCase.expectedRisk,
    actualRisk: successful.success ? successful.data.analysis.riskLevel : null,
    schemaValid: successful.success,
    unavailable: !successful.success,
    agreesWithExpected: successful.success && successful.data.analysis.riskLevel === testCase.expectedRisk,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  total: records.length,
  schemaValid: records.filter((record) => record.schemaValid).length,
  unavailable: records.filter((record) => record.unavailable).length,
  expectedClassificationAgreement: {
    count: records.filter((record) => record.agreesWithExpected).length,
    total: records.length,
  },
  claimLabel: "Agreement with team expected classification; not fraud-detection accuracy",
  records,
};
```

- [ ] **Step 6: Run development evaluation only**

Run:

```bash
npm test -- scripts
npm run eval:validate -- --development evaluation/development.json
npm run eval -- --dataset evaluation/development.json --base-url http://127.0.0.1:3000 --output evaluation/results/development.json
```

Use development results for tuning. Do not run the private holdout until the scheduled official checkpoint.

- [ ] **Step 7: Log and commit**

```bash
git add evaluation/dataset-schema.ts evaluation/development.json scripts .gitignore docs/ai/PROMPT_LOG.md
git commit -m "test: add unbiased CekDulu evaluation harness"
```

At the official checkpoint, run the private holdout exactly once and commit only its aggregate result plus a hash of the private dataset, not the private message bodies.

---

### Task 10: Finish documentation, deployment, and demo readiness

**Files:**
- Create: `.env.example`
- Create: `README.md`
- Create: `docs/DEMO.md`
- Create: `docs/PRIVACY.md`
- Modify: `docs/ai/PROMPT_LOG.md`
- Modify: `HACKATHON.md`

**Interfaces:**
- Consumes: all verified commands, deployed URL, prompt evidence, and aggregate evaluation output.
- Produces: reproducible setup, truthful privacy copy, timed demo, and submission-ready links.

- [ ] **Step 1: Define the environment contract**

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

Document that the key is server-only and must be set in the deployment dashboard, never exposed through a `NEXT_PUBLIC_` variable.

- [ ] **Step 2: Write the README**

Include: product promise, architecture diagram, prerequisites (Node 26/npm 12), installation, environment setup, all npm commands, privacy boundary, error behavior, evaluation claim wording, deployment steps, and official IASC/OJK source links. State explicitly that CekDulu is not affiliated with WhatsApp, banks, OJK, or IASC.

- [ ] **Step 3: Write the 2–3 minute demo choreography**

Use this sequence in `docs/DEMO.md`:

1. 0:00–0:20 — introduce Ibu Rina and the urgent message.
2. 0:20–0:45 — upload the synthetic screenshot and show local OCR.
3. 0:45–1:05 — correct one deliberate OCR error and confirm redaction.
4. 1:05–1:35 — run analysis and show the risk heading.
5. 1:35–2:05 — point to two evidence quotes and their explanations.
6. 2:05–2:25 — follow verification actions and official guidance.
7. 2:25–2:40 — state privacy and no-definitive-verdict boundaries.

Add a separate timeout rehearsal that shows general guidance without a risk level.

- [ ] **Step 4: Verify privacy claims against network behavior**

Document the tested facts only: screenshot handled by browser OCR, editable raw text retained in component memory, confirmed redacted text sent to same-origin API, no database, no request-body logging, and no URL fetch. Do not claim end-to-end encryption or permanent deletion guarantees that were not implemented and verified.

- [ ] **Step 5: Run the full release gate**

Run:

```bash
npm test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

Expected: tests, typecheck, lint, and build exit 0; any production audit finding is documented and resolved or explicitly risk-assessed before submission.

- [ ] **Step 6: Deploy and fresh-browser verify**

Set `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3.6-flash` in Vercel, deploy the release commit, then use an incognito browser to run the built-in sample, screenshot path, paste path, timeout rehearsal, mobile layout, official link, and reset flow. Record the deployed version for the backup video.

Create or reuse the Vercel project named `cekdulu`; use `npx vercel --prod` after the environment variables are configured.

- [ ] **Step 7: Reconcile proposal and shipped product**

Update the alignment section in `HACKATHON.md` so each proposal claim points to a screen, test, and live demo step. Remove any proposal claim whose feature was cut. Preserve the known organizer ambiguities without presenting an assumption as an official resolution.

- [ ] **Step 8: Log the final verification and commit**

```bash
git add .env.example README.md docs HACKATHON.md
git commit -m "docs: prepare CekDulu demo and deployment"
```

Record the release commit hash, deployment URL, demo-video link, proposal PDF, prompt-evidence link, aggregate holdout result, and Instagram link in the submission checklist without committing secrets.
