export class AnalysisUnavailableError extends Error {
  constructor() {
    super("ANALYSIS_UNAVAILABLE");
    this.name = "AnalysisUnavailableError";
  }
}
