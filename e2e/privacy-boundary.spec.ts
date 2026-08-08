import { expect, test } from "@playwright/test";
import { validResult } from "../src/domain/analysis/test-fixtures";

const rawPhone = "0812-3456-7890";
const rawUrl = "https://contoh.id/verifikasi";
const rawMessage = `Hubungi ${rawPhone} atau buka ${rawUrl} sekarang`;

test("only confirmed redacted text crosses the intercepted API boundary", async ({ page }) => {
  let capturedBody: unknown;
  await page.route("**/api/analyze", async (route) => {
    capturedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok", analysis: validResult }),
    });
  });

  await page.goto("/");
  await page.getByRole("radio", { name: "Tempel teks" }).check();
  await page.getByLabel("Teks pesan").fill(rawMessage);
  await page.getByRole("button", { name: "Tinjau pesan" }).click();

  await expect(page.getByLabel("Pratinjau teks tersamarkan")).toContainText(
    "Hubungi [PHONE_1] atau buka [URL_1] sekarang",
  );
  await page.getByRole("button", { name: "Konfirmasi dan periksa" }).click();
  await expect(page.getByRole("heading", { name: "Risiko tinggi" })).toBeVisible();

  expect(capturedBody).toEqual({
    message: "Hubungi [PHONE_1] atau buka [URL_1] sekarang",
  });
  const serializedBody = JSON.stringify(capturedBody);
  expect(serializedBody).toContain("[PHONE_1]");
  expect(serializedBody).toContain("[URL_1]");
  expect(serializedBody).not.toContain(rawPhone);
  expect(serializedBody).not.toContain(rawUrl);
});
