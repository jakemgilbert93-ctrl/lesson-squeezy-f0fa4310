import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import { requireSignupAgreement } from "./signup-agreement";

describe("required Sign Up agreement", () => {
  it("blocks account creation when unchecked", () => {
    assert.throws(() => requireSignupAgreement(false));
  });
  it("allows account creation when checked", () => {
    assert.doesNotThrow(() => requireSignupAgreement(true));
  });
});