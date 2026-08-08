import { describe, expect, it } from "vitest";
import { redactSensitiveText } from "./redaction";

describe("redactSensitiveText", () => {
  it.each([
    ["Hubungi 0812-3456-7890", "Hubungi [PHONE_1]"],
    ["Telepon +62 812 3456 7890", "Telepon [PHONE_1]"],
    ["Kirim ke dana@contoh.id", "Kirim ke [EMAIL_1]"],
    ["Buka https://contoh.id/verifikasi?a=1", "Buka [URL_1]"],
    ["Transfer ke 1234567890123456", "Transfer ke [ACCOUNT_1]"],
  ])("redacts %s", (input, expected) => {
    expect(redactSensitiveText(input).redactedText).toBe(expected);
  });

  it("numbers repeated values in stable source order", () => {
    const result = redactSensitiveText(
      "Hubungi 0812-3456-7890 lalu 0812-3456-7890.",
    );

    expect(result.redactedText).toBe("Hubungi [PHONE_1] lalu [PHONE_2].");
    expect(result.spans.map(({ token, original }) => ({ token, original }))).toEqual([
      { token: "[PHONE_1]", original: "0812-3456-7890" },
      { token: "[PHONE_2]", original: "0812-3456-7890" },
    ]);
  });

  it("uses URL precedence instead of double-redacting nested sensitive text", () => {
    const input = "Buka https://contoh.id/dana@contoh.id/081234567890";
    const result = redactSensitiveText(input);

    expect(result.redactedText).toBe("Buka [URL_1]");
    expect(result.spans).toEqual([{
      kind: "URL",
      token: "[URL_1]",
      original: "https://contoh.id/dana@contoh.id/081234567890",
      start: 5,
      end: 50,
    }]);
  });

  it("leaves ordinary Indonesian dates unchanged", () => {
    expect(redactSensitiveText("Batas waktu 10 Agustus 2026")).toEqual({
      redactedText: "Batas waktu 10 Agustus 2026",
      spans: [],
    });
  });

  it.each([
    ["Hubungi (0812-3456-7890).", "Hubungi ([PHONE_1])."],
    ["Buka https://contoh.id/verifikasi.", "Buka [URL_1]."],
    ["Transfer ke 1234 5678 9012 3456.", "Transfer ke [ACCOUNT_1]."],
  ])("preserves surrounding punctuation in %s", (input, expected) => {
    expect(redactSensitiveText(input).redactedText).toBe(expected);
  });

  it("removes every original sensitive value from a message containing all four kinds", () => {
    const sensitiveValues = [
      "https://contoh.id/verifikasi",
      "dana@contoh.id",
      "0812-3456-7890",
      "1234 5678 9012 3456",
    ];
    const result = redactSensitiveText(
      `Buka ${sensitiveValues[0]}, email ${sensitiveValues[1]}, telepon ${sensitiveValues[2]}, transfer ${sensitiveValues[3]}.`,
    );

    expect(result.redactedText).toBe(
      "Buka [URL_1], email [EMAIL_1], telepon [PHONE_1], transfer [ACCOUNT_1].",
    );
    expect(result.spans.map(({ kind, token }) => ({ kind, token }))).toEqual([
      { kind: "URL", token: "[URL_1]" },
      { kind: "EMAIL", token: "[EMAIL_1]" },
      { kind: "PHONE", token: "[PHONE_1]" },
      { kind: "ACCOUNT", token: "[ACCOUNT_1]" },
    ]);
    for (const sensitiveValue of sensitiveValues) {
      expect(result.redactedText).not.toContain(sensitiveValue);
    }
  });

  it.each([
    "0812 3456 7890 1234",
    "6281 2345 6789 0123",
  ])("does not partially classify a 16-digit account as phone: %s", (account) => {
    expect(redactSensitiveText(`Transfer ke ${account}`).redactedText).toBe(
      "Transfer ke [ACCOUNT_1]",
    );
  });

  it("preserves the separator between an account and following text", () => {
    expect(redactSensitiveText("Transfer ke 1234 5678 sekarang").redactedText).toBe(
      "Transfer ke [ACCOUNT_1] sekarang",
    );
  });

  it("preserves closing punctuation around a URL", () => {
    const result = redactSensitiveText("Buka (https://contoh.id).");

    expect(result.redactedText).toBe("Buka ([URL_1]).");
    expect(result.spans[0]?.original).toBe("https://contoh.id");
  });
});
