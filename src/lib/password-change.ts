import { APP_CONFIG } from "@/config/app-config";

export const PASSWORD_MESSAGES = {
  currentMissing: "Enter your current password.",
  tooShort: `New password must be at least ${APP_CONFIG.passwordMinLength} characters.`,
  mismatch: "New passwords don't match.",
  wrongCurrent: "Your current password is incorrect.",
  samePassword: "Choose a new password that's different from your current one.",
  success: "Password changed. You're still signed in.",
  generic: "Could not change your password. Please try again.",
} as const;

/** Returns an error message, or null when the form can be submitted. */
export function validatePasswordChange(current: string, next: string, confirm: string): string | null {
  if (!current) return PASSWORD_MESSAGES.currentMissing;
  if (next.length < APP_CONFIG.passwordMinLength) return PASSWORD_MESSAGES.tooShort;
  if (next !== confirm) return PASSWORD_MESSAGES.mismatch;
  return null;
}

/** Maps an auth error to a teacher-friendly message. */
export function passwordErrorMessage(error: { code?: string; message?: string }): string {
  const msg = (error.message ?? "").toLowerCase();
  if (error.code === "same_password") return PASSWORD_MESSAGES.samePassword;
  if (error.code === "weak_password") return PASSWORD_MESSAGES.tooShort;
  if (error.code === "invalid_credentials" || error.code === "reauthentication_needed" || msg.includes("current password")) return PASSWORD_MESSAGES.wrongCurrent;
  return PASSWORD_MESSAGES.generic;
}
