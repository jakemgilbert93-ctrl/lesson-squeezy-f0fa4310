/** Remove model-supplied markers before the view/export supplies its own marker. */
export function stripChoiceMarker(text: string | undefined): string {
  return (text ?? "").replace(/^\s*(?:[A-Za-z][).:]\s*)+/, "").trim();
}

export function stripStepMarker(text: string): string {
  return text.replace(/^\s*(?:\d+[.)]\s*)+/, "").trim();
}