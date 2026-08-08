export type ImageValidationErrorCode =
  | "UNSUPPORTED_IMAGE_TYPE"
  | "IMAGE_TOO_LARGE";

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; code: ImageValidationErrorCode };

const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): ImageValidationResult {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return { valid: false, code: "UNSUPPORTED_IMAGE_TYPE" };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, code: "IMAGE_TOO_LARGE" };
  }

  return { valid: true };
}
