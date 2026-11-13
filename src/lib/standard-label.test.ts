import { describe, it } from "bun:test";
import assert from "node:assert/strict";
import { shortStandardText, standardOptionLabel } from "./standard-label";

const LONG =
  "Read and write decimals to thousandths using base-ten numerals, number names, and expanded notation, and compare two decimals to thousandths based on meanings of the digits in each place.";

describe("standard dropdown option labels", () => {
  it("cuts a long description on a word boundary near the limit and marks the cut", () => {
    const label = shortStandardText(LONG);
    assert.ok(label.endsWith("…"), "a cut description ends with an ellipsis");
    const desc = label.slice(0, -1);
    assert.ok(desc.length <= 70, `description stays within the limit (got ${desc.length})`);
    assert.ok(LONG.startsWith(desc), "the shown words are an unchanged prefix");
    assert.equal(LONG[desc.length], " ", "the cut lands on a space, never inside a word");
  });

  it("adds no ellipsis when nothing was cut, including a description exactly at the limit", () => {
    const exact = LONG.slice(0, LONG.lastIndexOf(" ", 70));
    assert.ok(exact.length <= 70);
    assert.equal(shortStandardText(exact), exact);
    assert.equal(shortStandardText("Add two fractions"), "Add two fractions");
  });

  it("flattens the line breaks some standards carry into single spaces", () => {
    assert.equal(shortStandardText("Add two\n  fractions with\n  like denominators"), "Add two fractions with like denominators");
  });

  it("labels an option with the code and short description, or the code alone without text", () => {
    const label = standardOptionLabel("4.NF.B.3", LONG);
    assert.ok(label.startsWith("4.NF.B.3 — "));
    assert.equal(label, `4.NF.B.3 — ${shortStandardText(LONG)}`);
    assert.equal(standardOptionLabel("4.NF.B.3", null), "4.NF.B.3");
    assert.equal(standardOptionLabel("4.NF.B.3", "   "), "4.NF.B.3");
  });
});
