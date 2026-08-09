import { OpenAICompatibleStructuredModel } from "./external-model";
import { GeminiStructuredModel, type StructuredModel } from "./model";

type AnalysisEnvironment = Record<string, string | undefined>;

function configured(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function validBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  } catch {
    return false;
  }
}

function optionalBoolean(value: string | undefined): boolean | undefined | null {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

export function createAnalysisModel(
  environment: AnalysisEnvironment = process.env,
): StructuredModel | null {
  if (environment.AI_PROVIDER === "gemini") {
    const apiKey = configured(environment.GEMINI_API_KEY);
    if (!apiKey) return null;
    return new GeminiStructuredModel(apiKey, configured(environment.GEMINI_MODEL));
  }

  if (environment.AI_PROVIDER === "external") {
    const baseUrl = configured(environment.AI_BASE_URL);
    const apiKey = configured(environment.AI_API_KEY);
    const model = configured(environment.AI_MODEL);
    const enableThinking = optionalBoolean(environment.AI_ENABLE_THINKING);
    if (
      !baseUrl
      || !apiKey
      || !model
      || !validBaseUrl(baseUrl)
      || enableThinking === null
    ) return null;
    return new OpenAICompatibleStructuredModel({
      baseUrl,
      apiKey,
      model,
      enableThinking,
    });
  }

  return null;
}
