import { describe, expect, it } from "vitest";
import { PASSWORD_MESSAGES, passwordErrorMessage, validatePasswordChange } from "./password-change";

describe("validatePasswordChange", () => {
  it("rejects new passwords shorter than 6 characters", () => {
    expect(validatePasswordChange("old", "12345", "12345")).toBe(PASSWORD_MESSAGES.tooShort);
  });
  it("accepts a 6-character password that matches", () => {
    expect(validatePasswordChange("old", "123456", "123456")).toBeNull();
  });
  it("rejects mismatched confirmation", () => {
    expect(validatePasswordChange("old", "123456", "1234567")).toBe(PASSWORD_MESSAGES.mismatch);
  });
  it("requires the current password", () => {
    expect(validatePasswordChange("", "123456", "123456")).toBe(PASSWORD_MESSAGES.currentMissing);
  });
  it("maps wrong current password errors", () => {
    expect(passwordErrorMessage({ code: "invalid_credentials" })).toBe(PASSWORD_MESSAGES.wrongCurrent);
  });
});
