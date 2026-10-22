import { APP_CONFIG } from "@/config/app-config";

const callbackKey = "lesson-squeezy-confirmation-callback";
const cooldownKey = "lesson-squeezy-confirmation-resend-until";

export function confirmationCallback(hash: string): "expired" | "confirmed" | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("type") === "recovery") return null;
  if (params.get("error_code") === "otp_expired" || params.get("error") === "access_denied" || params.get("error_code") === "access_denied") return "expired";
  if (params.get("type") === "signup" && params.has("access_token")) return "confirmed";
  return null;
}

// Capture before the auth SDK consumes the callback; never store its tokens.
export function captureConfirmationCallback() {
  if (typeof window === "undefined" || window.location.pathname === "/reset-password") return;
  const callback = confirmationCallback(window.location.hash);
  if (!callback) return;
  window.sessionStorage.setItem(callbackKey, callback);
  if (callback === "expired") window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
}

export function pendingConfirmationCallback() {
  return window.sessionStorage.getItem(callbackKey);
}

export function consumeConfirmationCallback(expected: "expired" | "confirmed") {
  if (pendingConfirmationCallback() !== expected) return false;
  window.sessionStorage.removeItem(callbackKey);
  return true;
}

export function cooldownRemaining(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function resendCooldownRemaining(): number {
  return cooldownRemaining(Number(window.sessionStorage.getItem(cooldownKey) ?? 0), Date.now());
}

export function startResendCooldown(): number {
  const seconds = APP_CONFIG.auth.confirmationResendCooldownSeconds;
  window.sessionStorage.setItem(cooldownKey, String(Date.now() + seconds * 1000));
  return seconds;
}