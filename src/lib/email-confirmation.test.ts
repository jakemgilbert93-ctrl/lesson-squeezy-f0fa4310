import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import { APP_CONFIG } from "../config/app-config";
import { confirmationCallback, cooldownRemaining } from "./email-confirmation";

describe("email confirmation", () => {
  it("limits confirmation resends for 60 seconds", () => {
    assert.equal(APP_CONFIG.auth.confirmationResendCooldownSeconds, 60);
    assert.equal(cooldownRemaining(60000, 0), 60);
    assert.equal(cooldownRemaining(60000, 59001), 1);
    assert.equal(cooldownRemaining(60000, 60000), 0);
  });
  it("recognizes expired and already-used link errors", () => {
    assert.equal(confirmationCallback("#error_code=otp_expired"), "expired");
    assert.equal(confirmationCallback("#error=access_denied"), "expired");
    assert.equal(confirmationCallback("#error_code=access_denied"), "expired");
  });
  it("requires a signup callback, not just a session, for the welcome", () => {
    assert.equal(confirmationCallback("#type=signup&access_token=test-token"), "confirmed");
    assert.equal(confirmationCallback("#access_token=test-token"), null);
    assert.equal(confirmationCallback(""), null);
  });
  it("leaves password recovery callbacks untouched", () => {
    assert.equal(confirmationCallback("#type=recovery&error_code=otp_expired"), null);
    assert.equal(confirmationCallback("#type=recovery&access_token=test-token"), null);
  });
});