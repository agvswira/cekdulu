import { expect, test } from "@playwright/test";
import { validResult } from "../src/domain/analysis/test-fixtures";

test("built-in sample renders the complete structured result", async ({ page }) => {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok", analysis: validResult }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Coba contoh pesan" }).click();

  await expect(page.getByRole("heading", { name: "Risiko tinggi" })).toBeVisible();
  await expect(page.getByText("klik [URL_1] sekarang")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jangan klik" })).toBeVisible();
  await expect(
    page.getByText("CekDulu tidak dapat memastikan identitas pengirim."),
  ).toBeVisible();
});

test("analysis spinner is centered 20px above its label", async ({ page }) => {
  await page.route("**/api/analyze", async () => {
    await new Promise(() => undefined);
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Coba contoh pesan" }).click();

  const heading = page.getByRole("heading", { name: "Menganalisis pesan…" });
  await expect(heading).toBeVisible();

  const geometry = await page.getByRole("status").evaluate((card) => {
    const spinner = card.querySelector<HTMLElement>(".loadingMark");
    const label = Array.from(card.querySelectorAll<HTMLElement>("p")).find(
      (element) => element.textContent === "CekDulu sedang bekerja",
    );

    if (!spinner || !label) {
      throw new Error("Analysis loading geometry elements were not found");
    }

    const cardRect = card.getBoundingClientRect();
    const spinnerRect = spinner.getBoundingClientRect();

    return {
      hasAnalysisModifier: card.classList.contains("loadingState--analysis"),
      centerDelta:
        spinnerRect.left + spinnerRect.width / 2 -
        (cardRect.left + cardRect.width / 2),
      gap: label.offsetTop - (spinner.offsetTop + spinner.offsetHeight),
    };
  });

  expect(geometry.hasAnalysisModifier).toBe(true);
  expect(Math.abs(geometry.centerDelta)).toBeLessThanOrEqual(1);
  expect(geometry.gap).toBeCloseTo(20, 0);
});
