/** Remove model-supplied markers before the view/export supplies its own marker. */
export function stripChoiceMarker(text: string | undefined): string {
  return (text ?? "").replace(/^\s*(?:[A-Za-z][).:]\s*)+/, "").trim();
}

export function stripStepMarker(text: string): string {
  return text.replace(/^\s*(?:\d+[.)]\s*)+/, "").trim();
}

export const OPEN_RESPONSE_NOTE = "(Other correct answers are acceptable.)";

const SAMPLE_PREFIX = /^\s*sample answer\s*:\s*/i;

/**
 * Split an answer-key value into its display label and text. The model marks
 * open-response keys with a leading "Sample answer:"; those get the single
 * "Sample answer:" label and the open-response note. Everything else is a
 * single-answer question and keeps the plain "Answer:" label.
 */
export function splitAnswerLabel(answer: string): { label: "Answer" | "Sample answer"; text: string } {
  const text = answer.trim();
  if (SAMPLE_PREFIX.test(text)) return { label: "Sample answer", text: text.replace(SAMPLE_PREFIX, "") };
  return { label: "Answer", text: text.replace(/^([A-Za-z])[):]\s+/, "$1. ") };
}

/** Full answer-key line for plain-text exports. */
export function answerKeyLine(answer: string): string {
  const { label, text } = splitAnswerLabel(answer);
  return `${label}: ${text}${label === "Sample answer" ? ` ${OPEN_RESPONSE_NOTE}` : ""}`;
}