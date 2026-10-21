import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PASSWORD_MESSAGES, passwordErrorMessage, validatePasswordChange } from "./password-change";

describe("validatePasswordChange", () => {
  it("rejects new passwords shorter than 6 characters", () => {
    assert.equal(validatePasswordChange("old", "12345", "12345"), PASSWORD_MESSAGES.tooShort);
  });
  it("accepts a 6-character password that matches", () => {
    assert.equal(validatePasswordChange("old", "123456", "123456"), null);
  });
  it("rejects mismatched confirmation", () => {
    assert.equal(validatePasswordChange("old", "123456", "1234567"), PASSWORD_MESSAGES.mismatch);
  });
  it("requires the current password", () => {
    assert.equal(validatePasswordChange("", "123456", "123456"), PASSWORD_MESSAGES.currentMissing);
  });
  it("maps wrong current password errors", () => {
    assert.equal(passwordErrorMessage({ code: "invalid_credentials" }), PASSWORD_MESSAGES.wrongCurrent);
  });
});
