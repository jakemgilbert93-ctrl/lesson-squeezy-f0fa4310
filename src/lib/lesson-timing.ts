import type { z } from "zod";
import type { LessonSections } from "./lesson-schema";

/** Preserve the existing practice-only adjustment when possible; fit short lessons proportionally otherwise. */
export function fitTiming(plan: z.infer<typeof LessonSections>, total: number) {
  const sum = plan.warmUp.minutes + plan.directInstruction.minutes + plan.practice.minutes;
  if (sum === total) return plan;
  const practice = total - plan.warmUp.minutes - plan.directInstruction.minutes;
  if (practice >= 5) return { ...plan, practice: { ...plan.practice, minutes: practice } };
  const warmUp = Math.min(total - 6, Math.max(1, Math.round(plan.warmUp.minutes / sum * total)));
  const directInstruction = Math.min(total - warmUp - 5, Math.max(1, Math.round(plan.directInstruction.minutes / sum * total)));
  return {
    ...plan,
    warmUp: { ...plan.warmUp, minutes: warmUp },
    directInstruction: { ...plan.directInstruction, minutes: directInstruction },
    practice: { ...plan.practice, minutes: total - warmUp - directInstruction },
  };
}