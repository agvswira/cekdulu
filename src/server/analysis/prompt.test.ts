import { describe, expect, it } from "vitest";
import { buildAnalysisPrompt } from "./prompt";

describe("buildAnalysisPrompt", () => {
  it("includes the redacted input and risk definitions", () => {
    const prompt = buildAnalysisPrompt("klik [URL_1]");

    expect(prompt).toContain("klik [URL_1]");
    expect(prompt).toContain("low: tidak ada sinyal kuat");
    expect(prompt).toContain("medium: ada sinyal yang meragukan");
    expect(prompt).toContain("high: ada gabungan tekanan");
  });

  it.each([
    "tidak dapat memastikan identitas pengirim",
    "Jangan membuka atau menilai isi URL",
    "Jangan menebak pemilik nomor, rekening, atau identitas pengirim",
    "Jangan menciptakan nomor kontak resmi atau kesimpulan hukum",
    "Jangan menulis “pasti aman”, “pasti penipuan”, “dijamin aman”",
  ])("includes a prohibited behavior: %s", (instruction) => {
    expect(buildAnalysisPrompt("klik [URL_1]")).toContain(instruction);
  });

  it("instructs the model to quote only the redacted source text", () => {
    expect(buildAnalysisPrompt("klik [URL_1]")).toContain(
      "Salin setiap quote persis dari pesan yang sudah disamarkan.",
    );
  });
});
