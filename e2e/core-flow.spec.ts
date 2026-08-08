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
