import { test } from "bun:test";
import assert from "node:assert/strict";
import { changedSections, lessonHasChanges, restoreSection } from "./lesson-edits";
import type { LessonPlanData } from "./lesson-schema";

const baseline: LessonPlanData = {
  title: "Fractions", objective: "Identify fractions. Compare fractions.", materials: "Paper",
  warmUp: { minutes: 5, content: "Count pieces" }, directInstruction: { minutes: 10, content: "Model fractions" },
  practice: { minutes: 15, content: "Compare pieces" }, exitTicket: "Name a fraction", differentiation: "Use pictures", editedSections: ["objective"],
};

test("section changes are compared with saved/generated text, not edit markers", () => {
  assert.deepEqual(changedSections({ ...baseline, objective: "New objective", materials: "Scissors" }, baseline), ["objective", "materials"]);
  assert.deepEqual(changedSections(baseline, baseline), []);
});
test("discard restores only the selected section and its previous edit marker", () => {
  const restored = restoreSection({ ...baseline, objective: "New objective", materials: "Scissors", editedSections: ["objective", "materials"] }, baseline, "objective");
  assert.equal(restored.objective, baseline.objective);
  assert.equal(restored.materials, "Scissors");
  assert.deepEqual(restored.editedSections, ["materials", "objective"]);
});
test("discard of a timed section restores its text without touching other edits", () => {
  const restored = restoreSection({ ...baseline, warmUp: { minutes: 5, content: "Changed" }, materials: "Scissors", editedSections: ["warmUp"] }, baseline, "warmUp");
  assert.deepEqual(restored.warmUp, baseline.warmUp);
  assert.equal(restored.materials, "Scissors");
  assert.deepEqual(restored.editedSections, []);
});
test("returning to baseline clears dirty state while a title edit still counts", () => {
  assert.equal(lessonHasChanges(baseline, baseline), false);
  assert.equal(lessonHasChanges({ ...baseline, title: "New title" }, baseline), true);
});