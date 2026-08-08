export type RedactionKind = "URL" | "EMAIL" | "PHONE" | "ACCOUNT";

export type RedactionSpan = {
  kind: RedactionKind;
  token: string;
  original: string;
  start: number;
  end: number;
};

export type RedactionResult = { redactedText: string; spans: RedactionSpan[] };

const patterns: Array<{ kind: RedactionKind; precedence: number; regex: RegExp }> = [
  { kind: "URL", precedence: 0, regex: /https?:\/\/[^\s<>"']*[^\s<>"'.,!?;:)\]}]/gi },
  { kind: "EMAIL", precedence: 1, regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { kind: "PHONE", precedence: 2, regex: /(?<!\d)(?:(?:\+62|62)[\s-]?|0)8\d(?:[\s-]?\d){7,11}(?![\s-]?\d)/g },
  { kind: "ACCOUNT", precedence: 3, regex: /(?<!\d)\d(?:[\s-]?\d){7,15}(?![\s-]?\d)/g },
];

export function redactSensitiveText(input: string): RedactionResult {
  const candidates = patterns.flatMap(({ kind, precedence, regex }) =>
    Array.from(input.matchAll(new RegExp(regex.source, regex.flags))).map((match) => ({
      kind,
      precedence,
      original: match[0],
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    })),
  ).sort((a, b) => a.start - b.start || a.precedence - b.precedence || b.end - a.end);

  const accepted: typeof candidates = [];
  for (const candidate of candidates) {
    if (accepted.some((span) => candidate.start < span.end && candidate.end > span.start)) continue;
    accepted.push(candidate);
  }
  accepted.sort((a, b) => a.start - b.start);

  const counters: Record<RedactionKind, number> = { URL: 0, EMAIL: 0, PHONE: 0, ACCOUNT: 0 };
  const spans: RedactionSpan[] = [];
  let cursor = 0;
  let redactedText = "";

  for (const match of accepted) {
    counters[match.kind] += 1;
    const token = `[${match.kind}_${counters[match.kind]}]`;
    redactedText += input.slice(cursor, match.start) + token;
    spans.push({
      kind: match.kind,
      token,
      original: match.original,
      start: match.start,
      end: match.end,
    });
    cursor = match.end;
  }

  redactedText += input.slice(cursor);
  return { redactedText, spans };
}
