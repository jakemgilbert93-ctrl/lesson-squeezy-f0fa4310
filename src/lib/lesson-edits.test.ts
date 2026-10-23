import { expect, test } from "bun:test";
import { changedSections, lessonHasChanges, restoreSection } from "./lesson-edits";
import type { LessonPlanData } from "./lesson-schema";

const baseline: LessonPlanData = {
  title: "Fractions", objective: "Identify fractions. Compare fractions.", materials: "Paper",
  warmUp: { minutes: 5, content: "Count pieces" }, directInstruction: { minutes: 10, content: "Model fractions" },
  practice: { minutes: 15, content: "Compare pieces" }, exitTicket: "Name a fraction", differentiation: "Use pictures", editedSections: ["objective"],
};

test("section changes are compared with saved/generated text, not edit markers", () => {
  expect(changedSections({ ...baseline, objective: "New objective", materials: "Scissors" }, baseline)).toEqual(["objective", "materials"]);
  expect(changedSections(baseline, baseline)).toEqual([]);
});
test("cancel restores only the selected section and its previous edit marker", () => {
  const restored = restoreSection({ ...baseline, objective: "New objective", materials: "Scissors", editedSections: ["objective", "materials"] }, baseline, "objective");
  expect(restored.objective).toBe(baseline.objective);
  expect(restored.materials).toBe("Scissors");
  expect(restored.editedSections).toEqual(["materials", "objective"]);
});
test("cancel of a timed section restores its text without touching other edits", () => {
  const restored = restoreSection({ ...baseline, warmUp: { minutes: 5, content: "Changed" }, materials: "Scissors", editedSections: ["warmUp"] }, baseline, "warmUp");
  expect(restored.warmUp).toEqual(baseline.warmUp);
  expect(restored.materials).toBe("Scissors");
  expect(restored.editedSections).toEqual([]);
});
test("returning to baseline clears dirty state while a title edit still counts", () => {
  expect(lessonHasChanges(baseline, baseline)).toBe(false);
  expect(lessonHasChanges({ ...baseline, title: "New title" }, baseline)).toBe(true);
});