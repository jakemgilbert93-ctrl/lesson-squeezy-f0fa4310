import { test } from "bun:test";
import assert from "node:assert/strict";
import { answerKeyLine, splitAnswerLabel, stripChoiceMarker, stripStepMarker } from "./material-labels";

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

test("open-response answers get a single Sample answer label", () => {
  assert.deepEqual(splitAnswerLabel("Sample answer: 3/4 of the shapes"), { label: "Sample answer", text: "3/4 of the shapes" });
  assert.deepEqual(splitAnswerLabel("sample answer:Any correct drawing"), { label: "Sample answer", text: "Any correct drawing" });
  assert.equal(answerKeyLine("Sample answer: 3/4 of the shapes"), "Sample answer: 3/4 of the shapes (Other correct answers are acceptable.)");
});

test("single-answer questions keep the plain Answer label without the note", () => {
  assert.deepEqual(splitAnswerLabel("B. 3/4"), { label: "Answer", text: "B. 3/4" });
  assert.equal(answerKeyLine("B. 3/4"), "Answer: B. 3/4");
  assert.equal(answerKeyLine("="), "Answer: =");
});

test("single-answer choice markers normalize to a period without changing multiline text", () => {
  assert.deepEqual(splitAnswerLabel("A) First line\nSecond line"), { label: "Answer", text: "A. First line\nSecond line" });
  assert.equal(answerKeyLine("B: 3/4"), "Answer: B. 3/4");
});