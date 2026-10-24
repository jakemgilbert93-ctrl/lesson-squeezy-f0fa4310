import { test } from "bun:test";
import assert from "node:assert/strict";
import { APP_CONFIG, limitsFor } from "@/config/app-config";
import { ExitTicketContent, QuizContent, GenerateMaterialInput, quizAnswerKey } from "./materials-schema";

const question = { prompt: "What is 2 + 3?", choices: ["4", "5", "6", "7"], correctIndex: 1, workedSolution: "Start with 2. Add 3: 2 + 3 = 5." };
const quiz = { directions: "Choose one answer.", questions: Array.from({ length: 5 }, () => ({ ...question })) };

test("Pro has a 60-lesson monthly cap", () => assert.equal(limitsFor("pro").monthlyLessons, 60));
test("Free materials allow 5 regenerations per item", () => assert.equal(limitsFor("free").regensPerMaterial, 5));
test("Pro materials allow 15 regenerations per item", () => assert.equal(limitsFor("pro").regensPerMaterial, 15));
test("only exit tickets and quizzes can be generated for a saved UUID lesson", () => {
  assert.deepEqual(APP_CONFIG.materials.itemTypes, ["exit_ticket", "quiz"]);
  assert.equal(GenerateMaterialInput.safeParse({ lessonId: "bad", itemType: "quiz" }).success, false);
  assert.equal(GenerateMaterialInput.safeParse({ lessonId: "43552554-0714-4e82-9b7b-7b9be3cf6c11", itemType: "slides" }).success, false);
});
test("a quiz requires exactly 5 questions", () => {
  assert.equal(QuizContent.safeParse(quiz).success, true);
  assert.equal(QuizContent.safeParse({ ...quiz, questions: quiz.questions.slice(1) }).success, false);
  assert.equal(QuizContent.safeParse({ ...quiz, questions: [...quiz.questions, question] }).success, false);
});
test("each quiz question requires four distinct choices and one valid answer index", () => {
  for (const invalid of [{ ...question, choices: ["4", "5", "6"] }, { ...question, choices: ["4", "5", "5", "7"] }, { ...question, correctIndex: 4 }, { ...question, correctIndex: -1 }]) {
    assert.equal(QuizContent.safeParse({ ...quiz, questions: [invalid, ...quiz.questions.slice(1)] }).success, false);
  }
});
test("quiz choices cannot use all of the above", () => {
  assert.equal(QuizContent.safeParse({ ...quiz, questions: [{ ...question, choices: ["4", "5", "6", "All of the above"] }, ...quiz.questions.slice(1)] }).success, false);
});
test("quiz answers include the selected choice and worked solution", () => {
  const key = quizAnswerKey(QuizContent.parse(quiz));
  assert.ok(key.includes("1. B. 5\nStart with 2. Add 3: 2 + 3 = 5."));
  assert.equal(QuizContent.safeParse({ ...quiz, questions: [{ ...question, workedSolution: "" }, ...quiz.questions.slice(1)] }).success, false);
});
test("exit tickets support short answers with lines and multiple choice with choices", () => {
  assert.equal(ExitTicketContent.safeParse({ directions: "Answer.", questions: [{ prompt: "Explain.", type: "short_answer", answerLines: 3 }, { prompt: "Choose.", type: "multiple_choice", choices: ["Yes", "No"] }], teacherNotes: "Expected answers" }).success, true);
  assert.equal(ExitTicketContent.safeParse({ directions: "Answer.", questions: [{ prompt: "Choose.", type: "multiple_choice" }], teacherNotes: "" }).success, false);
});