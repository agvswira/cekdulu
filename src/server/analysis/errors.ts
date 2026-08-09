export class AnalysisUnavailableError extends Error {
  constructor() {
    super("ANALYSIS_UNAVAILABLE");
    this.name = "AnalysisUnavailableError";
  }
}

export class InvalidModelOutputError extends Error {
  constructor() {
    super("INVALID_MODEL_OUTPUT");
    this.name = "InvalidModelOutputError";
  }
}

export class ProviderRequestError extends Error {
  constructor(readonly status: number) {
    super("PROVIDER_REQUEST_FAILED");
    this.name = "ProviderRequestError";
  }
}
