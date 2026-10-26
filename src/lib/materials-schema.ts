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

const noAllOfTheAbove = (choices: string[] | undefined) => choices?.some((c) => /all of the above/i.test(c));

const WorksheetQuestion = z.object({
  prompt: z.string().trim().min(1),
  type: z.enum(APP_CONFIG.materials.worksheetQuestionTypes),
  choices: z.array(z.string().trim().min(1)).optional(),
  answerLines: z.number().int().positive().optional(),
  answer: z.string().trim().min(1),
  workedSolution: z.string().trim().min(1),
}).superRefine((q, ctx) => {
  if (q.type === "multiple_choice" && (!q.choices || q.choices.length < 2)) {
    ctx.addIssue({ code: "custom", message: "Multiple-choice questions need choices." });
  }
  if (q.type !== "multiple_choice" && q.choices) {
    ctx.addIssue({ code: "custom", message: "Only multiple-choice questions can contain choices." });
  }
  if (noAllOfTheAbove(q.choices)) {
    ctx.addIssue({ code: "custom", message: "All of the above is not allowed." });
  }
});

export const WorksheetContent = z.object({
  directions: z.string().trim().min(1),
  questions: z.array(WorksheetQuestion)
    .min(APP_CONFIG.materials.worksheetQuestionsMin)
    .max(APP_CONFIG.materials.worksheetQuestionsMax),
});

export const VocabCardsContent = z.object({
  cards: z.array(z.object({
    term: z.string().trim().min(1),
    studentFriendlyDefinition: z.string().trim().min(1),
    exampleSentence: z.string().trim().min(1),
    memoryHint: z.string().trim().min(1).optional(),
  })).min(APP_CONFIG.materials.vocabCardsMin).max(APP_CONFIG.materials.vocabCardsMax),
});

const GameCard = z.object({
  prompt: z.string().trim().min(1),
  choices: z.array(z.string().trim().min(1)).optional(),
  answer: z.string().trim().min(1),
  workedSolution: z.string().trim().min(1),
}).superRefine((c, ctx) => {
  if (noAllOfTheAbove(c.choices)) {
    ctx.addIssue({ code: "custom", message: "All of the above is not allowed." });
  }
});

export const GameContent = z.object({
  gameName: z.string().trim().min(1),
  format: z.enum(APP_CONFIG.materials.gameFormats),
  materialsNeeded: z.array(z.string().trim().min(1)).min(1),
  setup: z.string().trim().min(1),
  howToPlay: z.array(z.string().trim().min(1)).min(1),
  cards: z.array(GameCard).length(APP_CONFIG.materials.gameCards),
  teacherNotes: z.string().trim().min(1),
}).superRefine((g, ctx) => {
  if (g.format === "four_corners") {
    g.cards.forEach((c, i) => {
      if (!c.choices || c.choices.length !== 4) {
        ctx.addIssue({ code: "custom", message: `Four Corners card ${i + 1} needs exactly 4 choices.` });
      }
    });
  }
});

export const GenerateMaterialInput = z.object({ lessonId: z.string().uuid(), itemType: MaterialItemType });
export const RegenerateMaterialInput = z.object({ itemId: z.string().uuid() });
export type MaterialContent = z.infer<typeof ExitTicketContent> | z.infer<typeof QuizContent>
  | z.infer<typeof WorksheetContent> | z.infer<typeof VocabCardsContent> | z.infer<typeof GameContent>;

export function quizAnswerKey(content: z.infer<typeof QuizContent>): string {
  return content.questions.map((q, i) =>
    `${i + 1}. ${String.fromCharCode(65 + q.correctIndex)}. ${q.choices[q.correctIndex]}\n${q.workedSolution}`,
  ).join("\n\n");
}

export function worksheetAnswerKey(content: z.infer<typeof WorksheetContent>): string {
  return content.questions.map((q, i) => `${i + 1}. ${q.answer}\n${q.workedSolution}`).join("\n\n");
}

export function gameAnswerKey(content: z.infer<typeof GameContent>): string {
  return content.cards.map((c, i) => `${i + 1}. ${c.answer}\n${c.workedSolution}`).join("\n\n");
}