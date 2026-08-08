import { describe, expect, it } from "vitest";
import { validateImageFile } from "./file-validation";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function imageFile(type: string, size: number) {
  return new File([new Uint8Array(size)], "pesan", { type });
}

describe("validateImageFile", () => {
  it.each(["image/png", "image/jpeg"])("accepts %s images at the size limit", (type) => {
    expect(validateImageFile(imageFile(type, MAX_IMAGE_BYTES))).toEqual({ valid: true });
  });

  it.each(["image/gif", "application/pdf"])("rejects unsupported type %s", (type) => {
    expect(validateImageFile(imageFile(type, 100))).toEqual({
      valid: false,
      code: "UNSUPPORTED_IMAGE_TYPE",
    });
  });

  it("rejects supported images larger than 5 MiB", () => {
    expect(validateImageFile(imageFile("image/png", MAX_IMAGE_BYTES + 1))).toEqual({
      valid: false,
      code: "IMAGE_TOO_LARGE",
    });
  });
});
