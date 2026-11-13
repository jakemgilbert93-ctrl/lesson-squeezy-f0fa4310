/**
 * Labels for the standards dropdown.
 *
 * Each option shows the code plus a short description so a teacher can tell the
 * standards apart; the full text is shown separately once one is selected.
 * Attribution lives in one line under the dropdown, not in every option.
 */

export const STANDARD_OPTION_DESC_MAX = 70;

/** Some standards carry line breaks; options need one flat line. */
function flatten(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Short description for an option: cut near `max` characters on a word
 * boundary, and append "…" only when something was actually cut.
 */
export function shortStandardText(text: string, max: number = STANDARD_OPTION_DESC_MAX): string {
  const flat = flatten(text);
  if (flat.length <= max) return flat;
  const head = flat.slice(0, max);
  const lastSpace = head.lastIndexOf(" ");
  const cut = lastSpace > 0 ? head.slice(0, lastSpace) : head;
  return `${cut.trimEnd().replace(/[,;:.\-–]$/, "")}…`;
}

/** Option label: code plus short description, or just the code when there is no text. */
export function standardOptionLabel(code: string, text: string | null): string {
  const short = shortStandardText(text ?? "");
  return short ? `${code} — ${short}` : code;
}
