import { describe, expect, test } from "bun:test";
import { monthlyCountExplanation, savedThisUtcMonth } from "./monthly-lesson-count";

const now = new Date("2026-10-23T04:11:00Z");
const lesson = (created_at: string) => ({ created_at });

describe("monthly lesson count explanation", () => {
  test("counts only lessons created in the current UTC calendar month", () => {
    expect(savedThisUtcMonth([
      lesson("2026-09-30T23:59:59.999Z"),
      lesson("2026-10-01T00:00:00Z"),
      lesson("2026-10-31T23:59:59.999Z"),
      lesson("2026-11-01T00:00:00Z"),
    ], now)).toBe(2);
  });
  test("uses UTC rather than the timestamp's local month", () => {
    expect(savedThisUtcMonth([
      lesson("2026-09-30T17:00:00-07:00"),
      lesson("2026-10-31T17:00:00-07:00"),
    ], now)).toBe(1);
  });
  test("shows the explanation when four used exceeds three saved this month", () => {
    const rows = [lesson("2026-10-02T00:00:00Z"), lesson("2026-10-03T00:00:00Z"), lesson("2026-10-04T00:00:00Z")];
    expect(monthlyCountExplanation(4, rows, now)).toBe("3 saved this month. Lessons you delete or never save still count toward your monthly limit.");
  });
  test("older saved lessons cannot hide a current-month gap", () => {
    expect(monthlyCountExplanation(1, [lesson("2026-09-01T00:00:00Z")], now)).toBe("0 saved this month. Lessons you delete or never save still count toward your monthly limit.");
  });
  test("hides the explanation when used equals saved", () => {
    expect(monthlyCountExplanation(1, [lesson("2026-10-01T00:00:00Z")], now)).toBe(null);
  });
  test("hides the explanation when saved exceeds used", () => {
    expect(monthlyCountExplanation(0, [lesson("2026-10-01T00:00:00Z")], now)).toBe(null);
  });
  test("the comparison starts a new UTC month at midnight, including year rollover", () => {
    expect(savedThisUtcMonth([lesson("2026-12-31T23:59:59Z"), lesson("2027-01-01T00:00:00Z")], new Date("2027-01-01T00:00:00Z"))).toBe(1);
  });
});