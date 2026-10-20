import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeDisplayName, welcomeGreeting } from "./display-name";

describe("optional display names", () => {
  it("stores nothing for a blank name", () => {
    assert.equal(normalizeDisplayName("   "), null);
    assert.equal(normalizeDisplayName(undefined), null);
  });
  it("preserves a supplied name without surrounding whitespace", () => {
    assert.equal(normalizeDisplayName(" Ms. Rivera "), "Ms. Rivera");
  });
  it("greets a named teacher", () => {
    assert.equal(welcomeGreeting("Ms. Rivera"), "Welcome back, Ms. Rivera");
  });
  it("uses the plain greeting when no name exists", () => {
    assert.equal(welcomeGreeting(null), "Welcome back");
  });
});