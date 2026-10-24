import { z } from "zod";
import { APP_CONFIG } from "@/config/app-config";

export const MaterialItemType = z.enum(APP_CONFIG.materials.itemTypes);
export type MaterialItemType = z.infer<typeof MaterialItemType>;

const ExitTicketQuestion = z.object({
  prompt: z.string().trim().min(1),
  type: z.enum(APP_CONFIG.materials.exitTicketQuestionTypes),
  choices: z.array(z.string().trim().min(1)).optional(),
  answerLines: z.number().int().positive().optional(),
}).superRefine((q, ctx) => {
  if (q.type === "multiple_choice" && (!q.choices || q.choices.length < 2)) {
    ctx.addIssue({ code: "custom", message: "Multiple-choice questions need choices." });
  }
  if (q.type === "short_answer" && q.choices) {
    ctx.addIssue({ code: "custom", message: "Short-answer questions cannot contain choices." });
  }
});

export const ExitTicketContent = z.object({
  directions: z.string().trim().min(1),
  questions: z.array(ExitTicketQuestion).min(1),
  teacherNotes: z.string(),
});

export const QuizContent = z.object({
  directions: z.string().trim().min(1),
  questions: z.array(z.object({
    prompt: z.string().trim().min(1),
    choices: z.array(z.string().trim().min(1)).length(APP_CONFIG.materials.quizChoices),
    correctIndex: z.number().int().min(0).max(APP_CONFIG.materials.quizChoices - 1),
    workedSolution: z.string().trim().min(1),
  }).superRefine((q, ctx) => {
    if (new Set(q.choices.map((c) => c.toLowerCase())).size !== q.choices.length) {
      ctx.addIssue({ code: "custom", message: "Choices must be distinct." });
    }
    if (q.choices.some((c) => /all of the above/i.test(c))) {
      ctx.addIssue({ code: "custom", message: "All of the above is not allowed." });
    }
  })).length(APP_CONFIG.materials.quizQuestions),
});

export const GenerateMaterialInput = z.object({ lessonId: z.string().uuid(), itemType: MaterialItemType });
export const RegenerateMaterialInput = z.object({ itemId: z.string().uuid() });
export type MaterialContent = z.infer<typeof ExitTicketContent> | z.infer<typeof QuizContent>;

export function quizAnswerKey(content: z.infer<typeof QuizContent>): string {
  return content.questions.map((q, i) =>
    `${i + 1}. ${String.fromCharCode(65 + q.correctIndex)}. ${q.choices[q.correctIndex]}\n${q.workedSolution}`,
  ).join("\n\n");
}