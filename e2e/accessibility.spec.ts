import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { validResult } from "../src/domain/analysis/test-fixtures";

const pastedMessage =
  "Hubungi 0812-3456-7890 atau buka https://contoh.id/verifikasi sekarang";
const unavailableResponse = {
  status: "unavailable",
  message: "Analisis AI sedang tidak tersedia.",
  safetySteps: [
    "Jangan klik tautan atau mengirim data dari pesan tersebut.",
    "Cari kanal resmi pihak terkait secara terpisah.",
    "Jika sudah mentransfer, segera hubungi penyedia layanan keuangan dan IASC.",
  ],
};

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

async function expectVisibleTouchTargets(page: Page) {
  const touchTargets = await page
    .locator("header a, main a, main button, main input[type=file], main fieldset label")
    .evaluateAll((targets) => targets.map((target) => {
      const box = target.getBoundingClientRect();
      return {
        name: `${target.tagName.toLowerCase()} ${target.textContent?.trim() ?? ""}`.trim(),
        height: box.height,
        width: box.width,
      };
    }));
  for (const target of touchTargets) {
    expect(target.height, target.name).toBeGreaterThanOrEqual(44);
    expect(target.width, target.name).toBeGreaterThanOrEqual(44);
  }
}

async function expectReadableMobileText(page: Page) {
  const textSizes = await page
    .locator(
      ".privacyCue, .eyebrow, .sectionKicker, .sampleMessage span, .samplePrivacy, .signalCategory",
    )
    .evaluateAll((elements) => elements.map((element) => ({
      name: element.textContent?.trim() ?? element.className,
      pixels: Number.parseFloat(getComputedStyle(element).fontSize),
    })));
  for (const text of textSizes) {
    expect(text.pixels, text.name).toBeGreaterThanOrEqual(16);
  }
}

test("intake, review, analyzing, and result are accessible with managed focus", async ({
  page,
}, testInfo) => {
  let releaseAnalysis: (() => void) | undefined;
  const analysisGate = new Promise<void>((resolve) => {
    releaseAnalysis = resolve;
  });
  await page.route("**/api/analyze", async (route) => {
    await analysisGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok", analysis: validResult }),
    });
  });

  await page.goto("/");
  await expect(page.locator("body")).toBeFocused();
  await expectNoSeriousAxeViolations(page);

  await page.getByRole("radio", { name: "Tempel teks" }).check();
  await page.getByLabel("Teks pesan").fill(pastedMessage);
  await page.getByRole("button", { name: "Tinjau pesan" }).click();

  const reviewHeading = page.getByRole("heading", { name: "Tinjau dan samarkan" });
  await expect(reviewHeading).toBeFocused();
  await expectNoSeriousAxeViolations(page);

  await page.getByRole("button", { name: "Konfirmasi dan periksa" }).click();
  const analyzingStatus = page.getByRole("status");
  await expect(analyzingStatus).toHaveAttribute("aria-live", "polite");
  const analyzingHeading = page.getByRole("heading", { name: "Menganalisis pesan…" });
  await expect(analyzingHeading).toBeFocused();

  releaseAnalysis?.();
  const resultHeading = page.getByRole("heading", { name: "Risiko tinggi" });
  await expect(resultHeading).toBeFocused();
  await expectNoSeriousAxeViolations(page);
  if (testInfo.project.name === "mobile") {
    await expectVisibleTouchTargets(page);
    await expectReadableMobileText(page);
  }

  await page.getByRole("button", { name: "Periksa pesan lain" }).click();
  await expect(page.getByRole("heading", { name: "Periksa pesan" })).toBeFocused();
});

test("unavailable guidance is accessible, focused, and classification-free", async ({
  page,
}) => {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify(unavailableResponse),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Coba contoh pesan" }).click();

  const unavailableHeading = page.getByRole("heading", {
    name: "Analisis belum tersedia",
  });
  await expect(unavailableHeading).toBeFocused();
  await expect(page.getByText(/Risiko (rendah|sedang|tinggi)/i)).toHaveCount(0);
  await expectNoSeriousAxeViolations(page);
});

test("mobile intake and review keep readable text, touch targets, and no overflow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile layout assertion");

  await page.goto("/");
  await expectVisibleTouchTargets(page);
  await expectReadableMobileText(page);

  const introBox = await page.locator(".heroIntro").boundingBox();
  const panelBox = await page.locator(".checkPanel").boundingBox();
  expect(panelBox?.y).toBeGreaterThan(introBox?.y ?? 0);

  await page.getByRole("radio", { name: "Tempel teks" }).check();
  await page.getByLabel("Teks pesan").fill(pastedMessage);
  await page.getByRole("button", { name: "Tinjau pesan" }).click();
  await expectVisibleTouchTargets(page);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("reduced motion disables the loading spinner", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/analyze", async () => {
    await new Promise(() => undefined);
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Coba contoh pesan" }).click();

  await expect(page.locator(".loadingMark")).toHaveCSS("animation-name", "none");
});
