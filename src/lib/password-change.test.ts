import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import { PASSWORD_MESSAGES, passwordErrorMessage, passwordRuleError, validatePasswordChange } from "./password-change";

describe("passwordRuleError", () => {
  it("rejects passwords shorter than 12 characters", () => {
    assert.equal(passwordRuleError("abc1!defgh"), PASSWORD_MESSAGES.tooShort);
  });
  it("requires a number", () => {
    assert.equal(passwordRuleError("abcdefghijk!"), PASSWORD_MESSAGES.missingNumber);
  });
  it("requires a symbol", () => {
    assert.equal(passwordRuleError("abcdefghijk1"), PASSWORD_MESSAGES.missingSymbol);
  });
  it("does not count a space as the symbol", () => {
    assert.equal(passwordRuleError("abcde fghij1"), PASSWORD_MESSAGES.missingSymbol);
  });
  it("accepts a 12-character password with a number and symbol", () => {
    assert.equal(passwordRuleError("abcdefghij1!"), null);
  });
  it("accepts long passphrases with spaces", () => {
    assert.equal(passwordRuleError("correct horse battery staple 42 ?"), null);
  });
});

describe("validatePasswordChange", () => {
  it("rejects mismatched confirmation", () => {
    assert.equal(validatePasswordChange("old", "abcdefghij1!", "abcdefghij1?"), PASSWORD_MESSAGES.mismatch);
  });
  it("requires the current password", () => {
    assert.equal(validatePasswordChange("", "abcdefghij1!", "abcdefghij1!"), PASSWORD_MESSAGES.currentMissing);
  });
});

describe("passwordErrorMessage", () => {
  it("maps wrong current password errors", () => {
    assert.equal(passwordErrorMessage({ code: "invalid_credentials" }), PASSWORD_MESSAGES.wrongCurrent);
  });
  it("maps leaked passwords", () => {
    assert.equal(passwordErrorMessage({ code: "weak_password", reasons: ["pwned"] }), PASSWORD_MESSAGES.leaked);
  });
});
