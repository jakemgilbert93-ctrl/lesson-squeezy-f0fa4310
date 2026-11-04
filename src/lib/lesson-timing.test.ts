import { test } from "bun:test";
import assert from "node:assert/strict";
import { APP_CONFIG } from "@/config/app-config";
import { fitTiming } from "./lesson-timing";

const plan = {
  title: "Fractions", objective: "Compare fractions.", materials: "Paper",
  warmUp: { minutes: 10, content: "Review" }, directInstruction: { minutes: 20, content: "Model" },
  practice: { minutes: 15, content: "Practice" }, exitTicket: "Check", differentiation: "Support",
};

test("lesson length options are exactly the six requested lengths", () => {
  assert.deepEqual([...APP_CONFIG.lessonLengths], [20, 30, 45, 60, 75, 90]);
});

for (const total of [20, 30, 45, 60, 75, 90]) {
  test(`${total}-minute lessons always have positive integer chips totaling ${total}`, () => {
    for (const minutes of [[10, 20, 15], [1, 1, 1], [60, 90, 90], [5, 5, total - 10]] as const) {
      const fitted = fitTiming({ ...plan, warmUp: { ...plan.warmUp, minutes: minutes[0] }, directInstruction: { ...plan.directInstruction, minutes: minutes[1] }, practice: { ...plan.practice, minutes: minutes[2] } }, total);
      const chips = [fitted.warmUp.minutes, fitted.directInstruction.minutes, fitted.practice.minutes];
      assert.equal(chips.reduce((sum, n) => sum + n, 0), total);
      assert.ok(chips.every((n) => Number.isInteger(n) && n > 0));
      assert.equal(fitted.practice.content, plan.practice.content);
    }
  });
}