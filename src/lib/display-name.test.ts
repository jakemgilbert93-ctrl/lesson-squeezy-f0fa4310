import { describe, expect, it } from "vitest";
import { normalizeDisplayName, welcomeGreeting } from "./display-name";

describe("optional display names", () => {
  it("stores nothing for a blank name", () => {
    expect(normalizeDisplayName("   ")).toBeNull();
    expect(normalizeDisplayName(undefined)).toBeNull();
  });
  it("preserves a supplied name without surrounding whitespace", () => {
    expect(normalizeDisplayName(" Ms. Rivera ")).toBe("Ms. Rivera");
  });
  it("greets a named teacher", () => {
    expect(welcomeGreeting("Ms. Rivera")).toBe("Welcome back, Ms. Rivera");
  });
  it("uses the plain greeting when no name exists", () => {
    expect(welcomeGreeting(null)).toBe("Welcome back");
  });
});