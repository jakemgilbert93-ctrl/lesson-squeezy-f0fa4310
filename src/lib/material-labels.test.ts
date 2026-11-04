import { test } from "bun:test";
import assert from "node:assert/strict";
import { stripChoiceMarker, stripStepMarker } from "./material-labels";

test("choice markers are removed without altering answer text", () => {
  for (const marker of ["A)", "B.", "C:"]) assert.equal(stripChoiceMarker(`${marker} 3/4`), "3/4");
  assert.equal(stripChoiceMarker("A. A) 3/4"), "3/4");
  assert.equal(stripChoiceMarker("A fraction"), "A fraction");
});

test("step markers are removed without altering instructions", () => {
  assert.equal(stripStepMarker("1. Move to the next card."), "Move to the next card.");
  assert.equal(stripStepMarker("2) Solve the problem."), "Solve the problem.");
  assert.equal(stripStepMarker("1. 1) Solve."), "Solve.");
  assert.equal(stripStepMarker("20 students form teams."), "20 students form teams.");
});