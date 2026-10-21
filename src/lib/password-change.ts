import { APP_CONFIG } from "@/config/app-config";

const MIN = APP_CONFIG.passwordMinLength;

/** Shown before the teacher types, on every form that sets a password. */
export const PASSWORD_REQUIREMENT = `At least ${MIN} characters, with at least one number and one symbol.`;

export const PASSWORD_MESSAGES = {
  currentMissing: "Enter your current password.",
  tooShort: `Password must be at least ${MIN} characters.`,
  missingNumber: "Password must include at least one number.",
  missingSymbol: "Password must include at least one symbol, like ! ? # or @.",
  mismatch: "New passwords don't match.",
  wrongCurrent: "Your current password is incorrect.",
  samePassword: "Choose a new password that's different from your current one.",
  leaked: "This password has appeared in a known data breach. Please choose a different one.",
  rejected: "This password was rejected by our sign-in service. Please choose a different one.",
  success: "Password changed. You're still signed in.",
} as const;

const hasNumber = (pw: string) => /\p{N}/u.test(pw);
/** Any character that is not a letter, number or whitespace counts as a symbol. */
const hasSymbol = (pw: string) => /[^\p{L}\p{N}\s]/u.test(pw);

/** Live checklist items, in display order. */
export function passwordChecks(pw: string) {
  return [
    { label: `${MIN}+ characters`, met: pw.length >= MIN },
    { label: "A number", met: hasNumber(pw) },
    { label: "A symbol", met: hasSymbol(pw) },
  ];
}

/** The one shared rule for every new password. Returns an error message or null. */
export function passwordRuleError(pw: string): string | null {
  if (pw.length < MIN) return PASSWORD_MESSAGES.tooShort;
  if (!hasNumber(pw)) return PASSWORD_MESSAGES.missingNumber;
  if (!hasSymbol(pw)) return PASSWORD_MESSAGES.missingSymbol;
  return null;
}

/** Returns an error message, or null when the form can be submitted. */
export function validatePasswordChange(current: string, next: string, confirm: string): string | null {
  if (!current) return PASSWORD_MESSAGES.currentMissing;
  const rule = passwordRuleError(next);
  if (rule) return rule;
  if (next !== confirm) return PASSWORD_MESSAGES.mismatch;
  return null;
}

type AuthErr = { code?: string | undefined; message?: string | undefined; reasons?: string[] | undefined };

/** Maps a sign-in service rejection of a new password to a clear message. */
export function passwordErrorMessage(raw: unknown): string {
  const e = (raw ?? {}) as Record<string, unknown>;
  const error: AuthErr = {
    code: typeof e["code"] === "string" ? e["code"] : undefined,
    message: typeof e["message"] === "string" ? e["message"] : undefined,
    reasons: Array.isArray(e["reasons"]) ? e["reasons"].filter((r): r is string => typeof r === "string") : undefined,
  };
  const msg = (error.message ?? "").toLowerCase();
  const reasons = error.reasons ?? [];
  if (error.code === "same_password") return PASSWORD_MESSAGES.samePassword;
  if (reasons.includes("pwned") || msg.includes("pwned") || msg.includes("breach") || msg.includes("leaked")) return PASSWORD_MESSAGES.leaked;
  if (reasons.includes("length")) return PASSWORD_MESSAGES.tooShort;
  if (reasons.includes("characters")) return PASSWORD_MESSAGES.missingSymbol;
  if (error.code === "invalid_credentials" || error.code === "reauthentication_needed" || msg.includes("current password")) return PASSWORD_MESSAGES.wrongCurrent;
  if (error.code === "weak_password") return PASSWORD_MESSAGES.rejected;
  return error.message ? `${PASSWORD_MESSAGES.rejected} (${error.message})` : PASSWORD_MESSAGES.rejected;
}
